import { Album, Artist, Track, User, TopArtistData } from '../types';

const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

// --- RATE LIMITING CONFIGURATION ---
const RATE_LIMIT_REQUESTS = 100; // Maximum requests per window
const RATE_LIMIT_WINDOW = 60000; // 1 minute window in milliseconds
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY_BASE = 1000; // Base delay in milliseconds

// Rate limiting state
let requestTimestamps: number[] = [];
let isRateLimited = false;
let rateLimitResetTime = 0;

// --- CACHE CONFIGURATION ---
const CACHE_PREFIX = 'beatmap_v3_'; // Updated version for security improvements
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes in milliseconds

// --- SECURITY CONFIGURATION ---
const MAX_QUERY_LENGTH = 500;
const SANITIZATION_PATTERNS = {
  dangerousChars: /[<>'"&]/g,
  sqlInjection: /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)\b)/gi,
  xss: /(\b(script|javascript|vbscript|onload|onerror)\b)/gi
};

// --- SECURITY FUNCTIONS ---

/**
 * Sanitizes user input to prevent security vulnerabilities
 */
export const sanitizeInput = (input: string): string => {
  if (!input || typeof input !== 'string') return '';
  
  // Truncate to maximum length
  let sanitized = input.substring(0, MAX_QUERY_LENGTH);
  
  // Remove dangerous characters
  sanitized = sanitized.replace(SANITIZATION_PATTERNS.dangerousChars, '');
  
  // Remove potential SQL injection patterns
  sanitized = sanitized.replace(SANITIZATION_PATTERNS.sqlInjection, '');
  
  // Remove potential XSS patterns
  sanitized = sanitized.replace(SANITIZATION_PATTERNS.xss, '');
  
  // Trim whitespace
  return sanitized.trim();
};

/**
 * Validates that a token follows expected format
 */
export const validateToken = (token: string): boolean => {
  if (!token || typeof token !== 'string') return false;
  
  // Basic token format validation (Spotify tokens are typically Bearer tokens)
  // Allow mock tokens for testing
  return token.length > 10 && /^[A-Za-z0-9\-_]+$/.test(token) || token.startsWith('mock');
};

// --- RATE LIMITING FUNCTIONS ---

/**
 * Checks if we're currently rate limited
 */
const checkRateLimit = (): boolean => {
  const now = Date.now();
  
  // Reset rate limit if window has passed
  if (now > rateLimitResetTime) {
    isRateLimited = false;
    requestTimestamps = [];
  }
  
  // Clean old timestamps outside the window
  requestTimestamps = requestTimestamps.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);
  
  // Check if we've exceeded the limit
  if (requestTimestamps.length >= RATE_LIMIT_REQUESTS) {
    isRateLimited = true;
    rateLimitResetTime = now + RATE_LIMIT_WINDOW;
    return true;
  }
  
  return false;
};

/**
 * Records a request timestamp for rate limiting
 */
const recordRequest = (): void => {
  requestTimestamps.push(Date.now());
};

/**
 * Calculates exponential backoff delay for retries
 */
const getRetryDelay = (attempt: number): number => {
  return RETRY_DELAY_BASE * Math.pow(2, attempt) + Math.random() * 1000;
};

/**
 * Delays execution for specified milliseconds
 */
const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// --- ENHANCED FETCH WITH RETRY AND RATE LIMITING ---

/**
 * Enhanced fetch function with retry mechanism, rate limiting, and error handling
 */
const enhancedFetch = async (url: string, options: RequestInit, attempt: number = 0): Promise<Response> => {
  // Check rate limit before making request
  if (checkRateLimit()) {
    const waitTime = rateLimitResetTime - Date.now();
    console.warn(`Rate limit reached. Waiting ${waitTime}ms before retry.`);
    await delay(waitTime);
  }
  
  try {
    recordRequest();
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    // Handle rate limiting from Spotify
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : RATE_LIMIT_WINDOW;
      
      console.warn(`Spotify rate limit hit. Waiting ${waitTime}ms.`);
      isRateLimited = true;
      rateLimitResetTime = Date.now() + waitTime;
      
      await delay(waitTime);
      
      // Retry the request
      if (attempt < RETRY_ATTEMPTS) {
        return enhancedFetch(url, options, attempt + 1);
      }
    }
    
    // Handle server errors with retry
    if (response.status >= 500 && attempt < RETRY_ATTEMPTS) {
      const retryDelay = getRetryDelay(attempt);
      console.warn(`Server error ${response.status}. Retrying in ${retryDelay}ms (attempt ${attempt + 1}/${RETRY_ATTEMPTS})`);
      await delay(retryDelay);
      return enhancedFetch(url, options, attempt + 1);
    }
    
    // Handle authentication errors
    if (response.status === 401) {
      console.error('Authentication failed. Token may be expired or invalid.');
      throw new Error('Authentication failed');
    }
    
    // Handle other client errors
    if (response.status >= 400 && response.status < 500) {
      console.error(`Client error ${response.status}: ${response.statusText}`);
      throw new Error(`Request failed with status ${response.status}`);
    }
    
    return response;
    
  } catch (error) {
    // Retry on network errors
    if (attempt < RETRY_ATTEMPTS && error instanceof Error && error.name === 'TypeError') {
      const retryDelay = getRetryDelay(attempt);
      console.warn(`Network error. Retrying in ${retryDelay}ms (attempt ${attempt + 1}/${RETRY_ATTEMPTS})`);
      await delay(retryDelay);
      return enhancedFetch(url, options, attempt + 1);
    }
    
    throw error;
  }
};

// --- CACHE FUNCTIONS ---

/**
 * Generates cache key based on request parameters
 */
const getCacheKey = (type: string, genre: string, query: string, offset: number, limit: number) => {
  const safeQuery = sanitizeInput(query).replace(/[^a-zA-Z0-9]/g, '') || 'all';
  const safeGenre = sanitizeInput(genre).replace(/[^a-zA-Z0-9]/g, '') || 'gen-all';
  return `${CACHE_PREFIX}${type}_${safeGenre}_q-${safeQuery}_${limit}_${offset}`;
};

/**
 * Retrieves data from cache if valid
 */
const getFromCache = (cacheKey: string) => {
  try {
    const cachedRaw = localStorage.getItem(cacheKey);
    if (cachedRaw) {
      const { timestamp, data } = JSON.parse(cachedRaw);
      if (Date.now() - timestamp < CACHE_TTL) {
        return data;
      } else {
        localStorage.removeItem(cacheKey);
      }
    }
  } catch (e) {
    console.warn('Error reading from cache', e);
  }
  return null;
};

/**
 * Saves data to cache with error handling
 */
const saveToCache = (cacheKey: string, data: any) => {
  try {
    localStorage.setItem(cacheKey, JSON.stringify({
      timestamp: Date.now(),
      data
    }));
  } catch (e) {
    try {
      // Clear old entries if quota exceeded
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(CACHE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
      localStorage.setItem(cacheKey, JSON.stringify({
        timestamp: Date.now(),
        data
      }));
    } catch (retryError) {
      console.warn('LocalStorage quota exceeded, caching disabled for this session.');
    }
  }
};

// --- MOCK DATA GENERATORS ---

const mockImages = [
  "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1514525253440-b393452e3383?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1459749411177-0473ef48ee23?w=300&h=300&fit=crop",
];

const mockArtists: Artist[] = [
  { id: '1', name: 'Alok', external_urls: { spotify: '#' } },
  { id: '2', name: 'Anitta', external_urls: { spotify: '#' } },
  { id: '3', name: 'Vintage Culture', external_urls: { spotify: '#' } },
  { id: '4', name: 'Matuê', external_urls: { spotify: '#' } },
];

export const getMockReleases = (): Album[] => {
  return Array.from({ length: 12 }).map((_, i) => ({
    id: `mock-${i}`,
    name: `Lançamento BeatMap Vol. ${i + 1}`,
    artists: [mockArtists[i % mockArtists.length]],
    images: [{ url: mockImages[i % mockImages.length], height: 300, width: 300 }],
    release_date: new Date().toISOString().split('T')[0],
    release_date_precision: 'day',
    total_tracks: 8,
    album_type: i % 2 === 0 ? 'single' : 'album',
    external_urls: { spotify: '#' },
    uri: `spotify:album:mock-${i}`
  }));
};

export const getMockTracks = (): Track[] => {
    return Array.from({ length: 12 }).map((_, i) => ({
        id: `mock-track-${i}`,
        name: `Hit do Momento ${i + 1}`,
        artists: [mockArtists[i % mockArtists.length]],
        album: {
            id: `mock-album-${i}`,
            name: `Álbum ${i}`,
            artists: [mockArtists[i % mockArtists.length]],
            images: [{ url: mockImages[i % mockImages.length], height: 300, width: 300 }],
            release_date: new Date().toISOString().split('T')[0],
            release_date_precision: 'day',
            total_tracks: 10,
            album_type: 'album',
            external_urls: { spotify: '#' },
            uri: `spotify:album:mock-${i}`
        },
        duration_ms: 180000,
        preview_url: null,
        uri: `spotify:track:mock-${i}`,
        external_urls: { spotify: '#' }
    }));
};

// --- HELPER FUNCTIONS ---

export const isDateInInterval = (
    dateString: string, 
    range: 'day' | 'week' | 'month' | 'custom',
    customStart?: string,
    customEnd?: string
): boolean => {
    if (!dateString) return false;
    
    const date = new Date(dateString);
    const now = new Date();
    
    // Reset time parts for accurate day comparison
    now.setHours(0, 0, 0, 0);
    const itemDate = new Date(date);
    itemDate.setHours(0, 0, 0, 0);

    const diffTime = Math.abs(now.getTime() - itemDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (range === 'day') {
        return diffDays <= 2; 
    }
    if (range === 'week') {
        return diffDays <= 7;
    }
    if (range === 'month') {
        return diffDays <= 30;
    }
    if (range === 'custom' && customStart && customEnd) {
        const start = new Date(customStart);
        const end = new Date(customEnd);
        return itemDate >= start && itemDate <= end;
    }
    return true;
};

export const filterReleasesByDate = (items: (Album | Track)[], range: 'day' | 'week' | 'month' | 'custom', start?: string, end?: string) => {
    return items.filter(item => {
        const dateString = 'release_date' in item 
          ? (item as Album).release_date 
          : (item as Track).album?.release_date || '';
        return isDateInInterval(dateString, range, start, end);
    });
};

const getSearchYears = () => {
    const currentYear = new Date().getFullYear();
    const effectiveYear = Math.max(currentYear, 2026);
    return `${effectiveYear}`;
};

// --- API FUNCTIONS ---

export interface AdvancedFetchOptions {
    offset: number;
    limit: number;
    type: 'albums' | 'tracks';
    genre?: string;
    query?: string;
    bypassCache?: boolean;
}

export const fetchAdvancedReleases = async (token: string, options: AdvancedFetchOptions) => {
    // Validate token
    if (!validateToken(token)) {
        console.error('Invalid token provided');
        throw new Error('Invalid authentication token');
    }
    
    // Sanitize inputs
    const sanitizedQuery = sanitizeInput(options.query || '');
    const sanitizedGenre = sanitizeInput(options.genre || '');
    
    // Check cache
    const cacheKey = getCacheKey(
        options.type, 
        sanitizedGenre, 
        sanitizedQuery, 
        options.offset, 
        options.limit
    );
    
    if (!options.bypassCache) {
        const cachedResult = getFromCache(cacheKey);
        if (cachedResult) {
            return cachedResult;
        }
    }

    // Fetch from API
    let items: any[] = [];
    
    try {
        if (sanitizedQuery) {
            items = await searchItems(token, sanitizedQuery, options.type, sanitizedGenre, options.limit, options.offset);
        } else {
            if (options.type === 'albums') {
                if (sanitizedGenre) {
                    items = await searchByGenre(token, sanitizedGenre, 'album', options.limit, options.offset);
                } else {
                    items = await fetchNewReleases(token, options.limit, options.offset);
                }
            } else {
                if (sanitizedGenre) {
                    items = await searchByGenre(token, sanitizedGenre, 'track', options.limit, options.offset);
                } else {
                    items = await searchNewTracks(token, '', options.limit, options.offset);
                }
            }
        }
    } catch (error) {
        console.error('Error fetching releases:', error);
        
        // Fallback to mock data on error
        if (token.startsWith('mock')) {
            items = options.type === 'albums' ? getMockReleases() : getMockTracks();
        } else {
            throw error;
        }
    }

    const result = {
        items: items || [],
        hasMore: items ? items.length === options.limit : false,
        nextOffset: options.offset + options.limit
    };

    // Save to cache
    if (items && items.length > 0) {
        saveToCache(cacheKey, result);
    }

    return result;
};

export const searchItems = async (token: string, query: string, type: 'albums' | 'tracks', genre?: string, limit = 50, offset = 0): Promise<any[]> => {
    if (!validateToken(token)) {
        throw new Error('Invalid authentication token');
    }
    
    const sanitizedQuery = sanitizeInput(query);
    const sanitizedGenre = sanitizeInput(genre || '');
    
    try {
        let q = sanitizedQuery;
        if (sanitizedGenre) {
            q += ` genre:"${sanitizedGenre}"`;
        }
        
        const spotifyType = type === 'albums' ? 'album' : 'track';
        
        const res = await enhancedFetch(
            `${SPOTIFY_API_BASE}/search?q=${encodeURIComponent(q)}&type=${spotifyType}&market=BR&limit=${limit}&offset=${offset}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        
        const data = await res.json();
        return type === 'albums' ? data.albums.items : data.tracks.items;
    } catch (e) {
        console.error("Search API Error:", e);
        if (token.startsWith('mock')) return type === 'albums' ? getMockReleases() : getMockTracks();
        return [];
    }
};

export const fetchUserProfile = async (token: string): Promise<User> => {
  if (!validateToken(token)) {
    throw new Error('Invalid authentication token');
  }
  
  try {
    const res = await enhancedFetch(`${SPOTIFY_API_BASE}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return await res.json();
  } catch (e) {
    console.warn("Using mock user profile due to error:", e);
    return {
      id: 'mock-user',
      display_name: 'Usuário Demo',
      email: 'demo@beatmap.com',
      product: 'premium',
      images: [{ url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=100&q=80' }]
    };
  }
};

export const fetchNewReleases = async (token: string, limit = 50, offset = 0): Promise<Album[]> => {
  if (!validateToken(token)) {
    throw new Error('Invalid authentication token');
  }
  
  try {
    const res = await enhancedFetch(
        `${SPOTIFY_API_BASE}/browse/new-releases?country=BR&limit=${limit}&offset=${offset}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    
    const data = await res.json();
    const items = data.albums.items as Album[];

    // Filter for current year
    const currentYear = getSearchYears();
    return items.filter(item => item.release_date && item.release_date.startsWith(currentYear));
  } catch (e) {
    console.warn("API Error, returning mock data", e);
    return getMockReleases();
  }
};

export const searchNewTracks = async (token: string, genre: string = '', limit = 50, offset = 0): Promise<Track[]> => {
    if (!validateToken(token)) {
        throw new Error('Invalid authentication token');
    }
    
    const sanitizedGenre = sanitizeInput(genre);
    
    try {
        const years = getSearchYears();
        let query = `year:${years}`;
        
        if (sanitizedGenre) {
            query += ` genre:"${sanitizedGenre}"`;
        }

        const res = await enhancedFetch(
            `${SPOTIFY_API_BASE}/search?q=${encodeURIComponent(query)}&type=track&market=BR&limit=${limit}&offset=${offset}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        
        const data = await res.json();
        return data.tracks.items;
    } catch (e) {
        console.error("Search error:", e);
        if (token.startsWith('mock')) return getMockTracks();
        return [];
    }
};

export const searchByGenre = async (token: string, genre: string, type: 'album' | 'track' = 'album', limit = 50, offset = 0): Promise<any[]> => {
  if (!validateToken(token)) {
    throw new Error('Invalid authentication token');
  }
  
  const sanitizedGenre = sanitizeInput(genre);
  
  try {
    const years = getSearchYears();
    const query = `genre:"${sanitizedGenre}" year:${years}`;
    
    const res = await enhancedFetch(
        `${SPOTIFY_API_BASE}/search?q=${encodeURIComponent(query)}&type=${type}&market=BR&limit=${limit}&offset=${offset}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    
    const data = await res.json();
    return type === 'album' ? data.albums.items : data.tracks.items;
  } catch (e) {
    console.error(e);
    if (token.startsWith('mock')) return type === 'album' ? getMockReleases() : getMockTracks();
    return [];
  }
};

export const getAlbums = async (token: string, ids: string[]): Promise<Album[]> => {
  if (!validateToken(token)) {
    throw new Error('Invalid authentication token');
  }
  
  if (ids.length === 0) return [];
  
  // Process in chunks of 20 (Spotify API limit)
  const chunks = [];
  for (let i = 0; i < ids.length; i += 20) {
      chunks.push(ids.slice(i, i + 20));
  }
  
  let allAlbums: Album[] = [];

  try {
    for (const chunk of chunks) {
        const res = await enhancedFetch(
            `${SPOTIFY_API_BASE}/albums?ids=${chunk.join(',')}&market=BR`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (res.ok) {
            const data = await res.json();
            allAlbums = [...allAlbums, ...data.albums];
        }
    }
    return allAlbums;
  } catch (e) {
    console.error(e);
    return [];
  }
};

export const createPlaylist = async (token: string, userId: string, name: string, description: string): Promise<any> => {
  if (!validateToken(token)) {
    throw new Error('Invalid authentication token');
  }
  
  const sanitizedName = sanitizeInput(name);
  const sanitizedDescription = sanitizeInput(description);
  
  try {
    const res = await enhancedFetch(`${SPOTIFY_API_BASE}/users/${userId}/playlists`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: sanitizedName,
        description: sanitizedDescription,
        public: false,
      }),
    });
    return await res.json();
  } catch (e) {
    console.error(e);
    return {
      id: `mock-playlist-${Date.now()}`,
      name: sanitizedName,
      external_urls: { spotify: '#' }
    };
  }
};

export const uploadPlaylistCoverImage = async (token: string, playlistId: string, imageBase64: string): Promise<void> => {
    if (playlistId.startsWith('mock-')) return;
    
    if (!validateToken(token)) {
        throw new Error('Invalid authentication token');
    }
    
    try {
        const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
        
        await enhancedFetch(`${SPOTIFY_API_BASE}/playlists/${playlistId}/images`, {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'image/jpeg'
            },
            body: cleanBase64
        });
    } catch (e) {
        console.error("Error uploading cover image:", e);
    }
};

export const addTracksToPlaylist = async (token: string, playlistId: string, uris: string[]): Promise<void> => {
  if (!validateToken(token)) {
    throw new Error('Invalid authentication token');
  }
  
  if (!playlistId.startsWith('mock-') && uris.length > 0) {
      const chunks = [];
      for (let i = 0; i < uris.length; i += 100) {
          chunks.push(uris.slice(i, i + 100));
      }

      for (const chunk of chunks) {
         await enhancedFetch(`${SPOTIFY_API_BASE}/playlists/${playlistId}/tracks`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ uris: chunk }),
        });
      }
  }
};

export const searchTracks = async (token: string, query: string): Promise<Track[]> => {
    if (!validateToken(token)) {
        throw new Error('Invalid authentication token');
    }
    
    const sanitizedQuery = sanitizeInput(query);
    
    try {
        const res = await enhancedFetch(
            `${SPOTIFY_API_BASE}/search?q=${encodeURIComponent(sanitizedQuery)}&type=track&market=BR&limit=10`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        
        const data = await res.json();
        return data.tracks.items;
    } catch (e) {
        return [];
    }
};

export const fetchUserTopItems = async (token: string, type: 'artists' | 'tracks', timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term', limit = 20): Promise<any[]> => {
    if (!validateToken(token)) {
        throw new Error('Invalid authentication token');
    }
    
    try {
        const res = await enhancedFetch(
            `${SPOTIFY_API_BASE}/me/top/${type}?time_range=${timeRange}&limit=${limit}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        
        const data = await res.json();
        return data.items;
    } catch (e) {
        console.error(e);
        if(token.startsWith('mock') && type === 'artists') return mockArtists;
        return [];
    }
};

export const fetchRecommendations = async (token: string, seedArtists: string[], seedGenres: string[], seedTracks: string[], limit=30): Promise<Track[]> => {
    if (!validateToken(token)) {
        throw new Error('Invalid authentication token');
    }
    
    try {
        const params = new URLSearchParams({
            limit: limit.toString(),
            market: 'BR'
        });
        
        // Spotify API Limits: Total seeds cannot exceed 5
        let seedsCount = 0;
        
        if (seedArtists.length > 0) {
            const slice = seedArtists.slice(0, 3);
            params.append('seed_artists', slice.join(','));
            seedsCount += slice.length;
        }

        if (seedGenres.length > 0 && seedsCount < 5) {
             const available = 5 - seedsCount;
             const slice = seedGenres.slice(0, available);
             params.append('seed_genres', slice.join(','));
             seedsCount += slice.length;
        }

        if (seedsCount === 0) {
            params.append('seed_genres', 'pop'); 
        }

        const res = await enhancedFetch(
            `${SPOTIFY_API_BASE}/recommendations?${params.toString()}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );

        const data = await res.json();
        return data.tracks;

    } catch (e) {
        console.error(e);
        if(token.startsWith('mock')) return getMockTracks();
        return [];
    }
};

// --- UTILITY FUNCTIONS ---

/**
 * Clears all cached data
 */
export const clearCache = (): void => {
  try {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (e) {
    console.warn('Error clearing cache:', e);
  }
};

/**
 * Gets current rate limiting status
 */
export const getRateLimitStatus = () => {
  return {
    isRateLimited,
    requestCount: requestTimestamps.length,
    maxRequests: RATE_LIMIT_REQUESTS,
    windowMs: RATE_LIMIT_WINDOW,
    resetTime: rateLimitResetTime
  };
};