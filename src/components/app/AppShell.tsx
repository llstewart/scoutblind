'use client';

import { ReactNode, Suspense } from 'react';
import { useAppNavigation, AppTab } from '@/hooks/useAppNavigation';
import { BottomNav } from './BottomNav';
import { Sidebar } from './Sidebar';

interface SavedSearch {
  id: string;
  niche: string;
  location: string;
  analyzedCount: number;
  totalCount: number;
  lastAccessed: Date;
}

interface AppShellProps {
  children: {
    search: ReactNode;
    library: ReactNode;
    account: ReactNode;
  };
  recentSearches?: SavedSearch[];
  libraryCount?: number;
  credits: number;
  tier: string;
  userName?: string;
  onSearchSelect?: (searchId: string) => void;
  // Force a specific tab to show (overrides URL-based navigation)
  // Use this to avoid race conditions when programmatically switching tabs
  forceTab?: AppTab;
}

export function AppShell({
  children,
  recentSearches = [],
  libraryCount = 0,
  credits,
  tier,
  userName,
  onSearchSelect,
  forceTab,
}: AppShellProps) {
  const { activeTab: urlTab, setActiveTab } = useAppNavigation();

  // Use forceTab if provided (to avoid race conditions), otherwise use URL-based tab
  const activeTab = forceTab || urlTab;

  const handleSearchSelect = (searchId: string) => {
    onSearchSelect?.(searchId);
    setActiveTab('search');
  };

  return (
    <div className="min-h-screen bg-[#0f0f10] flex">
      {/* Desktop Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSearchSelect={handleSearchSelect}
        recentSearches={recentSearches}
        credits={credits}
        tier={tier}
        userName={userName}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
              </div>
            }
          >
            {activeTab === 'search' && children.search}
            {activeTab === 'library' && children.library}
            {activeTab === 'account' && children.account}
          </Suspense>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        libraryCount={libraryCount}
      />
    </div>
  );
}

// Tab wrapper component for consistent padding/styling
export function TabContent({
  children,
  className = '',
  noPadding = false,
}: {
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}) {
  return (
    <div className={`${noPadding ? '' : 'p-4 md:p-6'} ${className}`}>
      {children}
    </div>
  );
}

// Header component for tabs
export function TabHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        {subtitle && <p className="text-sm text-zinc-500 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
