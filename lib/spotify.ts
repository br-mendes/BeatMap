import { Album, Artist, Track, User, TopArtistData } from '../types';

const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

// --- CACHE CONFIGURATION ---
const CACHE_PREFIX = 'beatmap_v2_'; // Updated to invalidate v1 cache
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes in milliseconds

// Helper to generate cache keys based on request parameters
const getCacheKey = (type: string, genre: string, query: string, offset: number, limit: number) => {
  // Sanitize query to avoid cache key issues
  const safeQuery = query ? query.replace(/[^a-zA-Z0-9]/g, '') : 'all';
  return `${CACHE_PREFIX}${type}_${genre || 'gen-all'}_q-${safeQuery}_${limit}_${offset}`;
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
}

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
        // Allow up to 2 days to account for timezone differences in releases
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

// Alias for compatibility with new hook patterns
export const filterReleasesByDate = (items: (Album | Track)[], range: 'day' | 'week' | 'month' | 'custom', start?: string, end?: string) => {
    return items.filter(item => {
        const dateString = 'release_date' in item 
          ? (item as Album).release_date 
          : (item as Track).album?.release_date || '';
        return isDateInInterval(dateString, range, start, end);
    });
};

// Helper to get current relevant years for search context
const getSearchYears = () => {
    const currentYear = new Date().getFullYear();
    // Enforce 2026 as current year if system time is lagging, ensuring strict forward-looking discovery
    const effectiveYear = Math.max(currentYear, 2026);
    return `${effectiveYear}`;
};

// --- API FUNCTIONS ---

export interface AdvancedFetchOptions {
    offset: number;
    limit: number;
    type: 'albums' | 'tracks';
    genre?: string;
    query?: string; // New field for search
    bypassCache?: boolean;
}

export const fetchAdvancedReleases = async (token: string, options: AdvancedFetchOptions) => {
    // 1. Check Cache
    const cacheKey = getCacheKey(
        options.type, 
        options.genre || '', 
        options.query || '', 
        options.offset, 
        options.limit
    );
    
    if (!options.bypassCache) {
        try {
            const cachedRaw = localStorage.getItem(cacheKey);
            if (cachedRaw) {
                const { timestamp, data } = JSON.parse(cachedRaw);
                // Validate TTL
                if (Date.now() - timestamp < CACHE_TTL) {
                    return data; 
                } else {
                    localStorage.removeItem(cacheKey);
                }
            }
        } catch (e) {
            console.warn('Error reading from cache', e);
        }
    }

    // 2. Fetch from API if not cached
    let items: any[] = [];
    
    if (options.query && options.query.trim().length > 0) {
        // If there is a direct search query, we MUST use the Search API
        items = await searchItems(token, options.query, options.type, options.genre, options.limit, options.offset);
    } else {
        // No search query, rely on discovery logic
        if (options.type === 'albums') {
            if (options.genre) {
                items = await searchByGenre(token, options.genre, 'album', options.limit, options.offset);
            } else {
                items = await fetchNewReleases(token, options.limit, options.offset);
            }
        } else {
            // Tracks
            if (options.genre) {
                items = await searchByGenre(token, options.genre, 'track', options.limit, options.offset);
            } else {
                items = await searchNewTracks(token, '', options.limit, options.offset);
            }
        }
    }

    const result = {
        items: items || [],
        hasMore: items ? items.length === options.limit : false,
        nextOffset: options.offset + options.limit
    };

    // 3. Save to Cache
    if (items && items.length > 0) {
        try {
            localStorage.setItem(cacheKey, JSON.stringify({
                timestamp: Date.now(),
                data: result
            }));
        } catch (e) {
            try {
                // Clear old BeatMap entries if quota exceeded
                Object.keys(localStorage).forEach(key => {
                    if (key.startsWith(CACHE_PREFIX)) {
                        localStorage.removeItem(key);
                    }
                });
                localStorage.setItem(cacheKey, JSON.stringify({
                    timestamp: Date.now(),
                    data: result
                }));
            } catch (retryError) {
                console.warn('LocalStorage quota exceeded, caching disabled for this session.');
            }
        }
    }

    return result;
};

// Generalized search function for direct queries
export const searchItems = async (token: string, query: string, type: 'albums' | 'tracks', genre?: string, limit = 50, offset = 0): Promise<any[]> => {
    try {
        let q = query;
        if (genre) {
            q += ` genre:"${genre}"`;
        }
        
        // Map internal types to Spotify API types
        const spotifyType = type === 'albums' ? 'album' : 'track';
        
        const res = await fetch(`${SPOTIFY_API_BASE}/search?q=${encodeURIComponent(q)}&type=${spotifyType}&market=BR&limit=${limit}&offset=${offset}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error('Falha na busca');
        const data = await res.json();
        
        return type === 'albums' ? data.albums.items : data.tracks.items;
    } catch (e) {
        console.error("Search API Error:", e);
        if (token.startsWith('mock')) return type === 'albums' ? getMockReleases() : getMockTracks();
        return [];
    }
};

export const fetchUserProfile = async (token: string): Promise<User> => {
  try {
    const res = await fetch(`${SPOTIFY_API_BASE}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Falha ao buscar perfil');
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
  try {
    // Note: The browse/new-releases endpoint often returns items from late previous year.
    // We must manually filter them to strict current year compliance.
    const res = await fetch(`${SPOTIFY_API_BASE}/browse/new-releases?country=BR&limit=${limit}&offset=${offset}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Falha ao buscar lançamentos');
    const data = await res.json();
    const items = data.albums.items as Album[];

    // Strict Filter for Current Year
    const currentYear = getSearchYears();
    return items.filter(item => item.release_date && item.release_date.startsWith(currentYear));
  } catch (e) {
    console.warn("API Error, returning mock data", e);
    return getMockReleases();
  }
};

export const searchNewTracks = async (token: string, genre: string = '', limit = 50, offset = 0): Promise<Track[]> => {
    try {
        const years = getSearchYears();
        let query = `year:${years}`;
        
        if (genre) {
            query += ` genre:"${genre}"`;
        }

        const res = await fetch(`${SPOTIFY_API_BASE}/search?q=${encodeURIComponent(query)}&type=track&market=BR&limit=${limit}&offset=${offset}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error('Falha ao buscar músicas');
        const data = await res.json();
        return data.tracks.items;
    } catch (e) {
        console.error("Search error:", e);
        if (token.startsWith('mock')) return getMockTracks();
        return [];
    }
};

export const searchByGenre = async (token: string, genre: string, type: 'album' | 'track' = 'album', limit = 50, offset = 0): Promise<any[]> => {
  try {
    const years = getSearchYears();
    const query = `genre:"${genre}" year:${years}`;
    
    const res = await fetch(`${SPOTIFY_API_BASE}/search?q=${encodeURIComponent(query)}&type=${type}&market=BR&limit=${limit}&offset=${offset}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Falha ao buscar por gênero');
    const data = await res.json();
    return type === 'album' ? data.albums.items : data.tracks.items;
  } catch (e) {
    console.error(e);
    if (token.startsWith('mock')) return type === 'album' ? getMockReleases() : getMockTracks();
    return [];
  }
};

export const getAlbums = async (token: string, ids: string[]): Promise<Album[]> => {
  if (ids.length === 0) return [];
  const chunks = [];
  for (let i = 0; i < ids.length; i += 20) {
      chunks.push(ids.slice(i, i + 20));
  }
  
  let allAlbums: Album[] = [];

  try {
    for (const chunk of chunks) {
        const res = await fetch(`${SPOTIFY_API_BASE}/albums?ids=${chunk.join(',')}&market=BR`, {
            headers: { Authorization: `Bearer ${token}` },
        });
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
  try {
    const res = await fetch(`${SPOTIFY_API_BASE}/users/${userId}/playlists`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        description: description,
        public: false,
      }),
    });
    if (!res.ok) throw new Error('Erro ao criar playlist');
    return await res.json();
  } catch (e) {
    console.error(e);
    return {
      id: `mock-playlist-${Date.now()}`,
      name: name,
      external_urls: { spotify: '#' }
    };
  }
};

export const uploadPlaylistCoverImage = async (token: string, playlistId: string, imageBase64: string): Promise<void> => {
    if (playlistId.startsWith('mock-')) return;
    try {
        // Spotify API expects raw base64 without the data URI prefix
        const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
        
        await fetch(`${SPOTIFY_API_BASE}/playlists/${playlistId}/images`, {
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
  if (!playlistId.startsWith('mock-') && uris.length > 0) {
      const chunks = [];
      for (let i = 0; i < uris.length; i += 100) {
          chunks.push(uris.slice(i, i + 100));
      }

      for (const chunk of chunks) {
         await fetch(`${SPOTIFY_API_BASE}/playlists/${playlistId}/tracks`, {
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
    try {
        const res = await fetch(`${SPOTIFY_API_BASE}/search?q=${encodeURIComponent(query)}&type=track&market=BR&limit=10`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        return data.tracks.items;
    } catch (e) {
        return [];
    }
}

export const fetchUserTopItems = async (token: string, type: 'artists' | 'tracks', timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term', limit = 20): Promise<any[]> => {
    try {
        const res = await fetch(`${SPOTIFY_API_BASE}/me/top/${type}?time_range=${timeRange}&limit=${limit}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Falha ao buscar top items');
        const data = await res.json();
        return data.items;
    } catch (e) {
        console.error(e);
        // Mock fallback
        if(token.startsWith('mock') && type === 'artists') return mockArtists;
        return [];
    }
}

export const fetchRecommendations = async (token: string, seedArtists: string[], seedGenres: string[], seedTracks: string[], limit=30): Promise<Track[]> => {
    try {
        const params = new URLSearchParams({
            limit: limit.toString(),
            market: 'BR'
        });
        
        // Spotify API Limits: Total seeds (artists + genres + tracks) cannot exceed 5.
        // We prioritize artists, then genres.
        
        let seedsCount = 0;
        
        if (seedArtists.length > 0) {
            const slice = seedArtists.slice(0, 3); // Take up to 3 artists
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
            // Fallback seed
            params.append('seed_genres', 'pop'); 
        }

        const res = await fetch(`${SPOTIFY_API_BASE}/recommendations?${params.toString()}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Error fetching recommendations');
        const data = await res.json();
        return data.tracks;

    } catch (e) {
        console.error(e);
        if(token.startsWith('mock')) return getMockTracks();
        return [];
    }
}