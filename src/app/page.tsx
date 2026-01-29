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
    <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-16">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-foreground mb-6">
          Locus<span className="text-primary">.</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          Market intelligence for SEO & Google Business Profile agencies. Identify high-propensity leads hidden in plain sight.
        </p>

        {/* How it works - Easy to understand process */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12 max-w-4xl mx-auto">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg border border-primary/20">1</div>
            <span className="text-sm font-medium text-foreground">Target Niche</span>
          </div>
          <div className="hidden md:block w-16 h-[2px] bg-border" />
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg border border-primary/20">2</div>
            <span className="text-sm font-medium text-foreground">Scan Market</span>
          </div>
          <div className="hidden md:block w-16 h-[2px] bg-border" />
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg border border-primary/20">3</div>
            <span className="text-sm font-medium text-foreground">Find Signals</span>
          </div>
        </div>
      </div>

      {/* Search Form */}
      <div className="mb-12">
        <SearchForm onSearch={handleSearch} isLoading={isSearching} />
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-8 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-red-400 text-center">
          {error}
        </div>
      )}

      {/* Loading States */}
      {isSearching && (
        <LoadingState message="Searching Google Maps for businesses..." />
      )}

      {/* Progress bar for streaming analysis */}
      {isAnalyzing && analyzeProgress && (
        <div className={`mb-6 p-4 rounded-lg border transition-all ${analyzeProgress.firstPageComplete
          ? 'bg-emerald-500/10 border-emerald-500/20'
          : 'bg-primary/10 border-primary/20'
          }`}>
          {/* First page complete banner */}
          {analyzeProgress.firstPageComplete && analyzeProgress.isBackground && (
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-emerald-500/20">
              <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm font-medium text-emerald-400">
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
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-all ${phase < (analyzeProgress.phase || 0)
                      ? 'bg-emerald-500 text-white'
                      : phase === analyzeProgress.phase
                        ? 'bg-primary text-primary-foreground animate-pulse'
                        : 'bg-muted text-muted-foreground'
                      }`}
                  >
                    {phase < (analyzeProgress.phase || 0) ? '✓' : phase}
                  </div>
                  <span className={`text-xs hidden sm:inline ${phase === analyzeProgress.phase ? 'text-primary font-medium' : 'text-muted-foreground'
                    }`}>
                    {phase === 1 ? 'Visibility' : phase === 2 ? 'Reviews' : 'Analysis'}
                  </span>
                  {phase < 3 && (
                    <div className={`w-8 h-0.5 ${phase < (analyzeProgress.phase || 0) ? 'bg-emerald-500' : 'bg-muted'
                      }`} />
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-medium ${analyzeProgress.firstPageComplete ? 'text-emerald-400' : 'text-primary'
              }`}>
              {analyzeProgress.message || 'Analyzing businesses for Hidden Signals...'}
            </span>
            <span className={`text-sm ${analyzeProgress.firstPageComplete ? 'text-emerald-400' : 'text-primary'
              }`}>
              {analyzeProgress.completed}/{analyzeProgress.total}
            </span>
          </div>
          <div className={`w-full rounded-full h-2 ${analyzeProgress.firstPageComplete ? 'bg-emerald-500/20' : 'bg-primary/20'
            }`}>
            <div
              className={`h-2 rounded-full transition-all duration-300 ${analyzeProgress.firstPageComplete ? 'bg-emerald-500' : 'bg-primary'
                }`}
              style={{ width: `${(analyzeProgress.completed / analyzeProgress.total) * 100}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className={`text-xs ${analyzeProgress.firstPageComplete ? 'text-emerald-400' : 'text-primary'
              }`}>
              {analyzeProgress.firstPageComplete
                ? 'Background loading - results will appear automatically'
                : 'Results appear as they complete - no need to wait!'}
            </p>
            {analyzeProgress.phase === 2 && !analyzeProgress.firstPageComplete && (
              <p className="text-xs text-primary">
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
            <div className="flex gap-1 p-1 bg-muted rounded-lg">
              <button
                onClick={() => setActiveTab('general')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'general'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                General List ({businesses.length})
              </button>
              <button
                onClick={() => setActiveTab('upgraded')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'upgraded'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
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
                className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Analyze for Hidden Signals
              </button>
            )}
          </div>

          {/* Table Container */}
          <div className="bg-card border border-border rounded-lg">
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
          <div className="mt-4 text-center text-sm text-muted-foreground">
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
          <div className="inline-flex items-center justify-center w-16 h-16 bg-muted rounded-full mb-4">
            <svg
              className="w-8 h-8 text-muted-foreground"
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
          <h3 className="text-lg font-medium text-foreground mb-2">
            Start Your Search
          </h3>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Enter a business niche and location to find leads with high propensity to buy SEO services.
          </p>
        </div>
      )}
    </div>
  );
}
