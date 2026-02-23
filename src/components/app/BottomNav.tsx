'use client';

import { AppTab } from '@/hooks/useAppNavigation';

interface BottomNavProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  libraryCount?: number;
  tier?: string;
}

export function BottomNav({ activeTab, onTabChange, libraryCount = 0, tier }: BottomNavProps) {
  const isPremium = tier !== 'free' && tier !== '' && !!tier;

  const tabs: { id: AppTab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'search',
      label: 'Search',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
    },
    {
      id: 'library',
      label: 'Library',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      ),
    },
    ...(isPremium ? [{
      id: 'pipeline' as AppTab,
      label: 'Pipeline',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
    }] : []),
    {
      id: 'account',
      label: 'Account',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Background with blur */}
      <div className="absolute inset-0 bg-white/95 backdrop-blur-xl border-t border-gray-200" />

      {/* Safe area padding for iOS */}
      <div className="relative flex items-center justify-around px-2 pt-2 pb-safe">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col items-center justify-center w-full py-2 transition-colors ${
                isActive ? 'text-violet-600' : 'text-gray-400'
              }`}
            >
              {/* Active indicator line */}
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] bg-violet-500 rounded-full" />
              )}

              {/* Icon with badge */}
              <div className="relative">
                {tab.icon}

                {/* Badge for library count */}
                {tab.id === 'library' && libraryCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 flex items-center justify-center text-[10px] font-bold bg-violet-500 text-white rounded-full">
                    {libraryCount > 99 ? '99+' : libraryCount}
                  </span>
                )}
              </div>

              {/* Label */}
              <span className={`text-[10px] font-semibold mt-1 ${isActive ? 'text-violet-600' : 'text-gray-400'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
