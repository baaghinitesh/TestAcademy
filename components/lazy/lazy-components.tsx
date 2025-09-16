'use client';

import { lazy, Suspense } from 'react';
import { Spinner } from '@/components/loading/spinner';
import { DashboardSkeleton, TestListSkeleton, FormSkeleton } from '@/components/loading/skeleton-loader';

// Lazy load heavy components
const LazyTestResults = lazy(() => import('@/components/test-results'));
const LazyPDFViewer = lazy(() => import('@/components/pdf-viewer'));
const LazyChartWrapper = lazy(() => import('@/components/optimized/chart-wrapper'));

// Note: Admin components removed from lazy loading to prevent loading issues

// Wrapper components with appropriate loading states
export function LazyTestResultsWrapper(props: any) {
  return (
    <Suspense fallback={
      <div className="space-y-4">
        <div className="flex items-center justify-center p-8">
          <Spinner size="lg" />
          <span className="ml-2">Loading test results...</span>
        </div>
      </div>
    }>
      <LazyTestResults {...props} />
    </Suspense>
  );
}

export function LazyPDFViewerWrapper(props: any) {
  return (
    <Suspense fallback={
      <div className="h-96 flex items-center justify-center border rounded-lg bg-muted/30">
        <div className="text-center space-y-2">
          <Spinner size="lg" />
          <p className="text-muted-foreground">Loading PDF viewer...</p>
        </div>
      </div>
    }>
      <LazyPDFViewer {...props} />
    </Suspense>
  );
}

export function LazyChartWrapperComponent(props: any) {
  return (
    <Suspense fallback={
      <div className="h-64 flex items-center justify-center border rounded-lg bg-muted/30">
        <div className="text-center space-y-2">
          <Spinner size="md" />
          <p className="text-sm text-muted-foreground">Loading chart...</p>
        </div>
      </div>
    }>
      <LazyChartWrapper {...props} />
    </Suspense>
  );
}

// Admin Components - Direct loading (no lazy loading to prevent issues)
// Admin components are now loaded directly without lazy loading for better reliability

// Higher-order component for lazy loading with intersection observer
interface LazyLoadProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
}

export function LazyLoad({ 
  children, 
  fallback = <Spinner size="md" />, 
  threshold = 0.1,
  rootMargin = '50px'
}: LazyLoadProps) {
  return (
    <div className="lazy-load-container">
      <Suspense fallback={fallback}>
        {children}
      </Suspense>
    </div>
  );
}

// Route-based lazy loading utility
export const createLazyRoute = (importFn: () => Promise<{ default: React.ComponentType<any> }>) => {
  const LazyComponent = lazy(importFn);
  
  return function LazyRouteWrapper(props: any) {
    return (
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <Spinner size="lg" />
            <p className="text-muted-foreground">Loading page...</p>
          </div>
        </div>
      }>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
};