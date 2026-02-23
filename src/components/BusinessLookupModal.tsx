'use client';

import { useState } from 'react';
import { Business, EnrichedBusiness, isEnrichedBusiness } from '@/lib/types';
import { StatusTag } from './StatusTag';
import { calculateSeoNeedScore, getSeoNeedSummary, SIGNAL_CATEGORY_COLORS, SIGNAL_CATEGORY_LABELS } from '@/lib/signals';
import { useUser } from '@/hooks/useUser';

interface BusinessLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
  isPremium: boolean;
  onUpgradeClick: () => void;
  onSaved?: () => void; // Callback when business is saved
}

type LookupState = 'idle' | 'searching' | 'found' | 'analyzing' | 'complete' | 'not-found' | 'error';

export function BusinessLookupModal({ isOpen, onClose, isPremium, onUpgradeClick, onSaved }: BusinessLookupModalProps) {
  const [businessName, setBusinessName] = useState('');
  const [location, setLocation] = useState('');
  const [state, setState] = useState<LookupState>('idle');
  const [foundBusiness, setFoundBusiness] = useState<Business | null>(null);
  const [enrichedBusiness, setEnrichedBusiness] = useState<EnrichedBusiness | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const { refreshUser, user, credits } = useUser();

  const handleSearch = async () => {
    if (!businessName.trim() || !location.trim()) return;

    setState('searching');
    setError(null);
    setFoundBusiness(null);
    setEnrichedBusiness(null);

    try {
      // Search for the specific business (costs 1 credit - server-side deduction)
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          niche: businessName.trim(),
          location: location.trim(),
          limit: 5, // Get a few results to find best match
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.insufficientCredits) {
          setError('Insufficient credits. Please purchase more.');
          setState('error');
          return;
        }
        throw new Error(errorData.error || 'Search failed');
      }

      const data = await response.json();
      const businesses: Business[] = data.businesses || [];

      // Refresh UI to show updated credits (server deducted 1 credit)
      if (!data.cached) {
        refreshUser();
      }

      if (businesses.length === 0) {
        setState('not-found');
        return;
      }

      // Find best match by name similarity
      const searchName = businessName.toLowerCase().trim();
      const bestMatch = businesses.find(b =>
        b.name.toLowerCase().includes(searchName) ||
        searchName.includes(b.name.toLowerCase())
      ) || businesses[0];

      setFoundBusiness(bestMatch);
      setState('found');

      // Auto-save the found business to library (general list)
      if (user && bestMatch) {
        try {
          await fetch('/api/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              niche: businessName.trim(),
              location: location.trim(),
              businesses: [bestMatch],
            }),
          });
          console.log('[Lookup] Auto-saved business to library');
          onSaved?.(); // Notify parent to refresh library
        } catch (saveErr) {
          console.error('[Lookup] Failed to auto-save:', saveErr);
        }
      }
    } catch (err) {
      console.error('Lookup error:', err);
      setError('Failed to search. Please try again.');
      setState('error');
    }
  };

  const handleGetIntel = async () => {
    if (!foundBusiness || !isPremium) return;

    setState('analyzing');
    setError(null);

    try {
      // Credits are now deducted server-side in /api/analyze-single
      const response = await fetch('/api/analyze-single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business: foundBusiness,
          niche: businessName.trim(),
          location: location.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.requiresUpgrade) {
          setError('Upgrade to unlock Lead Intel features');
          setState('found');
          return;
        }
        if (errorData.insufficientCredits) {
          setError(`Insufficient credits. You have ${errorData.creditsRemaining} but need ${errorData.creditsRequired}.`);
          setState('found');
          return;
        }
        throw new Error(errorData.error || 'Analysis failed');
      }

      const data = await response.json();
      setEnrichedBusiness(data.business);
      setState('complete');
      setIsSaved(true); // Mark as saved since we auto-save now

      // Refresh UI to show updated credits (server deducted 1 credit)
      refreshUser();

      // Auto-save the enriched business to library (merges with existing)
      if (user && data.business) {
        try {
          await fetch('/api/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              niche: businessName.trim(),
              location: location.trim(),
              businesses: [data.business],
            }),
          });
          console.log('[Lookup] Auto-saved enriched business to library');
          onSaved?.(); // Notify parent to refresh library
        } catch (saveErr) {
          console.error('[Lookup] Failed to auto-save enriched:', saveErr);
        }
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setError('Failed to analyze. Please try again.');
      setState('found');
    }
  };

  const handleSave = async () => {
    if (!enrichedBusiness || !user) return;

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          niche: businessName.trim(),
          location: location.trim(),
          businesses: [enrichedBusiness],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save');
      }

      setIsSaved(true);
      onSaved?.();
    } catch (err) {
      console.error('Save error:', err);
      setError('Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setBusinessName('');
    setLocation('');
    setState('idle');
    setFoundBusiness(null);
    setEnrichedBusiness(null);
    setError(null);
    onClose();
  };

  const handleReset = () => {
    setState('idle');
    setFoundBusiness(null);
    setEnrichedBusiness(null);
    setError(null);
    setIsSaved(false);
  };

  if (!isOpen) return null;

  const seoScore = enrichedBusiness ? calculateSeoNeedScore(enrichedBusiness) : 0;
  const categorizedSignals = enrichedBusiness ? getSeoNeedSummary(enrichedBusiness) : { groups: [], totalCount: 0 };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30';
    if (score >= 40) return 'text-amber-400 bg-amber-500/20 border-amber-500/30';
    return 'text-gray-500 bg-gray-200 border-gray-300';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 70) return 'High Opportunity';
    if (score >= 40) return 'Medium Opportunity';
    return 'Low Opportunity';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white rounded-xl elevation-3 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Business Lookup</h2>
              <p className="text-sm text-gray-500">Search for a specific business</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Search Form - always visible */}
          {(state === 'idle' || state === 'searching' || state === 'not-found' || state === 'error') && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">
                  Business Name
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g., Joe's Plumbing"
                  className="w-full px-4 py-3 bg-gray-50 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  disabled={state === 'searching'}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">
                  City / Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Austin, TX"
                  className="w-full px-4 py-3 bg-gray-50 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  disabled={state === 'searching'}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              {state === 'not-found' && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <p className="text-amber-400 text-sm font-medium">No business found</p>
                  <p className="text-amber-400/70 text-xs mt-1">
                    Try adjusting the business name or check the location spelling.
                  </p>
                </div>
              )}

              <button
                onClick={handleSearch}
                disabled={!businessName.trim() || !location.trim() || state === 'searching'}
                className="w-full py-3 bg-violet-600 hover:bg-violet-500 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {state === 'searching' ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Searching...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Find Business
                  </>
                )}
              </button>
            </div>
          )}

          {/* Found Business - Pre-Intel */}
          {(state === 'found' || state === 'analyzing') && foundBusiness && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{foundBusiness.name}</h3>
                    <p className="text-sm text-gray-500 mt-1 truncate">{foundBusiness.address}</p>
                    <div className="flex items-center gap-4 mt-3 text-sm">
                      {foundBusiness.rating > 0 && (
                        <span className="text-gray-500">{foundBusiness.rating}★</span>
                      )}
                      <span className="text-gray-500">{foundBusiness.reviewCount} reviews</span>
                      {foundBusiness.website && (
                        <a
                          href={foundBusiness.website.startsWith('http') ? foundBusiness.website : `https://${foundBusiness.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-violet-400 hover:text-violet-300 truncate max-w-[150px]"
                        >
                          {foundBusiness.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                        </a>
                      )}
                    </div>
                  </div>
                  <StatusTag status={foundBusiness.claimed ? 'success' : 'warning'}>
                    {foundBusiness.claimed ? 'Claimed' : 'Unclaimed'}
                  </StatusTag>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Credit cost indicator */}
              {isPremium && (
                <div className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg text-xs">
                  <span className="text-gray-500">Lead Intel cost</span>
                  <span className="text-gray-700">
                    1 credit <span className="text-gray-500">({credits} available)</span>
                  </span>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleReset}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors"
                >
                  Search Again
                </button>
                {isPremium ? (
                  <button
                    onClick={handleGetIntel}
                    disabled={state === 'analyzing' || credits < 1}
                    className="flex-1 py-3 bg-violet-600 hover:bg-violet-500 disabled:bg-violet-600/50 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {state === 'analyzing' ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        Get Lead Intel
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={onUpgradeClick}
                    className="flex-1 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Unlock Lead Intel
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Complete - With Intel */}
          {state === 'complete' && enrichedBusiness && (
            <div className="space-y-4">
              {/* Business Header with Score */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{enrichedBusiness.name}</h3>
                    <p className="text-sm text-gray-500 mt-1 truncate">{enrichedBusiness.address}</p>
                  </div>
                  <div className={`px-3 py-2 rounded-lg border text-center ${getScoreColor(seoScore)}`}>
                    <div className="text-2xl font-bold">{seoScore}</div>
                    <div className="text-[10px] uppercase tracking-wider opacity-80">{getScoreLabel(seoScore)}</div>
                  </div>
                </div>

                {/* Signals - Grouped by category */}
                {categorizedSignals.totalCount > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Opportunity Signals</p>
                    <div className="space-y-2">
                      {categorizedSignals.groups.map((group) => {
                        const colors = SIGNAL_CATEGORY_COLORS[group.category];
                        return (
                          <div key={group.category}>
                            <span className={`inline-block px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded mb-1 ${colors.bg} ${colors.text}`}>
                              {SIGNAL_CATEGORY_LABELS[group.category]}
                            </span>
                            <div className="flex flex-wrap gap-1 ml-1">
                              {group.signals.map((signal, i) => (
                                <span
                                  key={i}
                                  className={`px-2 py-1 text-xs rounded ${colors.bg} ${colors.text}`}
                                >
                                  {signal}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Intel Grid */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 bg-white rounded-lg">
                    <p className="text-gray-500 text-xs mb-1">Rating</p>
                    <p className="text-gray-900 font-medium">
                      {enrichedBusiness.rating ? `${enrichedBusiness.rating}★` : 'No rating'}
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-lg">
                    <p className="text-gray-500 text-xs mb-1">Reviews</p>
                    <p className="text-gray-900 font-medium">{enrichedBusiness.reviewCount || 0}</p>
                  </div>
                  <div className="p-3 bg-white rounded-lg">
                    <p className="text-gray-500 text-xs mb-1">Response Rate</p>
                    <p className="text-gray-900 font-medium">{enrichedBusiness.responseRate}%</p>
                  </div>
                  <div className="p-3 bg-white rounded-lg">
                    <p className="text-gray-500 text-xs mb-1">Search Rank</p>
                    <StatusTag status={enrichedBusiness.searchVisibility !== null ? 'success' : 'error'}>
                      {enrichedBusiness.searchVisibility !== null
                        ? `#${enrichedBusiness.searchVisibility}`
                        : 'Not in Top 20'}
                    </StatusTag>
                  </div>
                  <div className="p-3 bg-white rounded-lg">
                    <p className="text-gray-500 text-xs mb-1">Claim Status</p>
                    <StatusTag status={enrichedBusiness.claimed ? 'success' : 'warning'}>
                      {enrichedBusiness.claimed ? 'Claimed' : 'Unclaimed'}
                    </StatusTag>
                  </div>
                  <div className="p-3 bg-white rounded-lg">
                    <p className="text-gray-500 text-xs mb-1">Website Tech</p>
                    <p className="text-gray-900 font-medium text-xs truncate">
                      {enrichedBusiness.websiteTech || 'No website'}
                    </p>
                  </div>
                </div>

                {/* Contact Info */}
                {(enrichedBusiness.phone || enrichedBusiness.website) && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Contact</p>
                    <div className="space-y-2">
                      {enrichedBusiness.phone && (
                        <a
                          href={`tel:${enrichedBusiness.phone}`}
                          className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
                        >
                          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          {enrichedBusiness.phone}
                        </a>
                      )}
                      {enrichedBusiness.website && (
                        <a
                          href={enrichedBusiness.website.startsWith('http') ? enrichedBusiness.website : `https://${enrichedBusiness.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                          </svg>
                          {enrichedBusiness.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleReset}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors"
                >
                  Look Up Another
                </button>
                {user && (
                  <button
                    onClick={handleSave}
                    disabled={isSaving || isSaved}
                    className={`flex-1 py-3 font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${
                      isSaved
                        ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-violet-600 hover:bg-violet-500 disabled:bg-violet-600/50 text-white'
                    }`}
                  >
                    {isSaved ? (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Saved
                      </>
                    ) : isSaving ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Saving...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                        </svg>
                        Save to History
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
