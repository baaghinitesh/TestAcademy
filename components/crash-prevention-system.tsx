'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  level?: 'page' | 'section' | 'component';
  context?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

// Global error tracking
class ErrorTracker {
  private static instance: ErrorTracker;
  private errors: Array<{ id: string; error: Error; timestamp: Date; context: string }> = [];

  static getInstance(): ErrorTracker {
    if (!ErrorTracker.instance) {
      ErrorTracker.instance = new ErrorTracker();
    }
    return ErrorTracker.instance;
  }

  logError(id: string, error: Error, context: string) {
    this.errors.push({ id, error, timestamp: new Date(), context });
    
    // Keep only last 50 errors to prevent memory issues
    if (this.errors.length > 50) {
      this.errors = this.errors.slice(-50);
    }

    console.error(`🚨 Error [${id}] in ${context}:`, error);
  }

  getErrors() {
    return this.errors;
  }

  clearErrors() {
    this.errors = [];
  }
}

export class CrashPreventionBoundary extends Component<Props, State> {
  private errorTracker = ErrorTracker.getInstance();

  constructor(props: Props) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): State {
    const errorId = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return {
      hasError: true,
      error,
      errorInfo: null,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { context = 'Unknown Component', onError } = this.props;
    
    this.setState({
      error,
      errorInfo,
    });

    this.errorTracker.logError(this.state.errorId, error, context);

    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo);
    }

    // Report to external service in production
    if (process.env.NODE_ENV === 'production') {
      this.reportErrorToService(error, errorInfo, context);
    }
  }

  private reportErrorToService = (error: Error, errorInfo: ErrorInfo, context: string) => {
    // This would typically send to an error reporting service like Sentry
    try {
      fetch('/api/errors/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
          },
          errorInfo: {
            componentStack: errorInfo.componentStack,
          },
          context,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        }),
      }).catch(reportingError => {
        console.error('Failed to report error:', reportingError);
      });
    } catch (reportingError) {
      console.error('Error in error reporting:', reportingError);
    }
  };

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleReportBug = () => {
    const { error, errorInfo, errorId } = this.state;
    const { context = 'Unknown' } = this.props;
    
    const bugReport = {
      errorId,
      error: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      context,
      timestamp: new Date().toISOString(),
      url: window.location.href
    };

    const mailtoLink = `mailto:support@testacademy.com?subject=Bug Report - ${errorId}&body=${encodeURIComponent(
      `Bug Report Details:\n\n${JSON.stringify(bugReport, null, 2)}`
    )}`;
    
    window.open(mailtoLink);
  };

  render() {
    if (this.state.hasError) {
      const { level = 'component', fallback, context = 'component' } = this.props;
      
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Different error UIs based on error level
      if (level === 'page') {
        return (
          <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-3 bg-red-100 rounded-full w-16 h-16 flex items-center justify-center">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
                <CardTitle className="text-2xl font-bold text-red-600">
                  Oops! Something went wrong
                </CardTitle>
                <CardDescription className="text-lg">
                  We're sorry, but there was an unexpected error on this page.
                  <br />
                  <span className="text-sm text-muted-foreground mt-2 block">
                    Error ID: {this.state.errorId}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-700">
                    <strong>Error in:</strong> {context}
                  </p>
                  <p className="text-sm text-red-600 mt-1">
                    {this.state.error?.message}
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button onClick={this.handleRetry} className="flex-1">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                  <Button onClick={this.handleReload} variant="outline" className="flex-1">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reload Page
                  </Button>
                  <Button onClick={this.handleGoHome} variant="outline" className="flex-1">
                    <Home className="h-4 w-4 mr-2" />
                    Go Home
                  </Button>
                </div>
                
                <div className="pt-4 border-t">
                  <Button 
                    onClick={this.handleReportBug} 
                    variant="ghost" 
                    size="sm"
                    className="w-full text-muted-foreground"
                  >
                    <Bug className="h-4 w-4 mr-2" />
                    Report this issue
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      }

      if (level === 'section') {
        return (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6 text-center">
              <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-600 mb-2">
                Section Error
              </h3>
              <p className="text-red-500 mb-4 text-sm">
                This section encountered an error: {this.state.error?.message}
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={this.handleRetry} size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
                <Button onClick={this.handleReportBug} variant="outline" size="sm">
                  <Bug className="h-4 w-4 mr-2" />
                  Report
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      }

      // Component level (minimal UI)
      return (
        <div className="border border-red-200 bg-red-50 rounded-lg p-4 text-center">
          <AlertTriangle className="h-5 w-5 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-red-600 mb-2">Component failed to load</p>
          <Button onClick={this.handleRetry} size="sm" variant="outline">
            <RefreshCw className="h-4 w-4 mr-1" />
            Retry
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easy wrapping
export const withCrashPrevention = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options?: {
    level?: 'page' | 'section' | 'component';
    context?: string;
    fallback?: ReactNode;
  }
) => {
  const WithCrashPrevention = (props: P) => (
    <CrashPreventionBoundary 
      level={options?.level || 'component'}
      context={options?.context || WrappedComponent.displayName || WrappedComponent.name}
      fallback={options?.fallback}
    >
      <WrappedComponent {...props} />
    </CrashPreventionBoundary>
  );

  WithCrashPrevention.displayName = `WithCrashPrevention(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return WithCrashPrevention;
};

// Safe component wrapper for critical components
export const SafeComponent: React.FC<{
  children: ReactNode;
  fallback?: ReactNode;
  context?: string;
}> = ({ children, fallback, context }) => (
  <CrashPreventionBoundary 
    level="component" 
    context={context}
    fallback={fallback || <div className="p-4 text-center text-muted-foreground">Component unavailable</div>}
  >
    {children}
  </CrashPreventionBoundary>
);

// Global error handler for unhandled promise rejections
export const initializeGlobalErrorHandling = () => {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('🚨 Unhandled Promise Rejection:', event.reason);
    
    // Prevent the default browser error handling
    event.preventDefault();
    
    // Log to error tracker
    ErrorTracker.getInstance().logError(
      `unhandled-promise-${Date.now()}`,
      new Error(`Unhandled Promise Rejection: ${event.reason}`),
      'Global Promise Handler'
    );
  });

  // Handle global JavaScript errors
  window.addEventListener('error', (event) => {
    console.error('🚨 Global JavaScript Error:', event.error);
    
    ErrorTracker.getInstance().logError(
      `global-error-${Date.now()}`,
      event.error || new Error(event.message),
      'Global Error Handler'
    );
  });
};

export default CrashPreventionBoundary;