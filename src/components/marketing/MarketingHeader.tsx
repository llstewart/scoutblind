'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export function MarketingHeader() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });
  }, []);

  // Shadow on scroll
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-50 bg-white transition-shadow duration-200 ${scrolled ? 'shadow-[0_1px_3px_rgba(0,0,0,0.06)]' : ''}`}>
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <img src="/icon.svg" alt="" className="w-7 h-7" />
          <span className="text-lg font-semibold text-gray-900">
            Packleads<span className="text-violet-500">.</span>
          </span>
        </Link>
        <nav aria-label="Main navigation" className="flex items-center gap-1">
          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className="px-4 py-2 text-[13px] font-medium bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              {/* Desktop nav */}
              <Link
                href="/features"
                className="hidden sm:inline-flex px-3 py-1.5 text-[13px] text-gray-800 hover:text-gray-900 transition-colors"
              >
                Features
              </Link>
              <Link
                href="/pricing"
                className="hidden sm:inline-flex px-3 py-1.5 text-[13px] text-gray-800 hover:text-gray-900 transition-colors"
              >
                Pricing
              </Link>
              <Link
                href="/login"
                className="hidden sm:inline-flex px-3 py-1.5 text-[13px] text-gray-800 hover:text-gray-900 transition-colors"
              >
                Log in
              </Link>

              {/* Get Started - always visible */}
              <Link
                href="/signup"
                className="ml-2 px-4 py-2 text-[13px] font-medium bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors"
              >
                Signup
              </Link>

              {/* Hamburger - mobile only */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="sm:hidden ml-1 p-2 text-gray-500 hover:text-gray-900 transition-colors"
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
            className="px-4 py-2.5 text-[13px] text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
          >
            Features
          </Link>
          <Link
            href="/pricing"
            onClick={() => setMenuOpen(false)}
            className="px-4 py-2.5 text-[13px] text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
          >
            Pricing
          </Link>
          <Link
            href="/login"
            onClick={() => setMenuOpen(false)}
            className="px-4 py-2.5 text-[13px] text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
          >
            Log in
          </Link>
        </div>
      )}
    </header>
  );
}
