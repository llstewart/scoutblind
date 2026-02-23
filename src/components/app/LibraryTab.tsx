'use client';

import { useState, useMemo, ReactNode } from 'react';
import { ArrowLeft, Search, Trash2, ChevronRight, Check, BarChart3, BookOpen } from 'lucide-react';
import { TabContent, TabHeader } from './AppShell';
import { Badge } from '@/components/ui/Badge';
import { BrandedSpinner } from '@/components/ui/BrandedSpinner';
import ScoreRing from '@/components/ui/ScoreRing';

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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<'bulk' | 'all' | null>(null);

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
        <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200 elevation-1">
          <div className="px-4 py-3">
            <div className="flex items-center gap-3">
              {/* Back button */}
              <button
                onClick={onBackToList}
                className="p-1.5 -ml-1.5 text-gray-500 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-100"
              >
                <ArrowLeft size={20} />
              </button>

              {/* Search info */}
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-medium text-gray-900 truncate">
                  {activeSearch.niche}
                </h2>
                <p className="text-xs text-gray-500 truncate">
                  {activeSearch.location}
                </p>
              </div>

              {/* GBP Signal badge */}
              <Badge variant="brand" size="sm">GBP Signals</Badge>
            </div>
          </div>
        </div>

        {/* Results content */}
        <div className="flex-1">
          {isLoadingResults ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <BrandedSpinner size="md" />
                <p className="text-sm text-gray-500 mt-3">Loading GBP analysis data...</p>
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
        <TabHeader icon={BookOpen} title="Library" subtitle="Your GBP prospect research" />
        <div className="flex items-center justify-center py-16">
          <BrandedSpinner size="md" />
        </div>
      </TabContent>
    );
  }

  // Empty state
  if (searches.length === 0) {
    return (
      <TabContent className="surface-library min-h-full">
        <TabHeader icon={BookOpen} title="Library" subtitle="Your GBP prospect research" />
        <div className="flex flex-col items-center justify-center py-16 text-center relative">
          {/* Animated gradient orb */}
          <div className="absolute w-32 h-32 rounded-full bg-gradient-to-br from-amber-100/40 to-yellow-100/20 blur-3xl -z-10 animate-pulse" />

          {/* Bookmark illustration */}
          <div className="mb-5">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="mx-auto">
              <rect x="12" y="8" width="40" height="48" rx="6" stroke="url(#library-grad)" strokeWidth="2.5" fill="none" />
              <path d="M24 8v20l8-6 8 6V8" stroke="url(#library-grad)" strokeWidth="2" strokeLinejoin="round" fill="none" />
              <path d="M20 40h24M20 48h16" stroke="url(#library-grad)" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
              <defs>
                <linearGradient id="library-grad" x1="12" y1="8" x2="52" y2="56">
                  <stop stopColor="#f59e0b" />
                  <stop offset="1" stopColor="#fbbf24" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <h3 className="text-xl font-semibold text-gray-900 mb-2">No saved searches yet</h3>
          <p className="text-sm text-gray-500 max-w-xs leading-relaxed mb-6">
            Your search history will appear here after your first search.
          </p>
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-violet-600 hover:bg-violet-500 rounded-lg transition-colors"
          >
            <Search size={16} />
            Start a search
          </a>
        </div>
      </TabContent>
    );
  }

  return (
    <TabContent className="surface-library min-h-full">
      {/* Header */}
      <TabHeader
        icon={BookOpen}
        title="Library"
        subtitle={`${searches.length} ${searches.length === 1 ? 'market' : 'markets'} researched`}
        actions={
          onDeleteSearch ? (
            <button
              onClick={() => {
                if (isEditing) {
                  setSelectedIds(new Set());
                }
                setIsEditing(!isEditing);
              }}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors ${
                isEditing
                  ? 'bg-violet-500/10 text-violet-400'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {isEditing ? 'Done' : 'Edit'}
            </button>
          ) : undefined
        }
      />

      {/* Bulk actions bar */}
      {isEditing && (
        <div className="flex items-center gap-2 mb-4 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl">
          <button
            onClick={() => {
              if (selectedIds.size === filteredSearches.length) {
                setSelectedIds(new Set());
              } else {
                setSelectedIds(new Set(filteredSearches.map(s => s.id)));
              }
            }}
            className="text-[11px] font-semibold text-violet-600 hover:text-violet-500 transition-colors"
          >
            {selectedIds.size === filteredSearches.length ? 'Deselect all' : 'Select all'}
          </button>
          <div className="flex-1" />
          {selectedIds.size > 0 && (
            <span className="text-[11px] font-semibold text-gray-500">{selectedIds.size} selected</span>
          )}
          <button
            onClick={() => selectedIds.size > 0 ? setShowDeleteConfirm('bulk') : null}
            disabled={selectedIds.size === 0}
            className="px-2.5 py-1 text-[11px] font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <Trash2 size={12} />
            Delete
          </button>
          {onClearAll && searches.length > 1 && (
            <button
              onClick={() => setShowDeleteConfirm('all')}
              className="px-2.5 py-1 text-[11px] font-semibold text-red-400 hover:text-red-500 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {/* Search filter */}
      <div className="mb-4">
        <div className="relative">
          <Search
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Filter markets..."
            className="w-full pl-8 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
          />
        </div>
      </div>

      {/* No results for filter */}
      {filteredSearches.length === 0 && searchFilter && (
        <div className="text-center py-8">
          <p className="text-xs text-gray-500">No markets match &quot;{searchFilter}&quot;</p>
        </div>
      )}

      {/* Grouped searches */}
      <div className="space-y-4">
        {Object.entries(groupedSearches).map(([period, periodSearches]) => (
          <div key={period}>
            <h3 className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1.5 px-1">
              {period}
            </h3>
            <div className="space-y-1">
              {periodSearches.map((search) => (
                <div
                  key={search.id}
                  className={`flex items-center gap-2 px-2.5 py-2.5 rounded-xl transition-colors group ${
                    selectedIds.has(search.id) ? 'bg-violet-50 ring-1 ring-violet-200' : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  {/* Checkbox (edit mode) */}
                  {isEditing && (
                    <input
                      type="checkbox"
                      checked={selectedIds.has(search.id)}
                      onChange={() => {
                        setSelectedIds(prev => {
                          const next = new Set(prev);
                          if (next.has(search.id)) next.delete(search.id); else next.add(search.id);
                          return next;
                        });
                      }}
                      className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500/30 flex-shrink-0"
                    />
                  )}

                  {/* Analysis completion ring */}
                  <ScoreRing
                    score={search.totalCount > 0 ? Math.round((search.analyzedCount / search.totalCount) * 100) : 0}
                    size="sm"
                  />

                  {/* Content - clickable */}
                  <button
                    onClick={() => !isEditing && onSearchClick(search)}
                    className="flex-1 min-w-0 text-left"
                    disabled={isEditing}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {search.niche}
                        </p>
                        <p className="text-[11px] text-gray-500 truncate">
                          {search.location}
                        </p>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[11px] text-gray-500">
                          {search.totalCount} found
                        </span>
                        {search.analyzedCount > 0 && (
                          <>
                            <span className="text-[11px] text-gray-300">·</span>
                            <span className="text-[11px] text-violet-400 font-medium">
                              {search.analyzedCount} analyzed
                            </span>
                          </>
                        )}

                        {/* Chevron */}
                        {!isEditing && (
                          <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
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
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(null)} />
          <div className="relative bg-white rounded-xl p-6 elevation-3 w-full max-w-sm">
            <div className="flex justify-center mb-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10">
                <Trash2 size={24} className="text-red-400" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
              {showDeleteConfirm === 'all'
                ? 'Clear all research?'
                : `Delete ${selectedIds.size} ${selectedIds.size === 1 ? 'market' : 'markets'}?`
              }
            </h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              {showDeleteConfirm === 'all'
                ? `This will permanently delete all ${searches.length} saved ${searches.length === 1 ? 'market' : 'markets'} and their analysis data. This cannot be undone.`
                : `This will permanently delete the selected ${selectedIds.size === 1 ? 'market' : 'markets'} and their analysis data. This cannot be undone.`
              }
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (showDeleteConfirm === 'all') {
                    onClearAll?.();
                  } else {
                    // Delete selected one by one
                    selectedIds.forEach(id => onDeleteSearch?.(id));
                    setSelectedIds(new Set());
                  }
                  setShowDeleteConfirm(null);
                  setIsEditing(false);
                }}
                className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg bg-red-600 text-white hover:bg-red-500 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </TabContent>
  );
}
