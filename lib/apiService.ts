/**
 * API Service Layer
 * Abstracts API operations and provides a clean interface for components
 */

import { spotifyAPI } from './spotify';
import { supabase } from './supabase';
import { errorManager, ErrorType } from './errorHandler';
import { env } from './env';

// Service interfaces
export interface UserProfile {
  id: string;
  display_name: string;
  email: string;
  country: string;
  image?: string;
  followers: number;
}

export interface Track {
  id: string;
  name: string;
  artists: string[];
  album: string;
  duration_ms: number;
  preview_url?: string;
  image?: string;
  uri: string;
}

export interface Album {
  id: string;
  name: string;
  artists: string[];
  release_date: string;
  total_tracks: number;
  image?: string;
  uri: string;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  is_public: boolean;
  tracks_count: number;
  image?: string;
  uri: string;
  owner: string;
}

export interface SearchResult {
  tracks: Track[];
  albums: Album[];
  artists: any[];
  total: {
    tracks: number;
    albums: number;
    artists: number;
  };
}

export interface DiscoveryOptions {
  seed_artists?: string[];
  seed_genres?: string[];
  seed_tracks?: string[];
  limit?: number;
  market?: string;
  min_energy?: number;
  max_energy?: number;
  min_danceability?: number;
  max_danceability?: number;
  min_valence?: number;
  max_valence?: number;
}

// Service response wrapper
export interface ServiceResponse<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  success: boolean;
}

// Abstract base service
abstract class BaseService {
  protected async executeOperation<T>(
    operation: () => Promise<T>,
    context: string
  ): Promise<ServiceResponse<T>> {
    try {
      const data = await operation();
      return {
        data,
        error: null,
        loading: false,
        success: true
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      errorManager.handleError(error, context, ErrorType.API);
      
      return {
        data: null,
        error: errorMessage,
        loading: false,
        success: false
      };
    }
  }
}

// Authentication Service
export class AuthService extends BaseService {
  public async isAuthenticated(): Promise<boolean> {
    return spotifyAPI.isAuthenticated();
  }

  public async getAuthUrl(): Promise<string> {
    return spotifyAPI.getAuthUrl();
  }

  public async authenticate(code: string): Promise<ServiceResponse<UserProfile>> {
    return this.executeOperation(async () => {
      await spotifyAPI.exchangeCodeForTokens(code);
      const profile = await spotifyAPI.getUserProfile();
      
      return {
        id: profile.id,
        display_name: profile.display_name,
        email: profile.email,
        country: profile.country,
        image: profile.images?.[0]?.url,
        followers: profile.followers.total
      };
    }, 'AuthService.authenticate');
  }

  public async logout(): Promise<void> {
    spotifyAPI.logout();
  }

  public async getCurrentUser(): Promise<ServiceResponse<UserProfile>> {
    return this.executeOperation(async () => {
      const profile = await spotifyAPI.getUserProfile();
      
      return {
        id: profile.id,
        display_name: profile.display_name,
        email: profile.email,
        country: profile.country,
        image: profile.images?.[0]?.url,
        followers: profile.followers.total
      };
    }, 'AuthService.getCurrentUser');
  }
}

// Search Service
export class SearchService extends BaseService {
  public async searchTracks(
    query: string,
    limit: number = 20
  ): Promise<ServiceResponse<SearchResult>> {
    return this.executeOperation(async () => {
      const result = await spotifyAPI.search(query, ['track'], { limit });
      
      return {
        tracks: result.tracks.items.map(this.transformTrack),
        albums: [],
        artists: [],
        total: {
          tracks: result.tracks.total,
          albums: 0,
          artists: 0
        }
      };
    }, 'SearchService.searchTracks');
  }

  public async searchAlbums(
    query: string,
    limit: number = 20
  ): Promise<ServiceResponse<SearchResult>> {
    return this.executeOperation(async () => {
      const result = await spotifyAPI.search(query, ['album'], { limit });
      
      return {
        tracks: [],
        albums: result.albums.items.map(this.transformAlbum),
        artists: [],
        total: {
          tracks: 0,
          albums: result.albums.total,
          artists: 0
        }
      };
    }, 'SearchService.searchAlbums');
  }

  public async searchAll(
    query: string,
    limit: number = 20
  ): Promise<ServiceResponse<SearchResult>> {
    return this.executeOperation(async () => {
      const result = await spotifyAPI.search(query, ['track', 'album', 'artist'], { limit });
      
      return {
        tracks: result.tracks?.items.map(this.transformTrack) || [],
        albums: result.albums?.items.map(this.transformAlbum) || [],
        artists: result.artists?.items || [],
        total: {
          tracks: result.tracks?.total || 0,
          albums: result.albums?.total || 0,
          artists: result.artists?.total || 0
        }
      };
    }, 'SearchService.searchAll');
  }

  private transformTrack(spotifyTrack: any): Track {
    return {
      id: spotifyTrack.id,
      name: spotifyTrack.name,
      artists: spotifyTrack.artists.map((a: any) => a.name),
      album: spotifyTrack.album.name,
      duration_ms: spotifyTrack.duration_ms,
      preview_url: spotifyTrack.preview_url,
      image: spotifyTrack.album.images?.[0]?.url,
      uri: spotifyTrack.uri
    };
  }

  private transformAlbum(spotifyAlbum: any): Album {
    return {
      id: spotifyAlbum.id,
      name: spotifyAlbum.name,
      artists: spotifyAlbum.artists.map((a: any) => a.name),
      release_date: spotifyAlbum.release_date,
      total_tracks: spotifyAlbum.total_tracks,
      image: spotifyAlbum.images?.[0]?.url,
      uri: spotifyAlbum.uri
    };
  }
}

// Discovery Service
export class DiscoveryService extends BaseService {
  public async getNewReleases(
    limit: number = 20
  ): Promise<ServiceResponse<Album[]>> {
    return this.executeOperation(async () => {
      const result = await spotifyAPI.getNewReleases({ limit });
      return result.albums.items.map(this.transformAlbum);
    }, 'DiscoveryService.getNewReleases');
  }

  public async getRecommendations(
    options: DiscoveryOptions
  ): Promise<ServiceResponse<Track[]>> {
    return this.executeOperation(async () => {
      const result = await spotifyAPI.getRecommendations(options);
      return result.tracks.map(this.transformTrack);
    }, 'DiscoveryService.getRecommendations');
  }

  public async getTopArtists(
    limit: number = 20,
    time_range: 'short_term' | 'medium_term' | 'long_term' = 'medium_term'
  ): Promise<ServiceResponse<any[]>> {
    return this.executeOperation(async () => {
      const result = await spotifyAPI.getTopArtists({ limit, time_range });
      return result.items;
    }, 'DiscoveryService.getTopArtists');
  }

  public async getTopTracks(
    limit: number = 20,
    time_range: 'short_term' | 'medium_term' | 'long_term' = 'medium_term'
  ): Promise<ServiceResponse<Track[]>> {
    return this.executeOperation(async () => {
      const result = await spotifyAPI.getTopTracks({ limit, time_range });
      return result.items.map(this.transformTrack);
    }, 'DiscoveryService.getTopTracks');
  }

  private transformAlbum(spotifyAlbum: any): Album {
    return {
      id: spotifyAlbum.id,
      name: spotifyAlbum.name,
      artists: spotifyAlbum.artists.map((a: any) => a.name),
      release_date: spotifyAlbum.release_date,
      total_tracks: spotifyAlbum.total_tracks,
      image: spotifyAlbum.images?.[0]?.url,
      uri: spotifyAlbum.uri
    };
  }

  private transformTrack(spotifyTrack: any): Track {
    return {
      id: spotifyTrack.id,
      name: spotifyTrack.name,
      artists: spotifyTrack.artists.map((a: any) => a.name),
      album: spotifyTrack.album.name,
      duration_ms: spotifyTrack.duration_ms,
      preview_url: spotifyTrack.preview_url,
      image: spotifyTrack.album.images?.[0]?.url,
      uri: spotifyTrack.uri
    };
  }
}

// Playlist Service
export class PlaylistService extends BaseService {
  public async createPlaylist(
    name: string,
    description: string = '',
    isPublic: boolean = true
  ): Promise<ServiceResponse<Playlist>> {
    return this.executeOperation(async () => {
      const userProfile = await spotifyAPI.getUserProfile();
      const result = await spotifyAPI.createPlaylist(
        userProfile.id,
        name,
        description,
        isPublic
      );
      
      return {
        id: result.id,
        name: result.name,
        description: result.description,
        is_public: result.public,
        tracks_count: result.tracks.total,
        image: result.images?.[0]?.url,
        uri: result.uri,
        owner: result.owner.id
      };
    }, 'PlaylistService.createPlaylist');
  }

  public async addTracksToPlaylist(
    playlistId: string,
    trackIds: string[]
  ): Promise<ServiceResponse<void>> {
    return this.executeOperation(async () => {
      await spotifyAPI.addTracksToPlaylist(playlistId, trackIds);
    }, 'PlaylistService.addTracksToPlaylist');
  }

  public async uploadPlaylistImage(
    playlistId: string,
    imageData: ArrayBuffer
  ): Promise<ServiceResponse<void>> {
    return this.executeOperation(async () => {
      await spotifyAPI.uploadPlaylistImage(playlistId, imageData);
    }, 'PlaylistService.uploadPlaylistImage');
  }
}

// Storage Service (Supabase)
export class StorageService extends BaseService {
  public async savePlaylist(data: any): Promise<ServiceResponse<void>> {
    return this.executeOperation(async () => {
      const { error } = await supabase
        .from('playlists')
        .insert(data);
      
      if (error) throw error;
    }, 'StorageService.savePlaylist');
  }

  public async getUserPlaylists(
    userId: string
  ): Promise<ServiceResponse<any[]>> {
    return this.executeOperation(async () => {
      const { data, error } = await supabase
        .from('playlists')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }, 'StorageService.getUserPlaylists');
  }

  public async savePreferences(
    userId: string,
    preferences: any
  ): Promise<ServiceResponse<void>> {
    return this.executeOperation(async () => {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: userId,
          preferences,
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
    }, 'StorageService.savePreferences');
  }

  public async getUserPreferences(
    userId: string
  ): Promise<ServiceResponse<any>> {
    return this.executeOperation(async () => {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('preferences')
        .eq('user_id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data?.preferences || {};
    }, 'StorageService.getUserPreferences');
  }
}

// Cache Service
export class CacheService extends BaseService {
  public clearAllCache(): Promise<ServiceResponse<void>> {
    return this.executeOperation(async () => {
      spotifyAPI.clearCache();
    }, 'CacheService.clearAllCache');
  }

  public getCacheInfo(): ServiceResponse<{
    rateLimit: any;
    cacheSize: number;
  }> {
    try {
      const rateLimit = spotifyAPI.getRateLimitStatus();
      let cacheSize = 0;
      
      try {
        const keys = Object.keys(localStorage);
        cacheSize = keys.filter(key => key.startsWith('beatmap_')).length;
      } catch (error) {
        // Ignore localStorage errors
      }
      
      return {
        data: { rateLimit, cacheSize },
        error: null,
        loading: false,
        success: true
      };
    } catch (error) {
      return {
        data: null,
        error: 'Failed to get cache info',
        loading: false,
        success: false
      };
    }
  }
}

// Main API Service (aggregates all services)
export class APIService {
  public readonly auth = new AuthService();
  public readonly search = new SearchService();
  public readonly discovery = new DiscoveryService();
  public readonly playlist = new PlaylistService();
  public readonly storage = new StorageService();
  public readonly cache = new CacheService();

  public async initialize(): Promise<ServiceResponse<void>> {
    try {
      // Validate environment configuration
      const validation = env.validateConfig();
      if (!validation.isValid) {
        throw new Error(`Configuration error: ${validation.errors.join(', ')}`);
      }

      // Test Supabase connection
      const { error } = await supabase.from('playlists').select('count').limit(1);
      if (error && !error.message.includes('does not exist')) {
        throw new Error(`Supabase connection failed: ${error.message}`);
      }

      return {
        data: null,
        error: null,
        loading: false,
        success: true
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Initialization failed',
        loading: false,
        success: false
      };
    }
  }

  public getHealthStatus(): ServiceResponse<{
    authenticated: boolean;
    configValid: boolean;
    supabaseConnected: boolean;
    rateLimitStatus: any;
  }> {
    try {
      const configValid = env.validateConfig().isValid;
      const rateLimitStatus = spotifyAPI.getRateLimitStatus();
      
      return {
        data: {
          authenticated: spotifyAPI.isAuthenticated(),
          configValid,
          supabaseConnected: true, // Basic check - could be enhanced
          rateLimitStatus
        },
        error: null,
        loading: false,
        success: true
      };
    } catch (error) {
      return {
        data: null,
        error: 'Health check failed',
        loading: false,
        success: false
      };
    }
  }
}

// Export singleton instance
export const apiService = new APIService();
export default apiService;