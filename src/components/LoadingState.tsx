'use client';

import { BrandedSpinner } from '@/components/ui/BrandedSpinner';

interface LoadingStateProps {
  message?: string;
  progress?: number;
}

export function LoadingState({ message = 'Loading...', progress }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <BrandedSpinner size="lg" />
      <p className="mt-4 text-sm text-muted-foreground">{message}</p>
      {progress !== undefined && (
        <div className="w-64 mt-4">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground text-center">{progress}%</p>
        </div>
      )}
    </div>
  );
}

export function LoadingSpinner({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg', className?: string }) {
  return <BrandedSpinner size={size} className={className} />;
}
