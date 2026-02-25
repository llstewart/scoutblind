'use client';

import { ReactNode } from 'react';
import { Search, ChevronRight } from 'lucide-react';
import { TabContent } from './AppShell';

interface RecentSearch {
  id: string;
  niche: string;
  location: string;
  totalCount: number;
  analyzedCount: number;
  lastAccessed: Date;
}

interface SearchTabProps {
  // Search form component
  searchForm: ReactNode;
  // Recent searches for quick access
  recentSearches?: RecentSearch[];
  // Callbacks
  onRecentSearchClick?: (search: RecentSearch) => void;
  onLookupClick?: () => void;
  // State
  credits: number;
  isSearching?: boolean;
}

export function SearchTab({
  searchForm,
  recentSearches = [],
  onRecentSearchClick,
  onLookupClick,
  credits,
  isSearching = false,
}: SearchTabProps) {
  return (
    <TabContent className="min-h-full flex flex-col">
      <div className="flex-1 flex items-center justify-center py-8 md:py-16">
        <div className="w-full max-w-2xl mx-auto text-center px-4">
          {/* Logo - visible on mobile since no sidebar */}
          <h1 className="md:hidden text-2xl font-bold text-gray-900 mb-2">
            Packleads<span className="text-violet-500">.</span>
          </h1>

          {/* Main value prop - SEO focused */}
          <p className="text-gray-700 text-base md:text-lg mb-2">
            Find businesses that need your services.
          </p>
          <p className="text-gray-500 text-sm mb-8 max-w-md mx-auto">
            Analyze Google Business Profiles to identify prospects with weak online presence, poor review engagement, and digital gaps.
          </p>

          {/* Search Form */}
          <div data-tour="search-form" className="mb-6">
            {searchForm}
          </div>

          {/* Lookup specific business */}
          {onLookupClick && (
            <button
              onClick={onLookupClick}
              className="text-xs text-gray-500 hover:text-violet-400 transition-colors flex items-center gap-1.5 mx-auto mb-8"
            >
              <Search size={14} />
              Or look up a specific business
            </button>
          )}

          {/* Credit info */}
          <p className="text-[11px] text-gray-400 mb-8">
            1 credit per search · 1 credit per GBP analysis · <span className="text-violet-400">{credits} credits remaining</span>
          </p>

          {/* Recent Searches */}
          {recentSearches.length > 0 && !isSearching && (
            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-3">Recent</h2>
              <div className="space-y-1.5">
                {recentSearches.slice(0, 3).map((search) => (
                  <button
                    key={search.id}
                    onClick={() => onRecentSearchClick?.(search)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-left group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          search.analyzedCount > 0 ? 'bg-violet-500' : 'bg-gray-300'
                        }`}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-700 truncate">
                          {search.niche}
                        </p>
                        <p className="text-[11px] text-gray-400 truncate">
                          {search.location}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[11px] text-gray-400">
                        {search.analyzedCount > 0 ? `${search.analyzedCount} analyzed` : `${search.totalCount} found`}
                      </span>
                      <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Empty state for new users */}
          {recentSearches.length === 0 && !isSearching && (
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-center gap-6 text-[11px] text-gray-400">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-400 text-[11px] font-medium">1</div>
                  <span>Search niche</span>
                </div>
                <div className="w-6 h-px bg-gray-200" />
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-400 text-[11px] font-medium">2</div>
                  <span>Scan GBP profiles</span>
                </div>
                <div className="w-6 h-px bg-gray-200" />
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-400 text-[11px] font-medium">3</div>
                  <span>Find weak signals</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </TabContent>
  );
}
