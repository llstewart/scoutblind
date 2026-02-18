'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AppTab } from '@/hooks/useAppNavigation';
import { useAppContext } from '@/contexts/AppContext';

interface SavedSearch {
  id: string;
  niche: string;
  location: string;
  analyzedCount: number;
  totalCount: number;
  lastAccessed: Date;
}

interface SidebarProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  onSearchSelect?: (searchId: string) => void;
  recentSearches?: SavedSearch[];
  credits: number;
  tier: string;
  userName?: string;
}

export function Sidebar({
  activeTab,
  onTabChange,
  onSearchSelect,
  recentSearches = [],
  credits,
  tier,
  userName,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { setShowBillingModal, setShowSettingsModal } = useAppContext();

  const tierColors: Record<string, string> = {
    free: 'text-gray-500 bg-gray-100',
    starter: 'text-emerald-400 bg-emerald-500/10',
    pro: 'text-violet-400 bg-violet-500/10',
    enterprise: 'text-amber-400 bg-amber-500/10',
  };

  return (
    <aside
      className={`hidden md:flex flex-col h-screen bg-white border-r border-gray-200 transition-all duration-200 ${
        isCollapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Logo / Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!isCollapsed && (
          <span className="text-lg font-bold text-gray-900">
            Packleads<span className="text-violet-500">.</span>
          </span>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg
            className={`w-4 h-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {/* Search Tab */}
        <button
          onClick={() => onTabChange('search')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
            activeTab === 'search'
              ? 'bg-violet-50 text-violet-600'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {!isCollapsed && <span className="font-medium">Search</span>}
        </button>

        {/* Library Tab */}
        <div>
          <button
            onClick={() => onTabChange('library')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              activeTab === 'library'
                ? 'bg-violet-50 text-violet-600'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            {!isCollapsed && (
              <>
                <span className="font-medium flex-1 text-left">Library</span>
                {recentSearches.length > 0 && (
                  <span className="text-xs text-gray-500">{recentSearches.length}</span>
                )}
              </>
            )}
          </button>

          {/* Recent searches (nested under Library when expanded) */}
          {!isCollapsed && activeTab === 'library' && recentSearches.length > 0 && (
            <div className="mt-1 ml-4 pl-4 border-l border-gray-200 space-y-0.5">
              {recentSearches.slice(0, 5).map((search) => (
                <button
                  key={search.id}
                  onClick={() => onSearchSelect?.(search.id)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-gray-500 hover:text-gray-900 rounded transition-colors truncate"
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      search.analyzedCount > 0 ? 'bg-violet-500' : 'bg-gray-300'
                    }`}
                  />
                  <span className="truncate">
                    {search.niche}, {search.location}
                  </span>
                </button>
              ))}
              {recentSearches.length > 5 && (
                <button
                  onClick={() => onTabChange('library')}
                  className="w-full px-2 py-1 text-xs text-gray-400 hover:text-gray-600 text-left"
                >
                  +{recentSearches.length - 5} more
                </button>
              )}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="my-3 border-t border-gray-200" />

        {/* Account Tab */}
        <button
          onClick={() => onTabChange('account')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
            activeTab === 'account'
              ? 'bg-violet-50 text-violet-600'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          {!isCollapsed && <span className="font-medium">Account</span>}
        </button>
      </nav>

      {/* Footer - Credits & User */}
      {!isCollapsed && (
        <div className="p-3 border-t border-gray-200 space-y-3">
          {/* Credits */}
          <button
            onClick={() => setShowBillingModal(true)}
            className="w-full flex items-center justify-between px-2 py-1.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium text-gray-900">{credits}</span>
            </div>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${tierColors[tier] || tierColors.free}`}>
              {tier.toUpperCase()}
            </span>
          </button>

          {/* User */}
          {userName && (
            <button
              onClick={() => setShowSettingsModal(true)}
              className="w-full flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className="w-6 h-6 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-medium">
                {userName.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm text-gray-600 truncate">{userName}</span>
            </button>
          )}

          {/* Footer links */}
          <div className="flex items-center gap-3 px-2 pt-1">
            <Link href="/contact" className="text-[10px] text-gray-400 hover:text-gray-600 transition-colors">Help</Link>
            <Link href="/privacy" className="text-[10px] text-gray-400 hover:text-gray-600 transition-colors">Privacy</Link>
            <Link href="/terms" className="text-[10px] text-gray-400 hover:text-gray-600 transition-colors">Terms</Link>
          </div>
        </div>
      )}

      {/* Collapsed footer */}
      {isCollapsed && (
        <div className="p-2 border-t border-gray-200">
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() => setShowBillingModal(true)}
              className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-center"
            >
              <span className="text-xs font-bold text-violet-400">{credits}</span>
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
