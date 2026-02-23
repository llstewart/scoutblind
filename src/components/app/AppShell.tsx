'use client';

import { ReactNode, Suspense } from 'react';
import { LucideIcon } from 'lucide-react';
import { useAppNavigation, AppTab } from '@/hooks/useAppNavigation';
import { BottomNav } from './BottomNav';
import { Sidebar } from './Sidebar';
import { BrandedSpinner } from '@/components/ui/BrandedSpinner';

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
  pipelineCount?: number;
  credits: number;
  tier: string;
  userName?: string;
  onSearchSelect?: (searchId: string) => void;
}

export function AppShell({
  children,
  recentSearches = [],
  libraryCount = 0,
  pipelineCount,
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
    <div className="min-h-screen bg-gray-50 dark:bg-background flex">
      {/* Desktop Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSearchSelect={handleSearchSelect}
        recentSearches={recentSearches}
        credits={credits}
        tier={tier}
        userName={userName}
        pipelineCount={pipelineCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Tab Content */}
        <div className="flex-1 min-h-0 overflow-y-auto pb-20 md:pb-0">
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-64">
                <BrandedSpinner size="md" />
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
        tier={tier}
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
    <div className={`animate-fade-in ${noPadding ? '' : 'p-4 md:p-6'} ${className}`}>
      {children}
    </div>
  );
}

// Header component for tabs
export function TabHeader({
  title,
  subtitle,
  actions,
  icon: Icon,
  badge,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  icon?: LucideIcon;
  badge?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
            <Icon size={20} className="text-violet-500" />
          </div>
        )}
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">{title}</h1>
            {badge}
          </div>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
