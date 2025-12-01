import React, { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { captureException } from '@/lib/sentry';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * Error Boundary Component
 *
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing.
 *
 * Usage:
 * ```tsx
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 *
 * Features:
 * - Catches errors in child components
 * - Prevents white screen of death
 * - Shows user-friendly error message
 * - Provides recovery options (reload, go home)
 * - Logs errors to console (can integrate with Sentry)
 * - Development: shows error stack trace
 * - Production: shows generic error message
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Store error info in state
    this.setState({
      error,
      errorInfo,
    });

    // Send error to Sentry
    captureException(error, {
      tags: {
        errorBoundary: 'true',
        component: 'ErrorBoundary',
      },
      extra: {
        componentStack: errorInfo.componentStack,
        errorInfo: errorInfo,
      },
      level: 'error',
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReload = () => {
    // Reload the page
    window.location.reload();
  };

  handleGoHome = () => {
    // Navigate to home page
    window.location.href = '/';
  };

  handleReset = () => {
    // Reset error boundary state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <AlertCircle className="h-8 w-8 text-destructive" />
                <div>
                  <CardTitle className="text-2xl">Something went wrong</CardTitle>
                  <CardDescription className="mt-1">
                    {import.meta.env.DEV
                      ? 'An error occurred in the application'
                      : 'We encountered an unexpected error. Please try reloading the page.'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Show error details in development */}
              {import.meta.env.DEV && this.state.error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                  <h3 className="font-semibold text-sm mb-2 text-destructive">
                    Error Details (Development Only)
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-medium">Message:</p>
                      <pre className="text-xs bg-black/5 dark:bg-white/5 p-2 rounded mt-1 overflow-x-auto">
                        {this.state.error.message}
                      </pre>
                    </div>
                    {this.state.error.stack && (
                      <div>
                        <p className="text-sm font-medium">Stack Trace:</p>
                        <pre className="text-xs bg-black/5 dark:bg-white/5 p-2 rounded mt-1 overflow-x-auto max-h-64 overflow-y-auto">
                          {this.state.error.stack}
                        </pre>
                      </div>
                    )}
                    {this.state.errorInfo?.componentStack && (
                      <div>
                        <p className="text-sm font-medium">Component Stack:</p>
                        <pre className="text-xs bg-black/5 dark:bg-white/5 p-2 rounded mt-1 overflow-x-auto max-h-64 overflow-y-auto">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Production-friendly message */}
              {!import.meta.env.DEV && (
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    Don't worry! Your data is safe. This is just a temporary issue.
                    Try reloading the page, and if the problem persists, please contact support.
                  </p>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex gap-2 flex-wrap">
              <Button onClick={this.handleReload} variant="default" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Reload Page
              </Button>
              <Button onClick={this.handleGoHome} variant="outline" className="gap-2">
                <Home className="h-4 w-4" />
                Go to Home
              </Button>
              {import.meta.env.DEV && (
                <Button onClick={this.handleReset} variant="ghost" className="gap-2">
                  Reset Error Boundary
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      );
    }

    // No error, render children normally
    return this.props.children;
  }
}

/**
 * Hook-friendly wrapper for ErrorBoundary
 *
 * Usage:
 * ```tsx
 * function App() {
 *   return (
 *     <ErrorBoundaryWrapper>
 *       <YourComponent />
 *     </ErrorBoundaryWrapper>
 *   );
 * }
 * ```
 */
export function ErrorBoundaryWrapper({ children }: { children: ReactNode }) {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Log to console
    console.error('Error caught by boundary:', error, errorInfo);

    // Sentry is already called in componentDidCatch
    // This is just for additional custom handling if needed
  };

  return <ErrorBoundary onError={handleError}>{children}</ErrorBoundary>;
}
