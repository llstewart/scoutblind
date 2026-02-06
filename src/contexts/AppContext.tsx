'use client';

import { createContext, useContext, useState, useRef, useEffect, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { Business, EnrichedBusiness, TableBusiness, PendingBusiness, isPendingBusiness, isEnrichedBusiness } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';

type TabType = 'general' | 'upgraded' | 'market';

const SESSION_STORAGE_KEY = 'truesignal_session';
const PERSISTENT_SESSION_ID_KEY = 'truesignal_sid';

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

interface SavedSearch {
  id: string;
  niche: string;
  location: string;
  totalCount: number;
  analyzedCount: number;
  createdAt: Date;
  lastAccessed: Date;
}

interface AnalyzeProgress {
  completed: number;
  total: number;
  phase?: number;
  totalPhases?: number;
  message?: string;
  isBackground?: boolean;
  firstPageComplete?: boolean;
}

interface AppContextValue {
  // User & Auth
  user: ReturnType<typeof useUser>['user'];
  subscription: ReturnType<typeof useUser>['subscription'];
  isAuthLoading: boolean;
  credits: number;
  tier: string;
  isPremium: boolean;
  refreshUser: () => Promise<void>;
  getCredits: () => Promise<number>;

  // Modals
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  authMode: 'signin' | 'signup';
  setAuthMode: (mode: 'signin' | 'signup') => void;
  showBillingModal: boolean;
  setShowBillingModal: (show: boolean) => void;
  showSettingsModal: boolean;
  setShowSettingsModal: (show: boolean) => void;
  showLookupModal: boolean;
  setShowLookupModal: (show: boolean) => void;

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

  // Library State
  savedSearchesList: SavedSearch[];
  setSavedSearchesList: (searches: SavedSearch[]) => void;
  savedAnalysesCount: number;
  isLoadingLibrary: boolean;
  isLoadingSaved: boolean;

  // Analysis State
  analyzeProgress: AnalyzeProgress | null;
  setAnalyzeProgress: (progress: AnalyzeProgress | null) => void;
  wasAnalysisInterrupted: boolean;
  setWasAnalysisInterrupted: (interrupted: boolean) => void;

  // Toast
  toastMessage: string | null;
  setToastMessage: (message: string | null) => void;
  rateLimitCountdown: number | null;
  setRateLimitCountdown: (countdown: number | null) => void;

  // Functions
  handleSearch: (niche: string, location: string) => Promise<void>;
  handleAnalyze: () => Promise<void>;
  handleLoadFromHistory: (niche: string, location: string) => Promise<void>;
  handleDeleteSearch: (searchId: string) => Promise<void>;
  handleClearAllSearches: () => Promise<void>;
  handleSignOut: () => Promise<void>;
  handleNewSearch: () => void;
  handleUpgradeClick: () => void;
  fetchSavedSearchesList: () => Promise<void>;
  saveToLibrary: (businesses: (Business | EnrichedBusiness)[], niche: string, location: string) => Promise<void>;

  // Computed
  hasResults: boolean;
  recentSearches: SavedSearch[];

  // Refs for analysis worker
  analyzeWorkerRef: React.MutableRefObject<Worker | null>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
}

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const router = useRouter();

  // Auth state
  const { user, subscription, isLoading: isAuthLoading, credits, tier, refreshUser, deductCredit, getCredits } = useUser();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showLookupModal, setShowLookupModal] = useState(false);

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
  const [sessionId, setSessionId] = useState<string>('');
  const [savedAnalysesCount, setSavedAnalysesCount] = useState(0);
  const [isSessionConnected, setIsSessionConnected] = useState(false);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);
  const [wasAnalysisInterrupted, setWasAnalysisInterrupted] = useState(false);
  const [isViewingSavedSearch, setIsViewingSavedSearch] = useState(false);

  // Library state
  const [savedSearchesList, setSavedSearchesList] = useState<SavedSearch[]>([]);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);

  // User is considered premium only if they have a paid subscription (not free tier)
  const isPremium = !!user && !!subscription && subscription.tier !== 'free';

  // Toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [rateLimitCountdown, setRateLimitCountdown] = useState<number | null>(null);

  const searchControllerRef = useRef<AbortController | null>(null);
  const analyzeControllerRef = useRef<AbortController | null>(null);
  const analyzeWorkerRef = useRef<Worker | null>(null);
  const inFlightSearchRef = useRef<{ niche: string; location: string } | null>(null);

  // Analysis progress
  const [analyzeProgress, setAnalyzeProgress] = useState<AnalyzeProgress | null>(null);

  // Computed values
  const hasResults = businesses.length > 0 || (isViewingSavedSearch && tableBusinesses.length > 0);
  const recentSearches = savedSearchesList.slice(0, 3);

  // Rate limit countdown timer
  useEffect(() => {
    if (rateLimitCountdown === null || rateLimitCountdown <= 0) {
      if (rateLimitCountdown === 0) {
        setRateLimitCountdown(null);
        setToastMessage(null);
      }
      return;
    }

    const timer = setTimeout(() => {
      setRateLimitCountdown(prev => (prev !== null ? prev - 1 : null));
    }, 1000);

    setToastMessage(`Rate limited. Please wait ${rateLimitCountdown} seconds...`);

    return () => clearTimeout(timer);
  }, [rateLimitCountdown]);

  // Fetch saved searches count
  const fetchSavedCount = useCallback(async () => {
    if (!user) {
      setSavedAnalysesCount(0);
      return;
    }
    try {
      const response = await fetch('/api/session');
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
  }, [user]);

  // Fetch saved searches list for Library tab
  const fetchSavedSearchesList = useCallback(async () => {
    if (!user) {
      setSavedSearchesList([]);
      return;
    }
    setIsLoadingLibrary(true);
    try {
      const response = await fetch('/api/session');
      if (response.ok) {
        const data = await response.json();
        const analyses = data.analyses || {};

        const searchesList = Object.entries(analyses).map(([key, value]: [string, any]) => {
          const [niche, location] = key.split('|');
          return {
            id: key,
            niche: niche || '',
            location: location || '',
            totalCount: value.businessCount || 0,
            analyzedCount: value.analyzedCount || 0,
            createdAt: new Date(value.createdAt || Date.now()),
            lastAccessed: new Date(value.lastAccessed || Date.now()),
          };
        });

        searchesList.sort((a, b) => b.lastAccessed.getTime() - a.lastAccessed.getTime());

        setSavedSearchesList(searchesList);
        setSavedAnalysesCount(searchesList.length);
      }
    } catch (error) {
      console.error('[Library] Failed to fetch saved searches:', error);
    } finally {
      setIsLoadingLibrary(false);
    }
  }, [user]);

  // Load saved search from library
  const loadSavedAnalyses = useCallback(async (niche: string, location: string) => {
    if (!user || !subscription || subscription.tier === 'free') return;
    setIsLoadingSaved(true);
    try {
      const response = await fetch(
        `/api/session?niche=${encodeURIComponent(niche)}&location=${encodeURIComponent(location)}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.businesses && data.businesses.length > 0) {
          const allBusinesses = data.businesses as (Business | EnrichedBusiness)[];
          const enrichedBusinesses = allBusinesses.filter((b: any) => isEnrichedBusiness(b));

          setBusinesses(allBusinesses as Business[]);
          setTableBusinesses(enrichedBusinesses as EnrichedBusiness[]);

          console.log(`[Session] Loaded saved search: ${allBusinesses.length} total, ${enrichedBusinesses.length} analyzed`);

          if (enrichedBusinesses.length > 0) {
            setActiveTab('upgraded');
          } else {
            setActiveTab('general');
          }
        }
        setIsSessionConnected(true);
      }
    } catch (error) {
      console.error('[Session] Failed to load saved searches:', error);
      setIsSessionConnected(false);
    } finally {
      setIsLoadingSaved(false);
    }
  }, [user, subscription]);

  // Save businesses to database
  const saveToLibrary = useCallback(async (
    businessesToSave: (Business | EnrichedBusiness)[],
    niche: string,
    location: string
  ) => {
    if (!user) return;
    try {
      await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          niche,
          location,
          businesses: businessesToSave,
        }),
      });
      console.log(`[Session] Saved ${businessesToSave.length} businesses to library`);
      fetchSavedCount();
      fetchSavedSearchesList();
    } catch (error) {
      console.error('[Session] Failed to save to library:', error);
    }
  }, [user, fetchSavedCount, fetchSavedSearchesList]);

  // Save analyses to session (legacy wrapper)
  const saveAnalysesToSession = useCallback(async (businesses: EnrichedBusiness[]) => {
    if (!searchParams) return;
    await saveToLibrary(businesses, searchParams.niche, searchParams.location);
  }, [searchParams, saveToLibrary]);

  // Initialize session ID
  useEffect(() => {
    const sid = getSessionId();
    setSessionId(sid);
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
          setActiveTab(state.activeTab || 'general');
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

  // Fetch saved count and library list when user is logged in
  useEffect(() => {
    if (user) {
      fetchSavedCount();
      fetchSavedSearchesList();
    }
  }, [user, fetchSavedCount, fetchSavedSearchesList]);

  // Clear analyzed data for free tier users
  useEffect(() => {
    if (!isAuthLoading && (!subscription || subscription.tier === 'free')) {
      setTableBusinesses([]);
    }
  }, [isAuthLoading, subscription]);

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
        e.returnValue = 'Analysis is in progress. Your progress will be saved, but the analysis will stop. Are you sure you want to leave?';
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

  // Handle search
  const handleSearch = async (niche: string, location: string) => {
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

      setBusinesses(data.businesses);
      setTableBusinesses([]);
      setSelectedBusinesses(new Set());
      setIsCached(data.cached || false);
      setActiveTab('general');
      setIsViewingSavedSearch(false);

      if (!data.cached) {
        refreshUser();
      }

      if (data.businesses && data.businesses.length > 0) {
        saveToLibrary(data.businesses, niche, location);
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
  };

  // Handle upgrade click
  const handleUpgradeClick = () => {
    if (!user) {
      setAuthMode('signup');
      setShowAuthModal(true);
    } else {
      setShowBillingModal(true);
    }
  };

  // Handle load from history
  const handleLoadFromHistory = async (niche: string, location: string) => {
    if (isLoadingSaved) return;

    setSearchParams({ niche, location });
    setIsViewingSavedSearch(true);
    setError(null);

    setBusinesses([]);
    setTableBusinesses([]);

    await loadSavedAnalyses(niche, location);
  };

  // Handle delete search
  const handleDeleteSearch = async (searchId: string) => {
    try {
      const response = await fetch(`/api/session?key=${encodeURIComponent(searchId)}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchSavedSearchesList();
      }
    } catch (error) {
      console.error('[Library] Failed to delete search:', error);
    }
  };

  // Handle clear all searches
  const handleClearAllSearches = async () => {
    try {
      const response = await fetch('/api/session', {
        method: 'DELETE',
      });
      if (response.ok) {
        setSavedSearchesList([]);
        setSavedAnalysesCount(0);
        setTableBusinesses([]);
      }
    } catch (error) {
      console.error('[Library] Failed to clear all searches:', error);
    }
  };

  // Handle sign out
  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setBusinesses([]);
    setTableBusinesses([]);
    setSearchParams(null);
    setSavedSearchesList([]);
    setSavedAnalysesCount(0);
    router.replace('/');
  };

  // Handle new search
  const handleNewSearch = () => {
    setBusinesses([]);
    setTableBusinesses([]);
    setSearchParams(null);
    setIsViewingSavedSearch(false);
    setError(null);
    router.replace('/dashboard');
  };

  // Handle analyze (simplified - full implementation would be moved here)
  const handleAnalyze = async () => {
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

        case 'FIRST_PAGE_COMPLETE':
          setAnalyzeProgress({
            completed: payload.completed,
            total: payload.total,
            phase: 3,
            totalPhases: 3,
            message: payload.message,
            isBackground: payload.hasMore,
            firstPageComplete: true,
          });
          break;

        case 'BUSINESS_COMPLETE':
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
  };

  const value: AppContextValue = {
    // User & Auth
    user,
    subscription,
    isAuthLoading,
    credits,
    tier,
    isPremium,
    refreshUser,
    getCredits,

    // Modals
    showAuthModal,
    setShowAuthModal,
    authMode,
    setAuthMode,
    showBillingModal,
    setShowBillingModal,
    showSettingsModal,
    setShowSettingsModal,
    showLookupModal,
    setShowLookupModal,

    // Search State
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

    // Library State
    savedSearchesList,
    setSavedSearchesList,
    savedAnalysesCount,
    isLoadingLibrary,
    isLoadingSaved,

    // Analysis State
    analyzeProgress,
    setAnalyzeProgress,
    wasAnalysisInterrupted,
    setWasAnalysisInterrupted,

    // Toast
    toastMessage,
    setToastMessage,
    rateLimitCountdown,
    setRateLimitCountdown,

    // Functions
    handleSearch,
    handleAnalyze,
    handleLoadFromHistory,
    handleDeleteSearch,
    handleClearAllSearches,
    handleSignOut,
    handleNewSearch,
    handleUpgradeClick,
    fetchSavedSearchesList,
    saveToLibrary,

    // Computed
    hasResults,
    recentSearches,

    // Refs
    analyzeWorkerRef,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}
