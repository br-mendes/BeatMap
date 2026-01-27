import { createClient } from '@supabase/supabase-js';
import { env } from './env';
import { errorManager, ErrorType, ErrorSeverity } from './errorHandler';

class SupabaseManager {
  private client: ReturnType<typeof createClient> | null = null;
  private initialized = false;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    try {
      const config = env.getConfig();
      const validation = env.validateConfig();

      if (!validation.isValid) {
        const errorMessage = `Supabase configuration invalid: ${validation.errors.join(', ')}`;
        errorManager.handleError({
          type: ErrorType.VALIDATION,
          severity: ErrorSeverity.CRITICAL,
          message: errorMessage,
          timestamp: Date.now(),
          context: 'SupabaseManager.initialize',
          retryable: false
        });
        throw new Error(errorMessage);
      }

      this.client = createClient(config.supabaseUrl, config.supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      });

      this.initialized = true;

      if (env.isDevelopment()) {
        console.log('✅ Supabase client initialized successfully');
      }

    } catch (error) {
      errorManager.handleError({
        type: ErrorType.UNKNOWN,
        severity: ErrorSeverity.CRITICAL,
        message: error instanceof Error ? error.message : 'Failed to initialize Supabase client',
        details: error,
        timestamp: Date.now(),
        context: 'SupabaseManager.initialize',
        retryable: false
      });
      throw error;
    }
  }

  public getClient(): ReturnType<typeof createClient> {
    if (!this.initialized || !this.client) {
      const errorMessage = 'Supabase client not initialized';
      errorManager.handleError({
        type: ErrorType.UNKNOWN,
        severity: ErrorSeverity.HIGH,
        message: errorMessage,
        timestamp: Date.now(),
        context: 'SupabaseManager.getClient',
        retryable: false
      });
      throw new Error(errorMessage);
    }

    return this.client;
  }

  public isInitialized(): boolean {
    return this.initialized && this.client !== null;
  }

  public async testConnection(): Promise<boolean> {
    try {
      const client = this.getClient();
      const { data, error } = await client.from('_').select('*').limit(1);
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      return true;
    } catch (error) {
      errorManager.handleError({
        type: ErrorType.NETWORK,
        severity: ErrorSeverity.MEDIUM,
        message: 'Supabase connection test failed',
        details: error,
        timestamp: Date.now(),
        context: 'SupabaseManager.testConnection',
        retryable: true
      });
      return false;
    }
  }
}

const supabaseManager = new SupabaseManager();
export const supabase = supabaseManager.getClient();

export const spotifyConfig = {
  clientId: env.getConfig().spotifyClientId,
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

export { supabaseManager };
export default supabase;