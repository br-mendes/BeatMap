/**
 * Application Initialization
 * Validates environment and initializes services
 */

import { env } from './env';
import { errorManager, ErrorType, ErrorSeverity } from './errorHandler';
import { apiService } from './apiService';

export interface InitializationResult {
  success: boolean;
  errors: string[];
  warnings: string[];
  services: {
    supabase: boolean;
    spotify: boolean;
    environment: boolean;
  };
}

class AppInitializer {
  private static instance: AppInitializer;
  private initialized = false;
  private initializationResult: InitializationResult | null = null;

  private constructor() {}

  public static getInstance(): AppInitializer {
    if (!AppInitializer.instance) {
      AppInitializer.instance = new AppInitializer();
    }
    return AppInitializer.instance;
  }

  public async initialize(): Promise<InitializationResult> {
    if (this.initialized && this.initializationResult) {
      return this.initializationResult;
    }

    console.log('🚀 Initializing BeatMap Application...');

    const result: InitializationResult = {
      success: false,
      errors: [],
      warnings: [],
      services: {
        supabase: false,
        spotify: false,
        environment: false
      }
    };

    try {
      // 1. Validate Environment Configuration
      console.log('📋 Validating environment configuration...');
      await this.validateEnvironment(result);

      // 2. Initialize Error Handling
      console.log('🛡️ Setting up error handling...');
      this.initializeErrorHandling(result);

      // 3. Test Service Connections
      console.log('🔗 Testing service connections...');
      await this.testServices(result);

      // 4. Initialize API Service
      console.log('🔧 Initializing API service...');
      await this.initializeAPIService(result);

      // 5. Setup Global Error Handlers
      console.log('⚙️ Setting up global error handlers...');
      this.setupGlobalErrorHandlers(result);

      // Determine overall success
      result.success = result.errors.length === 0;
      this.initialized = true;
      this.initializationResult = result;

      // Log initialization results
      this.logInitializationResults(result);

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown initialization error';
      result.errors.push(errorMessage);
      result.success = false;
      
      errorManager.handleError(
        error,
        'AppInitializer.initialize',
        ErrorType.UNKNOWN,
        ErrorSeverity.CRITICAL
      );

      this.initialized = true;
      this.initializationResult = result;
      
      return result;
    }
  }

  private async validateEnvironment(result: InitializationResult): Promise<void> {
    const validation = env.validateConfig();
    
    if (!validation.isValid) {
      result.errors.push(...validation.errors);
      result.services.environment = false;
    } else {
      result.services.environment = true;
      
      // Check for optional but recommended variables
      const config = env.getConfig();
      
      if (!config.geminiApiKey) {
        result.warnings.push('Gemini API key not provided - AI features will be limited');
      }
      
      if (config.cacheTtl < 60000) {
        result.warnings.push('Cache TTL is very low - may impact performance');
      }
      
      if (env.isDevelopment()) {
        console.log('✅ Environment configuration validated (Development mode)');
      } else {
        console.log('✅ Environment configuration validated (Production mode)');
      }
    }
  }

  private initializeErrorHandling(result: InitializationResult): void {
    try {
      // Register error handlers based on environment
      if (env.isProduction()) {
        // Production error handlers
        errorManager.registerHandler({
          handle: (error) => {
            // Send to monitoring service
            if (typeof gtag !== 'undefined') {
              gtag('event', 'exception', {
                description: error.message,
                fatal: error.severity === ErrorSeverity.CRITICAL
              });
            }
          }
        });
      }

      console.log('✅ Error handling initialized');
    } catch (error) {
      result.errors.push('Failed to initialize error handling');
      errorManager.handleError(
        error,
        'AppInitializer.initializeErrorHandling',
        ErrorType.UNKNOWN,
        ErrorSeverity.HIGH
      );
    }
  }

  private async testServices(result: InitializationResult): Promise<void> {
    // Test Supabase Connection
    try {
      const { supabase } = await import('./supabase');
      
      // Simple connection test
      const { error } = await supabase.from('playlists').select('count').limit(1);
      
      if (error && !error.message.includes('does not exist')) {
        throw new Error(`Supabase connection failed: ${error.message}`);
      }
      
      result.services.supabase = true;
      console.log('✅ Supabase connection successful');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Supabase connection failed';
      result.errors.push(errorMessage);
      result.services.supabase = false;
      
      errorManager.handleError(
        error,
        'AppInitializer.testServices.supabase',
        ErrorType.NETWORK,
        ErrorSeverity.HIGH
      );
    }

    // Test Spotify Configuration
    try {
      const config = env.getConfig();
      
      if (!config.spotifyClientId) {
        throw new Error('Spotify Client ID not configured');
      }
      
      // Test Spotify API availability
      const authUrl = `https://accounts.spotify.com/authorize?client_id=${config.spotifyClientId}`;
      const response = await fetch(authUrl, { method: 'HEAD' });
      
      if (!response.ok) {
        throw new Error('Spotify API not accessible');
      }
      
      result.services.spotify = true;
      console.log('✅ Spotify API configuration validated');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Spotify API test failed';
      result.errors.push(errorMessage);
      result.services.spotify = false;
      
      errorManager.handleError(
        error,
        'AppInitializer.testServices.spotify',
        ErrorType.NETWORK,
        ErrorSeverity.HIGH
      );
    }
  }

  private async initializeAPIService(result: InitializationResult): Promise<void> {
    try {
      const initResult = await apiService.initialize();
      
      if (!initResult.success) {
        throw new Error(initResult.error || 'API service initialization failed');
      }
      
      console.log('✅ API service initialized successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'API service initialization failed';
      result.errors.push(errorMessage);
      
      errorManager.handleError(
        error,
        'AppInitializer.initializeAPIService',
        ErrorType.UNKNOWN,
        ErrorSeverity.HIGH
      );
    }
  }

  private setupGlobalErrorHandlers(result: InitializationResult): void {
    try {
      // Handle unhandled promise rejections
      window.addEventListener('unhandledrejection', (event) => {
        errorManager.handleError(
          event.reason,
          'Global.unhandledRejection',
          ErrorType.UNKNOWN,
          ErrorSeverity.HIGH
        );
        
        if (env.isDevelopment()) {
          console.error('Unhandled promise rejection:', event.reason);
        }
      });

      // Handle uncaught errors
      window.addEventListener('error', (event) => {
        errorManager.handleError(
          event.error || new Error(event.message),
          'Global.uncaughtError',
          ErrorType.UNKNOWN,
          ErrorSeverity.CRITICAL
        );
        
        if (env.isDevelopment()) {
          console.error('Uncaught error:', event.error);
        }
      });

      console.log('✅ Global error handlers setup');
    } catch (error) {
      result.warnings.push('Failed to setup some global error handlers');
      errorManager.handleError(
        error,
        'AppInitializer.setupGlobalErrorHandlers',
        ErrorType.UNKNOWN,
        ErrorSeverity.MEDIUM
      );
    }
  }

  private logInitializationResults(result: InitializationResult): void {
    console.log('\n📊 Initialization Results:');
    console.log('========================');
    
    if (result.success) {
      console.log('✅ Application initialized successfully!');
    } else {
      console.log('❌ Application initialization completed with errors');
    }

    // Services Status
    console.log('\n🔧 Services Status:');
    console.log(`  Environment: ${result.services.environment ? '✅' : '❌'}`);
    console.log(`  Supabase: ${result.services.supabase ? '✅' : '❌'}`);
    console.log(`  Spotify: ${result.services.spotify ? '✅' : '❌'}`);

    // Errors
    if (result.errors.length > 0) {
      console.log('\n❌ Errors:');
      result.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }

    // Warnings
    if (result.warnings.length > 0) {
      console.log('\n⚠️ Warnings:');
      result.warnings.forEach((warning, index) => {
        console.log(`  ${index + 1}. ${warning}`);
      });
    }

    console.log('========================\n');
  }

  public getInitializationResult(): InitializationResult | null {
    return this.initializationResult;
  }

  public isInitialized(): boolean {
    return this.initialized;
  }

  public async reinitialize(): Promise<InitializationResult> {
    this.initialized = false;
    this.initializationResult = null;
    return this.initialize();
  }
}

// Export singleton instance
export const appInitializer = AppInitializer.getInstance();
export default appInitializer;