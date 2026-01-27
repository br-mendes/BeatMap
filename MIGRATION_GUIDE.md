# Migration Guide: BeatMap API Integration v2.0

This guide outlines the changes required to migrate from the legacy API integration to the new secure and robust API integration system.

## Migration Steps

### 1. Environment Setup

Create a `.env.local` file based on `.env.example`:

```bash
# Copy the example file
cp .env.example .env.local

# Edit with your actual values
# VITE_SUPABASE_URL=https://your-project.supabase.co
# VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
# VITE_SPOTIFY_CLIENT_ID=your-spotify-client-id
```

### 2. Update Imports

Replace old imports with new service layer:

#### Before (Legacy)
```typescript
import { supabase } from './lib/supabase';
import { spotifyAPI } from './lib/spotify';
```

#### After (New)
```typescript
import { apiService } from './lib/apiService';
```

### 3. Authentication Changes

#### Before (Legacy)
```typescript
// Old authentication flow
const tokens = await spotifyAPI.exchangeCodeForTokens(code);
const profile = await spotifyAPI.getUserProfile();
```

#### After (New)
```typescript
// New authentication flow
const result = await apiService.auth.authenticate(code);
if (result.success) {
  const profile = result.data;
  // Use profile data
} else {
  console.error('Authentication failed:', result.error);
}
```

### 4. Search API Changes

#### Before (Legacy)
```typescript
// Old search implementation
const results = await spotifyAPI.search(query, ['track'], { limit: 20 });
```

#### After (New)
```typescript
// New search implementation
const result = await apiService.search.searchTracks(query, 20);
if (result.success) {
  const tracks = result.data.tracks;
  // Process tracks
} else {
  console.error('Search failed:', result.error);
}
```

### 5. Playlist Management Changes

#### Before (Legacy)
```typescript
// Old playlist creation
const userProfile = await spotifyAPI.getUserProfile();
const playlist = await spotifyAPI.createPlaylist(
  userProfile.id,
  name,
  description
);
```

#### After (New)
```typescript
// New playlist creation
const result = await apiService.playlist.createPlaylist(name, description);
if (result.success) {
  const playlist = result.data;
  // Use playlist
} else {
  console.error('Playlist creation failed:', result.error);
}
```

### 6. Error Handling Changes

#### Before (Legacy)
```typescript
// Old error handling
try {
  const data = await spotifyAPI.someMethod();
} catch (error) {
  console.error('Error:', error);
}
```

#### After (New)
```typescript
// New error handling
const result = await apiService.discovery.getRecommendations(options);
if (!result.success) {
  // Error is already logged by error manager
  // Handle UI feedback
  showErrorMessage(result.error);
}
```

### 7. Component Updates

#### Before (Legacy)
```typescript
const MyComponent = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await spotifyAPI.getTopTracks();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    // JSX with error handling
  );
};
```

#### After (New)
```typescript
const MyComponent = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const loadData = async () => {
    setLoading(true);
    const result = await apiService.discovery.getTopTracks();
    
    if (result.success) {
      setData(result.data);
      setError(null);
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    // JSX with simplified error handling
  );
};
```

## File Changes

### Files to Remove
- `lib/supabase.ts` (legacy version)
- `lib/spotify.ts` (legacy version)
- Any components with hardcoded API calls

### Files to Add
- `lib/env.ts` - Environment management
- `lib/errorHandler.ts` - Error handling system
- `lib/apiService.ts` - Service layer
- `lib/initializer.ts` - Application initialization
- `components/ErrorBoundary.tsx` - React error boundaries
- `.env.example` - Environment template

### Files to Update
- `App.tsx` - Add initialization and error boundaries
- `index.tsx` - Add app initialization
- All components using API calls

## Security Changes

### 1. Environment Variables
All sensitive data moved to environment variables:
- Supabase URL and keys
- Spotify Client ID
- Gemini API key (optional)

### 2. Token Storage
- Secure localStorage implementation
- Automatic token refresh
- Proper token validation

### 3. Input Validation
- Sanitization of user inputs
- SQL injection prevention
- XSS protection

## Performance Improvements

### 1. Enhanced Caching
- Improved TTL management
- Better cache invalidation
- Size-based cache cleanup

### 2. Rate Limiting
- Client-side rate limiting
- Exponential backoff
- Automatic retry logic

### 3. Error Recovery
- Automatic retry for retryable errors
- Graceful degradation
- Better user feedback

## Testing Changes

### 1. Unit Tests
Update tests to use new service layer:

```typescript
// Old test
test('should get user profile', async () => {
  const profile = await spotifyAPI.getUserProfile();
  expect(profile).toBeDefined();
});

// New test
test('should get user profile', async () => {
  const result = await apiService.auth.getCurrentUser();
  expect(result.success).toBe(true);
  expect(result.data).toBeDefined();
});
```

### 2. Integration Tests
Add tests for service layer and error handling.

## Deployment Changes

### 1. Environment Configuration
Set up environment variables in production:
- Vercel Environment Variables
- GitHub Secrets
- Docker Environment Variables

### 2. Build Configuration
Update build configuration if needed:

```typescript
// vite.config.ts
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version)
  }
});
```

## Migration Checklist

- [ ] Create `.env.local` from `.env.example`
- [ ] Update all imports to use `apiService`
- [ ] Replace direct API calls with service methods
- [ ] Add error handling for service responses
- [ ] Wrap components with ErrorBoundaries
- [ ] Add app initialization in `index.tsx`
- [ ] Update environment variables in production
- [ ] Run tests and fix any failures
- [ ] Test authentication flow
- [ ] Test API integration
- [ ] Monitor error logs
- [ ] Update documentation

## Rollback Plan

If issues occur during migration:

1. **Quick Rollback**: Revert to legacy API files
2. **Partial Rollback**: Use hybrid approach with some services
3. **Gradual Migration**: Migrate one service at a time

## Support

For migration issues:

1. Check error logs in browser console
2. Review API documentation
3. Test environment variables
4. Verify API credentials
5. Check network requests in dev tools

---

**Migration Completed**: 🎉 Your BeatMap application now uses a secure, robust, and maintainable API integration system!