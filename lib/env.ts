/**
 * Environment configuration manager for Next.js
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

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): EnvConfig {
    const requiredVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'NEXT_PUBLIC_SPOTIFY_CLIENT_ID'
    ];

    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0 && process.env.NODE_ENV === 'development') {
      console.warn('⚠️ Missing environment variables:', missingVars.join(', '));
      console.warn('Please check your .env.local file or .env.example for required variables');
    }

    return {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      spotifyClientId: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || '',
      geminiApiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '',
      appName: process.env.NEXT_PUBLIC_APP_NAME || 'BeatMap',
      appVersion: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.spotify.com/v1',
      cacheTtl: parseInt(process.env.NEXT_PUBLIC_CACHE_TTL || '1800000'),
      cachePrefix: process.env.NEXT_PUBLIC_CACHE_PREFIX || 'beatmap_',
      enableAnalytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
      enableNotifications: process.env.NEXT_PUBLIC_ENABLE_NOTIFICATIONS === 'true',
      enableDiscovery: process.env.NEXT_PUBLIC_ENABLE_DISCOVERY === 'true'
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
    return process.env.NODE_ENV === 'development';
  }

  public isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  }

  public getEnvironment(): string {
    return process.env.NODE_ENV || 'development';
  }
}

export const env = new EnvManager();
export default env;
