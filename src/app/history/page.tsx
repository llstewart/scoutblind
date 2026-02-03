'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { AuthModal } from '@/components/auth/AuthModal';
import { UserMenu } from '@/components/auth/UserMenu';
import { SettingsModal } from '@/components/SettingsModal';
import { EnrichedBusiness, isEnrichedBusiness } from '@/lib/types';
import { calculateSeoNeedScore, getSeoNeedSummary, getDormancyStatus } from '@/lib/signals';
import { StatusTag } from '@/components/StatusTag';

interface SavedAnalysis {
  searchKey: string;
  niche: string;
  location: string;
  businesses: EnrichedBusiness[];
  analyzedAt: string;
}

export default function HistoryPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading, credits, tier, subscription } = useUser();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [savedAnalyses, setSavedAnalyses] = useState<SavedAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAnalysis, setSelectedAnalysis] = useState<SavedAnalysis | null>(null);

  // Check if user has a paid subscription
  const isPaidSubscriber = !!subscription && subscription.tier !== 'free';

  const loadSavedAnalyses = useCallback(async () => {
    // Only load for paid subscribers
    if (!isPaidSubscriber) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Get session ID for anonymous users
      const sessionId = localStorage.getItem('truesignal_sid') || '';
      const response = await fetch(`/api/session?sessionId=${encodeURIComponent(sessionId)}`);

      if (response.ok) {
        const data = await response.json();
        const analyses = data.analyses || {};

        const analysesList: SavedAnalysis[] = Object.entries(analyses)
          .map(([key, value]: [string, any]) => {
            // Filter to only include actually enriched businesses
            const allBusinesses = value.businesses || [];
            const enrichedBusinesses = allBusinesses.filter((b: any) => isEnrichedBusiness(b));
            return {
              searchKey: key,
              niche: value.niche,
              location: value.location,
              businesses: enrichedBusinesses,
              analyzedAt: value.analyzedAt,
            };
          })
          // Only include analyses that have at least one enriched business
          .filter(analysis => analysis.businesses.length > 0);

        // Sort by most recent first
        analysesList.sort(
          (a, b) => new Date(b.analyzedAt).getTime() - new Date(a.analyzedAt).getTime()
        );

        setSavedAnalyses(analysesList);

        // Auto-select first analysis if available
        if (analysesList.length > 0 && !selectedAnalysis) {
          setSelectedAnalysis(analysesList[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load saved analyses:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedAnalysis, isPaidSubscriber]);

  // Load saved analyses on mount and when user/subscription changes
  useEffect(() => {
    if (!isAuthLoading) {
      loadSavedAnalyses();
    }
  }, [loadSavedAnalyses, isAuthLoading]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // Higher SEO need score = more opportunity (needs help)
  const getSignalColor = (score: number) => {
    if (score >= 70) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    if (score >= 40) return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    return 'bg-zinc-700 text-zinc-400 border-zinc-600';
  };

  const [sortByPriority, setSortByPriority] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  // Reset page when analysis changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedAnalysis?.searchKey]);

  return (
    <div className="min-h-screen bg-[#0a0a0b]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0b]/95 backdrop-blur-sm border-b border-zinc-800/50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
                className="text-xl font-bold text-white hover:text-violet-400 transition-colors"
              >
                TrueSignal<span className="text-violet-500">.</span>
              </button>
              <span className="text-zinc-600">/</span>
              <h1 className="text-lg font-medium text-zinc-300">Saved Analyses</h1>

              {/* Back to Dashboard button */}
              <button
                onClick={() => router.push('/')}
                className="ml-4 flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-600 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="hidden sm:inline">Dashboard</span>
              </button>
            </div>

            {isAuthLoading ? (
              <div className="w-8 h-8 rounded-full bg-zinc-800 animate-pulse" />
            ) : user ? (
              <UserMenu
                user={user}
                credits={credits}
                tier={tier}
                onOpenBilling={() => {}}
                onOpenSettings={() => setShowSettingsModal(true)}
              />
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-4 py-2 text-sm font-medium bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {isAuthLoading ? (
          // Auth loading state
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-zinc-500 text-sm">Loading...</p>
            </div>
          </div>
        ) : !user ? (
          // Not logged in state
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Sign in required</h2>
            <p className="text-zinc-500 mb-6 max-w-md">
              Sign in to view your saved SEO analyses.
            </p>
            <button
              onClick={() => setShowAuthModal(true)}
              className="px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-medium transition-colors"
            >
              Sign In
            </button>
          </div>
        ) : !isPaidSubscriber ? (
          // Free tier - needs to upgrade
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-violet-500/10 rounded-full flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Upgrade to Access Saved Analyses</h2>
            <p className="text-zinc-500 mb-6 max-w-md">
              Saved SEO analyses are a premium feature. Upgrade to a paid plan to save and view your detailed SEO signal analyses.
            </p>
            <button
              onClick={() => router.push('/?upgrade=true')}
              className="px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-medium transition-colors"
            >
              View Plans
            </button>
          </div>
        ) : isLoading ? (
          // Loading state
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-zinc-500 text-sm">Loading saved analyses...</p>
            </div>
          </div>
        ) : savedAnalyses.length === 0 ? (
          // Empty state
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">No saved analyses yet</h2>
            <p className="text-zinc-500 mb-6 max-w-md">
              Run an analysis on the main page to save businesses here. Your analyzed data will be stored permanently in your account.
            </p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-medium transition-colors"
            >
              Start Searching
            </button>
          </div>
        ) : (
          // Main content - responsive layout (stacks on mobile)
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
            {/* Left sidebar - Analysis list (horizontal scroll on mobile) */}
            <div className="w-full lg:w-80 flex-shrink-0">
              <div className="lg:sticky lg:top-24">
                <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">
                  Your Searches ({savedAnalyses.length})
                </h2>
                {/* Horizontal scroll on mobile, vertical on desktop */}
                <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible lg:max-h-[calc(100vh-180px)] lg:overflow-y-auto pb-2 lg:pb-0 lg:pr-2 -mx-4 px-4 lg:mx-0 lg:px-0">
                  {savedAnalyses.map((analysis) => (
                    <button
                      key={analysis.searchKey}
                      onClick={() => setSelectedAnalysis(analysis)}
                      className={`flex-shrink-0 w-64 lg:w-full text-left p-3 lg:p-4 rounded-lg border transition-all ${
                        selectedAnalysis?.searchKey === analysis.searchKey
                          ? 'bg-violet-500/10 border-violet-500/30 ring-1 ring-violet-500/20'
                          : 'bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800/50 hover:border-zinc-700'
                      }`}
                    >
                      <div className="font-medium text-white truncate text-sm lg:text-base">{analysis.niche}</div>
                      <div className="flex items-center gap-1.5 mt-1 text-xs lg:text-sm text-zinc-400">
                        <svg className="w-3 lg:w-3.5 h-3 lg:h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        <span className="truncate">{analysis.location}</span>
                      </div>
                      <div className="flex items-center justify-between mt-2 text-[10px] lg:text-xs">
                        <span className="text-zinc-500">{analysis.businesses.length} businesses</span>
                        <span className="text-zinc-600 hidden sm:inline">{formatDate(analysis.analyzedAt)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right content - Business details */}
            <div className="flex-1 min-w-0">
              {selectedAnalysis ? (
                <div>
                  {/* Header */}
                  <div className="mb-4 lg:mb-6">
                    <h2 className="text-xl lg:text-2xl font-bold text-white">{selectedAnalysis.niche}</h2>
                    <p className="text-zinc-400 mt-1 text-sm lg:text-base">
                      {selectedAnalysis.location} · {selectedAnalysis.businesses.length} businesses
                    </p>
                    <p className="text-zinc-600 text-xs lg:text-sm mt-1">
                      {formatDate(selectedAnalysis.analyzedAt)}
                    </p>
                  </div>

                  {/* Stats summary - responsive grid */}
                  <div className="grid grid-cols-3 gap-2 lg:gap-4 mb-4 lg:mb-6">
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-2 lg:p-4">
                      <div className="text-lg lg:text-2xl font-bold text-emerald-400">
                        {selectedAnalysis.businesses.filter(b => calculateSeoNeedScore(b) >= 70).length}
                      </div>
                      <div className="text-[10px] lg:text-sm text-zinc-500">High Need</div>
                    </div>
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-2 lg:p-4">
                      <div className="text-lg lg:text-2xl font-bold text-amber-400">
                        {selectedAnalysis.businesses.filter(b => {
                          const score = calculateSeoNeedScore(b);
                          return score >= 40 && score < 70;
                        }).length}
                      </div>
                      <div className="text-[10px] lg:text-sm text-zinc-500">Medium Need</div>
                    </div>
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-2 lg:p-4">
                      <div className="text-lg lg:text-2xl font-bold text-zinc-400">
                        {selectedAnalysis.businesses.filter(b => calculateSeoNeedScore(b) < 40).length}
                      </div>
                      <div className="text-[10px] lg:text-sm text-zinc-500">Low Need</div>
                    </div>
                  </div>

                  {/* Sort toggle */}
                  <div className="flex items-center justify-between mb-4 px-1">
                    <span className="text-sm text-zinc-500">
                      {selectedAnalysis.businesses.length} businesses
                    </span>
                    <button
                      onClick={() => setSortByPriority(!sortByPriority)}
                      className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                        sortByPriority
                          ? 'bg-violet-600 text-white'
                          : 'bg-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                      </svg>
                      {sortByPriority ? 'Sorted by Priority' : 'Sort by Priority'}
                    </button>
                  </div>

                  {/* Business table */}
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-full">
                        <thead className="bg-zinc-800/50 border-b border-zinc-700">
                          <tr>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                              Business
                            </th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                              SEO Score
                            </th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider hidden sm:table-cell">
                              Signals
                            </th>
                            <th className="text-center px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider hidden md:table-cell">
                              Rating
                            </th>
                            <th className="text-center px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider hidden md:table-cell">
                              Reviews
                            </th>
                            <th className="text-center px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider hidden lg:table-cell">
                              Response
                            </th>
                            <th className="text-center px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider hidden lg:table-cell">
                              Visibility
                            </th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider hidden xl:table-cell">
                              Tech
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                          {(() => {
                            const sortedBusinesses = sortByPriority
                              ? [...selectedAnalysis.businesses].sort((a, b) => calculateSeoNeedScore(b) - calculateSeoNeedScore(a))
                              : selectedAnalysis.businesses;

                            const totalPages = Math.ceil(sortedBusinesses.length / ITEMS_PER_PAGE);
                            const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
                            const paginatedBusinesses = sortedBusinesses.slice(startIndex, startIndex + ITEMS_PER_PAGE);

                            return paginatedBusinesses.map((business, index) => {
                              const seoScore = calculateSeoNeedScore(business);
                              const signals = getSeoNeedSummary(business);

                              return (
                                <tr
                                  key={business.placeId || business.name}
                                  className="hover:bg-zinc-800/30 transition-colors"
                                >
                                  {/* Business name & address */}
                                  <td className="px-4 py-3">
                                    <div className="flex flex-col">
                                      <span className="text-sm font-medium text-white truncate max-w-[200px]">
                                        {business.name}
                                      </span>
                                      <span className="text-xs text-zinc-500 truncate max-w-[200px]">
                                        {business.address}
                                      </span>
                                      {business.website && (
                                        <a
                                          href={business.website.startsWith('http') ? business.website : `https://${business.website}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-xs text-violet-400 hover:text-violet-300 truncate max-w-[200px] mt-0.5"
                                        >
                                          {business.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                                        </a>
                                      )}
                                    </div>
                                  </td>

                                  {/* SEO Score */}
                                  <td className="px-4 py-3">
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${getSignalColor(seoScore)}`}>
                                      {seoScore}
                                    </span>
                                  </td>

                                  {/* Signals */}
                                  <td className="px-4 py-3 hidden sm:table-cell">
                                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                                      {signals.length > 0 ? (
                                        signals.slice(0, 2).map((signal, i) => (
                                          <span
                                            key={i}
                                            className="px-1.5 py-0.5 text-[10px] bg-rose-500/10 text-rose-400 rounded border border-rose-500/20 whitespace-nowrap"
                                          >
                                            {signal}
                                          </span>
                                        ))
                                      ) : (
                                        <span className="text-xs text-emerald-400">Well optimized</span>
                                      )}
                                      {signals.length > 2 && (
                                        <span className="px-1.5 py-0.5 text-[10px] bg-zinc-700 text-zinc-400 rounded">
                                          +{signals.length - 2}
                                        </span>
                                      )}
                                    </div>
                                  </td>

                                  {/* Rating */}
                                  <td className="px-4 py-3 text-center hidden md:table-cell">
                                    <span className="text-sm text-zinc-300">
                                      {business.rating ? `${business.rating}★` : '—'}
                                    </span>
                                  </td>

                                  {/* Reviews */}
                                  <td className="px-4 py-3 text-center hidden md:table-cell">
                                    <span className="text-sm text-zinc-300">
                                      {business.reviewCount || 0}
                                    </span>
                                  </td>

                                  {/* Response Rate */}
                                  <td className="px-4 py-3 text-center hidden lg:table-cell">
                                    <StatusTag status={
                                      business.responseRate >= 70 ? 'success' :
                                      business.responseRate >= 30 ? 'warning' : 'error'
                                    }>
                                      {business.responseRate}%
                                    </StatusTag>
                                  </td>

                                  {/* Search Visibility */}
                                  <td className="px-4 py-3 text-center hidden lg:table-cell">
                                    <StatusTag status={business.searchVisibility ? 'success' : 'error'}>
                                      {business.searchVisibility ? 'Ranked' : 'Not Ranked'}
                                    </StatusTag>
                                  </td>

                                  {/* Website Tech */}
                                  <td className="px-4 py-3 hidden xl:table-cell">
                                    <div className="flex items-center gap-1">
                                      <span className="text-xs text-zinc-400 truncate max-w-[100px]">
                                        {business.websiteTech || '—'}
                                      </span>
                                      {business.seoOptimized && (
                                        <StatusTag status="success">SEO</StatusTag>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            });
                          })()}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {selectedAnalysis.businesses.length > ITEMS_PER_PAGE && (
                      <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800 bg-zinc-900/30">
                        <span className="text-xs text-zinc-500">
                          Page {currentPage} of {Math.ceil(selectedAnalysis.businesses.length / ITEMS_PER_PAGE)}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-2 py-1 text-xs font-medium rounded border border-zinc-700 text-zinc-400 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Previous
                          </button>
                          <button
                            onClick={() => setCurrentPage(p => Math.min(Math.ceil(selectedAnalysis.businesses.length / ITEMS_PER_PAGE), p + 1))}
                            disabled={currentPage >= Math.ceil(selectedAnalysis.businesses.length / ITEMS_PER_PAGE)}
                            className="px-2 py-1 text-xs font-medium rounded border border-zinc-700 text-zinc-400 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-96 text-zinc-500">
                  Select an analysis from the left to view details
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultMode="signin"
      />

      {/* Settings Modal */}
      {user && (
        <SettingsModal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          user={user}
        />
      )}
    </div>
  );
}
