'use client';

import { ReactNode, Suspense } from 'react';
import { AppProvider } from '@/contexts/AppContext';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    }>
      <AppProvider>
        {children}
      </AppProvider>
    </Suspense>
  );
}
