import { Album, Artist, Track, User } from '../types';

const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

// MOCK DATA GENERATORS (For demo purposes when API key is missing/invalid)
const mockImages = [
  "https://picsum.photos/300/300?random=1",
  "https://picsum.photos/300/300?random=2",
  "https://picsum.photos/300/300?random=3",
  "https://picsum.photos/300/300?random=4",
  "https://picsum.photos/300/300?random=5",
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
    total_tracks: 8,
    album_type: i % 2 === 0 ? 'single' : 'album',
    external_urls: { spotify: '#' },
    uri: `spotify:album:mock-${i}`
  }));
};

// REAL API FUNCTIONS

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
      images: [{ url: 'https://picsum.photos/200' }]
    };
  }
};

export const fetchNewReleases = async (token: string): Promise<Album[]> => {
  try {
    const res = await fetch(`${SPOTIFY_API_BASE}/browse/new-releases?country=BR&limit=20`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Falha ao buscar lançamentos');
    const data = await res.json();
    return data.albums.items;
  } catch (e) {
    console.warn("API Error, returning mock data", e);
    return getMockReleases();
  }
};

export const searchByGenre = async (token: string, genre: string): Promise<Album[]> => {
  try {
    // Spotify search for albums by genre
    const res = await fetch(`${SPOTIFY_API_BASE}/search?q=genre:${encodeURIComponent(genre)}&type=album&limit=20`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Falha ao buscar por gênero');
    const data = await res.json();
    return data.albums.items;
  } catch (e) {
    console.error(e);
    if (token.startsWith('mock')) return getMockReleases();
    return [];
  }
};

export const getAlbums = async (token: string, ids: string[]): Promise<Album[]> => {
  if (ids.length === 0) return [];
  // Note: Spotify allows max 20 IDs per request.
  // For simplicity, we slice the first 20 if more are selected.
  const idsToFetch = ids.slice(0, 20).join(',');
  
  try {
    const res = await fetch(`${SPOTIFY_API_BASE}/albums?ids=${idsToFetch}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    if (!res.ok) throw new Error('Falha ao buscar detalhes dos álbuns');
    const data = await res.json();
    return data.albums;
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
    // Return a mock response for UI feedback
    return {
      id: `mock-playlist-${Date.now()}`,
      name: name,
      external_urls: { spotify: '#' }
    };
  }
};

export const addTracksToPlaylist = async (token: string, playlistId: string, uris: string[]): Promise<void> => {
  // In a real app we'd batch these if > 100
  if (!playlistId.startsWith('mock-') && uris.length > 0) {
     await fetch(`${SPOTIFY_API_BASE}/playlists/${playlistId}/tracks`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ uris }),
    });
  }
};

export const searchTracks = async (token: string, query: string): Promise<Track[]> => {
    try {
        const res = await fetch(`${SPOTIFY_API_BASE}/search?q=${encodeURIComponent(query)}&type=track&limit=10`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        return data.tracks.items;
    } catch (e) {
        return [];
    }
}