/**
 * Centralized error handling system
 * Provides consistent error handling for API calls and application errors
 */

export enum ErrorType {
  NETWORK = 'NETWORK',
  API = 'API',
  AUTHENTICATION = 'AUTHENTICATION',
  VALIDATION = 'VALIDATION',
  CACHE = 'CACHE',
  RATE_LIMIT = 'RATE_LIMIT',
  UNKNOWN = 'UNKNOWN'
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface ApiError {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  code?: string | number;
  details?: any;
  timestamp: number;
  context?: string;
  retryable: boolean;
}

export interface ErrorHandler {
  handle(error: ApiError): void;
}

class ErrorManager {
  private handlers: ErrorHandler[] = [];
  private errorLog: ApiError[] = [];
  private maxLogSize = 1000;

  public registerHandler(handler: ErrorHandler): void {
    this.handlers.push(handler);
  }

  public removeHandler(handler: ErrorHandler): void {
    const index = this.handlers.indexOf(handler);
    if (index > -1) {
      this.handlers.splice(index, 1);
    }
  }

  public handleError(
    error: Error | any,
    context?: string,
    type: ErrorType = ErrorType.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM
  ): ApiError {
    const apiError: ApiError = {
      type,
      severity,
      message: error?.message || 'Unknown error occurred',
      code: error?.status || error?.code,
      details: error,
      timestamp: Date.now(),
      context,
      retryable: this.isRetryableError(error, type)
    };

    this.logError(apiError);
    this.notifyHandlers(apiError);

    return apiError;
  }

  public handleNetworkError(error: any, context?: string): ApiError {
    return this.handleError(error, context, ErrorType.NETWORK, ErrorSeverity.HIGH);
  }

  public handleApiError(error: any, context?: string): ApiError {
    const type = this.getApiErrorType(error);
    const severity = this.getApiErrorSeverity(error);
    
    return this.handleError(error, context, type, severity);
  }

  public handleAuthError(error: any, context?: string): ApiError {
    return this.handleError(error, context, ErrorType.AUTHENTICATION, ErrorSeverity.HIGH);
  }

  public handleValidationError(message: string, context?: string): ApiError {
    return this.handleError(
      { message },
      context,
      ErrorType.VALIDATION,
      ErrorSeverity.LOW
    );
  }

  public handleCacheError(error: any, context?: string): ApiError {
    return this.handleError(error, context, ErrorType.CACHE, ErrorSeverity.LOW);
  }

  private isRetryableError(error: any, type: ErrorType): boolean {
    switch (type) {
      case ErrorType.NETWORK:
        return true;
      case ErrorType.RATE_LIMIT:
        return true;
      case ErrorType.API:
        return error?.status >= 500 || error?.status === 429;
      case ErrorType.AUTHENTICATION:
      case ErrorType.VALIDATION:
      case ErrorType.CACHE:
        return false;
      default:
        return false;
    }
  }

  private getApiErrorType(error: any): ErrorType {
    if (error?.status === 401 || error?.status === 403) {
      return ErrorType.AUTHENTICATION;
    }
    if (error?.status === 429) {
      return ErrorType.RATE_LIMIT;
    }
    if (error?.status >= 400 && error?.status < 500) {
      return ErrorType.API;
    }
    if (error?.status >= 500) {
      return ErrorType.NETWORK;
    }
    return ErrorType.UNKNOWN;
  }

  private getApiErrorSeverity(error: any): ErrorSeverity {
    if (error?.status === 401 || error?.status === 403) {
      return ErrorSeverity.HIGH;
    }
    if (error?.status >= 500) {
      return ErrorSeverity.CRITICAL;
    }
    if (error?.status === 429) {
      return ErrorSeverity.MEDIUM;
    }
    return ErrorSeverity.LOW;
  }

  private logError(error: ApiError): void {
    this.errorLog.push(error);
    
    // Keep log size manageable
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(-this.maxLogSize);
    }

    // Console logging with appropriate level
    const logMessage = `[${error.type}] ${error.context ? `${error.context}: ` : ''}${error.message}`;
    
    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        console.error('🚨', logMessage, error.details);
        break;
      case ErrorSeverity.HIGH:
        console.error('❌', logMessage, error.details);
        break;
      case ErrorSeverity.MEDIUM:
        console.warn('⚠️', logMessage, error.details);
        break;
      case ErrorSeverity.LOW:
        console.log('ℹ️', logMessage, error.details);
        break;
    }
  }

  private notifyHandlers(error: ApiError): void {
    this.handlers.forEach(handler => {
      try {
        handler.handle(error);
      } catch (handlerError) {
        console.error('Error in error handler:', handlerError);
      }
    });
  }

  public getErrorLog(): ApiError[] {
    return [...this.errorLog];
  }

  public clearErrorLog(): void {
    this.errorLog = [];
  }

  public getErrorsByType(type: ErrorType): ApiError[] {
    return this.errorLog.filter(error => error.type === type);
  }

  public getErrorsByContext(context: string): ApiError[] {
    return this.errorLog.filter(error => error.context === context);
  }
}

// Console error handler
export class ConsoleErrorHandler implements ErrorHandler {
  handle(error: ApiError): void {
    if (error.severity === ErrorSeverity.CRITICAL || error.severity === ErrorSeverity.HIGH) {
      // Additional console formatting for critical errors
      console.group(`🚨 ${error.type} Error in ${error.context || 'Unknown Context'}`);
      console.error('Message:', error.message);
      console.error('Code:', error.code);
      console.error('Timestamp:', new Date(error.timestamp).toISOString());
      console.error('Retryable:', error.retryable);
      if (error.details) {
        console.error('Details:', error.details);
      }
      console.groupEnd();
    }
  }
}

// Analytics error handler (if analytics is enabled)
export class AnalyticsErrorHandler implements ErrorHandler {
  handle(error: ApiError): void {
    // Send error to analytics service
    if (typeof gtag !== 'undefined') {
      gtag('event', 'exception', {
        description: error.message,
        fatal: error.severity === ErrorSeverity.CRITICAL
      });
    }
  }
}

export const errorManager = new ErrorManager();

// Register default handlers
if (import.meta.env.PROD) {
  errorManager.registerHandler(new ConsoleErrorHandler());
}

export default errorManager;