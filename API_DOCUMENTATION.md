# BeatMap API Documentation

## Overview

BeatMap is a music discovery application that integrates with Spotify Web API and Supabase for backend services. This document outlines the complete API architecture, integration flows, and usage guidelines.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Environment Configuration](#environment-configuration)
3. [Service Layer](#service-layer)
4. [Spotify API Integration](#spotify-api-integration)
5. [Supabase Integration](#supabase-integration)
6. [Error Handling](#error-handling)
7. [Caching Strategy](#caching-strategy)
8. [Rate Limiting](#rate-limiting)
9. [Security Considerations](#security-considerations)
10. [Usage Examples](#usage-examples)

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React UI      │    │  Service Layer  │    │   External APIs │
│                 │    │                 │    │                 │
│ - Components    │◄──►│ - AuthService   │◄──►│ - Spotify API   │
│ - Hooks         │    │ - SearchService │    │ - Supabase      │
│ - Pages         │    │ - PlaylistSvc   │    │                 │
└─────────────────┘    │ - StorageSvc    │    └─────────────────┘
                       │ - CacheService  │
                       └─────────────────┘
                                │
                       ┌─────────────────┐
                       │  Error Manager  │
                       │ - Centralized   │
                       │ - Logging       │
                       │ - Recovery      │
                       └─────────────────┘
```

### Key Components

- **Service Layer**: Abstracts API operations and provides clean interfaces
- **Error Manager**: Centralized error handling and logging
- **Environment Manager**: Secure configuration management
- **Cache Layer**: Intelligent caching with TTL and validation

## Environment Configuration

### Required Variables

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Spotify Configuration  
VITE_SPOTIFY_CLIENT_ID=your-spotify-client-id
```

### Optional Variables

```bash
# Gemini API (AI Features)
VITE_GEMINI_API_KEY=your-gemini-api-key

# Application Configuration
VITE_APP_NAME=BeatMap
VITE_APP_VERSION=1.0.0
VITE_API_BASE_URL=https://api.spotify.com/v1

# Cache Configuration
VITE_CACHE_TTL=1800000
VITE_CACHE_PREFIX=beatmap_

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_NOTIFICATIONS=true
VITE_ENABLE_DISCOVERY=true
```

### Environment Validation

The application validates all required variables on startup:

```typescript
const validation = env.validateConfig();
if (!validation.isValid) {
  console.error('Configuration errors:', validation.errors);
}
```

## Service Layer

### AuthService

Handles user authentication and profile management.

```typescript
interface AuthService {
  isAuthenticated(): Promise<boolean>;
  getAuthUrl(): Promise<string>;
  authenticate(code: string): Promise<ServiceResponse<UserProfile>>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<ServiceResponse<UserProfile>>;
}
```

### SearchService

Provides search functionality across tracks, albums, and artists.

```typescript
interface SearchService {
  searchTracks(query: string, limit?: number): Promise<ServiceResponse<SearchResult>>;
  searchAlbums(query: string, limit?: number): Promise<ServiceResponse<SearchResult>>;
  searchAll(query: string, limit?: number): Promise<ServiceResponse<SearchResult>>;
}
```

### DiscoveryService

Manages music discovery and recommendations.

```typescript
interface DiscoveryService {
  getNewReleases(limit?: number): Promise<ServiceResponse<Album[]>>;
  getRecommendations(options: DiscoveryOptions): Promise<ServiceResponse<Track[]>>;
  getTopArtists(limit?: number, timeRange?: TimeRange): Promise<ServiceResponse<any[]>>;
  getTopTracks(limit?: number, timeRange?: TimeRange): Promise<ServiceResponse<Track[]>>;
}
```

### PlaylistService

Handles playlist creation and management.

```typescript
interface PlaylistService {
  createPlaylist(name: string, description?: string, isPublic?: boolean): Promise<ServiceResponse<Playlist>>;
  addTracksToPlaylist(playlistId: string, trackIds: string[]): Promise<ServiceResponse<void>>;
  uploadPlaylistImage(playlistId: string, imageData: ArrayBuffer): Promise<ServiceResponse<void>>;
}
```

### StorageService

Manages data persistence with Supabase.

```typescript
interface StorageService {
  savePlaylist(data: any): Promise<ServiceResponse<void>>;
  getUserPlaylists(userId: string): Promise<ServiceResponse<any[]>>;
  savePreferences(userId: string, preferences: any): Promise<ServiceResponse<void>>;
  getUserPreferences(userId: string): Promise<ServiceResponse<any>>;
}
```

## Spotify API Integration

### Authentication Flow

1. **Authorization Request**
   ```typescript
   const authUrl = await authService.getAuthUrl();
   window.location.href = authUrl;
   ```

2. **Code Exchange**
   ```typescript
   const result = await authService.authenticate(code);
   if (result.success) {
     // User is authenticated
   }
   ```

3. **Token Management**
   - Access tokens stored securely in localStorage
   - Automatic refresh before expiry
   - Fallback to re-authentication if refresh fails

### API Endpoints Used

| Endpoint | Method | Purpose | Rate Limit |
|----------|--------|---------|------------|
| `/me` | GET | User profile | Standard |
| `/search` | GET | Search content | Standard |
| `/browse/new-releases` | GET | New releases | Standard |
| `/albums/{id}` | GET | Album details | Standard |
| `/users/{id}/playlists` | POST | Create playlist | Standard |
| `/playlists/{id}/tracks` | POST | Add tracks | Standard |
| `/playlists/{id}/images` | PUT | Upload image | Standard |
| `/me/top/{type}` | GET | User top content | Standard |
| `/recommendations` | GET | Get recommendations | Standard |

### Rate Limiting

- **Request Limit**: 100 requests per minute
- **Window**: 60 seconds sliding window
- **Retry Logic**: Exponential backoff with jitter
- **Automatic Handling**: Built into API client

## Supabase Integration

### Database Schema

```sql
-- Playlists table
CREATE TABLE playlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  spotify_id TEXT UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  tracks_count INTEGER DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- User preferences table
CREATE TABLE user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  preferences JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Analytics table
CREATE TABLE analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT,
  event_type TEXT NOT NULL,
  event_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Operations

- **CRUD Operations**: Full support for playlists and preferences
- **Real-time Updates**: Optional real-time subscriptions
- **Row Level Security**: Configured for user data isolation

## Error Handling

### Error Types

```typescript
enum ErrorType {
  NETWORK = 'NETWORK',
  API = 'API', 
  AUTHENTICATION = 'AUTHENTICATION',
  VALIDATION = 'VALIDATION',
  CACHE = 'CACHE',
  RATE_LIMIT = 'RATE_LIMIT',
  UNKNOWN = 'UNKNOWN'
}
```

### Error Severity

```typescript
enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM', 
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}
```

### Error Handling Strategy

1. **Centralized Logging**: All errors logged to error manager
2. **Context Preservation**: Error context maintained throughout stack
3. **Retry Logic**: Automatic retry for retryable errors
4. **User Feedback**: Graceful degradation with user notifications
5. **Monitoring**: Production errors sent to analytics

### Error Boundaries

React Error Boundaries catch and handle component-level errors:

```typescript
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

## Caching Strategy

### Cache Layers

1. **API Response Cache**: 30 minutes TTL
2. **User Data Cache**: 15 minutes TTL  
3. **Static Data Cache**: 24 hours TTL

### Cache Implementation

```typescript
// Cache entry structure
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// Cache operations
const getFromCache = <T>(key: string): T | null;
const setCache = <T>(key: string, data: T, ttl?: number): void;
const clearCache = (): void;
```

### Cache Invalidation

- **Time-based**: Automatic expiration based on TTL
- **Manual**: Clear cache on logout or configuration changes
- **Size-based**: Automatic cleanup when localStorage quota exceeded

## Rate Limiting

### Implementation

```typescript
interface RateLimitState {
  requests: number;
  windowStart: number;
  isLimited: boolean;
}
```

### Strategy

1. **Client-side Limiting**: Prevents API overuse
2. **Server Response Handling**: Respects HTTP 429 responses
3. **Exponential Backoff**: Smart retry with increasing delays
4. **Request Queuing**: Optional queue for critical requests

## Security Considerations

### Data Protection

- **Environment Variables**: All sensitive data in environment
- **Token Storage**: Secure localStorage with encryption
- **Input Validation**: Sanitization of all user inputs
- **HTTPS Only**: Production requires secure connections

### Authentication Security

- **PKCE Flow**: Recommended for mobile apps
- **State Parameter**: CSRF protection
- **Token Refresh**: Secure token rotation
- **Scope Limitation**: Minimal required permissions

### API Security

- **Rate Limiting**: Prevents abuse and DoS
- **Input Sanitization**: SQL injection and XSS prevention
- **Error Sanitization**: No sensitive data in error responses
- **CORS Configuration**: Proper cross-origin setup

## Usage Examples

### Basic Authentication

```typescript
import { apiService } from './lib/apiService';

// Check if user is authenticated
const isAuthenticated = await apiService.auth.isAuthenticated();

// Get authentication URL
const authUrl = await apiService.auth.getAuthUrl();

// Authenticate with code
const result = await apiService.auth.authenticate(code);
if (result.success) {
  console.log('User profile:', result.data);
}
```

### Search Functionality

```typescript
// Search for tracks
const searchResult = await apiService.search.searchTracks('Beatles', 10);
if (searchResult.success) {
  console.log('Found tracks:', searchResult.data.tracks);
}

// Search across all types
const allResults = await apiService.search.searchAll('Queen', 20);
```

### Playlist Management

```typescript
// Create a new playlist
const playlistResult = await apiService.playlist.createPlaylist(
  'My Favorites',
  'My favorite songs',
  true
);

if (playlistResult.success) {
  const playlist = playlistResult.data;
  
  // Add tracks to playlist
  await apiService.playlist.addTracksToPlaylist(
    playlist.id,
    ['track1', 'track2', 'track3']
  );
}
```

### Error Handling

```typescript
try {
  const result = await apiService.discovery.getRecommendations({
    seed_artists: ['artist1', 'artist2'],
    limit: 20
  });
  
  if (!result.success) {
    console.error('API Error:', result.error);
    // Handle error gracefully
  }
} catch (error) {
  console.error('Unexpected error:', error);
  // Error boundary will catch this
}
```

### React Integration

```typescript
import React, { useState, useEffect } from 'react';
import { apiService } from '../lib/apiService';

const SearchComponent = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    const result = await apiService.search.searchAll(query, 10);
    
    if (result.success) {
      setResults(result.data);
    } else {
      console.error('Search failed:', result.error);
    }
    
    setLoading(false);
  };

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for music..."
      />
      <button onClick={handleSearch} disabled={loading}>
        {loading ? 'Searching...' : 'Search'}
      </button>
      
      {results && (
        <div>
          <h3>Tracks</h3>
          {results.tracks.map(track => (
            <div key={track.id}>{track.name}</div>
          ))}
        </div>
      )}
    </div>
  );
};
```

## Testing

### Unit Tests

```typescript
// Example service test
describe('SearchService', () => {
  it('should search tracks successfully', async () => {
    const result = await apiService.search.searchTracks('test query');
    expect(result.success).toBe(true);
    expect(result.data.tracks).toBeDefined();
  });
});
```

### Integration Tests

```typescript
// Example integration test
describe('API Integration', () => {
  it('should authenticate and get user profile', async () => {
    const authResult = await apiService.auth.authenticate(mockCode);
    expect(authResult.success).toBe(true);
    
    const profileResult = await apiService.auth.getCurrentUser();
    expect(profileResult.success).toBe(true);
  });
});
```

## Monitoring and Analytics

### Error Tracking

- **Automatic Logging**: All errors logged with context
- **Performance Metrics**: API response times tracked
- **User Analytics**: Feature usage monitored

### Health Checks

```typescript
const healthStatus = await apiService.getHealthStatus();
console.log('Service health:', healthStatus.data);
```

## Deployment Considerations

### Environment Setup

1. **Development**: Use `.env.local` with local values
2. **Staging**: Use staging environment variables
3. **Production**: Use production secrets and monitoring

### Build Configuration

```typescript
// vite.config.ts
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version)
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          api: ['./lib/apiService', './lib/spotify', './lib/supabase']
        }
      }
    }
  }
});
```

## Troubleshooting

### Common Issues

1. **Authentication Failures**
   - Check Spotify Client ID configuration
   - Verify redirect URI matches Spotify dashboard
   - Ensure proper token storage

2. **API Rate Limits**
   - Monitor request frequency
   - Implement proper caching
   - Use exponential backoff

3. **CORS Issues**
   - Verify Spotify API configuration
   - Check Supabase CORS settings
   - Ensure proper headers

4. **Cache Problems**
   - Clear cache on configuration changes
   - Monitor localStorage quota
   - Handle cache corruption gracefully

### Debug Mode

Enable debug logging in development:

```typescript
if (env.isDevelopment()) {
  console.log('Debug mode enabled');
  // Additional debug logging
}
```

## Support

For issues and questions:

1. **Documentation**: Refer to this guide
2. **Error Logs**: Check browser console and error manager
3. **GitHub Issues**: Report bugs in repository
4. **Community**: Join discussions for help

---

*Last updated: January 2026*
*Version: 1.0.0*