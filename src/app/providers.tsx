'use client';

import { ReactNode, Suspense } from 'react';
import { ThemeProvider } from 'next-themes';
import { AppProvider } from '@/contexts/AppContext';
import { BrandedSpinner } from '@/components/ui/BrandedSpinner';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <Suspense fallback={
        <div className="min-h-screen bg-gray-50 dark:bg-background flex items-center justify-center">
          <div className="text-center">
            <BrandedSpinner size="md" />
            <p className="text-gray-500 text-sm mt-4">Loading...</p>
          </div>
        </div>
      }>
        <AppProvider>
          {children}
        </AppProvider>
      </Suspense>
    </ThemeProvider>
  );
}
