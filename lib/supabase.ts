import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from './env';
import { errorManager, ErrorType, ErrorSeverity } from './errorHandler';

let supabaseInstance: SupabaseClient | null = null;

/**
 * Initialize Supabase client with proper error handling and configuration validation
 */
function initializeSupabase(): SupabaseClient {
  try {
    // Validate environment configuration
    const validation = env.validateConfig();
    if (!validation.isValid) {
      const errorMessage = `Supabase configuration validation failed: ${validation.errors.join(', ')}`;
      errorManager.handleError(
        new Error(errorMessage),
        'supabase-initialization',
        ErrorType.VALIDATION,
        ErrorSeverity.CRITICAL
      );
      throw new Error(errorMessage);
    }

    const config = env.getConfig();
    
    // Additional runtime validation
    if (!config.supabaseUrl.startsWith('https://')) {
      const errorMessage = 'Supabase URL must use HTTPS';
      errorManager.handleError(
        new Error(errorMessage),
        'supabase-initialization',
        ErrorType.VALIDATION,
        ErrorSeverity.HIGH
      );
      throw new Error(errorMessage);
    }

    if (config.supabaseAnonKey.length < 20) {
      const errorMessage = 'Invalid Supabase anonymous key format';
      errorManager.handleError(
        new Error(errorMessage),
        'supabase-initialization',
        ErrorType.VALIDATION,
        ErrorSeverity.HIGH
      );
      throw new Error(errorMessage);
    }

    // Create Supabase client with configuration
    const client = createClient(config.supabaseUrl, config.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      },
      global: {
        headers: {
          'X-Client-Info': `beatmap/${config.appVersion}`
        }
      }
    });

    return client;
  } catch (error) {
    const apiError = errorManager.handleError(
      error,
      'supabase-initialization',
      ErrorType.API,
      ErrorSeverity.CRITICAL
    );
    throw apiError;
  }
}

/**
 * Get Supabase client instance (lazy initialization)
 */
export function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    supabaseInstance = initializeSupabase();
  }
  return supabaseInstance;
}

// Export the supabase client for backward compatibility
export const supabase = getSupabaseClient();

/**
 * Spotify configuration using environment variables
 */
export const spotifyConfig = {
  get clientId(): string {
    const config = env.getConfig();
    if (!config.spotifyClientId) {
      errorManager.handleValidationError(
        'Spotify Client ID is not configured',
        'spotify-config'
      );
      return '';
    }
    return config.spotifyClientId;
  },
  scopes: [
    'user-read-email',
    'user-read-private',
    'playlist-modify-public',
    'playlist-modify-private',
    'user-library-read',
    'user-top-read',
    'ugc-image-upload'
  ]
};

/**
 * Reinitialize Supabase client (useful for testing or config changes)
 */
export function reinitializeSupabase(): SupabaseClient {
  try {
    supabaseInstance = null;
    return getSupabaseClient();
  } catch (error) {
    const apiError = errorManager.handleError(
      error,
      'supabase-reinitialization',
      ErrorType.API,
      ErrorSeverity.MEDIUM
    );
    throw apiError;
  }
}

/**
 * Health check for Supabase connection
 */
export async function checkSupabaseHealth(): Promise<{ healthy: boolean; error?: string }> {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client.from('_').select('*').limit(1);
    
    if (error) {
      errorManager.handleApiError(error, 'supabase-health-check');
      return { healthy: false, error: error.message };
    }
    
    return { healthy: true };
  } catch (error) {
    const apiError = errorManager.handleError(
      error,
      'supabase-health-check',
      ErrorType.NETWORK,
      ErrorSeverity.MEDIUM
    );
    return { healthy: false, error: apiError.message };
  }
}

export default supabase;