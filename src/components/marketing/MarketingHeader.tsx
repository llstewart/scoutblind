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
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });
  }, []);

  return (
    <header className="relative z-50 border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-gray-900">
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
              {/* Desktop nav */}
              <Link
                href="/features"
                className="hidden sm:inline-flex px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                Features
              </Link>
              <Link
                href="/pricing"
                className="hidden sm:inline-flex px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                Pricing
              </Link>
              {onSignIn ? (
                <button
                  onClick={onSignIn}
                  className="hidden sm:inline-flex px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Sign in
                </button>
              ) : (
                <Link
                  href="/"
                  className="hidden sm:inline-flex px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Sign in
                </Link>
              )}

              {/* Get Started - always visible */}
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

              {/* Hamburger - mobile only */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="sm:hidden p-2 text-gray-500 hover:text-gray-900 transition-colors"
                aria-label="Toggle menu"
                aria-expanded={menuOpen}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  {menuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </>
          )}
        </nav>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && !isLoggedIn && (
        <div className="sm:hidden absolute top-full left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 flex flex-col gap-1 shadow-lg">
          <Link
            href="/features"
            onClick={() => setMenuOpen(false)}
            className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
          >
            Features
          </Link>
          <Link
            href="/pricing"
            onClick={() => setMenuOpen(false)}
            className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
          >
            Pricing
          </Link>
          {onSignIn ? (
            <button
              onClick={() => { onSignIn(); setMenuOpen(false); }}
              className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors text-left"
            >
              Sign in
            </button>
          ) : (
            <Link
              href="/"
              onClick={() => setMenuOpen(false)}
              className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
            >
              Sign in
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
