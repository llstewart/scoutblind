'use client';

import { ReactNode } from 'react';
import { TabContent, TabHeader } from './AppShell';

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
  // Results component (when has results)
  results?: ReactNode;
  // Recent searches for quick access
  recentSearches?: RecentSearch[];
  // Callbacks
  onRecentSearchClick?: (search: RecentSearch) => void;
  onLookupClick?: () => void;
  onNewSearch?: () => void;
  // State
  hasResults?: boolean;
  credits: number;
  // When viewing a saved search from Library
  isViewingSavedSearch?: boolean;
  savedSearchNiche?: string;
  savedSearchLocation?: string;
}

export function SearchTab({
  searchForm,
  results,
  recentSearches = [],
  onRecentSearchClick,
  onLookupClick,
  onNewSearch,
  hasResults = false,
  credits,
  isViewingSavedSearch = false,
  savedSearchNiche,
  savedSearchLocation,
}: SearchTabProps) {
  // If we have results, show the results view
  if (hasResults && results) {
    return (
      <div className="min-h-full">
        {/* Header - different for saved search vs active search */}
        <div className="sticky top-0 z-40 bg-[#0f0f10]/80 backdrop-blur-xl border-b border-zinc-800/50">
          <div className="max-w-[1400px] mx-auto px-4 py-3">
            {isViewingSavedSearch ? (
              // Saved search header - shows what search we're viewing
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-violet-500/10 rounded-lg">
                    <svg className="w-4 h-4 text-violet-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                    <span className="text-xs font-medium text-violet-400 uppercase tracking-wide">Saved Search</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-zinc-300 truncate">
                    <span className="font-medium text-white truncate">{savedSearchNiche}</span>
                    <span className="text-zinc-500">in</span>
                    <span className="truncate">{savedSearchLocation}</span>
                  </div>
                </div>
                <button
                  onClick={onNewSearch}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-500 rounded-lg transition-colors flex-shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span className="hidden sm:inline">New Search</span>
                </button>
              </div>
            ) : (
              // Active search header - shows the search form
              <div className="flex items-center gap-4">
                {searchForm}
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="max-w-[1400px] mx-auto">
          {results}
        </div>
      </div>
    );
  }

  // Hero/empty state
  return (
    <TabContent className="min-h-full flex flex-col">
      <div className="flex-1 flex items-center justify-center py-8 md:py-16">
        <div className="w-full max-w-2xl mx-auto text-center px-4">
          {/* Logo - visible on mobile since no sidebar */}
          <h1 className="md:hidden text-3xl font-bold text-white mb-2">
            TrueSignal<span className="text-violet-500">.</span>
          </h1>

          {/* Tagline */}
          <p className="text-zinc-400 text-base md:text-lg mb-8 max-w-md mx-auto">
            Find businesses that actually need your services.
          </p>

          {/* Search Form */}
          <div className="mb-6">
            {searchForm}
          </div>

          {/* Lookup specific business */}
          {onLookupClick && (
            <button
              onClick={onLookupClick}
              className="text-sm text-zinc-500 hover:text-violet-400 transition-colors flex items-center gap-2 mx-auto mb-8"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Or look up a specific business
            </button>
          )}

          {/* Credit info */}
          <p className="text-xs text-zinc-600 mb-8">
            1 credit per search · 1 credit per business analysis · <span className="text-violet-400">{credits} credits remaining</span>
          </p>

          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div className="border-t border-zinc-800/30 pt-6">
              <h2 className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider mb-2">Recent</h2>
              <div className="space-y-1">
                {recentSearches.slice(0, 3).map((search) => (
                  <button
                    key={search.id}
                    onClick={() => onRecentSearchClick?.(search)}
                    className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg bg-zinc-900/30 hover:bg-zinc-800/50 transition-colors text-left group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                          search.analyzedCount > 0 ? 'bg-violet-500' : 'bg-zinc-700'
                        }`}
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-zinc-300 truncate">
                          {search.niche}
                        </p>
                        <p className="text-[10px] text-zinc-600 truncate">
                          {search.location}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[10px] text-zinc-600">
                        {search.totalCount}
                      </span>
                      <svg
                        className="w-3 h-3 text-zinc-700 group-hover:text-zinc-500 transition-colors"
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
          {recentSearches.length === 0 && (
            <div className="border-t border-zinc-800/50 pt-8">
              <div className="flex items-center justify-center gap-8 text-sm text-zinc-600">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-400 text-xs font-medium">1</div>
                  <span>Search niche</span>
                </div>
                <div className="hidden sm:block w-8 h-px bg-zinc-800" />
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-400 text-xs font-medium">2</div>
                  <span>Scan market</span>
                </div>
                <div className="hidden sm:block w-8 h-px bg-zinc-800" />
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-400 text-xs font-medium">3</div>
                  <span>Find signals</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </TabContent>
  );
}
