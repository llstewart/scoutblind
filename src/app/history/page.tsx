'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { AuthModal } from '@/components/auth/AuthModal';
import { UserMenu } from '@/components/auth/UserMenu';
import { EnrichedBusiness } from '@/lib/types';
import { calculateSeoNeedScore, getSeoNeedSummary } from '@/lib/signals';

interface SavedAnalysis {
  searchKey: string;
  niche: string;
  location: string;
  businesses: EnrichedBusiness[];
  analyzedAt: string;
}

export default function HistoryPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading, credits, tier } = useUser();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [savedAnalyses, setSavedAnalyses] = useState<SavedAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAnalysis, setSelectedAnalysis] = useState<SavedAnalysis | null>(null);
  const [expandedBusinesses, setExpandedBusinesses] = useState<Set<string>>(new Set());

  const loadSavedAnalyses = useCallback(async () => {
    setIsLoading(true);
    try {
      // Get session ID for anonymous users
      const sessionId = localStorage.getItem('truesignal_sid') || '';
      const response = await fetch(`/api/session?sessionId=${encodeURIComponent(sessionId)}`);

      if (response.ok) {
        const data = await response.json();
        const analyses = data.analyses || {};

        const analysesList: SavedAnalysis[] = Object.entries(analyses).map(
          ([key, value]: [string, any]) => ({
            searchKey: key,
            niche: value.niche,
            location: value.location,
            businesses: value.businesses || [],
            analyzedAt: value.analyzedAt,
          })
        );

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
  }, [selectedAnalysis]);

  // Load saved analyses on mount and when user changes
  useEffect(() => {
    loadSavedAnalyses();
  }, [loadSavedAnalyses]);

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

  const getSignalLabel = (score: number) => {
    if (score >= 70) return 'High Need';
    if (score >= 40) return 'Medium Need';
    return 'Low Need';
  };

  const toggleBusinessExpanded = (businessId: string) => {
    setExpandedBusinesses(prev => {
      const next = new Set(prev);
      if (next.has(businessId)) {
        next.delete(businessId);
      } else {
        next.add(businessId);
      }
      return next;
    });
  };

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
            </div>

            {isAuthLoading ? (
              <div className="w-8 h-8 rounded-full bg-zinc-800 animate-pulse" />
            ) : user ? (
              <UserMenu
                user={user}
                credits={credits}
                tier={tier}
                onOpenBilling={() => {}}
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
        {isLoading ? (
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
              Run an analysis on the main page to save businesses here. Your analyzed data will be stored
              {user ? ' permanently in your account.' : ' for 7 days. Sign in to save permanently.'}
            </p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-medium transition-colors"
            >
              Start Searching
            </button>
          </div>
        ) : (
          // Main content - two column layout
          <div className="flex gap-6">
            {/* Left sidebar - Analysis list */}
            <div className="w-80 flex-shrink-0">
              <div className="sticky top-24">
                <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">
                  Your Searches ({savedAnalyses.length})
                </h2>
                <div className="space-y-2 max-h-[calc(100vh-180px)] overflow-y-auto pr-2">
                  {savedAnalyses.map((analysis) => (
                    <button
                      key={analysis.searchKey}
                      onClick={() => setSelectedAnalysis(analysis)}
                      className={`w-full text-left p-4 rounded-lg border transition-all ${
                        selectedAnalysis?.searchKey === analysis.searchKey
                          ? 'bg-violet-500/10 border-violet-500/30 ring-1 ring-violet-500/20'
                          : 'bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800/50 hover:border-zinc-700'
                      }`}
                    >
                      <div className="font-medium text-white truncate">{analysis.niche}</div>
                      <div className="flex items-center gap-1.5 mt-1 text-sm text-zinc-400">
                        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        <span className="truncate">{analysis.location}</span>
                      </div>
                      <div className="flex items-center justify-between mt-2 text-xs">
                        <span className="text-zinc-500">{analysis.businesses.length} businesses</span>
                        <span className="text-zinc-600">{formatDate(analysis.analyzedAt)}</span>
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
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-white">{selectedAnalysis.niche}</h2>
                    <p className="text-zinc-400 mt-1">
                      {selectedAnalysis.location} &bull; {selectedAnalysis.businesses.length} businesses analyzed
                    </p>
                    <p className="text-zinc-600 text-sm mt-1">
                      Analyzed on {formatDate(selectedAnalysis.analyzedAt)}
                    </p>
                  </div>

                  {/* Stats summary */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                      <div className="text-2xl font-bold text-emerald-400">
                        {selectedAnalysis.businesses.filter(b => calculateSeoNeedScore(b) >= 70).length}
                      </div>
                      <div className="text-sm text-zinc-500">High SEO Need</div>
                    </div>
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                      <div className="text-2xl font-bold text-amber-400">
                        {selectedAnalysis.businesses.filter(b => {
                          const score = calculateSeoNeedScore(b);
                          return score >= 40 && score < 70;
                        }).length}
                      </div>
                      <div className="text-sm text-zinc-500">Medium SEO Need</div>
                    </div>
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                      <div className="text-2xl font-bold text-zinc-400">
                        {selectedAnalysis.businesses.filter(b => calculateSeoNeedScore(b) < 40).length}
                      </div>
                      <div className="text-sm text-zinc-500">Low SEO Need</div>
                    </div>
                  </div>

                  {/* Business list */}
                  <div className="space-y-3">
                    {selectedAnalysis.businesses
                      .sort((a, b) => calculateSeoNeedScore(b) - calculateSeoNeedScore(a))
                      .map((business) => {
                        const businessId = business.placeId || business.name;
                        const isExpanded = expandedBusinesses.has(businessId);
                        const seoScore = calculateSeoNeedScore(business);
                        const signals = getSeoNeedSummary(business);

                        return (
                          <div
                            key={businessId}
                            className="bg-zinc-900/50 border border-zinc-800 rounded-lg overflow-hidden"
                          >
                            {/* Business header - always visible */}
                            <button
                              onClick={() => toggleBusinessExpanded(businessId)}
                              className="w-full p-4 text-left hover:bg-zinc-800/30 transition-colors"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-3">
                                    <h3 className="font-medium text-white truncate">{business.name}</h3>
                                    <span className={`px-2 py-0.5 text-xs font-medium rounded border ${getSignalColor(seoScore)}`}>
                                      {seoScore}/100 - {getSignalLabel(seoScore)}
                                    </span>
                                  </div>
                                  <p className="text-sm text-zinc-500 mt-1 truncate">{business.address}</p>
                                </div>
                                <svg
                                  className={`w-5 h-5 text-zinc-500 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                            </button>

                            {/* Expanded details */}
                            {isExpanded && (
                              <div className="px-4 pb-4 border-t border-zinc-800/50">
                                <div className="grid grid-cols-2 gap-4 mt-4">
                                  {/* Contact Info */}
                                  <div>
                                    <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Contact</h4>
                                    <div className="space-y-2">
                                      {business.phone && (
                                        <div className="flex items-center gap-2 text-sm">
                                          <svg className="w-4 h-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                          </svg>
                                          <a href={`tel:${business.phone}`} className="text-zinc-300 hover:text-white">
                                            {business.phone}
                                          </a>
                                        </div>
                                      )}
                                      {business.website && (
                                        <div className="flex items-center gap-2 text-sm">
                                          <svg className="w-4 h-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                          </svg>
                                          <a
                                            href={business.website.startsWith('http') ? business.website : `https://${business.website}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-violet-400 hover:text-violet-300 truncate"
                                          >
                                            {business.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                                          </a>
                                        </div>
                                      )}
                                      <div className="flex items-center gap-2 text-sm">
                                        <svg className="w-4 h-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        <span className="text-zinc-400">{business.address}</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Signals */}
                                  <div>
                                    <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Signals</h4>
                                    <div className="space-y-2">
                                      <div className="flex items-center justify-between text-sm">
                                        <span className="text-zinc-500">Rating</span>
                                        <span className="text-zinc-300">
                                          {business.rating ? `${business.rating} / 5` : 'N/A'}
                                        </span>
                                      </div>
                                      <div className="flex items-center justify-between text-sm">
                                        <span className="text-zinc-500">Reviews</span>
                                        <span className="text-zinc-300">{business.reviewCount || 0}</span>
                                      </div>
                                      {business.lastReviewDate && (
                                        <div className="flex items-center justify-between text-sm">
                                          <span className="text-zinc-500">Last Review</span>
                                          <span className="text-zinc-300">
                                            {new Date(business.lastReviewDate).toLocaleDateString()}
                                          </span>
                                        </div>
                                      )}
                                      {business.responseRate !== undefined && (
                                        <div className="flex items-center justify-between text-sm">
                                          <span className="text-zinc-500">Response Rate</span>
                                          <span className="text-zinc-300">{business.responseRate}%</span>
                                        </div>
                                      )}
                                      {business.websiteTech && (
                                        <div className="flex items-center justify-between text-sm">
                                          <span className="text-zinc-500">Website Tech</span>
                                          <span className="text-zinc-300">{business.websiteTech}</span>
                                        </div>
                                      )}
                                      <div className="flex items-center justify-between text-sm">
                                        <span className="text-zinc-500">SEO Optimized</span>
                                        <span className={business.seoOptimized ? 'text-emerald-400' : 'text-zinc-500'}>
                                          {business.seoOptimized ? 'Yes' : 'No'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* SEO Need Signals */}
                                {signals.length > 0 && (
                                  <div className="mt-4 pt-4 border-t border-zinc-800/50">
                                    <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
                                      Why This Business Needs SEO Help
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                      {signals.map((signal, i) => (
                                        <span
                                          key={i}
                                          className="px-2 py-1 text-xs bg-rose-500/10 text-rose-400 rounded border border-rose-500/20"
                                        >
                                          {signal}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
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
    </div>
  );
}
