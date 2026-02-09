'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface MarketingHeaderProps {
  onSignIn?: () => void;
  onSignUp?: () => void;
}

export function MarketingHeader({ onSignIn, onSignUp }: MarketingHeaderProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });
  }, []);

  return (
    <header className="relative z-50">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-white">
          Scoutblind<span className="text-violet-500">.</span>
        </Link>
        <nav aria-label="Main navigation" className="flex items-center gap-3">
          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className="px-4 py-2 text-sm font-medium bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/pricing"
                className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white transition-colors"
              >
                Pricing
              </Link>
              {onSignIn ? (
                <button
                  onClick={onSignIn}
                  className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white transition-colors"
                >
                  Sign in
                </button>
              ) : (
                <Link
                  href="/"
                  className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white transition-colors"
                >
                  Sign in
                </Link>
              )}
              {onSignUp ? (
                <button
                  onClick={onSignUp}
                  className="px-4 py-2 text-sm font-medium bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors"
                >
                  Get Started Free
                </button>
              ) : (
                <Link
                  href="/"
                  className="px-4 py-2 text-sm font-medium bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors"
                >
                  Get Started Free
                </Link>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
