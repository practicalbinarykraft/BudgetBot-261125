/**
 * Loading Spinner Component
 *
 * Used as Suspense fallback while lazy-loaded components are loading.
 * Provides a centered loading indicator with optional text.
 */

import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  text?: string;
  fullScreen?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingSpinner({
  text = 'Loading...',
  fullScreen = true,
  size = 'md'
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  const containerClasses = fullScreen
    ? 'flex min-h-screen items-center justify-center'
    : 'flex items-center justify-center p-8';

  return (
    <div className={containerClasses}>
      <div className="flex flex-col items-center gap-3">
        <Loader2 className={`${sizeClasses[size]} animate-spin text-primary`} />
        {text && (
          <p className="text-sm text-muted-foreground">{text}</p>
        )}
      </div>
    </div>
  );
}

/**
 * Page Loading Fallback
 * Optimized for full-page route transitions
 */
export function PageLoading() {
  return <LoadingSpinner text="Loading page..." fullScreen />;
}

/**
 * Component Loading Fallback
 * Optimized for partial component loading
 */
export function ComponentLoading({ text }: { text?: string }) {
  return <LoadingSpinner text={text} fullScreen={false} size="sm" />;
}
