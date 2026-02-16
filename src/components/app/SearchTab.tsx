'use client';

import { ReactNode } from 'react';
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
          <h1 className="md:hidden text-2xl font-bold text-white mb-2">
            Scoutblind<span className="text-violet-500">.</span>
          </h1>

          {/* Main value prop - SEO focused */}
          <p className="text-zinc-300 text-base md:text-lg mb-2">
            Find businesses that need your services.
          </p>
          <p className="text-zinc-500 text-sm mb-8 max-w-md mx-auto">
            Analyze Google Business Profiles to identify prospects with weak GMB presence, poor review engagement, and SEO gaps.
          </p>

          {/* Search Form */}
          <div className="mb-6">
            {searchForm}
          </div>

          {/* Lookup specific business */}
          {onLookupClick && (
            <button
              onClick={onLookupClick}
              className="text-xs text-zinc-500 hover:text-violet-400 transition-colors flex items-center gap-1.5 mx-auto mb-8"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Or look up a specific business
            </button>
          )}

          {/* Credit info */}
          <p className="text-[10px] text-zinc-600 mb-8">
            1 credit per search · 1 credit per GMB analysis · <span className="text-violet-400">{credits} credits remaining</span>
          </p>

          {/* Recent Searches */}
          {recentSearches.length > 0 && !isSearching && (
            <div className="border-t border-zinc-800/30 pt-6">
              <h2 className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider mb-3">Recent</h2>
              <div className="space-y-1.5">
                {recentSearches.slice(0, 3).map((search) => (
                  <button
                    key={search.id}
                    onClick={() => onRecentSearchClick?.(search)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-zinc-900/30 hover:bg-zinc-800/50 transition-colors text-left group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          search.analyzedCount > 0 ? 'bg-violet-500' : 'bg-zinc-700'
                        }`}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-300 truncate">
                          {search.niche}
                        </p>
                        <p className="text-[10px] text-zinc-600 truncate">
                          {search.location}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[10px] text-zinc-600">
                        {search.analyzedCount > 0 ? `${search.analyzedCount} analyzed` : `${search.totalCount} found`}
                      </span>
                      <svg
                        className="w-3.5 h-3.5 text-zinc-700 group-hover:text-zinc-500 transition-colors"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Empty state for new users */}
          {recentSearches.length === 0 && !isSearching && (
            <div className="border-t border-zinc-800/30 pt-6">
              <div className="flex items-center justify-center gap-6 text-[10px] text-zinc-600">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-400 text-[10px] font-medium">1</div>
                  <span>Search niche</span>
                </div>
                <div className="w-6 h-px bg-zinc-800" />
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-400 text-[10px] font-medium">2</div>
                  <span>Scan GMB profiles</span>
                </div>
                <div className="w-6 h-px bg-zinc-800" />
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-400 text-[10px] font-medium">3</div>
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
