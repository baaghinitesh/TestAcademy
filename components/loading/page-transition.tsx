'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Spinner, FullScreenLoader } from './spinner';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const [previousPathname, setPreviousPathname] = useState(pathname);

  useEffect(() => {
    if (pathname !== previousPathname) {
      setIsLoading(true);
      setPreviousPathname(pathname);
      
      // Simulate page loading time
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [pathname, previousPathname]);

  if (isLoading) {
    return (
      <FullScreenLoader 
        title="Loading Page"
        subtitle="Preparing your content..."
      />
    );
  }

  return (
    <div className={cn('animate-fade-in', className)}>
      {children}
    </div>
  );
}

// Progressive Loading Component
interface ProgressiveLoaderProps {
  steps: string[];
  currentStep: number;
  className?: string;
}

export function ProgressiveLoader({ steps, currentStep, className }: ProgressiveLoaderProps) {
  const progress = (currentStep / steps.length) * 100;

  return (
    <div className={cn('space-y-4 p-6', className)}>
      {/* Progress Bar */}
      <div className="w-full bg-muted rounded-full h-2">
        <div 
          className="bg-primary h-2 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {/* Current Step */}
      <div className="text-center space-y-2">
        <Spinner size="md" />
        <div>
          <p className="font-medium">{steps[currentStep] || 'Completing...'}</p>
          <p className="text-sm text-muted-foreground">
            Step {currentStep + 1} of {steps.length}
          </p>
        </div>
      </div>

      {/* Steps List */}
      <div className="space-y-2 max-w-sm mx-auto">
        {steps.map((step, index) => (
          <div 
            key={index}
            className={cn(
              'flex items-center gap-3 p-2 rounded text-sm',
              index < currentStep && 'text-green-600 bg-green-50',
              index === currentStep && 'text-primary bg-primary/10',
              index > currentStep && 'text-muted-foreground'
            )}
          >
            <div className={cn(
              'w-2 h-2 rounded-full',
              index < currentStep && 'bg-green-500',
              index === currentStep && 'bg-primary animate-pulse',
              index > currentStep && 'bg-muted'
            )} />
            <span>{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Content Loading Wrapper
interface ContentLoaderProps {
  loading: boolean;
  error?: string | null;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  retry?: () => void;
  className?: string;
}

export function ContentLoader({ 
  loading, 
  error, 
  children, 
  fallback,
  retry,
  className 
}: ContentLoaderProps) {
  if (loading) {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        {fallback || <Spinner size="lg" />}
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('text-center p-8 space-y-4', className)}>
        <div className="text-destructive">
          <p className="font-medium">Something went wrong</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
        {retry && (
          <button
            onClick={retry}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    );
  }

  return <div className={className}>{children}</div>;
}

// Lazy Loading Wrapper
interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
  threshold?: number;
}

export function LazyWrapper({ 
  children, 
  fallback,
  className,
  threshold = 0.1 
}: LazyWrapperProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [element, setElement] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [element, threshold]);

  return (
    <div ref={setElement} className={className}>
      {isVisible ? children : (
        fallback || (
          <div className="flex items-center justify-center p-4">
            <Spinner size="md" />
          </div>
        )
      )}
    </div>
  );
}

// Staggered Loading Animation
interface StaggeredLoaderProps {
  items: React.ReactNode[];
  delay?: number;
  className?: string;
}

export function StaggeredLoader({ items, delay = 100, className }: StaggeredLoaderProps) {
  const [visibleItems, setVisibleItems] = useState<number[]>([]);

  useEffect(() => {
    items.forEach((_, index) => {
      setTimeout(() => {
        setVisibleItems(prev => [...prev, index]);
      }, index * delay);
    });
  }, [items, delay]);

  return (
    <div className={className}>
      {items.map((item, index) => (
        <div
          key={index}
          className={cn(
            'transition-all duration-500',
            visibleItems.includes(index) 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-4'
          )}
          style={{ transitionDelay: `${index * 50}ms` }}
        >
          {item}
        </div>
      ))}
    </div>
  );
}

// Skeleton to Content Transition
interface SkeletonTransitionProps {
  loading: boolean;
  skeleton: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function SkeletonTransition({ 
  loading, 
  skeleton, 
  children, 
  className 
}: SkeletonTransitionProps) {
  const [showSkeleton, setShowSkeleton] = useState(loading);

  useEffect(() => {
    if (!loading) {
      // Add a small delay before hiding skeleton for smooth transition
      const timer = setTimeout(() => {
        setShowSkeleton(false);
      }, 150);
      return () => clearTimeout(timer);
    } else {
      setShowSkeleton(true);
    }
  }, [loading]);

  return (
    <div className={cn('relative', className)}>
      {showSkeleton && (
        <div className={cn(
          'transition-opacity duration-300',
          !loading && 'opacity-0'
        )}>
          {skeleton}
        </div>
      )}
      
      {!loading && (
        <div className="animate-fade-in">
          {children}
        </div>
      )}
    </div>
  );
}