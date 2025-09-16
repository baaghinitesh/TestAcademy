'use client';

import { useState, useEffect } from 'react';
import { Spinner } from './spinner';

interface LoadingBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  timeout?: number;
  onTimeout?: () => void;
}

export function LoadingBoundary({ 
  children, 
  fallback, 
  timeout = 10000, // 10 seconds default timeout
  onTimeout 
}: LoadingBoundaryProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasTimedOut, setHasTimedOut] = useState(false);

  useEffect(() => {
    // Set loading to false after a short delay to allow components to mount
    const loadingTimer = setTimeout(() => {
      setIsLoading(false);
    }, 100);

    // Set up timeout
    const timeoutTimer = setTimeout(() => {
      if (isLoading) {
        setHasTimedOut(true);
        setIsLoading(false);
        onTimeout?.();
      }
    }, timeout);

    return () => {
      clearTimeout(loadingTimer);
      clearTimeout(timeoutTimer);
    };
  }, [timeout, onTimeout, isLoading]);

  if (hasTimedOut) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-destructive">Loading took longer than expected</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <Spinner size="lg" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      )
    );
  }

  return <>{children}</>;
}