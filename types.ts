export interface User {
  id: string;
  email?: string;
  display_name?: string;
  images?: { url: string }[];
  product?: string; // 'premium', 'free', etc.
}

export interface SpotifyImage {
  url: string;
  height: number;
  width: number;
}

export interface Artist {
  id: string;
  name: string;
  genres?: string[];
  images?: SpotifyImage[];
  external_urls: { spotify: string };
}

export interface Album {
  id: string;
  name: string;
  artists: Artist[];
  images: SpotifyImage[];
  release_date: string;
  total_tracks: number;
  album_type: 'album' | 'single' | 'compilation';
  external_urls: { spotify: string };
  uri: string;
  tracks?: {
    items: Track[];
  };
}

export interface Track {
  id: string;
  name: string;
  album?: Album;
  artists: Artist[];
  duration_ms: number;
  preview_url: string | null;
  uri: string;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  images: SpotifyImage[];
  tracks: {
    total: number;
  };
  external_urls: { spotify: string };
}

export interface FilterState {
  search: string;
  type: 'all' | 'album' | 'single';
  dateRange: 'day' | 'week' | 'month';
}

export interface HistoryItem {
  id: string;
  playlistName: string;
  trackCount: number;
  createdAt: string;
  spotifyUrl: string;
}

// Database Types
export interface DbPlaylist {
  id: string;
  user_id: string;
  name: string;
  spotify_playlist_id: string;
  created_at: string;
  updated_at: string;
}

export interface DbPlaylistTrack {
  id?: string;
  playlist_id: string;
  spotify_track_id: string;
  track_name: string;
  artist_name: string;
  album_name: string;
  duration_ms: number;
  genre: string | null;
  release_date: string;
  image_url: string;
}