'use client';

import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

interface UserMenuProps {
  user: User;
  credits: number;
  tier: string;
  onOpenBilling: () => void;
  onOpenSettings: () => void;
}

export function UserMenu({ user, credits, tier, onOpenBilling, onOpenSettings }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    // Clear all storage FIRST
    try {
      sessionStorage.clear();
      localStorage.removeItem('scoutblind_session');
      localStorage.removeItem('scoutblind_sid');
    } catch (e) {
      console.error('Failed to clear storage:', e);
    }

    // Sign out from Supabase (don't await - we want to redirect immediately)
    // The redirect is more important than waiting for signOut to complete
    supabase.auth.signOut().catch((e) => {
      console.error('Sign out error:', e);
    });

    // Force immediate redirect - this MUST happen regardless of signOut success
    // Use setTimeout to ensure this runs even if there are sync issues
    setTimeout(() => {
      window.location.href = window.location.origin;
    }, 0);
  };

  const userInitial = user.user_metadata?.full_name?.[0] || user.email?.[0] || '?';
  const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
  const userAvatar = user.user_metadata?.avatar_url;

  const tierColors: Record<string, string> = {
    free: 'text-zinc-400 bg-zinc-800',
    starter: 'text-zinc-300 bg-zinc-800',
    pro: 'text-violet-400 bg-violet-500/10',
    enterprise: 'text-zinc-300 bg-zinc-800',
  };

  const tierLabels: Record<string, string> = {
    free: 'FREE',
    starter: 'STARTER',
    pro: 'PRO',
    enterprise: 'ENTERPRISE',
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 sm:gap-3 px-2 sm:px-3 py-1.5 hover:bg-zinc-800 rounded-lg transition-colors"
      >
        {/* Tier Badge - Hidden on mobile, visible on sm+ */}
        <div className={`hidden sm:block px-2 py-1 text-[10px] font-bold rounded ${tierColors[tier] || tierColors.free}`}>
          {tierLabels[tier] || 'FREE'}
        </div>

        {/* Credits Badge */}
        <div className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-1 bg-zinc-800 rounded-md">
          <svg className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs sm:text-sm font-medium text-white">{credits}</span>
        </div>

        {/* Avatar */}
        {userAvatar ? (
          <img
            src={userAvatar}
            alt={userName}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full"
          />
        ) : (
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-violet-600 flex items-center justify-center text-white font-medium text-xs sm:text-sm">
            {userInitial.toUpperCase()}
          </div>
        )}

        {/* Dropdown Arrow - Hidden on smallest screens */}
        <svg
          className={`hidden sm:block w-4 h-4 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-zinc-900 rounded-xl shadow-lg shadow-black/30 z-50 overflow-hidden">
          {/* User Info */}
          <div className="px-4 py-3">
            <div className="flex items-center gap-3">
              {userAvatar ? (
                <img
                  src={userAvatar}
                  alt={userName}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center text-white font-medium">
                  {userInitial.toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{userName}</p>
                <p className="text-xs text-zinc-500 truncate">{user.email}</p>
              </div>
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full capitalize ${tierColors[tier] || tierColors.free}`}>
                {tier}
              </span>
            </div>
          </div>

          {/* Credits Section */}
          <div className="px-4 py-3 bg-zinc-800/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-zinc-400">Credits remaining</span>
              <span className="text-lg font-semibold text-white">{credits}</span>
            </div>
            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-violet-500 rounded-full transition-all"
                style={{ width: `${Math.min((credits / 50) * 100, 100)}%` }}
              />
            </div>
            <button
              onClick={() => {
                onOpenBilling();
                setIsOpen(false);
              }}
              className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              {tier === 'free' ? 'Upgrade Plan' : 'Buy More Credits'}
            </button>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <button
              onClick={() => {
                onOpenBilling();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              Billing & Subscription
            </button>
            <button
              onClick={() => {
                onOpenSettings();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </button>
          </div>

          {/* Sign Out */}
          <div className="py-2">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
