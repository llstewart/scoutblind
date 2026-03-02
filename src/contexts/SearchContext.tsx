'use client';

import { createContext, useContext, useState, useRef, useEffect, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useUI } from '@/contexts/UIContext';
import { Business, EnrichedBusiness, TableBusiness, PendingBusiness, isPendingBusiness, isEnrichedBusiness } from '@/lib/types';

export type TabType = 'general' | 'upgraded' | 'market';

const SESSION_STORAGE_KEY = 'packleads_session';
const PERSISTENT_SESSION_ID_KEY = 'packleads_sid';

function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

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
  wasAnalyzing?: boolean;
}

export interface AnalyzeProgress {
  completed: number;
  total: number;
  phase?: number;
  totalPhases?: number;
  message?: string;
  isBackground?: boolean;
  firstPageComplete?: boolean;
}

interface SearchContextValue {
  // Search State
  businesses: Business[];
  setBusinesses: (businesses: Business[]) => void;
  tableBusinesses: TableBusiness[];
  setTableBusinesses: React.Dispatch<React.SetStateAction<TableBusiness[]>>;
  isSearching: boolean;
  setIsSearching: (searching: boolean) => void;
  isAnalyzing: boolean;
  setIsAnalyzing: (analyzing: boolean) => void;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  error: string | null;
  setError: (error: string | null) => void;
  searchParams: { niche: string; location: string } | null;
  setSearchParams: (params: { niche: string; location: string } | null) => void;
  selectedBusinesses: Set<number>;
  setSelectedBusinesses: (selected: Set<number>) => void;
  isCached: boolean;
  setIsCached: (cached: boolean) => void;
  isViewingSavedSearch: boolean;
  setIsViewingSavedSearch: (viewing: boolean) => void;

  // Analysis State
  analyzeProgress: AnalyzeProgress | null;
  setAnalyzeProgress: (progress: AnalyzeProgress | null) => void;
  wasAnalysisInterrupted: boolean;
  setWasAnalysisInterrupted: (interrupted: boolean) => void;

  // Preview
  isPreviewEnriching: boolean;
  isPreviewMode: boolean;
  previewExhausted: boolean;
  triggerFreePreview: (businesses: Business[], niche: string, location: string) => Promise<void>;

  // Functions
  handleSearch: (niche: string, location: string) => Promise<void>;
  handleAnalyze: () => Promise<void>;
  handleNewSearch: () => void;

  // Computed
  hasResults: boolean;

  // Refs for analysis worker
  analyzeWorkerRef: React.MutableRefObject<Worker | null>;
}

const SearchContext = createContext<SearchContextValue | null>(null);

export function useSearch() {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within SearchProvider');
  }
  return context;
}

interface SearchProviderProps {
  children: ReactNode;
}

export function SearchProvider({ children }: SearchProviderProps) {
  const router = useRouter();
  const { user, subscription, isAuthLoading, credits, isPremium, refreshUser, getCredits } = useAuth();
  const { setShowAuthModal, setAuthMode, setShowBillingModal, setRateLimitCountdown, setToastMessage } = useUI();

  // Search state
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
  const [isViewingSavedSearch, setIsViewingSavedSearch] = useState(false);
  const [wasAnalysisInterrupted, setWasAnalysisInterrupted] = useState(false);

  // Preview state
  const [isPreviewEnriching, setIsPreviewEnriching] = useState(false);
  const [previewExhausted, setPreviewExhausted] = useState(false);

  // Analysis progress
  const [analyzeProgress, setAnalyzeProgress] = useState<AnalyzeProgress | null>(null);

  // Refs
  const searchControllerRef = useRef<AbortController | null>(null);
  const analyzeControllerRef = useRef<AbortController | null>(null);
  const analyzeWorkerRef = useRef<Worker | null>(null);
  const inFlightSearchRef = useRef<{ niche: string; location: string } | null>(null);

  // Computed values
  const hasResults = businesses.length > 0 || (isViewingSavedSearch && tableBusinesses.length > 0);
  const isPreviewMode = !isPremium && tableBusinesses.length > 0 && tableBusinesses.some(b => !isPendingBusiness(b) && isEnrichedBusiness(b));

  // Initialize session ID
  useEffect(() => {
    getSessionId();
    setIsInitialized(true);
  }, []);

  // Restore state from sessionStorage
  useEffect(() => {
    if (isAuthLoading) return;

    if (user) {
      try {
        const saved = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (saved) {
          const state: SessionState = JSON.parse(saved);
          setBusinesses(state.businesses || []);
          setTableBusinesses(state.tableBusinesses || []);
          setSearchParams(state.searchParams);
          const restoredTab = (state.activeTab || 'general') as string;
          setActiveTab(
            restoredTab === 'general' || restoredTab === 'upgraded' || restoredTab === 'market'
              ? restoredTab
              : 'general'
          );
          if (state.wasAnalyzing && state.tableBusinesses && state.tableBusinesses.length > 0) {
            setWasAnalysisInterrupted(true);
          }
        }
      } catch (e) {
        console.error('Failed to restore session:', e);
      }
    } else {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      setBusinesses([]);
      setTableBusinesses([]);
      setSearchParams(null);
      setActiveTab('general');
      setSelectedBusinesses(new Set());
    }
  }, [user, isAuthLoading]);

  // Clear analyzed data for free tier users (but preserve preview data)
  useEffect(() => {
    if (!isAuthLoading && (!subscription || subscription.tier === 'free')) {
      if (!isPreviewEnriching) {
        setTableBusinesses(prev => {
          const enriched = prev.filter(b => !isPendingBusiness(b) && isEnrichedBusiness(b));
          if (enriched.length <= 3 && enriched.length > 0) return prev;
          return [];
        });
      }
    }
  }, [isAuthLoading, subscription, isPreviewEnriching]);

  // Save state to sessionStorage
  useEffect(() => {
    if (!isInitialized || !user) return;

    try {
      const state: SessionState = {
        businesses,
        tableBusinesses,
        searchParams,
        activeTab,
        wasAnalyzing: isAnalyzing,
      };
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.code === 22)) {
        try {
          sessionStorage.clear();
          const state: SessionState = {
            businesses,
            tableBusinesses,
            searchParams,
            activeTab,
            wasAnalyzing: isAnalyzing,
          };
          sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(state));
        } catch (retryError) {
          console.error('Failed to save session after clearing storage:', retryError);
        }
      } else {
        console.error('Failed to save session:', e);
      }
    }
  }, [businesses, tableBusinesses, searchParams, activeTab, isInitialized, isAnalyzing, user]);

  // Warn user before leaving page during analysis
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isAnalyzing) {
        e.preventDefault();
        e.returnValue = 'Analysis is running in the background. You can safely leave — results will be available when you return.';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isAnalyzing]);

  // Cleanup worker on unmount
  useEffect(() => {
    return () => {
      if (analyzeWorkerRef.current) {
        analyzeWorkerRef.current.terminate();
        analyzeWorkerRef.current = null;
      }
    };
  }, []);

  // Trigger free preview enrichment for user-selected businesses (max 3)
  const triggerFreePreview = useCallback(async (previewBusinesses: Business[], niche: string, location: string) => {
    if (isPremium) return;
    const capped = previewBusinesses.slice(0, 3);
    if (capped.length === 0) return;
    setIsPreviewEnriching(true);
    try {
      const response = await fetch('/api/analyze-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businesses: capped, niche, location }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.enrichedBusinesses && data.enrichedBusinesses.length > 0) {
          setTableBusinesses(data.enrichedBusinesses);
          setActiveTab('upgraded');
        }
      } else if (response.status === 403 || response.status === 429) {
        setPreviewExhausted(true);
      }
    } catch (err) {
      console.error('[Preview] Failed to trigger free preview:', err);
    } finally {
      setIsPreviewEnriching(false);
    }
  }, [isPremium]);

  // Handle search
  const handleSearch = useCallback(async (niche: string, location: string) => {
    const normalizedNiche = niche.toLowerCase().trim();
    const normalizedLocation = location.toLowerCase().trim();

    if (
      inFlightSearchRef.current &&
      inFlightSearchRef.current.niche === normalizedNiche &&
      inFlightSearchRef.current.location === normalizedLocation
    ) {
      console.log('[Search] Duplicate request ignored - search already in progress');
      return;
    }

    inFlightSearchRef.current = { niche: normalizedNiche, location: normalizedLocation };

    if (!user) {
      inFlightSearchRef.current = null;
      setAuthMode('signup');
      setShowAuthModal(true);
      return;
    }

    let currentCredits: number;
    try {
      currentCredits = await getCredits();
    } catch (err) {
      console.error('[Search] Error fetching credits:', err);
      inFlightSearchRef.current = null;
      setError('Unable to verify credits. Please refresh the page and try again.');
      return;
    }

    if (currentCredits < 1) {
      try {
        await refreshUser();
        currentCredits = await getCredits();
      } catch (err) {
        console.error('[Search] Error refreshing user:', err);
      }

      if (currentCredits < 1) {
        inFlightSearchRef.current = null;
        setError('You need 1 credit to search. Purchase more credits to continue.');
        setShowBillingModal(true);
        return;
      }
    }

    if (searchControllerRef.current && !searchControllerRef.current.signal.aborted) {
      searchControllerRef.current.abort();
    }
    if (analyzeControllerRef.current && !analyzeControllerRef.current.signal.aborted) {
      analyzeControllerRef.current.abort();
    }

    const controller = new AbortController();
    searchControllerRef.current = controller;

    console.log('[Search] Starting search for:', normalizedNiche, normalizedLocation);
    setIsSearching(true);
    setIsAnalyzing(false);
    setError(null);
    setSearchParams({ niche, location });
    setIsViewingSavedSearch(false);

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche, location }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const data = await response.json();

        if (response.status === 429 && data.retryAfter) {
          setRateLimitCountdown(data.retryAfter);
          return;
        }

        throw new Error(data.error || 'Search failed');
      }

      const data = await response.json();

      if (!data.businesses || data.businesses.length === 0) {
        setError('No businesses found for that search. Try a different niche or location.');
        return;
      }

      setBusinesses(data.businesses);
      setTableBusinesses([]);
      setSelectedBusinesses(new Set());
      setIsCached(data.cached || false);
      setActiveTab('general');
      setIsViewingSavedSearch(false);

      if (!data.cached) {
        refreshUser();
      }

      // Save to library via API directly (not through LibraryContext to avoid circular dep)
      if (user) {
        try {
          await fetch('/api/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              niche,
              location,
              businesses: data.businesses,
            }),
          });
        } catch (saveErr) {
          console.error('[Search] Failed to save to library:', saveErr);
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;

      console.error('[Search] Error:', err);

      let errorMessage = 'An unexpected error occurred';
      if (err instanceof Error) {
        errorMessage = err.message;
        if (err.message === 'Failed to fetch' || err.message.includes('fetch')) {
          errorMessage = 'Network error: Unable to reach the server. Please check your internet connection and try again.';
        }
      }

      if (errorMessage.includes('too many') || errorMessage.includes('wait')) {
        const match = errorMessage.match(/wait\s+(\d+)\s+seconds/i);
        if (match) {
          setRateLimitCountdown(parseInt(match[1], 10));
          return;
        }
      }

      setError(errorMessage);
    } finally {
      setIsSearching(false);
      inFlightSearchRef.current = null;
    }
  }, [user, getCredits, refreshUser, setAuthMode, setShowAuthModal, setShowBillingModal, setRateLimitCountdown]);

  // Handle new search
  const handleNewSearch = useCallback(() => {
    setBusinesses([]);
    setTableBusinesses([]);
    setSearchParams(null);
    setIsViewingSavedSearch(false);
    setError(null);
    router.replace('/dashboard');
  }, [router]);

  // Handle analyze
  const handleAnalyze = useCallback(async () => {
    if (!searchParams || businesses.length === 0) return;

    if (!user) {
      setAuthMode('signup');
      setShowAuthModal(true);
      return;
    }

    if (!subscription || subscription.tier === 'free') {
      setError('Upgrade to unlock Lead Intel features.');
      setShowBillingModal(true);
      return;
    }

    const selectedList = selectedBusinesses.size > 0
      ? Array.from(selectedBusinesses).map(i => businesses[i])
      : businesses;

    const alreadyAnalyzedIds = new Set(
      tableBusinesses
        .filter((b): b is EnrichedBusiness => !isPendingBusiness(b) && isEnrichedBusiness(b))
        .map(b => b.placeId || b.name)
    );
    const businessesToAnalyze = selectedList.filter(b => !alreadyAnalyzedIds.has(b.placeId || b.name));

    if (businessesToAnalyze.length === 0) {
      setError('All selected businesses have already been analyzed. Select different businesses or view your existing results in the Lead Intel tab.');
      setActiveTab('upgraded');
      return;
    }

    const creditsNeeded = businessesToAnalyze.length;

    let currentCredits = await getCredits();

    if (currentCredits < creditsNeeded) {
      await refreshUser();
      currentCredits = await getCredits();

      if (currentCredits < creditsNeeded) {
        setError(`You need ${creditsNeeded} credits to analyze ${businessesToAnalyze.length} businesses. You have ${currentCredits} credits remaining.`);
        setShowBillingModal(true);
        return;
      }
    }

    if (analyzeWorkerRef.current) {
      analyzeWorkerRef.current.terminate();
      analyzeWorkerRef.current = null;
    }

    setIsAnalyzing(true);
    setError(null);
    setWasAnalysisInterrupted(false);

    const pendingBusinesses: PendingBusiness[] = businessesToAnalyze.map(b => ({
      ...b,
      isEnriching: true as const,
    }));

    setTableBusinesses(prev => {
      const existingAnalyzed = prev.filter(b => !isPendingBusiness(b));
      const existingIds = new Set(existingAnalyzed.map(b => b.placeId || b.name));
      const newPending = pendingBusinesses.filter(b => !existingIds.has(b.placeId || b.name));
      return [...existingAnalyzed, ...newPending];
    });

    setAnalyzeProgress({ completed: 0, total: businessesToAnalyze.length, phase: 1, totalPhases: 3, message: 'Starting analysis...' });
    setActiveTab('upgraded');

    const endpoint = selectedBusinesses.size > 0 ? '/api/analyze-selected' : '/api/analyze-stream';

    let successfulAnalyses = 0;

    const worker = new Worker('/workers/analyze-worker.js');
    analyzeWorkerRef.current = worker;

    let serverDeductedCredits = false;

    // Save analyses to session helper
    const saveAnalysesToSession = async (enrichedBusinesses: EnrichedBusiness[]) => {
      if (!searchParams) return;
      try {
        await fetch('/api/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            niche: searchParams.niche,
            location: searchParams.location,
            businesses: enrichedBusinesses,
          }),
        });
      } catch (err) {
        console.error('[Session] Failed to save analyses:', err);
      }
    };

    const cleanup = async () => {
      setIsAnalyzing(false);
      setAnalyzeProgress(null);

      if (serverDeductedCredits) {
        refreshUser();
      }

      setTableBusinesses(current => {
        const enrichedOnly = current.filter((b): b is EnrichedBusiness =>
          !isPendingBusiness(b) && isEnrichedBusiness(b)
        );
        if (enrichedOnly.length > 0) {
          saveAnalysesToSession(enrichedOnly);
        }
        return current;
      });

      if (analyzeWorkerRef.current) {
        analyzeWorkerRef.current.terminate();
        analyzeWorkerRef.current = null;
      }
    };

    worker.onmessage = async (e: MessageEvent) => {
      const { type, payload } = e.data;

      switch (type) {
        case 'STARTED':
          if (payload?.serverSideDeduction) {
            serverDeductedCredits = true;
            console.log(`[Analysis] Server deducted ${payload.creditsDeducted} credits (${payload.creditsRemaining} remaining)`);
          }
          setAnalyzeProgress(prev => ({
            ...prev,
            completed: 0,
            total: payload?.total || businessesToAnalyze.length,
            phase: 1,
            totalPhases: 3,
            message: payload?.message || 'Starting analysis...',
          }));
          break;

        case 'STATUS':
          setAnalyzeProgress(prev => ({
            completed: prev?.completed || 0,
            total: prev?.total || businessesToAnalyze.length,
            phase: payload.phase,
            totalPhases: payload.totalPhases,
            message: payload.message,
            isBackground: payload.isBackground || false,
            firstPageComplete: prev?.firstPageComplete || false,
          }));
          break;

        case 'PROGRESS':
          setAnalyzeProgress(prev => ({
            completed: payload.completed,
            total: payload.total,
            phase: payload.phase || prev?.phase || 2,
            totalPhases: 3,
            message: payload.message,
            isBackground: payload.hasMore || prev?.isBackground || false,
            firstPageComplete: prev?.firstPageComplete || false,
          }));
          break;

        case 'BUSINESS_COMPLETE': {
          const enrichedBusiness: EnrichedBusiness = {
            ...payload.business,
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
          successfulAnalyses++;
          setAnalyzeProgress(prev => ({
            completed: payload.progress.completed,
            total: payload.progress.total,
            phase: 3,
            totalPhases: 3,
            message: `Analyzing ${payload.progress.completed}/${payload.progress.total}`,
            isBackground: prev?.isBackground || false,
            firstPageComplete: prev?.firstPageComplete || false,
          }));
          break;
        }

        case 'STREAM_ERROR':
          setError(payload.message || 'Analysis encountered an error');
          await cleanup();
          break;

        case 'ERROR':
          if (payload.requiresAuth) {
            setError('Please sign in to unlock Lead Intel');
            setAuthMode('signin');
            setShowAuthModal(true);
            await cleanup();
            return;
          }
          if (payload.requiresUpgrade) {
            setError('Upgrade to unlock Lead Intel features');
            setShowBillingModal(true);
            await cleanup();
            return;
          }
          if (payload.insufficientCredits) {
            setError(`Insufficient credits. You have ${payload.creditsRemaining} but need ${payload.creditsRequired}.`);
            setShowBillingModal(true);
            await cleanup();
            return;
          }
          setError(payload.error || 'Analysis failed');
          await cleanup();
          break;

        case 'COMPLETE':
          if (payload?.serverSideDeduction) {
            serverDeductedCredits = true;
          }
          await cleanup();
          break;
      }
    };

    worker.onerror = async (event: ErrorEvent) => {
      console.error('Worker error:', event.message, event.filename, event.lineno);
      const errorMessage = event.message?.includes('NetworkError') || event.message?.includes('fetch')
        ? 'Network error during analysis. Please check your connection and try again.'
        : 'Analysis failed due to a technical error. Please try again.';
      setError(errorMessage);
      await cleanup();
    };

    worker.postMessage({
      type: 'START_ANALYSIS',
      payload: {
        endpoint,
        businesses: businessesToAnalyze,
        niche: searchParams.niche,
        location: searchParams.location,
      },
    });
  }, [searchParams, businesses, selectedBusinesses, tableBusinesses, user, subscription, isPremium, getCredits, refreshUser, setAuthMode, setShowAuthModal, setShowBillingModal]);

  const value: SearchContextValue = {
    businesses,
    setBusinesses,
    tableBusinesses,
    setTableBusinesses,
    isSearching,
    setIsSearching,
    isAnalyzing,
    setIsAnalyzing,
    activeTab,
    setActiveTab,
    error,
    setError,
    searchParams,
    setSearchParams,
    selectedBusinesses,
    setSelectedBusinesses,
    isCached,
    setIsCached,
    isViewingSavedSearch,
    setIsViewingSavedSearch,
    analyzeProgress,
    setAnalyzeProgress,
    wasAnalysisInterrupted,
    setWasAnalysisInterrupted,
    isPreviewEnriching,
    isPreviewMode,
    previewExhausted,
    triggerFreePreview,
    handleSearch,
    handleAnalyze,
    handleNewSearch,
    hasResults,
    analyzeWorkerRef,
  };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
}
