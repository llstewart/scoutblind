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
  children: ReactNode;
  recentSearches?: SavedSearch[];
  libraryCount?: number;
  credits: number;
  tier: string;
  userName?: string;
  onSearchSelect?: (searchId: string) => void;
}

export function AppShell({
  children,
  recentSearches = [],
  libraryCount = 0,
  credits,
  tier,
  userName,
  onSearchSelect,
}: AppShellProps) {
  const { activeTab, setActiveTab } = useAppNavigation();

  const handleSearchSelect = (searchId: string) => {
    onSearchSelect?.(searchId);
    // Don't change tabs - saved searches are viewed in the Library tab
    // If not already on library, navigate there
    if (activeTab !== 'library') {
      setActiveTab('library');
    }
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
            {children}
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
