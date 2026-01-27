/**
 * Error management system for centralized error handling
 */

export enum ErrorType {
  NETWORK = 'network',
  API = 'api',
  VALIDATION = 'validation',
  CACHE = 'cache',
  AUTHENTICATION = 'authentication',
  RATE_LIMIT = 'rate_limit',
  UNKNOWN = 'unknown'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface AppError {
  id: string;
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  originalError?: Error;
  context?: Record<string, any>;
  timestamp: number;
  retryable: boolean;
  userMessage: string;
}

export interface ErrorOptions {
  context?: Record<string, any>;
  retryable?: boolean;
  userMessage?: string;
  severity?: ErrorSeverity;
}

class ErrorManager {
  private errors: AppError[] = [];
  private maxErrors = 100;

  public createError(
    type: ErrorType,
    message: string,
    originalError?: Error,
    options: ErrorOptions = {}
  ): AppError {
    const error: AppError = {
      id: this.generateErrorId(),
      type,
      severity: options.severity || this.getDefaultSeverity(type),
      message,
      originalError,
      context: options.context,
      timestamp: Date.now(),
      retryable: options.retryable || this.isRetryableError(type),
      userMessage: options.userMessage || this.getDefaultUserMessage(type)
    };

    this.logError(error);
    this.storeError(error);
    return error;
  }

  public handleApiError(response: Response, endpoint: string): AppError {
    const isRateLimit = response.status === 429;
    const isAuthError = response.status === 401 || response.status === 403;
    const isServerError = response.status >= 500;

    let type: ErrorType = ErrorType.API;
    if (isRateLimit) type = ErrorType.RATE_LIMIT;
    else if (isAuthError) type = ErrorType.AUTHENTICATION;
    else if (isServerError) type = ErrorType.NETWORK;

    return this.createError(
      type,
      `API Error: ${response.status} ${response.statusText} at ${endpoint}`,
      undefined,
      {
        context: { endpoint, status: response.status, statusText: response.statusText },
        retryable: isRateLimit || isServerError,
        userMessage: isRateLimit ? 'Muitas requisições. Tente novamente em alguns instantes.' 
                   : isAuthError ? 'Erro de autenticação. Faça login novamente.'
                   : 'Erro ao conectar com o servidor. Tente novamente.',
        severity: isAuthError ? ErrorSeverity.HIGH : ErrorSeverity.MEDIUM
      }
    );
  }

  public handleNetworkError(error: Error, endpoint: string): AppError {
    return this.createError(
      ErrorType.NETWORK,
      `Network error at ${endpoint}: ${error.message}`,
      error,
      {
        context: { endpoint },
        userMessage: 'Erro de conexão. Verifique sua internet e tente novamente.',
        severity: ErrorSeverity.MEDIUM
      }
    );
  }

  public handleCacheError(operation: string, error: Error): AppError {
    return this.createError(
      ErrorType.CACHE,
      `Cache error during ${operation}: ${error.message}`,
      error,
      {
        context: { operation },
        userMessage: 'Erro ao carregar dados salvos. Continuando normalmente.',
        severity: ErrorSeverity.LOW
      }
    );
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getDefaultSeverity(type: ErrorType): ErrorSeverity {
    switch (type) {
      case ErrorType.AUTHENTICATION:
      case ErrorType.CRITICAL:
        return ErrorSeverity.HIGH;
      case ErrorType.RATE_LIMIT:
      case ErrorType.NETWORK:
      case ErrorType.API:
        return ErrorSeverity.MEDIUM;
      case ErrorType.VALIDATION:
      case ErrorType.CACHE:
      default:
        return ErrorSeverity.LOW;
    }
  }

  private getDefaultUserMessage(type: ErrorType): string {
    switch (type) {
      case ErrorType.NETWORK:
        return 'Erro de conexão. Verifique sua internet.';
      case ErrorType.AUTHENTICATION:
        return 'Erro de autenticação. Faça login novamente.';
      case ErrorType.RATE_LIMIT:
        return 'Muitas requisições. Aguarde um momento.';
      case ErrorType.API:
        return 'Erro ao carregar dados. Tente novamente.';
      case ErrorType.VALIDATION:
        return 'Dados inválidos. Verifique e tente novamente.';
      case ErrorType.CACHE:
        return 'Erro ao carregar cache. Continuando normalmente.';
      default:
        return 'Ocorreu um erro. Tente novamente.';
    }
  }

  private isRetryableError(type: ErrorType): boolean {
    return [ErrorType.NETWORK, ErrorType.RATE_LIMIT, ErrorType.API].includes(type);
  }

  private logError(error: AppError): void {
    const logLevel = error.severity === ErrorSeverity.HIGH || error.severity === ErrorSeverity.CRITICAL ? 'error' : 'warn';
    console[logLevel](`[${error.type.toUpperCase()}] ${error.message}`, {
      id: error.id,
      context: error.context,
      retryable: error.retryable,
      userMessage: error.userMessage
    });
  }

  private storeError(error: AppError): void {
    this.errors.push(error);
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }
  }

  public getErrors(type?: ErrorType): AppError[] {
    return type ? this.errors.filter(e => e.type === type) : [...this.errors];
  }

  public clearErrors(): void {
    this.errors = [];
  }

  public getErrorStats(): Record<ErrorType, number> {
    const stats: Record<ErrorType, number> = {
      [ErrorType.NETWORK]: 0,
      [ErrorType.API]: 0,
      [ErrorType.VALIDATION]: 0,
      [ErrorType.CACHE]: 0,
      [ErrorType.AUTHENTICATION]: 0,
      [ErrorType.RATE_LIMIT]: 0,
      [ErrorType.UNKNOWN]: 0
    };

    this.errors.forEach(error => {
      stats[error.type]++;
    });

    return stats;
  }
}

export const errorManager = new ErrorManager();
export default errorManager;