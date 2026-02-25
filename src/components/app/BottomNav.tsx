'use client';

import { Search, BookOpen, LayoutList, UserCircle } from 'lucide-react';
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
      icon: <Search size={24} />,
    },
    {
      id: 'library',
      label: 'Library',
      icon: <BookOpen size={24} />,
    },
    ...(isPremium ? [{
      id: 'pipeline' as AppTab,
      label: 'Pipeline',
      icon: <LayoutList size={24} />,
    }] : []),
    {
      id: 'account',
      label: 'Account',
      icon: <UserCircle size={24} />,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Background with blur */}
      <div className="absolute inset-0 bg-white/95 dark:bg-card/95 backdrop-blur-xl border-t border-gray-200" />

      {/* Safe area padding for iOS home indicator */}
      <div className="relative flex items-center justify-around px-2 pt-2 nav-bottom-safe">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          const tourAttr = tab.id === 'library' ? 'library-tab-mobile'
            : tab.id === 'account' ? 'credits-display-mobile'
            : undefined;

          return (
            <button
              key={tab.id}
              data-tour={tourAttr}
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
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 flex items-center justify-center text-[11px] font-bold bg-violet-500 text-white rounded-full">
                    {libraryCount > 99 ? '99+' : libraryCount}
                  </span>
                )}
              </div>

              {/* Label */}
              <span className={`text-[11px] font-semibold mt-1 ${isActive ? 'text-violet-600' : 'text-gray-400'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
