'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * History page redirect
 *
 * This page now redirects to the main app with the Library tab active.
 * The Library tab contains the same functionality as the old history page.
 */
export default function HistoryPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to main app with library tab
    router.replace('/library');
  }, [router]);

  // Show loading state while redirecting
  return (
    <div className="min-h-screen bg-[#0f0f10] flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-zinc-500 text-sm">Redirecting to Library...</p>
      </div>
    </div>
  );
}
