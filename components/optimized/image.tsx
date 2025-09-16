'use client';

import React, { useState, useRef, useEffect, memo } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/loading/skeleton-loader';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  sizes?: string;
  fill?: boolean;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  onLoad?: () => void;
  onError?: () => void;
  lazy?: boolean;
}

const OptimizedImage = memo(function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  quality = 75,
  placeholder = 'empty',
  blurDataURL,
  sizes,
  fill = false,
  objectFit = 'cover',
  onLoad,
  onError,
  lazy = true
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(!lazy || priority);
  const imgRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || priority || isInView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [lazy, priority, isInView]);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  };

  // Generate optimized blur data URL if not provided
  const getBlurDataURL = (src: string) => {
    if (blurDataURL) return blurDataURL;
    
    // Create a simple blur data URL
    const canvas = document.createElement('canvas');
    canvas.width = 10;
    canvas.height = 10;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#f3f4f6';
      ctx.fillRect(0, 0, 10, 10);
    }
    return canvas.toDataURL();
  };

  const imageProps = {
    src,
    alt,
    quality,
    onLoad: handleLoad,
    onError: handleError,
    className: cn(
      'transition-opacity duration-300',
      isLoading && 'opacity-0',
      !isLoading && 'opacity-100',
      className
    ),
    ...(fill ? { fill: true } : { width, height }),
    ...(sizes && { sizes }),
    ...(priority && { priority: true }),
    ...(placeholder === 'blur' && {
      placeholder: 'blur' as const,
      blurDataURL: getBlurDataURL(src)
    })
  };

  return (
    <div 
      ref={imgRef}
      className={cn(
        'relative overflow-hidden',
        fill && 'w-full h-full',
        !fill && width && height && `w-[${width}px] h-[${height}px]`
      )}
      style={{
        ...(objectFit && fill && { objectFit }),
        ...(!fill && width && height && { width, height })
      }}
    >
      {/* Loading skeleton */}
      {isLoading && (
        <Skeleton 
          className={cn(
            'absolute inset-0 z-10',
            !fill && width && height && `w-[${width}px] h-[${height}px]`
          )}
        />
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground">
          <div className="text-center space-y-2">
            <div className="text-2xl">📷</div>
            <p className="text-sm">Failed to load image</p>
          </div>
        </div>
      )}

      {/* Actual image */}
      {isInView && !hasError && (
        <Image
          {...imageProps}
          style={{
            ...(fill && { objectFit }),
            ...imageProps.style
          }}
        />
      )}
    </div>
  );
});

// Avatar component with optimized image
interface AvatarProps {
  src?: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  fallback?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24'
};

export const OptimizedAvatar = memo(function OptimizedAvatar({
  src,
  alt,
  size = 'md',
  className,
  fallback
}: AvatarProps) {
  const [hasError, setHasError] = useState(false);
  const sizeClass = sizeClasses[size];
  
  const initials = fallback || alt.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  if (!src || hasError) {
    return (
      <div className={cn(
        'flex items-center justify-center rounded-full bg-muted text-muted-foreground font-medium',
        sizeClass,
        className
      )}>
        {initials}
      </div>
    );
  }

  return (
    <div className={cn('relative rounded-full overflow-hidden', sizeClass, className)}>
      <OptimizedImage
        src={src}
        alt={alt}
        fill
        objectFit="cover"
        quality={90}
        onError={() => setHasError(true)}
        className="rounded-full"
      />
    </div>
  );
});

// Logo component with optimized loading
interface LogoProps {
  variant?: 'light' | 'dark' | 'color';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const OptimizedLogo = memo(function OptimizedLogo({
  variant = 'color',
  size = 'md',
  className
}: LogoProps) {
  const dimensions = {
    sm: { width: 120, height: 40 },
    md: { width: 160, height: 53 },
    lg: { width: 240, height: 80 }
  };

  const logoSrc = `/images/logo-${variant}.svg`;
  
  return (
    <OptimizedImage
      src={logoSrc}
      alt="EduLMS Logo"
      width={dimensions[size].width}
      height={dimensions[size].height}
      priority
      quality={100}
      className={className}
    />
  );
});

// Hero image component with progressive loading
interface HeroImageProps {
  src: string;
  alt: string;
  className?: string;
  overlay?: boolean;
}

export const HeroImage = memo(function HeroImage({
  src,
  alt,
  className,
  overlay = false
}: HeroImageProps) {
  return (
    <div className={cn('relative overflow-hidden', className)}>
      <OptimizedImage
        src={src}
        alt={alt}
        fill
        objectFit="cover"
        priority
        quality={85}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        placeholder="blur"
      />
      {overlay && (
        <div className="absolute inset-0 bg-black/20" />
      )}
    </div>
  );
});

export default OptimizedImage;