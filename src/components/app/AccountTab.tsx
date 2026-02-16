'use client';

import Link from 'next/link';
import { TabContent, TabHeader } from './AppShell';
import { User } from '@supabase/supabase-js';

interface AccountTabProps {
  user: User;
  credits: number;
  tier: string;
  onOpenBilling: () => void;
  onOpenSettings: () => void;
  onSignOut: () => void;
}

export function AccountTab({
  user,
  credits,
  tier,
  onOpenBilling,
  onOpenSettings,
  onSignOut,
}: AccountTabProps) {
  const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
  const userEmail = user.email || '';
  const userAvatar = user.user_metadata?.avatar_url;
  const userInitial = userName.charAt(0).toUpperCase();

  const tierInfo: Record<string, { label: string; color: string; description: string }> = {
    free: {
      label: 'Free',
      color: 'text-zinc-400 bg-zinc-800',
      description: 'Basic access with limited credits',
    },
    starter: {
      label: 'Starter',
      color: 'text-emerald-400 bg-emerald-500/10',
      description: '50 credits/month + Lead Intel',
    },
    pro: {
      label: 'Pro',
      color: 'text-violet-400 bg-violet-500/10',
      description: '200 credits/month + Priority support',
    },
    enterprise: {
      label: 'Enterprise',
      color: 'text-amber-400 bg-amber-500/10',
      description: 'Unlimited credits + Dedicated support',
    },
  };

  const currentTier = tierInfo[tier] || tierInfo.free;

  return (
    <TabContent>
      {/* Header hidden on mobile (visible in sidebar on desktop) */}
      <div className="md:hidden mb-6">
        <TabHeader title="Account" />
      </div>

      {/* Profile Card */}
      <div className="rounded-xl bg-zinc-900/50 p-6 mb-6">
        <div className="flex items-center gap-4">
          {userAvatar ? (
            <img
              src={userAvatar}
              alt={userName}
              className="w-16 h-16 rounded-full"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-violet-600 flex items-center justify-center text-white text-2xl font-medium">
              {userInitial}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-white truncate">{userName}</h2>
            <p className="text-sm text-zinc-500 truncate">{userEmail}</p>
            <span className={`inline-block mt-2 px-2.5 py-0.5 text-xs font-bold rounded ${currentTier.color}`}>
              {currentTier.label.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Credits Card */}
      <div className="rounded-xl bg-zinc-900/50 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium text-zinc-400">Credits Remaining</h3>
            <p className="text-3xl font-bold text-white mt-1">{credits}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center">
            <svg className="w-6 h-6 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        {/* Usage breakdown */}
        <div className="text-xs text-zinc-500 mb-4">
          <span>1 credit = 1 search or 1 business analysis</span>
        </div>

        <button
          onClick={onOpenBilling}
          className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          {tier === 'free' ? 'Upgrade Plan' : 'Buy More Credits'}
        </button>
      </div>

      {/* Plan Card */}
      <div className="rounded-xl bg-zinc-900/50 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-zinc-400">Current Plan</h3>
            <p className="text-lg font-semibold text-white mt-1">{currentTier.label}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{currentTier.description}</p>
          </div>
          <button
            onClick={onOpenBilling}
            className="px-4 py-2 text-sm font-medium text-violet-400 hover:text-violet-300 transition-colors"
          >
            {tier === 'free' ? 'Upgrade' : 'Manage'}
          </button>
        </div>
      </div>

      {/* Menu Items */}
      <div className="rounded-xl bg-zinc-900/50 overflow-hidden mb-6">
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center gap-3 px-4 py-3.5 text-left text-zinc-300 hover:bg-zinc-800/50 transition-colors border-b border-zinc-800/50"
        >
          <svg className="w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="flex-1">Settings</span>
          <svg className="w-4 h-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <button
          onClick={onOpenBilling}
          className="w-full flex items-center gap-3 px-4 py-3.5 text-left text-zinc-300 hover:bg-zinc-800/50 transition-colors border-b border-zinc-800/50"
        >
          <svg className="w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          <span className="flex-1">Billing & Invoices</span>
          <svg className="w-4 h-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <Link
          href="/contact"
          className="w-full flex items-center gap-3 px-4 py-3.5 text-left text-zinc-300 hover:bg-zinc-800/50 transition-colors"
        >
          <svg className="w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="flex-1">Help & Support</span>
          <svg className="w-4 h-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* Sign Out */}
      <button
        onClick={onSignOut}
        className="w-full flex items-center justify-center gap-2 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/5 rounded-xl transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        <span className="font-medium">Sign Out</span>
      </button>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-xs text-zinc-600">
          © {new Date().getFullYear()} Scoutblind. All rights reserved.
        </p>
      </div>
    </TabContent>
  );
}
