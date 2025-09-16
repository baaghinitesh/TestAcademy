'use client';

import { cn } from '@/lib/utils';
import { Loader2, RefreshCw, RotateCcw } from 'lucide-react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  variant?: 'default' | 'dots' | 'pulse' | 'bounce' | 'bars' | 'icon';
  color?: 'primary' | 'secondary' | 'accent' | 'muted';
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6', 
  lg: 'w-8 h-8',
  xl: 'w-12 h-12'
};

const colorClasses = {
  primary: 'text-primary',
  secondary: 'text-secondary',
  accent: 'text-accent',
  muted: 'text-muted-foreground'
};

export function Spinner({ 
  size = 'md', 
  className, 
  variant = 'default',
  color = 'primary'
}: SpinnerProps) {
  const sizeClass = sizeClasses[size];
  const colorClass = colorClasses[color];

  if (variant === 'icon') {
    return (
      <Loader2 className={cn(
        'animate-spin',
        sizeClass,
        colorClass,
        className
      )} />
    );
  }

  if (variant === 'dots') {
    return (
      <div className={cn('flex space-x-1', className)}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'rounded-full bg-current animate-pulse',
              size === 'sm' ? 'w-1 h-1' : size === 'md' ? 'w-2 h-2' : size === 'lg' ? 'w-3 h-3' : 'w-4 h-4',
              colorClass
            )}
            style={{
              animationDelay: `${i * 0.2}s`,
              animationDuration: '1.4s'
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div 
        className={cn(
          'rounded-full bg-current animate-pulse',
          sizeClass,
          colorClass,
          className
        )}
      />
    );
  }

  if (variant === 'bounce') {
    return (
      <div className={cn('flex space-x-1', className)}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'rounded-full bg-current animate-bounce',
              size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-5 h-5',
              colorClass
            )}
            style={{
              animationDelay: `${i * 0.1}s`,
              animationDuration: '1.4s'
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'bars') {
    return (
      <div className={cn('flex items-end space-x-1', className)}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'bg-current animate-pulse',
              size === 'sm' ? 'w-1 h-4' : size === 'md' ? 'w-1 h-6' : size === 'lg' ? 'w-2 h-8' : 'w-2 h-10',
              colorClass
            )}
            style={{
              animationDelay: `${i * 0.15}s`,
              animationDuration: '1.2s'
            }}
          />
        ))}
      </div>
    );
  }

  // Default circular spinner
  return (
    <div 
      className={cn(
        'animate-spin rounded-full border-2 border-current border-t-transparent',
        sizeClass,
        colorClass,
        className
      )}
    />
  );
}

// Loading Button Component
interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function LoadingButton({ 
  loading = false, 
  loadingText, 
  children, 
  disabled,
  className,
  ...props 
}: LoadingButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2',
        'rounded-md px-4 py-2 text-sm font-medium',
        'bg-primary text-primary-foreground hover:bg-primary/90',
        'disabled:pointer-events-none disabled:opacity-50',
        'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className
      )}
      {...props}
    >
      {loading && <Spinner size="sm" variant="icon" color="primary" />}
      {loading ? loadingText || 'Loading...' : children}
    </button>
  );
}

// Page Loading Component
export function PageLoader({ 
  title = 'Loading...', 
  description,
  className 
}: { 
  title?: string; 
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center min-h-[400px] space-y-4',
      className
    )}>
      <Spinner size="lg" />
      <div className="text-center space-y-2">
        <h3 className="text-lg font-medium">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground max-w-sm">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

// Full Screen Loading Component
export function FullScreenLoader({ 
  title = 'Loading EduLMS', 
  subtitle = 'Please wait while we prepare your experience...',
  progress,
  className 
}: { 
  title?: string; 
  subtitle?: string;
  progress?: number;
  className?: string;
}) {
  return (
    <div className={cn(
      'fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm',
      className
    )}>
      <div className="text-center space-y-6 px-4">
        {/* Logo */}
        <div className="flex items-center justify-center space-x-2">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-xl">E</span>
          </div>
          <span className="text-2xl font-bold">EduLMS</span>
        </div>
        
        {/* Spinner */}
        <Spinner size="xl" />
        
        {/* Text */}
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="text-muted-foreground max-w-md">{subtitle}</p>
        </div>
        
        {/* Progress Bar */}
        {progress !== undefined && (
          <div className="w-64 mx-auto space-y-2">
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground">{Math.round(progress)}% complete</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Inline Loading Component
export function InlineLoader({ 
  text = 'Loading...', 
  className 
}: { 
  text?: string;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-2 text-muted-foreground', className)}>
      <Spinner size="sm" />
      <span className="text-sm">{text}</span>
    </div>
  );
}

// Refresh Loading Component  
export function RefreshLoader({ 
  onRefresh, 
  loading = false,
  className 
}: { 
  onRefresh?: () => void;
  loading?: boolean;
  className?: string;
}) {
  return (
    <button
      onClick={onRefresh}
      disabled={loading}
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-md',
        'hover:bg-muted transition-colors',
        'disabled:pointer-events-none disabled:opacity-50',
        className
      )}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <RefreshCw className="w-4 h-4" />
      )}
      {loading ? 'Refreshing...' : 'Refresh'}
    </button>
  );
}