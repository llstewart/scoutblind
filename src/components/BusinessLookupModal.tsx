'use client';

import { useState } from 'react';
import { Search, Loader2, Sparkles, Lock, Phone, Globe, Check, Download } from 'lucide-react';
import { Modal } from './ui/Modal';
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

  const headerContent = (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
        <Search size={20} className="text-violet-400" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Business Lookup</h2>
        <p className="text-sm text-gray-500">Search for a specific business</p>
      </div>
    </div>
  );

  return (
    <Modal open={isOpen} onClose={handleClose} size="md" customHeader={headerContent}>
      <div className="pb-6">
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
                className="w-full py-3 bg-violet-600 hover:bg-violet-500 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 active:scale-[0.97]"
              >
                {state === 'searching' ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search size={16} />
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
                        <Loader2 size={16} className="animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        Get Lead Intel
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={onUpgradeClick}
                    className="flex-1 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Lock size={16} />
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
                    <div className="text-[11px] uppercase tracking-wider opacity-80">{getScoreLabel(seoScore)}</div>
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
                            <span className={`inline-block px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider rounded-lg mb-1 ${colors.bg} ${colors.text}`}>
                              {SIGNAL_CATEGORY_LABELS[group.category]}
                            </span>
                            <div className="flex flex-wrap gap-1 ml-1">
                              {group.signals.map((signal, i) => (
                                <span
                                  key={i}
                                  className={`px-2 py-1 text-xs rounded-lg ${colors.bg} ${colors.text}`}
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
                          <Phone size={16} className="text-gray-400" />
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
                          <Globe size={16} />
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
                        <Check size={16} />
                        Saved
                      </>
                    ) : isSaving ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Download size={16} />
                        Save to History
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
      </div>
    </Modal>
  );
}
