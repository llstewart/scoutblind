'use client';

import { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { SearchForm } from '@/components/SearchForm';
import { GeneralListTable } from '@/components/GeneralListTable';
import { UpgradedListTable } from '@/components/UpgradedListTable';
import { LoadingState } from '@/components/LoadingState';
import { PremiumGate } from '@/components/PremiumGate';
import { SavedAnalysesPanel } from '@/components/SavedAnalysesPanel';
import { AuthModal } from '@/components/auth/AuthModal';
import { UserMenu } from '@/components/auth/UserMenu';
import { BillingModal } from '@/components/BillingModal';
import { useUser } from '@/hooks/useUser';
// Note: SessionIndicator removed - replaced by UserMenu
import { Business, EnrichedBusiness, TableBusiness, PendingBusiness, isPendingBusiness } from '@/lib/types';
import { exportGeneralListToCSV, exportEnrichedListToCSV } from '@/lib/export';

type TabType = 'general' | 'upgraded';

const SESSION_STORAGE_KEY = 'truesignal_session';
const PERSISTENT_SESSION_ID_KEY = 'truesignal_sid';

// Generate a unique session ID
function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

// Get or create persistent session ID
function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let sessionId = localStorage.getItem(PERSISTENT_SESSION_ID_KEY);
  if (!sessionId) {
    sessionId = generateSessionId();
    localStorage.setItem(PERSISTENT_SESSION_ID_KEY, sessionId);
  }
  return sessionId;
}

interface SessionState {
  businesses: Business[];
  tableBusinesses: TableBusiness[];
  searchParams: { niche: string; location: string } | null;
  activeTab: TabType;
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-500 text-sm">Loading...</p>
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const router = useRouter();
  const urlSearchParams = useSearchParams();

  // Auth state
  const { user, subscription, isLoading: isAuthLoading, credits, tier, refreshUser, deductCredit } = useUser();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [showBillingModal, setShowBillingModal] = useState(false);

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [tableBusinesses, setTableBusinesses] = useState<TableBusiness[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useState<{ niche: string; location: string } | null>(null);
  const [selectedBusinesses, setSelectedBusinesses] = useState<Set<number>>(new Set());
  const [isCached, setIsCached] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [showSavedPanel, setShowSavedPanel] = useState(false);
  const [savedAnalysesCount, setSavedAnalysesCount] = useState(0);
  const [isSessionConnected, setIsSessionConnected] = useState(false);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);

  // User is considered premium if they're logged in (they get free credits to start)
  const isPremium = !!user;

  // Toast message for checkout success
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const searchControllerRef = useRef<AbortController | null>(null);
  const analyzeControllerRef = useRef<AbortController | null>(null);

  // Handle checkout success/cancel from Stripe redirect
  useEffect(() => {
    const checkout = urlSearchParams.get('checkout');
    if (checkout === 'success') {
      // Refresh user data to get updated credits
      refreshUser();
      setToastMessage('Payment successful! Your credits have been added.');
      // Clear the query parameter
      const params = new URLSearchParams(window.location.search);
      params.delete('checkout');
      params.delete('session_id');
      const newUrl = params.toString() ? `?${params.toString()}` : '/';
      router.replace(newUrl, { scroll: false });
      // Auto-hide toast after 5 seconds
      setTimeout(() => setToastMessage(null), 5000);
    } else if (checkout === 'canceled') {
      setToastMessage('Checkout was canceled.');
      // Clear the query parameter
      const params = new URLSearchParams(window.location.search);
      params.delete('checkout');
      const newUrl = params.toString() ? `?${params.toString()}` : '/';
      router.replace(newUrl, { scroll: false });
      setTimeout(() => setToastMessage(null), 3000);
    }
  }, [urlSearchParams, refreshUser, router]);

  // Fetch saved analyses count for session indicator
  const fetchSavedCount = useCallback(async () => {
    if (!sessionId) return;
    try {
      const response = await fetch(`/api/session?sessionId=${encodeURIComponent(sessionId)}`);
      if (response.ok) {
        const data = await response.json();
        const analyses = data.analyses || {};
        const count = Object.keys(analyses).length;
        setSavedAnalysesCount(count);
        setIsSessionConnected(true);
      }
    } catch {
      setIsSessionConnected(false);
    }
  }, [sessionId]);

  // Load saved analyses from Redis for current search
  const loadSavedAnalyses = useCallback(async (niche: string, location: string) => {
    if (!sessionId) return;
    setIsLoadingSaved(true);
    try {
      const response = await fetch(
        `/api/session?sessionId=${encodeURIComponent(sessionId)}&niche=${encodeURIComponent(niche)}&location=${encodeURIComponent(location)}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.businesses && data.businesses.length > 0) {
          console.log(`[Session] Loaded ${data.businesses.length} previously analyzed businesses`);
          setTableBusinesses(data.businesses);
        }
        setIsSessionConnected(true);
      }
    } catch (error) {
      console.error('[Session] Failed to load saved analyses:', error);
      setIsSessionConnected(false);
    } finally {
      setIsLoadingSaved(false);
    }
  }, [sessionId]);

  // Save analyses to Redis
  const saveAnalysesToSession = useCallback(async (businesses: EnrichedBusiness[]) => {
    if (!sessionId || !searchParams) return;
    try {
      await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          niche: searchParams.niche,
          location: searchParams.location,
          businesses,
        }),
      });
      console.log(`[Session] Saved ${businesses.length} analyzed businesses`);
      // Refresh saved count
      fetchSavedCount();
    } catch (error) {
      console.error('[Session] Failed to save analyses:', error);
    }
  }, [sessionId, searchParams, fetchSavedCount]);

  // Determine if we're in "results mode" (compact header) or "hero mode" (full landing)
  const hasResults = businesses.length > 0;

  // Initialize session ID and restore state
  useEffect(() => {
    // Get or create persistent session ID
    const sid = getSessionId();
    setSessionId(sid);

    try {
      const saved = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (saved) {
        const state: SessionState = JSON.parse(saved);
        setBusinesses(state.businesses || []);
        setTableBusinesses(state.tableBusinesses || []);
        setSearchParams(state.searchParams);
        setActiveTab(state.activeTab || 'general');
        // isPremium is now derived from auth, not stored in session
      }
    } catch (e) {
      console.error('Failed to restore session:', e);
    }
    setIsInitialized(true);
  }, []);

  // Load saved analyses from Redis when search params change
  useEffect(() => {
    if (sessionId && searchParams && tableBusinesses.length === 0) {
      loadSavedAnalyses(searchParams.niche, searchParams.location);
    }
  }, [sessionId, searchParams, loadSavedAnalyses, tableBusinesses.length]);

  // Fetch saved count when session is initialized
  useEffect(() => {
    if (sessionId) {
      fetchSavedCount();
    }
  }, [sessionId, fetchSavedCount]);

  useEffect(() => {
    if (!isInitialized) return;
    try {
      const state: SessionState = {
        businesses,
        tableBusinesses,
        searchParams,
        activeTab,
      };
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save session:', e);
    }
  }, [businesses, tableBusinesses, searchParams, activeTab, isInitialized]);

  useEffect(() => {
    if (!isInitialized || !searchParams) return;
    const params = new URLSearchParams();
    params.set('niche', searchParams.niche);
    params.set('location', searchParams.location);
    params.set('tab', activeTab);
    const newUrl = `?${params.toString()}`;
    if (window.location.search !== newUrl) {
      router.replace(newUrl, { scroll: false });
    }
  }, [searchParams, activeTab, isInitialized, router]);

  useEffect(() => {
    if (!isInitialized) return;
    const niche = urlSearchParams.get('niche');
    const location = urlSearchParams.get('location');
    const tab = urlSearchParams.get('tab') as TabType | null;
    if (niche && location && businesses.length === 0 && !isSearching) {
      if (tab) setActiveTab(tab);
      handleSearchFromUrl(niche, location);
    }
  }, [isInitialized, urlSearchParams, businesses.length, isSearching]);

  const handleSearchFromUrl = async (niche: string, location: string) => {
    if (searchControllerRef.current) {
      searchControllerRef.current.abort();
    }
    const controller = new AbortController();
    searchControllerRef.current = controller;
    setIsSearching(true);
    setError(null);
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
      setIsCached(data.cached || false);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = async (niche: string, location: string) => {
    if (searchControllerRef.current) searchControllerRef.current.abort();
    if (analyzeControllerRef.current) analyzeControllerRef.current.abort();

    const controller = new AbortController();
    searchControllerRef.current = controller;

    setIsSearching(true);
    setIsAnalyzing(false);
    setError(null);
    setBusinesses([]);
    setTableBusinesses([]);
    setSelectedBusinesses(new Set());
    setSearchParams({ niche, location });
    setIsCached(false);

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
      setIsCached(data.cached || false);
      setActiveTab('general');
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsSearching(false);
    }
  };

  const [analyzeProgress, setAnalyzeProgress] = useState<{
    completed: number;
    total: number;
    phase?: number;
    totalPhases?: number;
    message?: string;
    isBackground?: boolean;
    firstPageComplete?: boolean;
  } | null>(null);

  const handleUpgradeClick = () => {
    // User needs to sign up to upgrade
    setAuthMode('signup');
    setShowAuthModal(true);
    setShowUpgradeModal(false);
  };

  // Load a search from saved history
  const handleLoadFromHistory = async (niche: string, location: string) => {
    setSearchParams({ niche, location });
    setActiveTab('upgraded');
    // Search will be triggered by URL params, and saved analyses will load via useEffect
    router.replace(`?niche=${encodeURIComponent(niche)}&location=${encodeURIComponent(location)}&tab=upgraded`);
    // Trigger a fresh search to populate the general list
    handleSearch(niche, location);
  };

  // Handle clearing history
  const handleClearHistory = () => {
    setTableBusinesses([]);
    setSavedAnalysesCount(0);
  };

  // Get current search key for highlighting in saved panel
  const currentSearchKey = searchParams
    ? `${searchParams.niche.toLowerCase().trim()}|${searchParams.location.toLowerCase().trim()}`
    : undefined;

  const handleAnalyze = async () => {
    if (!searchParams || businesses.length === 0) return;

    // Check if user is logged in
    if (!user) {
      setAuthMode('signup');
      setShowAuthModal(true);
      return;
    }

    // Check if user has credits
    const businessesToAnalyze = selectedBusinesses.size > 0
      ? Array.from(selectedBusinesses).map(i => businesses[i])
      : businesses;

    const creditsNeeded = businessesToAnalyze.length;
    if (credits < creditsNeeded) {
      setError(`You need ${creditsNeeded} credits to analyze ${businessesToAnalyze.length} businesses. You have ${credits} credits remaining.`);
      setShowBillingModal(true);
      return;
    }

    // Deduct credits
    const success = await deductCredit(creditsNeeded);
    if (!success) {
      setError('Failed to deduct credits. Please try again.');
      return;
    }

    if (analyzeControllerRef.current) analyzeControllerRef.current.abort();
    const controller = new AbortController();
    analyzeControllerRef.current = controller;

    setIsAnalyzing(true);
    setError(null);

    const pendingBusinesses: PendingBusiness[] = businessesToAnalyze.map(b => ({
      ...b,
      isEnriching: true as const,
    }));

    // Merge with existing analyzed businesses (keep previously analyzed, add new pending)
    setTableBusinesses(prev => {
      const existingAnalyzed = prev.filter(b => !isPendingBusiness(b));
      const existingIds = new Set(existingAnalyzed.map(b => b.placeId || b.name));
      // Only add pending businesses that aren't already analyzed
      const newPending = pendingBusinesses.filter(b => !existingIds.has(b.placeId || b.name));
      return [...existingAnalyzed, ...newPending];
    });

    setAnalyzeProgress({ completed: 0, total: businessesToAnalyze.length, phase: 1, totalPhases: 3, message: 'Starting analysis...' });
    setActiveTab('upgraded');

    const endpoint = selectedBusinesses.size > 0 ? '/api/analyze-selected' : '/api/analyze-stream';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businesses: businessesToAnalyze,
          niche: searchParams.niche,
          location: searchParams.location,
        }),
        signal: controller.signal,
      });

      if (!response.ok) throw new Error('Analysis failed');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === 'status') {
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
                const enrichedBusiness: EnrichedBusiness = {
                  ...data.business,
                  isEnriching: false,
                };
                setTableBusinesses(prev => {
                  const idx = prev.findIndex(b => b.name === enrichedBusiness.name);
                  if (idx !== -1) {
                    const updated = [...prev];
                    updated[idx] = enrichedBusiness;
                    return updated;
                  }
                  return [...prev, enrichedBusiness];
                });
                setAnalyzeProgress(prev => ({
                  completed: data.progress.completed,
                  total: data.progress.total,
                  phase: 3,
                  totalPhases: 3,
                  message: `Analyzing ${data.progress.completed}/${data.progress.total}`,
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
      if (err instanceof Error && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsAnalyzing(false);
      setAnalyzeProgress(null);

      // Save all analyzed businesses to Redis session
      setTableBusinesses(current => {
        const enrichedOnly = current.filter((b): b is EnrichedBusiness => !isPendingBusiness(b));
        if (enrichedOnly.length > 0) {
          saveAnalysesToSession(enrichedOnly);
        }
        return current;
      });
    }
  };

  // ============================================
  // RENDER: Hero Mode (No Results)
  // ============================================
  if (!hasResults && !isSearching) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex flex-col">
        {/* Top Navigation */}
        <header className="absolute top-0 left-0 right-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="text-xl font-bold text-white">
              TrueSignal<span className="text-violet-500">.</span>
            </div>
            {isAuthLoading ? (
              <div className="w-8 h-8 rounded-full bg-zinc-800 animate-pulse" />
            ) : user ? (
              <UserMenu
                user={user}
                credits={credits}
                tier={tier}
                onOpenBilling={() => setShowBillingModal(true)}
              />
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setAuthMode('signin');
                    setShowAuthModal(true);
                  }}
                  className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white transition-colors"
                >
                  Sign in
                </button>
                <button
                  onClick={() => {
                    setAuthMode('signup');
                    setShowAuthModal(true);
                  }}
                  className="px-4 py-2 text-sm font-medium bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors"
                >
                  Get Started
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Centered Hero Content */}
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="w-full max-w-3xl mx-auto text-center">
            {/* Logo */}
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
              TrueSignal<span className="text-violet-500">.</span>
            </h1>
            <p className="text-zinc-400 text-lg mb-10 max-w-xl mx-auto">
              Find businesses that actually need your services. Powered by real signals, not guesswork.
            </p>

            {/* Search Form */}
            <SearchForm
              onSearch={handleSearch}
              isLoading={isSearching}
              initialNiche={searchParams?.niche}
              initialLocation={searchParams?.location}
            />

            {/* How it works */}
            <div className="mt-16 flex items-center justify-center gap-8 text-sm text-zinc-500">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 text-xs font-medium">1</div>
                <span>Search niche</span>
              </div>
              <div className="w-8 h-px bg-zinc-800" />
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 text-xs font-medium">2</div>
                <span>Scan market</span>
              </div>
              <div className="w-8 h-px bg-zinc-800" />
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 text-xs font-medium">3</div>
                <span>Find signals</span>
              </div>
            </div>

            {/* Saved Analyses Link */}
            {savedAnalysesCount > 0 && (
              <button
                onClick={() => setShowSavedPanel(true)}
                className="mt-8 inline-flex items-center gap-2 px-4 py-2 text-sm text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-600 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                View {savedAnalysesCount} saved {savedAnalysesCount === 1 ? 'analysis' : 'analyses'}
              </button>
            )}

            {/* Error State */}
            {error && (
              <div className="mt-8 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Saved Analyses Panel (Hero Mode) */}
        <SavedAnalysesPanel
          isOpen={showSavedPanel}
          onClose={() => setShowSavedPanel(false)}
          sessionId={user?.id || sessionId}
          currentSearchKey={currentSearchKey}
          onLoadSearch={handleLoadFromHistory}
          onClearHistory={handleClearHistory}
          isLoggedIn={!!user}
        />

        {/* Auth Modal (Hero Mode) */}
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          defaultMode={authMode}
        />

        {/* Billing Modal (Hero Mode) */}
        <BillingModal
          isOpen={showBillingModal}
          onClose={() => {
            setShowBillingModal(false);
            refreshUser();
          }}
          currentTier={tier}
          creditsRemaining={credits}
        />

        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
            <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 shadow-lg flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${toastMessage.includes('successful') ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span className="text-sm text-zinc-200">{toastMessage}</span>
              <button
                onClick={() => setToastMessage(null)}
                className="text-zinc-400 hover:text-white ml-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============================================
  // RENDER: Results Mode (Compact Header + Data)
  // ============================================
  return (
    <div className="min-h-screen bg-[#0a0a0b] flex flex-col">
      {/* Compact Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0b]/95 backdrop-blur-sm border-b border-zinc-800/50">
        <div className="max-w-[1600px] mx-auto px-4 py-3">
          <div className="flex items-center gap-6">
            {/* Logo - clickable to reset */}
            <button
              onClick={() => {
                setBusinesses([]);
                setTableBusinesses([]);
                setSearchParams(null);
                setError(null);
                router.replace('/');
              }}
              className="text-xl font-bold text-white hover:text-violet-400 transition-colors flex-shrink-0"
            >
              TrueSignal<span className="text-violet-500">.</span>
            </button>

            {/* Compact Search Form */}
            <div className="flex-1 max-w-xl">
              <SearchForm
                onSearch={handleSearch}
                isLoading={isSearching}
                initialNiche={searchParams?.niche}
                initialLocation={searchParams?.location}
                compact
              />
            </div>

            {/* Quick Stats */}
            {searchParams && (
              <div className="hidden lg:flex items-center gap-4 text-sm">
                <div className="text-zinc-500">
                  <span className="text-zinc-300 font-medium">{businesses.length}</span> results
                </div>
                {isCached && (
                  <span className="px-2 py-0.5 text-xs font-medium rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    Cached
                  </span>
                )}
              </div>
            )}

            {/* Auth Section */}
            {isAuthLoading ? (
              <div className="w-8 h-8 rounded-full bg-zinc-800 animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-2">
                {/* History Button */}
                <button
                  onClick={() => setShowSavedPanel(true)}
                  className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                  title="Saved analyses"
                >
                  <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
                {/* User Menu */}
                <UserMenu
                  user={user}
                  credits={credits}
                  tier={tier}
                  onOpenBilling={() => setShowBillingModal(true)}
                />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setAuthMode('signin');
                    setShowAuthModal(true);
                  }}
                  className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white transition-colors"
                >
                  Sign in
                </button>
                <button
                  onClick={() => {
                    setAuthMode('signup');
                    setShowAuthModal(true);
                  }}
                  className="px-4 py-2 text-sm font-medium bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors"
                >
                  Get Started
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 py-4">
        {/* Loading State */}
        {isSearching && (
          <div className="py-16">
            <LoadingState message="Searching businesses..." />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Results */}
        {!isSearching && hasResults && (
          <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between">
              {/* Tabs */}
              <div className="flex items-center gap-1 p-1 bg-zinc-900 rounded-lg border border-zinc-800">
                <button
                  onClick={() => setActiveTab('general')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    activeTab === 'general'
                      ? 'bg-zinc-800 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  All Results
                  <span className="ml-2 text-zinc-500">({businesses.length})</span>
                </button>
                <button
                  onClick={() => setActiveTab('upgraded')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${
                    activeTab === 'upgraded'
                      ? 'bg-zinc-800 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <span>Signals</span>
                  {isPremium ? (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      PRO
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-violet-500/20 text-violet-400 border border-violet-500/30">
                      UPGRADE
                    </span>
                  )}
                  {tableBusinesses.length > 0 && (
                    <span className="text-zinc-500">({tableBusinesses.length})</span>
                  )}
                </button>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {/* Export */}
                <button
                  onClick={() => {
                    if (activeTab === 'upgraded' && tableBusinesses.length > 0) {
                      const hasEnrichedData = tableBusinesses.some(b => !isPendingBusiness(b));
                      if (hasEnrichedData) {
                        exportEnrichedListToCSV(tableBusinesses, searchParams?.niche, searchParams?.location);
                      }
                    } else {
                      exportGeneralListToCSV(businesses, searchParams?.niche, searchParams?.location);
                    }
                  }}
                  disabled={activeTab === 'upgraded' && tableBusinesses.length > 0 && tableBusinesses.every(b => isPendingBusiness(b))}
                  className="px-3 py-2 text-sm font-medium rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white border border-zinc-700 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export
                </button>

                {/* Analyze Button */}
                {activeTab === 'general' && (
                  <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="px-4 py-2 text-sm font-medium rounded-lg bg-violet-600 text-white hover:bg-violet-500 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    {selectedBusinesses.size > 0
                      ? `Analyze ${selectedBusinesses.size} Selected`
                      : 'Analyze All'}
                  </button>
                )}

                {/* Dev info - shows current auth status */}
                {process.env.NODE_ENV === 'development' && (
                  <span className="px-2 py-1 text-xs border border-zinc-700 rounded text-zinc-500">
                    {user ? `${credits} credits` : 'Not signed in'}
                  </span>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            {isAnalyzing && analyzeProgress && (
              <div className={`p-3 rounded-lg border ${
                analyzeProgress.firstPageComplete
                  ? 'bg-emerald-500/5 border-emerald-500/20'
                  : 'bg-violet-500/5 border-violet-500/20'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {/* Phase indicators */}
                    <div className="flex items-center gap-1">
                      {[1, 2, 3].map((phase) => (
                        <div
                          key={phase}
                          className={`w-2 h-2 rounded-full transition-all ${
                            phase < (analyzeProgress.phase || 0)
                              ? 'bg-emerald-500'
                              : phase === analyzeProgress.phase
                                ? 'bg-violet-500 animate-pulse'
                                : 'bg-zinc-700'
                          }`}
                        />
                      ))}
                    </div>
                    <span className={`text-sm font-medium ${
                      analyzeProgress.firstPageComplete ? 'text-emerald-400' : 'text-violet-400'
                    }`}>
                      {analyzeProgress.message}
                    </span>
                  </div>
                  <span className={`text-sm ${
                    analyzeProgress.firstPageComplete ? 'text-emerald-400' : 'text-violet-400'
                  }`}>
                    {analyzeProgress.completed}/{analyzeProgress.total}
                  </span>
                </div>
                <div className={`h-1 rounded-full ${
                  analyzeProgress.firstPageComplete ? 'bg-emerald-500/20' : 'bg-violet-500/20'
                }`}>
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      analyzeProgress.firstPageComplete ? 'bg-emerald-500' : 'bg-violet-500'
                    }`}
                    style={{ width: `${(analyzeProgress.completed / analyzeProgress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Data Table */}
            <div className={`bg-zinc-900/50 border rounded-lg overflow-hidden ${
              activeTab === 'upgraded' && isPremium
                ? 'border-violet-500/20'
                : 'border-zinc-800'
            }`}>
              {activeTab === 'general' ? (
                <GeneralListTable
                  businesses={businesses}
                  selectedBusinesses={selectedBusinesses}
                  onSelectionChange={setSelectedBusinesses}
                />
              ) : !isPremium ? (
                <PremiumGate
                  onUpgradeClick={handleUpgradeClick}
                  niche={searchParams?.niche}
                  location={searchParams?.location}
                />
              ) : (
                <UpgradedListTable
                  businesses={tableBusinesses}
                  niche={searchParams?.niche}
                  location={searchParams?.location}
                  isLoadingMore={isAnalyzing}
                  expectedTotal={analyzeProgress?.total || businesses.length}
                />
              )}
            </div>

            {/* Footer Summary */}
            <div className="text-center text-sm text-zinc-500 pb-4">
              {activeTab === 'general' ? (
                <span>
                  Showing {businesses.length} businesses for &quot;{searchParams?.niche}&quot; in {searchParams?.location}
                </span>
              ) : isPremium && tableBusinesses.length > 0 ? (
                <span>
                  {tableBusinesses.filter(b => !isPendingBusiness(b)).length} of {tableBusinesses.length} analyzed
                </span>
              ) : null}
            </div>
          </div>
        )}
      </main>

      {/* Saved Analyses Panel */}
      <SavedAnalysesPanel
        isOpen={showSavedPanel}
        onClose={() => setShowSavedPanel(false)}
        sessionId={user?.id || sessionId}
        currentSearchKey={currentSearchKey}
        onLoadSearch={handleLoadFromHistory}
        onClearHistory={handleClearHistory}
        isLoggedIn={!!user}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultMode={authMode}
      />

      {/* Billing Modal */}
      <BillingModal
        isOpen={showBillingModal}
        onClose={() => {
          setShowBillingModal(false);
          refreshUser();
        }}
        currentTier={tier}
        creditsRemaining={credits}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 shadow-lg flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${toastMessage.includes('successful') ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <span className="text-sm text-zinc-200">{toastMessage}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="text-zinc-400 hover:text-white ml-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
