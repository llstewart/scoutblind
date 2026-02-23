'use client';

import Link from 'next/link';
import { Coins, Plus, Settings, CreditCard, HelpCircle, ChevronRight, LogOut, UserCircle } from 'lucide-react';
import { TabContent, TabHeader } from './AppShell';
import { Badge } from '@/components/ui/Badge';
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
      color: 'text-gray-500 bg-gray-100',
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
      <TabHeader icon={UserCircle} title="Account" />

      {/* Profile Card */}
      <div className="rounded-xl bg-white p-6 mb-6 elevation-1">
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
            <h2 className="text-lg font-semibold text-gray-900 truncate">{userName}</h2>
            <p className="text-sm text-gray-500 truncate">{userEmail}</p>
            <Badge variant={tier === 'pro' ? 'brand' : tier === 'starter' ? 'success' : tier === 'enterprise' ? 'warning' : 'neutral'} size="sm" className="mt-2">
              {currentTier.label.toUpperCase()}
            </Badge>
          </div>
        </div>
      </div>

      {/* Credits Card */}
      <div className="rounded-xl bg-white p-6 mb-6 elevation-1">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Credits Remaining</h3>
            <p className="text-3xl font-extrabold text-gray-900 mt-1">{credits}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center">
            <Coins size={24} className="text-violet-400" />
          </div>
        </div>

        {/* Usage breakdown */}
        <div className="text-xs text-gray-500 mb-4">
          <span>1 credit = 1 search or 1 business analysis</span>
        </div>

        <button
          onClick={onOpenBilling}
          className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={16} />
          {tier === 'free' ? 'Upgrade Plan' : 'Buy More Credits'}
        </button>
      </div>

      {/* Plan Card */}
      <div className="rounded-xl bg-white p-6 mb-6 elevation-1">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Current Plan</h3>
            <p className="text-lg font-semibold text-gray-900 mt-1">{currentTier.label}</p>
            <p className="text-xs text-gray-500 mt-0.5">{currentTier.description}</p>
          </div>
          <button
            onClick={onOpenBilling}
            className="px-4 py-2 text-sm font-semibold text-violet-400 hover:text-violet-300 transition-colors"
          >
            {tier === 'free' ? 'Upgrade' : 'Manage'}
          </button>
        </div>
      </div>

      {/* Menu Items */}
      <div className="rounded-xl bg-white overflow-hidden mb-6 elevation-1">
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center gap-3 px-4 py-3.5 text-left text-gray-600 hover:bg-gray-50 transition-colors border-b border-gray-100"
        >
          <Settings size={20} className="text-gray-400" />
          <span className="flex-1">Settings</span>
          <ChevronRight size={16} className="text-gray-300" />
        </button>

        <button
          onClick={onOpenBilling}
          className="w-full flex items-center gap-3 px-4 py-3.5 text-left text-gray-600 hover:bg-gray-50 transition-colors border-b border-gray-100"
        >
          <CreditCard size={20} className="text-gray-400" />
          <span className="flex-1">Billing & Invoices</span>
          <ChevronRight size={16} className="text-gray-300" />
        </button>

        <Link
          href="/contact"
          className="w-full flex items-center gap-3 px-4 py-3.5 text-left text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <HelpCircle size={20} className="text-gray-400" />
          <span className="flex-1">Help & Support</span>
          <ChevronRight size={16} className="text-gray-300" />
        </Link>
      </div>

      {/* Sign Out */}
      <button
        onClick={onSignOut}
        className="w-full flex items-center justify-center gap-2 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/5 rounded-xl transition-colors"
      >
        <LogOut size={20} />
        <span className="font-medium">Sign Out</span>
      </button>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-xs text-gray-400">
          © {new Date().getFullYear()} Packleads. All rights reserved.
        </p>
      </div>
    </TabContent>
  );
}
