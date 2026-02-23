'use client';

import { useState, useRef, useEffect } from 'react';
import { Coins, ChevronDown, Plus, CreditCard, Settings, LogOut } from 'lucide-react';
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
      localStorage.removeItem('packleads_session');
      localStorage.removeItem('packleads_sid');
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
    free: 'text-gray-500 bg-gray-100',
    starter: 'text-gray-600 bg-gray-100',
    pro: 'text-violet-400 bg-violet-500/10',
    enterprise: 'text-gray-600 bg-gray-100',
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
        className="flex items-center gap-1.5 sm:gap-3 px-2 sm:px-3 py-1.5 hover:bg-gray-100 rounded-lg transition-colors"
      >
        {/* Tier Badge - Hidden on mobile, visible on sm+ */}
        <div className={`hidden sm:block px-2 py-1 text-[11px] font-bold rounded ${tierColors[tier] || tierColors.free}`}>
          {tierLabels[tier] || 'FREE'}
        </div>

        {/* Credits Badge */}
        <div className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-1 bg-gray-100 rounded-lg">
          <Coins size={16} className="text-violet-400" />
          <span className="text-xs sm:text-sm font-medium text-gray-900">{credits}</span>
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
        <ChevronDown size={16} className={`hidden sm:block text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-lg shadow-black/10 z-50 overflow-hidden">
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
                <p className="text-sm font-medium text-gray-900 truncate">{userName}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full capitalize ${tierColors[tier] || tierColors.free}`}>
                {tier}
              </span>
            </div>
          </div>

          {/* Credits Section */}
          <div className="px-4 py-3 bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">Credits remaining</span>
              <span className="text-lg font-semibold text-gray-900">{credits}</span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
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
              <Plus size={16} />
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
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <CreditCard size={16} className="text-gray-400" />
              Billing & Subscription
            </button>
            <button
              onClick={() => {
                onOpenSettings();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Settings size={16} className="text-gray-400" />
              Settings
            </button>
          </div>

          {/* Sign Out */}
          <div className="py-2">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
