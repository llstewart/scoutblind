'use client';

import { useState, useMemo, ReactNode } from 'react';
import { TabContent } from './AppShell';

interface SavedSearch {
  id: string;
  niche: string;
  location: string;
  totalCount: number;
  analyzedCount: number;
  createdAt: Date;
  lastAccessed: Date;
}

interface LibraryTabProps {
  searches: SavedSearch[];
  isLoading?: boolean;
  onSearchClick: (search: SavedSearch) => void;
  onDeleteSearch?: (searchId: string) => void;
  onClearAll?: () => void;
  // For detail view
  activeSearch?: { niche: string; location: string } | null;
  resultsContent?: ReactNode;
  onBackToList?: () => void;
  isLoadingResults?: boolean;
}

// Helper to group searches by time period
function groupSearchesByTime(searches: SavedSearch[]): Record<string, SavedSearch[]> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thisMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  const groups: Record<string, SavedSearch[]> = {
    'Today': [],
    'Yesterday': [],
    'This Week': [],
    'This Month': [],
    'Older': [],
  };

  searches.forEach(search => {
    const date = new Date(search.lastAccessed);
    if (date >= today) {
      groups['Today'].push(search);
    } else if (date >= yesterday) {
      groups['Yesterday'].push(search);
    } else if (date >= thisWeek) {
      groups['This Week'].push(search);
    } else if (date >= thisMonth) {
      groups['This Month'].push(search);
    } else {
      groups['Older'].push(search);
    }
  });

  // Remove empty groups
  Object.keys(groups).forEach(key => {
    if (groups[key].length === 0) {
      delete groups[key];
    }
  });

  return groups;
}

export function LibraryTab({
  searches,
  isLoading = false,
  onSearchClick,
  onDeleteSearch,
  onClearAll,
  activeSearch,
  resultsContent,
  onBackToList,
  isLoadingResults = false,
}: LibraryTabProps) {
  const [searchFilter, setSearchFilter] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Filter and group searches
  const filteredSearches = useMemo(() => {
    if (!searchFilter.trim()) return searches;
    const filter = searchFilter.toLowerCase();
    return searches.filter(
      s => s.niche.toLowerCase().includes(filter) || s.location.toLowerCase().includes(filter)
    );
  }, [searches, searchFilter]);

  const groupedSearches = useMemo(() => groupSearchesByTime(filteredSearches), [filteredSearches]);

  // ==================== DETAIL VIEW ====================
  if (activeSearch && resultsContent) {
    return (
      <div className="min-h-full flex flex-col">
        {/* Header for detail view */}
        <div className="sticky top-0 z-40 bg-[#0f0f10]/95 backdrop-blur-sm border-b border-zinc-800/50">
          <div className="px-4 py-3">
            <div className="flex items-center gap-3">
              {/* Back button */}
              <button
                onClick={onBackToList}
                className="p-1.5 -ml-1.5 text-zinc-400 hover:text-white transition-colors rounded-lg hover:bg-zinc-800/50"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Search info */}
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-medium text-white truncate">
                  {activeSearch.niche}
                </h2>
                <p className="text-xs text-zinc-500 truncate">
                  {activeSearch.location}
                </p>
              </div>

              {/* GMB Signal badge */}
              <div className="flex items-center gap-1.5 px-2 py-1 bg-violet-500/10 rounded-md">
                <svg className="w-3.5 h-3.5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className="text-[10px] font-medium text-violet-400 uppercase tracking-wide">GMB Signals</span>
              </div>
            </div>
          </div>
        </div>

        {/* Results content */}
        <div className="flex-1">
          {isLoadingResults ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-zinc-500">Loading GMB analysis data...</p>
              </div>
            </div>
          ) : (
            resultsContent
          )}
        </div>
      </div>
    );
  }

  // ==================== LIST VIEW ====================

  // Loading state
  if (isLoading) {
    return (
      <TabContent>
        <div className="mb-6">
          <h1 className="text-xl font-bold text-white">Library</h1>
          <p className="text-xs text-zinc-500 mt-1">Your GMB prospect research</p>
        </div>
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
        </div>
      </TabContent>
    );
  }

  // Empty state
  if (searches.length === 0) {
    return (
      <TabContent>
        <div className="mb-6">
          <h1 className="text-xl font-bold text-white">Library</h1>
          <p className="text-xs text-zinc-500 mt-1">Your GMB prospect research</p>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-xl bg-zinc-800/50 flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-base font-medium text-white mb-1">No prospects yet</h3>
          <p className="text-xs text-zinc-500 max-w-xs">
            Search for businesses in the Search tab to find prospects with weak GMB presence.
          </p>
        </div>
      </TabContent>
    );
  }

  return (
    <TabContent>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-white">Library</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            {searches.length} {searches.length === 1 ? 'market' : 'markets'} researched
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onClearAll && searches.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="px-2 py-1 text-[10px] font-medium text-zinc-600 hover:text-red-400 transition-colors"
            >
              Clear all
            </button>
          )}
          {onDeleteSearch && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`px-2 py-1 text-[10px] font-medium rounded transition-colors ${
                isEditing
                  ? 'bg-violet-500/10 text-violet-400'
                  : 'text-zinc-500 hover:text-white'
              }`}
            >
              {isEditing ? 'Done' : 'Edit'}
            </button>
          )}
        </div>
      </div>

      {/* Search filter */}
      <div className="mb-4">
        <div className="relative">
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Filter markets..."
            className="w-full pl-8 pr-3 py-2 text-xs bg-zinc-800/50 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
          />
        </div>
      </div>

      {/* No results for filter */}
      {filteredSearches.length === 0 && searchFilter && (
        <div className="text-center py-8">
          <p className="text-xs text-zinc-500">No markets match &quot;{searchFilter}&quot;</p>
        </div>
      )}

      {/* Grouped searches */}
      <div className="space-y-4">
        {Object.entries(groupedSearches).map(([period, periodSearches]) => (
          <div key={period}>
            <h3 className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider mb-1.5 px-1">
              {period}
            </h3>
            <div className="space-y-1">
              {periodSearches.map((search) => (
                <div
                  key={search.id}
                  className="flex items-center gap-2 px-2.5 py-2.5 rounded-lg bg-zinc-900/30 hover:bg-zinc-800/50 transition-colors group"
                >
                  {/* Delete button (edit mode) */}
                  {isEditing && onDeleteSearch && (
                    <button
                      onClick={() => onDeleteSearch(search.id)}
                      className="p-0.5 text-zinc-600 hover:text-red-400 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}

                  {/* Status indicator */}
                  <div
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      search.analyzedCount === search.totalCount && search.analyzedCount > 0
                        ? 'bg-green-500' // Fully analyzed
                        : search.analyzedCount > 0
                          ? 'bg-violet-500' // Partially analyzed
                          : 'bg-zinc-700' // Not analyzed
                    }`}
                    title={
                      search.analyzedCount === search.totalCount && search.analyzedCount > 0
                        ? 'Fully analyzed'
                        : search.analyzedCount > 0
                          ? 'Partially analyzed'
                          : 'Not analyzed'
                    }
                  />

                  {/* Content - clickable */}
                  <button
                    onClick={() => !isEditing && onSearchClick(search)}
                    className="flex-1 min-w-0 text-left"
                    disabled={isEditing}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-zinc-200 truncate">
                          {search.niche}
                        </p>
                        <p className="text-[10px] text-zinc-500 truncate">
                          {search.location}
                        </p>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[10px] text-zinc-500">
                          {search.totalCount} found
                        </span>
                        {search.analyzedCount > 0 && (
                          <>
                            <span className="text-[10px] text-zinc-700">·</span>
                            <span className="text-[10px] text-violet-400 font-medium">
                              {search.analyzedCount} analyzed
                            </span>
                          </>
                        )}

                        {/* Chevron */}
                        {!isEditing && (
                          <svg
                            className="w-4 h-4 text-zinc-700 group-hover:text-zinc-500 transition-colors"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {/* Clear All Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowClearConfirm(false)} />
          <div className="relative bg-zinc-900 rounded-2xl p-6 shadow-2xl shadow-black/40 w-full max-w-sm border border-zinc-800">
            <div className="flex justify-center mb-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10">
                <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-white text-center mb-2">Clear all research?</h3>
            <p className="text-sm text-zinc-400 text-center mb-6">
              This will permanently delete all {searches.length} saved {searches.length === 1 ? 'market' : 'markets'} and their analysis data. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowClearConfirm(false);
                  onClearAll?.();
                }}
                className="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl bg-red-600 text-white hover:bg-red-500 transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </TabContent>
  );
}
