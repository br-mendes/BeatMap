/**
 * Error Boundary Component
 * Catches and handles errors in React components gracefully
 */

import React, { Component, ReactNode } from 'react';
import { errorManager, ErrorType, ErrorSeverity } from '../lib/errorHandler';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorId: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: Math.random().toString(36).substring(7)
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to error manager
    errorManager.handleError(
      error,
      `ErrorBoundary.${this.constructor.name}`,
      ErrorType.UNKNOWN,
      ErrorSeverity.HIGH
    );

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Update state with error info
    this.setState({
      error,
      errorInfo,
      errorId: Math.random().toString(36).substring(7)
    });

    // Log detailed error information
    console.group('🚨 React Error Boundary Caught an Error');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Component Stack:', errorInfo.componentStack);
    console.groupEnd();
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      // Default fallback UI
      return (
        <div className="error-boundary-fallback">
          <div style={{
            padding: '2rem',
            textAlign: 'center',
            backgroundColor: '#fee',
            border: '1px solid #fcc',
            borderRadius: '8px',
            margin: '1rem'
          }}>
            <h2 style={{ color: '#c33', marginBottom: '1rem' }}>
              Oops! Something went wrong
            </h2>
            
            <p style={{ color: '#666', marginBottom: '1rem' }}>
              We're sorry, but something unexpected happened. The error has been logged and our team will look into it.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details style={{ 
                textAlign: 'left', 
                marginTop: '1rem', 
                padding: '1rem', 
                backgroundColor: '#f5f5f5',
                borderRadius: '4px',
                border: '1px solid #ddd'
              }}>
                <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                  Error Details (Development Only)
                </summary>
                
                <div style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
                  <p><strong>Error:</strong> {this.state.error.message}</p>
                  <p><strong>Error ID:</strong> {this.state.errorId}</p>
                  
                  {this.state.errorInfo && (
                    <>
                      <p><strong>Component Stack:</strong></p>
                      <pre style={{ 
                        whiteSpace: 'pre-wrap', 
                        backgroundColor: '#fff', 
                        padding: '0.5rem',
                        borderRadius: '4px',
                        border: '1px solid #ddd',
                        fontSize: '0.8rem',
                        maxHeight: '200px',
                        overflow: 'auto'
                      }}>
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </>
                  )}
                </div>
              </details>
            )}

            <div style={{ marginTop: '1.5rem' }}>
              <button
                onClick={this.handleRetry}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  marginRight: '0.5rem'
                }}
              >
                Try Again
              </button>
              
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                Reload Page
              </button>
            </div>

            {this.state.errorId && (
              <p style={{ 
                fontSize: '0.8rem', 
                color: '#999', 
                marginTop: '1rem' 
              }}>
                Error ID: {this.state.errorId}
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Specialized error boundaries for different contexts
export class APIErrorBoundary extends ErrorBoundary {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    errorManager.handleError(
      error,
      'APIErrorBoundary',
      ErrorType.API,
      ErrorSeverity.HIGH
    );
    
    super.componentDidCatch(error, errorInfo);
  }
}

export class AuthErrorBoundary extends ErrorBoundary {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    errorManager.handleError(
      error,
      'AuthErrorBoundary',
      ErrorType.AUTHENTICATION,
      ErrorSeverity.HIGH
    );
    
    super.componentDidCatch(error, errorInfo);
  }
}

export class SearchErrorBoundary extends ErrorBoundary {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    errorManager.handleError(
      error,
      'SearchErrorBoundary',
      ErrorType.API,
      ErrorSeverity.MEDIUM
    );
    
    super.componentDidCatch(error, errorInfo);
  }
}

// Hook for functional components
export const useErrorHandler = () => {
  const [error, setError] = React.useState<Error | null>(null);
  const [errorInfo, setErrorInfo] = React.useState<React.ErrorInfo | null>(null);

  const handleError = React.useCallback((error: Error, errorInfo?: React.ErrorInfo) => {
    setError(error);
    setErrorInfo(errorInfo || null);
    
    errorManager.handleError(
      error,
      'useErrorHandler',
      ErrorType.UNKNOWN,
      ErrorSeverity.MEDIUM
    );
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
    setErrorInfo(null);
  }, []);

  return {
    error,
    errorInfo,
    handleError,
    clearError,
    hasError: !!error
  };
};

// HOC for wrapping components with error boundary
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback} onError={onError}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

export default ErrorBoundary;