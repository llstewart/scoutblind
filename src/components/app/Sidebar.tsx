'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, BookOpen, LayoutList, UserCircle, ChevronsLeft, ChevronsRight, Coins } from 'lucide-react';
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
  pipelineCount?: number;
}

export function Sidebar({
  activeTab,
  onTabChange,
  onSearchSelect,
  recentSearches = [],
  credits,
  tier,
  userName,
  pipelineCount,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { setShowBillingModal, setShowSettingsModal } = useAppContext();

  const tierColors: Record<string, string> = {
    free: 'text-gray-400 bg-white/5',
    starter: 'text-emerald-400 bg-emerald-500/20',
    pro: 'text-violet-400 bg-violet-500/20',
    enterprise: 'text-amber-400 bg-amber-500/20',
  };

  return (
    <aside
      className={`always-dark hidden md:flex flex-col h-[100dvh] bg-gray-950 border-r border-gray-800 transition-all duration-200 ${
        isCollapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Logo / Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        {!isCollapsed && (
          <span className="text-lg font-bold tracking-tight text-white">
            Packleads<span className="text-violet-500">.</span>
          </span>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-white/5 rounded-lg transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronsRight size={16} className="transition-transform" />
          ) : (
            <ChevronsLeft size={16} className="transition-transform" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {/* Section label */}
        {!isCollapsed && (
          <p className="text-[11px] uppercase tracking-wider text-gray-600 px-3 mb-1 mt-1">Navigate</p>
        )}

        {/* Search Tab */}
        <button
          onClick={() => onTabChange('search')}
          className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
            activeTab === 'search'
              ? 'bg-white/10 text-white'
              : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
          }`}
        >
          {activeTab === 'search' && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-violet-500 rounded-full" />
          )}
          <Search size={20} className="flex-shrink-0" />
          {!isCollapsed && <span className="font-semibold">Search</span>}
        </button>

        {/* Library Tab */}
        <div>
          <button
            data-tour="library-tab"
            onClick={() => onTabChange('library')}
            className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              activeTab === 'library'
                ? 'bg-white/10 text-white'
                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
            }`}
          >
            {activeTab === 'library' && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-violet-500 rounded-full" />
            )}
            <BookOpen size={20} className="flex-shrink-0" />
            {!isCollapsed && (
              <>
                <span className="font-semibold flex-1 text-left">Library</span>
                {recentSearches.length > 0 && (
                  <span className="min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[11px] font-bold bg-violet-500/20 text-violet-300 rounded-full">
                    {recentSearches.length}
                  </span>
                )}
              </>
            )}
          </button>

          {/* Recent searches (nested under Library when expanded) */}
          {!isCollapsed && activeTab === 'library' && recentSearches.length > 0 && (
            <div className="mt-1 ml-4 pl-4 border-l border-gray-800 space-y-0.5">
              {recentSearches.slice(0, 5).map((search) => (
                <button
                  key={search.id}
                  onClick={() => onSearchSelect?.(search.id)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-gray-500 hover:text-gray-300 rounded-lg transition-colors truncate"
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      search.analyzedCount > 0 ? 'bg-violet-400' : 'bg-gray-600'
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
                  className="w-full px-2 py-1 text-xs text-gray-600 hover:text-gray-400 text-left"
                >
                  +{recentSearches.length - 5} more
                </button>
              )}
            </div>
          )}
        </div>

        {/* Pipeline Tab (premium only) */}
        {tier !== 'free' && tier !== '' && (
          <button
            onClick={() => onTabChange('pipeline')}
            className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              activeTab === 'pipeline'
                ? 'bg-white/10 text-white'
                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
            }`}
          >
            {activeTab === 'pipeline' && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-violet-500 rounded-full" />
            )}
            <LayoutList size={20} className="flex-shrink-0" />
            {!isCollapsed && (
              <>
                <span className="font-semibold flex-1 text-left">Pipeline</span>
                {pipelineCount != null && pipelineCount > 0 && (
                  <span className="min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[11px] font-bold bg-violet-500/20 text-violet-300 rounded-full">
                    {pipelineCount}
                  </span>
                )}
              </>
            )}
          </button>
        )}

        {/* Settings section */}
        <div className="my-3 border-t border-gray-800" />

        {!isCollapsed && (
          <p className="text-[11px] uppercase tracking-wider text-gray-600 px-3 mb-1">Settings</p>
        )}

        {/* Account Tab */}
        <button
          onClick={() => onTabChange('account')}
          className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
            activeTab === 'account'
              ? 'bg-white/10 text-white'
              : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
          }`}
        >
          {activeTab === 'account' && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-violet-500 rounded-full" />
          )}
          <UserCircle size={20} className="flex-shrink-0" />
          {!isCollapsed && <span className="font-semibold">Account</span>}
        </button>
      </nav>

      {/* Footer - Credits & User */}
      {!isCollapsed && (
        <div className="p-3 border-t border-gray-800 space-y-3">
          {/* Credits */}
          <button
            data-tour="credits-display"
            onClick={() => setShowBillingModal(true)}
            className="w-full flex items-center justify-between px-2 py-1.5 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Coins size={16} className="text-violet-400" />
              <span className="text-sm font-medium text-gray-300">{credits}</span>
            </div>
            <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${tierColors[tier] || tierColors.free}`}>
              {tier.toUpperCase()}
            </span>
          </button>

          {/* User */}
          {userName && (
            <button
              onClick={() => setShowSettingsModal(true)}
              className="w-full flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            >
              <div className="w-6 h-6 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-medium">
                {userName.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm text-gray-300 truncate">{userName}</span>
            </button>
          )}

          {/* Footer links */}
          <div className="flex items-center gap-3 px-2 pt-1">
            <Link href="/contact" className="text-[11px] text-gray-600 hover:text-gray-400 transition-colors">Help</Link>
            <Link href="/privacy" className="text-[11px] text-gray-600 hover:text-gray-400 transition-colors">Privacy</Link>
            <Link href="/terms" className="text-[11px] text-gray-600 hover:text-gray-400 transition-colors">Terms</Link>
          </div>
        </div>
      )}

      {/* Collapsed footer */}
      {isCollapsed && (
        <div className="p-2 border-t border-gray-800">
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() => setShowBillingModal(true)}
              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center"
            >
              <span className="text-xs font-bold text-violet-400">{credits}</span>
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
