'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Clock, MapPin, Trash2 } from 'lucide-react';
import { isEnrichedBusiness } from '@/lib/types';

interface SavedSearch {
  searchKey: string;
  niche: string;
  location: string;
  businessCount: number;
  analyzedAt: string;
}

interface SavedAnalysesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  currentSearchKey?: string;
  onLoadSearch: (niche: string, location: string) => void;
  onClearHistory: () => void;
  isLoggedIn?: boolean;
}

export function SavedAnalysesPanel({
  isOpen,
  onClose,
  sessionId,
  currentSearchKey,
  onLoadSearch,
  onClearHistory,
  isLoggedIn = false,
}: SavedAnalysesPanelProps) {
  const router = useRouter();
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    if (isOpen && sessionId) {
      loadSavedSearches();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, sessionId]);

  const loadSavedSearches = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/session?sessionId=${encodeURIComponent(sessionId)}`);
      if (response.ok) {
        const data = await response.json();
        const analyses = data.analyses || {};

        const searches: SavedSearch[] = Object.entries(analyses)
          .map(([key, value]: [string, any]) => {
            // Only count actually enriched businesses
            const allBusinesses = value.businesses || [];
            const enrichedCount = allBusinesses.filter((b: any) => isEnrichedBusiness(b)).length;
            return {
              searchKey: key,
              niche: value.niche,
              location: value.location,
              businessCount: enrichedCount,
              analyzedAt: value.analyzedAt,
            };
          })
          // Only show analyses that have at least one enriched business
          .filter(search => search.businessCount > 0);

        // Sort by most recent first
        searches.sort((a, b) => new Date(b.analyzedAt).getTime() - new Date(a.analyzedAt).getTime());
        setSavedSearches(searches);
      }
    } catch (error) {
      console.error('Failed to load saved searches:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = async () => {
    try {
      await fetch(`/api/session?sessionId=${encodeURIComponent(sessionId)}`, {
        method: 'DELETE',
      });
      setSavedSearches([]);
      setShowClearConfirm(false);
      onClearHistory();
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-card border-l border-gray-200 z-50 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Saved Analyses</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {isLoggedIn ? 'Saved to your account' : 'Saved for 7 days (sign in to save permanently)'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                router.push('/history');
                onClose();
              }}
              className="px-3 py-1.5 text-xs font-medium text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 rounded-lg transition-colors"
            >
              View All
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            // Loading skeleton
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-100 rounded-lg p-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : savedSearches.length === 0 ? (
            // Empty state
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Clock size={32} className="text-gray-400" />
              </div>
              <h3 className="text-gray-700 font-medium mb-1">No saved analyses</h3>
              <p className="text-gray-500 text-sm">
                Your analyzed businesses will appear here after you run an analysis.
              </p>
            </div>
          ) : (
            // Saved searches list
            <div className="p-4 space-y-2">
              {savedSearches.map((search) => {
                const isActive = currentSearchKey === search.searchKey;
                return (
                  <button
                    key={search.searchKey}
                    onClick={() => {
                      // Navigate to history page to view without rerunning API
                      router.push('/history');
                      onClose();
                    }}
                    className={`w-full text-left p-4 rounded-lg border transition-all ${
                      isActive
                        ? 'bg-violet-500/10 border-violet-500/30 ring-1 ring-violet-500/20'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-900 font-medium truncate">{search.niche}</span>
                          {isActive && (
                            <span className="px-1.5 py-0.5 text-[11px] font-medium bg-violet-500/20 text-violet-400 rounded">
                              Current
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-500">
                          <MapPin size={14} />
                          <span className="truncate">{search.location}</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm font-medium text-gray-700">
                          {search.businessCount} businesses
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {formatDate(search.analyzedAt)}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {savedSearches.length > 0 && (
          <div className="border-t border-gray-200 p-4">
            {showClearConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 flex-1">Clear all history?</span>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearHistory}
                  className="px-3 py-1.5 text-sm bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                >
                  Clear All
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <Trash2 size={16} />
                Clear History
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
