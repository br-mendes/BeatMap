/**
 * Environment configuration manager
 * Provides secure access to environment variables with validation
 */

export interface EnvConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  spotifyClientId: string;
  geminiApiKey: string;
  appName: string;
  appVersion: string;
  apiBaseUrl: string;
  cacheTtl: number;
  cachePrefix: string;
  enableAnalytics: boolean;
  enableNotifications: boolean;
  enableDiscovery: boolean;
}

class EnvManager {
  private config: EnvConfig;
  private initialized = false;

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): EnvConfig {
    const requiredVars = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY',
      'VITE_SPOTIFY_CLIENT_ID'
    ];

    const missingVars = requiredVars.filter(varName => !import.meta.env[varName]);
    
    if (missingVars.length > 0 && import.meta.env.DEV) {
      console.warn('⚠️ Missing environment variables:', missingVars.join(', '));
      console.warn('Please check your .env file or .env.example for required variables');
    }

    return {
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
      supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
      spotifyClientId: import.meta.env.VITE_SPOTIFY_CLIENT_ID || '',
      geminiApiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
      appName: import.meta.env.VITE_APP_NAME || 'BeatMap',
      appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
      apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'https://api.spotify.com/v1',
      cacheTtl: parseInt(import.meta.env.VITE_CACHE_TTL || '1800000'),
      cachePrefix: import.meta.env.VITE_CACHE_PREFIX || 'beatmap_',
      enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
      enableNotifications: import.meta.env.VITE_ENABLE_NOTIFICATIONS === 'true',
      enableDiscovery: import.meta.env.VITE_ENABLE_DISCOVERY === 'true'
    };
  }

  public getConfig(): EnvConfig {
    return this.config;
  }

  public validateConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.config.supabaseUrl) {
      errors.push('Supabase URL is required');
    }

    if (!this.config.supabaseAnonKey) {
      errors.push('Supabase Anon Key is required');
    }

    if (!this.config.spotifyClientId) {
      errors.push('Spotify Client ID is required');
    }

    // Validate URL format
    try {
      new URL(this.config.supabaseUrl);
    } catch {
      errors.push('Invalid Supabase URL format');
    }

    try {
      new URL(this.config.apiBaseUrl);
    } catch {
      errors.push('Invalid API Base URL format');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  public isDevelopment(): boolean {
    return import.meta.env.DEV;
  }

  public isProduction(): boolean {
    return import.meta.env.PROD;
  }

  public getEnvironment(): string {
    return import.meta.env.MODE || 'development';
  }
}

export const env = new EnvManager();
export default env;