'use client';

import { useState, useRef } from 'react';
import { SearchForm } from '@/components/SearchForm';
import { GeneralListTable } from '@/components/GeneralListTable';
import { UpgradedListTable } from '@/components/UpgradedListTable';
import { LoadingState } from '@/components/LoadingState';
import { Business, EnrichedBusiness } from '@/lib/types';

type TabType = 'general' | 'upgraded';

export default function Home() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [enrichedBusinesses, setEnrichedBusinesses] = useState<EnrichedBusiness[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useState<{ niche: string; location: string } | null>(null);

  // AbortController refs to cancel pending requests
  const searchControllerRef = useRef<AbortController | null>(null);
  const analyzeControllerRef = useRef<AbortController | null>(null);

  const handleSearch = async (niche: string, location: string) => {
    // Cancel any pending search or analyze requests
    if (searchControllerRef.current) {
      searchControllerRef.current.abort();
    }
    if (analyzeControllerRef.current) {
      analyzeControllerRef.current.abort();
    }

    // Create new abort controller for this request
    const controller = new AbortController();
    searchControllerRef.current = controller;

    setIsSearching(true);
    setIsAnalyzing(false); // Stop any analyzing state
    setError(null);
    setBusinesses([]);
    setEnrichedBusinesses([]);
    setSearchParams({ niche, location });

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche, location }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Search failed');
      }

      const data = await response.json();
      setBusinesses(data.businesses);
      setActiveTab('general');
    } catch (err) {
      // Don't show error if request was aborted (user started new search)
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsSearching(false);
    }
  };

  // Enhanced progress tracking with phases
  const [analyzeProgress, setAnalyzeProgress] = useState<{
    completed: number;
    total: number;
    phase?: number;
    totalPhases?: number;
    message?: string;
    isBackground?: boolean;
    firstPageComplete?: boolean;
  } | null>(null);

  const handleAnalyze = async () => {
    if (!searchParams || businesses.length === 0) return;

    // Cancel any pending analyze request
    if (analyzeControllerRef.current) {
      analyzeControllerRef.current.abort();
    }

    // Create new abort controller for this request
    const controller = new AbortController();
    analyzeControllerRef.current = controller;

    setIsAnalyzing(true);
    setError(null);
    setEnrichedBusinesses([]); // Clear previous results
    setAnalyzeProgress({ completed: 0, total: businesses.length, phase: 1, totalPhases: 3, message: 'Starting analysis...' });
    setActiveTab('upgraded'); // Switch to upgraded tab immediately to show progress

    try {
      const response = await fetch('/api/analyze-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businesses,
          niche: searchParams.niche,
          location: searchParams.location,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      // Read the SSE stream
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE messages
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || ''; // Keep incomplete message in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === 'status') {
                // Update status message and phase
                setAnalyzeProgress(prev => ({
                  completed: prev?.completed || 0,
                  total: prev?.total || businesses.length,
                  phase: data.phase,
                  totalPhases: data.totalPhases,
                  message: data.message,
                  isBackground: data.isBackground || false,
                  firstPageComplete: prev?.firstPageComplete || false,
                }));
              } else if (data.type === 'progress') {
                // Update progress during review fetching
                setAnalyzeProgress(prev => ({
                  completed: data.completed,
                  total: data.total,
                  phase: data.phase || prev?.phase,
                  totalPhases: prev?.totalPhases || 3,
                  message: data.message,
                  isBackground: data.isBackground || prev?.isBackground || false,
                  firstPageComplete: prev?.firstPageComplete || false,
                }));
              } else if (data.type === 'first_page_complete') {
                // First 20 results are ready - user can start browsing
                setAnalyzeProgress(prev => ({
                  completed: data.count,
                  total: data.total,
                  phase: 3,
                  totalPhases: 3,
                  message: data.message,
                  isBackground: data.hasMore,
                  firstPageComplete: true,
                }));
              } else if (data.type === 'business') {
                // Add business to list as it arrives
                setEnrichedBusinesses(prev => [...prev, data.business]);
                setAnalyzeProgress(prev => ({
                  completed: data.progress.completed,
                  total: data.progress.total,
                  phase: 3,
                  totalPhases: 3,
                  message: prev?.firstPageComplete
                    ? `Loading more: ${data.progress.completed}/${data.progress.total}`
                    : `Processed ${data.progress.completed}/${data.progress.total} businesses`,
                  isBackground: prev?.isBackground || false,
                  firstPageComplete: prev?.firstPageComplete || false,
                }));
              } else if (data.type === 'error') {
                setError(data.message);
              } else if (data.type === 'complete') {
                setAnalyzeProgress(null);
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', e);
            }
          }
        }
      }
    } catch (err) {
      // Don't show error if request was aborted (user started new search)
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsAnalyzing(false);
      setAnalyzeProgress(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight text-black mb-3">
          Locus
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Market intelligence for SEO agencies. Find businesses with high propensity to buy through Hidden Signals analysis.
        </p>
      </div>

      {/* Search Form */}
      <div className="mb-12">
        <SearchForm onSearch={handleSearch} isLoading={isSearching} />
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center">
          {error}
        </div>
      )}

      {/* Loading States */}
      {isSearching && (
        <LoadingState message="Searching Google Maps for businesses..." />
      )}

      {/* Progress bar for streaming analysis */}
      {isAnalyzing && analyzeProgress && (
        <div className={`mb-6 p-4 rounded-lg border transition-all ${
          analyzeProgress.firstPageComplete
            ? 'bg-green-50 border-green-200'
            : 'bg-blue-50 border-blue-200'
        }`}>
          {/* First page complete banner */}
          {analyzeProgress.firstPageComplete && analyzeProgress.isBackground && (
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-green-200">
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm font-medium text-green-700">
                First page ready! You can start browsing while more results load.
              </span>
            </div>
          )}

          {/* Phase indicator - hide when in background mode */}
          {analyzeProgress.phase && analyzeProgress.totalPhases && !analyzeProgress.firstPageComplete && (
            <div className="flex items-center gap-2 mb-3">
              {[1, 2, 3].map((phase) => (
                <div key={phase} className="flex items-center gap-1">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                      phase < (analyzeProgress.phase || 0)
                        ? 'bg-green-500 text-white'
                        : phase === analyzeProgress.phase
                        ? 'bg-blue-600 text-white animate-pulse'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {phase < (analyzeProgress.phase || 0) ? '✓' : phase}
                  </div>
                  <span className={`text-xs hidden sm:inline ${
                    phase === analyzeProgress.phase ? 'text-blue-700 font-medium' : 'text-gray-500'
                  }`}>
                    {phase === 1 ? 'Visibility' : phase === 2 ? 'Reviews' : 'Analysis'}
                  </span>
                  {phase < 3 && (
                    <div className={`w-8 h-0.5 ${
                      phase < (analyzeProgress.phase || 0) ? 'bg-green-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-medium ${
              analyzeProgress.firstPageComplete ? 'text-green-700' : 'text-blue-700'
            }`}>
              {analyzeProgress.message || 'Analyzing businesses for Hidden Signals...'}
            </span>
            <span className={`text-sm ${
              analyzeProgress.firstPageComplete ? 'text-green-600' : 'text-blue-600'
            }`}>
              {analyzeProgress.completed}/{analyzeProgress.total}
            </span>
          </div>
          <div className={`w-full rounded-full h-2 ${
            analyzeProgress.firstPageComplete ? 'bg-green-200' : 'bg-blue-200'
          }`}>
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                analyzeProgress.firstPageComplete ? 'bg-green-500' : 'bg-blue-600'
              }`}
              style={{ width: `${(analyzeProgress.completed / analyzeProgress.total) * 100}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className={`text-xs ${
              analyzeProgress.firstPageComplete ? 'text-green-600' : 'text-blue-600'
            }`}>
              {analyzeProgress.firstPageComplete
                ? 'Background loading - results will appear automatically'
                : 'Results appear as they complete - no need to wait!'}
            </p>
            {analyzeProgress.phase === 2 && !analyzeProgress.firstPageComplete && (
              <p className="text-xs text-blue-500">
                Fetching review data with retry protection...
              </p>
            )}
          </div>
        </div>
      )}

      {/* Results - show even while analyzing to display progressive results */}
      {!isSearching && businesses.length > 0 && (
        <div>
          {/* Tab Navigation */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
              <button
                onClick={() => setActiveTab('general')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  activeTab === 'general'
                    ? 'bg-white text-black shadow-sm'
                    : 'text-gray-600 hover:text-black'
                }`}
              >
                General List ({businesses.length})
              </button>
              <button
                onClick={() => setActiveTab('upgraded')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  activeTab === 'upgraded'
                    ? 'bg-white text-black shadow-sm'
                    : 'text-gray-600 hover:text-black'
                }`}
              >
                Upgraded List ({enrichedBusinesses.length})
              </button>
            </div>

            {/* Analyze Button */}
            {activeTab === 'general' && businesses.length > 0 && (
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Analyze for Hidden Signals
              </button>
            )}
          </div>

          {/* Table Container */}
          <div className="bg-white border border-gray-200 rounded-lg">
            {activeTab === 'general' ? (
              <GeneralListTable businesses={businesses} />
            ) : (
              <UpgradedListTable
                businesses={enrichedBusinesses}
                niche={searchParams?.niche}
                location={searchParams?.location}
                isLoadingMore={isAnalyzing && analyzeProgress?.firstPageComplete}
                expectedTotal={analyzeProgress?.total || businesses.length}
              />
            )}
          </div>

          {/* Results Summary */}
          <div className="mt-4 text-center text-sm text-gray-500">
            {activeTab === 'general' ? (
              <span>
                Found {businesses.length} businesses for &quot;{searchParams?.niche}&quot; in {searchParams?.location}
              </span>
            ) : (
              <span>
                Analyzed {enrichedBusinesses.length} businesses with Hidden Signals
              </span>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isSearching && !isAnalyzing && businesses.length === 0 && !error && (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Start Your Search
          </h3>
          <p className="text-gray-500 max-w-sm mx-auto">
            Enter a business niche and location to find leads with high propensity to buy SEO services.
          </p>
        </div>
      )}
    </div>
  );
}
