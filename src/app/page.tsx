'use client';

import { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { SearchForm } from '@/components/SearchForm';
import { GeneralListTable } from '@/components/GeneralListTable';
import { UpgradedListTable } from '@/components/UpgradedListTable';
import { LoadingState } from '@/components/LoadingState';
import { PremiumGate } from '@/components/PremiumGate';
import { AuthModal } from '@/components/auth/AuthModal';
import { BillingModal } from '@/components/BillingModal';
import { SettingsModal } from '@/components/SettingsModal';
import { BusinessLookupModal } from '@/components/BusinessLookupModal';
import { useUser } from '@/hooks/useUser';
import { Business, EnrichedBusiness, TableBusiness, PendingBusiness, isPendingBusiness, isEnrichedBusiness } from '@/lib/types';
import { exportGeneralListToCSV, exportEnrichedListToCSV } from '@/lib/export';
// New app structure components
import { MarketingPage } from '@/components/marketing/MarketingPage';
import { AppShell } from '@/components/app/AppShell';
import { SearchTab } from '@/components/app/SearchTab';
import { LibraryTab } from '@/components/app/LibraryTab';
import { AccountTab } from '@/components/app/AccountTab';
import { createClient } from '@/lib/supabase/client';

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
  wasAnalyzing?: boolean; // Track if analysis was interrupted
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0f0f10] flex items-center justify-center">
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
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [savedAnalysesCount, setSavedAnalysesCount] = useState(0);
  const [isSessionConnected, setIsSessionConnected] = useState(false);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);
  const [wasAnalysisInterrupted, setWasAnalysisInterrupted] = useState(false);
  const [isViewingSavedSearch, setIsViewingSavedSearch] = useState(false);

  // Library state
  const [savedSearchesList, setSavedSearchesList] = useState<{
    id: string;
    niche: string;
    location: string;
    totalCount: number;
    analyzedCount: number;
    createdAt: Date;
    lastAccessed: Date;
  }[]>([]);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);

  // User is considered premium only if they have a paid subscription (not free tier)
  const isPremium = !!user && !!subscription && subscription.tier !== 'free';

  // Toast message for checkout success
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [rateLimitCountdown, setRateLimitCountdown] = useState<number | null>(null);

  const searchControllerRef = useRef<AbortController | null>(null);
  const analyzeControllerRef = useRef<AbortController | null>(null);
  const analyzeWorkerRef = useRef<Worker | null>(null);

  // Track in-flight search to prevent duplicate requests (double-click protection)
  const inFlightSearchRef = useRef<{ niche: string; location: string } | null>(null);

  // Handle checkout success/cancel from Stripe redirect
  useEffect(() => {
    const checkout = urlSearchParams.get('checkout');
    if (checkout === 'success') {
      // Clear the query parameter first
      const params = new URLSearchParams(window.location.search);
      params.delete('checkout');
      params.delete('session_id');
      const newUrl = params.toString() ? `?${params.toString()}` : '/';
      router.replace(newUrl, { scroll: false });

      // Poll for credit update (webhook may take a few seconds to process)
      const pollForCredits = async () => {
        const initialCredits = await getCredits();
        setToastMessage('Processing payment...');

        // Poll every 1 second for up to 10 seconds
        for (let i = 0; i < 10; i++) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          const currentCredits = await getCredits();
          if (currentCredits > initialCredits) {
            // Credits updated!
            await refreshUser();
            setToastMessage(`Payment successful! ${currentCredits - initialCredits} credits added.`);
            setTimeout(() => setToastMessage(null), 5000);
            return;
          }
        }

        // Timeout - credits may still be processing
        await refreshUser();
        setToastMessage('Payment received! Credits may take a moment to appear.');
        setTimeout(() => setToastMessage(null), 5000);
      };

      pollForCredits();
    } else if (checkout === 'canceled') {
      setToastMessage('Checkout was canceled.');
      // Clear the query parameter
      const params = new URLSearchParams(window.location.search);
      params.delete('checkout');
      const newUrl = params.toString() ? `?${params.toString()}` : '/';
      router.replace(newUrl, { scroll: false });
      setTimeout(() => setToastMessage(null), 3000);
    }
  }, [urlSearchParams, refreshUser, router, getCredits]);

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

    // Update toast message with countdown
    setToastMessage(`Rate limited. Please wait ${rateLimitCountdown} seconds...`);

    return () => clearTimeout(timer);
  }, [rateLimitCountdown]);

  // Fetch saved searches count - only for logged-in users
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

        // Transform analyses object to list format for LibraryTab
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

        // Sort by lastAccessed (most recent first)
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

  // Load saved search from library - loads both general list and analyzed businesses
  const loadSavedAnalyses = useCallback(async (niche: string, location: string) => {
    // Only load for paid subscribers (free users get 403 from API anyway)
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

          // Set ALL businesses for "All Results" tab (includes both basic and enriched)
          // This ensures the count matches what's shown in library
          setBusinesses(allBusinesses as Business[]);

          // Set only enriched businesses for "Lead Intel" tab
          setTableBusinesses(enrichedBusinesses as EnrichedBusiness[]);

          console.log(`[Session] Loaded saved search: ${allBusinesses.length} total, ${enrichedBusinesses.length} analyzed`);

          // Auto-switch to Lead Intel if there are analyzed businesses
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

  // Save businesses to database - works for both General List and Analyzed businesses
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
      // Refresh library list and count
      fetchSavedCount();
      fetchSavedSearchesList();
    } catch (error) {
      console.error('[Session] Failed to save to library:', error);
    }
  }, [user, fetchSavedCount, fetchSavedSearchesList]);

  // Legacy wrapper for analysis saves (uses current searchParams)
  const saveAnalysesToSession = useCallback(async (businesses: EnrichedBusiness[]) => {
    if (!searchParams) return;
    await saveToLibrary(businesses, searchParams.niche, searchParams.location);
  }, [searchParams, saveToLibrary]);

  // Determine if we're in "results mode" (compact header) or "hero mode" (full landing)
  // Has results if we have businesses from search OR enriched data from saved search
  const hasResults = businesses.length > 0 || (isViewingSavedSearch && tableBusinesses.length > 0);

  // Initialize session ID
  useEffect(() => {
    const sid = getSessionId();
    setSessionId(sid);
    setIsInitialized(true);
  }, []);

  // Restore state from sessionStorage ONLY if user is logged in
  // This prevents showing old data after logout
  useEffect(() => {
    if (isAuthLoading) return; // Wait for auth to load

    if (user) {
      // User is logged in - try to restore session
      try {
        const saved = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (saved) {
          const state: SessionState = JSON.parse(saved);
          setBusinesses(state.businesses || []);
          setTableBusinesses(state.tableBusinesses || []);
          setSearchParams(state.searchParams);
          setActiveTab(state.activeTab || 'general');
          // Check if analysis was interrupted (had partial results)
          if (state.wasAnalyzing && state.tableBusinesses && state.tableBusinesses.length > 0) {
            setWasAnalysisInterrupted(true);
          }
        }
      } catch (e) {
        console.error('Failed to restore session:', e);
      }
    } else {
      // User is logged out - clear sessionStorage and reset state
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      setBusinesses([]);
      setTableBusinesses([]);
      setSearchParams(null);
      setActiveTab('general');
      setSelectedBusinesses(new Set());
    }
  }, [user, isAuthLoading]);

  // NOTE: Saved analyses are loaded explicitly via handleLoadFromHistory
  // We removed the auto-load effect to prevent race conditions and double-fetches
  // The old effect was triggering when searchParams changed, causing loops

  // Fetch saved count and library list when user is logged in
  useEffect(() => {
    if (user) {
      fetchSavedCount();
      fetchSavedSearchesList();
    }
  }, [user, fetchSavedCount, fetchSavedSearchesList]);

  // Clear analyzed data for free tier users (they can't access Signals Pro)
  useEffect(() => {
    if (!isAuthLoading && (!subscription || subscription.tier === 'free')) {
      setTableBusinesses([]);
    }
  }, [isAuthLoading, subscription]);

  // Save state to sessionStorage - ONLY when user is logged in
  // This prevents re-saving data after logout clears it
  useEffect(() => {
    if (!isInitialized || !user) return; // Don't save if not logged in

    try {
      const state: SessionState = {
        businesses,
        tableBusinesses,
        searchParams,
        activeTab,
        wasAnalyzing: isAnalyzing, // Track if analysis is in progress
      };
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      // Handle quota exceeded error by clearing and retrying once
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

  // NOTE: URL updates are now handled explicitly in handleSearch success
  // This prevents feedback loops from continuous URL watching
  // The URL is updated ONCE after a successful search, not on every state change

  // SIMPLIFIED: URL is only used for navigation tabs (search/library/account)
  // Search params are NOT stored in URL to prevent feedback loops
  // Users access saved searches via the Library tab, not via URL
  // This is a cleaner, more predictable model that eliminates race conditions

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

  // Warn user when switching tabs during analysis (browsers throttle background tabs)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isAnalyzing) {
        // Show a toast or notification when user returns
        setToastMessage('Analysis is running in the background. For best results, keep this tab open.');
        // Auto-hide after 5 seconds
        setTimeout(() => setToastMessage(null), 5000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
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

  const handleSearch = async (niche: string, location: string) => {
    // Normalize inputs for comparison
    const normalizedNiche = niche.toLowerCase().trim();
    const normalizedLocation = location.toLowerCase().trim();

    // CRITICAL: Set in-flight marker IMMEDIATELY to prevent race conditions
    // This must happen BEFORE any async operations to prevent double-clicks
    // from triggering multiple searches
    if (
      inFlightSearchRef.current &&
      inFlightSearchRef.current.niche === normalizedNiche &&
      inFlightSearchRef.current.location === normalizedLocation
    ) {
      console.log('[Search] Duplicate request ignored - search already in progress');
      return;
    }

    // Mark as in-flight BEFORE any async work
    inFlightSearchRef.current = { niche: normalizedNiche, location: normalizedLocation };

    // Require sign-in for all searches
    if (!user) {
      inFlightSearchRef.current = null; // Clear marker on early exit
      setAuthMode('signup');
      setShowAuthModal(true);
      return;
    }

    // Get fresh credits from database (not stale React state)
    let currentCredits: number;
    try {
      currentCredits = await getCredits();
    } catch (err) {
      console.error('[Search] Error fetching credits:', err);
      inFlightSearchRef.current = null; // Clear marker on error
      setError('Unable to verify credits. Please refresh the page and try again.');
      return;
    }

    // Check if user has credits (1 credit per search)
    if (currentCredits < 1) {
      // Refresh and re-check in case credits were just added
      try {
        await refreshUser();
        currentCredits = await getCredits();
      } catch (err) {
        console.error('[Search] Error refreshing user:', err);
      }

      if (currentCredits < 1) {
        inFlightSearchRef.current = null; // Clear marker on early exit
        setError('You need 1 credit to search. Purchase more credits to continue.');
        setShowBillingModal(true);
        return;
      }
    }

    // Don't abort if we're already searching (shouldn't happen with dedup, but be safe)
    if (searchControllerRef.current && !searchControllerRef.current.signal.aborted) {
      console.log('[Search] Aborting previous search controller');
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
    setIsViewingSavedSearch(false); // Fresh search, not viewing saved

    try {
      console.log('[Search] Sending API request...');
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche, location }),
        signal: controller.signal,
      });

      console.log('[Search] API response received, status:', response.status);

      if (!response.ok) {
        const data = await response.json();

        // Handle rate limit specifically with toast + countdown
        if (response.status === 429 && data.retryAfter) {
          setRateLimitCountdown(data.retryAfter);
          return; // Don't clear existing results or show inline error
        }

        throw new Error(data.error || 'Search failed');
      }

      const data = await response.json();

      console.log('[Search] Search successful, received', data.businesses?.length, 'businesses, cached:', data.cached);

      // Only clear and update on SUCCESS
      setBusinesses(data.businesses);
      setTableBusinesses([]);
      setSelectedBusinesses(new Set());
      setIsCached(data.cached || false);
      setActiveTab('general');
      setIsViewingSavedSearch(false);

      // Credits are now deducted SERVER-SIDE - just refresh to get updated balance
      if (!data.cached) {
        // Server already deducted credit - just refresh UI state
        refreshUser();
      }

      // AUTO-SAVE: Save General List to library immediately
      // This ensures users don't lose their search even if they close the tab
      if (data.businesses && data.businesses.length > 0) {
        saveToLibrary(data.businesses, niche, location);
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;

      console.error('[Search] Error:', err);

      let errorMessage = 'An unexpected error occurred';
      if (err instanceof Error) {
        errorMessage = err.message;
        // Add more context for common network errors
        if (err.message === 'Failed to fetch' || err.message.includes('fetch')) {
          errorMessage = 'Network error: Unable to reach the server. Please check your internet connection and try again.';
          console.error('[Search] Network error details:', {
            name: err.name,
            message: err.message,
            stack: err.stack,
          });
        }
      }

      // Check if error message looks like a rate limit message
      if (errorMessage.includes('too many') || errorMessage.includes('wait')) {
        // Extract seconds from message like "Please wait 29 seconds"
        const match = errorMessage.match(/wait\s+(\d+)\s+seconds/i);
        if (match) {
          setRateLimitCountdown(parseInt(match[1], 10));
          return; // Don't show inline error for rate limits
        }
      }

      setError(errorMessage);
      // No credits deducted on failure
    } finally {
      console.log('[Search] Search completed (finally block)');
      setIsSearching(false);
      inFlightSearchRef.current = null; // Clear in-flight marker
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
    // User needs a paid subscription to access Signals Pro
    if (!user) {
      // Not logged in - show auth modal
      setAuthMode('signup');
      setShowAuthModal(true);
    } else {
      // Logged in but on free tier - show billing modal
      setShowBillingModal(true);
    }
    setShowUpgradeModal(false);
  };

  // Load a search from saved history (no credit cost - just loads saved data)
  const handleLoadFromHistory = async (niche: string, location: string) => {
    // Prevent re-entry if already loading
    if (isLoadingSaved) return;

    setSearchParams({ niche, location });
    setIsViewingSavedSearch(true); // Mark as viewing saved search
    setError(null);

    // Clear existing data before loading (loadSavedAnalyses will populate both lists)
    setBusinesses([]);
    setTableBusinesses([]);

    // Load the saved search (includes both general list and analyzed businesses)
    // This will also set the appropriate active tab based on data
    await loadSavedAnalyses(niche, location);
  };

  // Handle clicking a search from Library tab
  const handleLibrarySearchClick = (search: { id: string; niche: string; location: string }) => {
    handleLoadFromHistory(search.niche, search.location);
  };

  // Handle deleting a search from library
  const handleDeleteSearch = async (searchId: string) => {
    try {
      const response = await fetch(`/api/session?key=${encodeURIComponent(searchId)}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        // Refresh the library list
        fetchSavedSearchesList();
      }
    } catch (error) {
      console.error('[Library] Failed to delete search:', error);
    }
  };

  // Handle clearing all history
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
    // Clear all local state
    setBusinesses([]);
    setTableBusinesses([]);
    setSearchParams(null);
    setSavedSearchesList([]);
    setSavedAnalysesCount(0);
    router.replace('/');
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

    // Check if user has a paid subscription (not free tier)
    if (!subscription || subscription.tier === 'free') {
      setError('Upgrade to unlock Lead Intel features.');
      setShowBillingModal(true);
      return;
    }

    // Get selected businesses
    const selectedList = selectedBusinesses.size > 0
      ? Array.from(selectedBusinesses).map(i => businesses[i])
      : businesses;

    // Filter out businesses that are ALREADY analyzed (prevent duplicate charges)
    const alreadyAnalyzedIds = new Set(
      tableBusinesses
        .filter((b): b is EnrichedBusiness => !isPendingBusiness(b) && isEnrichedBusiness(b))
        .map(b => b.placeId || b.name)
    );
    const businessesToAnalyze = selectedList.filter(b => !alreadyAnalyzedIds.has(b.placeId || b.name));

    // Check if all selected businesses are already analyzed
    if (businessesToAnalyze.length === 0) {
      setError('All selected businesses have already been analyzed. Select different businesses or view your existing results in the Lead Intel tab.');
      setActiveTab('upgraded');
      return;
    }

    // Notify user if some were skipped
    const skippedCount = selectedList.length - businessesToAnalyze.length;
    if (skippedCount > 0) {
      console.log(`Skipping ${skippedCount} already-analyzed businesses`);
    }

    const creditsNeeded = businessesToAnalyze.length;

    // Get fresh credits from database (not stale React state)
    let currentCredits = await getCredits();

    if (currentCredits < creditsNeeded) {
      // Refresh user state to update UI with latest credits
      await refreshUser();
      // Re-check credits in case they were updated
      currentCredits = await getCredits();

      if (currentCredits < creditsNeeded) {
        setError(`You need ${creditsNeeded} credits to analyze ${businessesToAnalyze.length} businesses. You have ${currentCredits} credits remaining.`);
        setShowBillingModal(true);
        return;
      }
    }

    // Terminate any existing worker
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

    // Merge with existing analyzed businesses
    setTableBusinesses(prev => {
      const existingAnalyzed = prev.filter(b => !isPendingBusiness(b));
      const existingIds = new Set(existingAnalyzed.map(b => b.placeId || b.name));
      const newPending = pendingBusinesses.filter(b => !existingIds.has(b.placeId || b.name));
      return [...existingAnalyzed, ...newPending];
    });

    setAnalyzeProgress({ completed: 0, total: businessesToAnalyze.length, phase: 1, totalPhases: 3, message: 'Starting analysis...' });
    setActiveTab('upgraded');

    const endpoint = selectedBusinesses.size > 0 ? '/api/analyze-selected' : '/api/analyze-stream';

    // Track successful analyses for logging
    let successfulAnalyses = 0;

    // Create Web Worker for background processing (survives tab switches better)
    const worker = new Worker('/workers/analyze-worker.js');
    analyzeWorkerRef.current = worker;

    // Track if server already deducted credits (prevents double-deduction)
    let serverDeductedCredits = false;

    // Handle completion/cleanup
    const cleanup = async () => {
      setIsAnalyzing(false);
      setAnalyzeProgress(null);

      // Credits are now deducted SERVER-SIDE at the start of analysis
      // Just refresh UI state to reflect the server's deduction
      if (serverDeductedCredits) {
        refreshUser();
      }

      // Save enriched businesses to session
      setTableBusinesses(current => {
        const enrichedOnly = current.filter((b): b is EnrichedBusiness =>
          !isPendingBusiness(b) && isEnrichedBusiness(b)
        );
        if (enrichedOnly.length > 0) {
          saveAnalysesToSession(enrichedOnly);
        }
        return current;
      });

      // Clean up worker
      if (analyzeWorkerRef.current) {
        analyzeWorkerRef.current.terminate();
        analyzeWorkerRef.current = null;
      }
    };

    // Handle messages from worker
    worker.onmessage = async (e: MessageEvent) => {
      const { type, payload } = e.data;

      switch (type) {
        case 'STARTED':
          // Server deducted credits at start - track this to prevent double-deduction
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
          await cleanup(); // Ensure we clean up on stream errors too
          break;

        case 'ERROR':
          // Handle auth/billing errors from server
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
          await cleanup(); // Credits already deducted server-side
          break;

        case 'COMPLETE':
          // Server already deducted credits - just refresh UI
          if (payload?.serverSideDeduction) {
            serverDeductedCredits = true;
          }
          await cleanup();
          break;
      }
    };

    worker.onerror = async (event: ErrorEvent) => {
      console.error('Worker error:', event.message, event.filename, event.lineno);
      // Provide more context if available
      const errorMessage = event.message?.includes('NetworkError') || event.message?.includes('fetch')
        ? 'Network error during analysis. Please check your connection and try again.'
        : 'Analysis failed due to a technical error. Please try again.';
      setError(errorMessage);
      await cleanup(); // Credits already deducted server-side
    };

    // Start the worker
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

  // Get recent searches for SearchTab (top 3)
  const recentSearches = savedSearchesList.slice(0, 3);

  // ============================================
  // RENDER: Auth Loading
  // ============================================
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#0f0f10] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER: Marketing Page (Not Logged In)
  // ============================================
  if (!user) {
    return (
      <>
        <MarketingPage
          onSignIn={() => {
            setAuthMode('signin');
            setShowAuthModal(true);
          }}
          onSignUp={() => {
            setAuthMode('signup');
            setShowAuthModal(true);
          }}
        />
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          defaultMode={authMode}
        />
      </>
    );
  }

  // ============================================
  // RENDER: App (Logged In)
  // ============================================

  // Build the search form component
  // Search form should be clean when viewing saved searches (those show in Library)
  // Only show initial values for active/new searches
  const searchFormComponent = (
    <SearchForm
      onSearch={handleSearch}
      isLoading={isSearching}
      initialNiche={isViewingSavedSearch ? undefined : searchParams?.niche}
      initialLocation={isViewingSavedSearch ? undefined : searchParams?.location}
      compact={false} // Search tab form is never compact
    />
  );

  // Handler to clear results and start new search
  const handleNewSearch = () => {
    setBusinesses([]);
    setTableBusinesses([]);
    setSearchParams(null);
    setIsViewingSavedSearch(false);
    setError(null);
    router.replace('/');
  };

  // Build the results component (when we have results)
  const resultsComponent = hasResults ? (
    <div className="space-y-4 p-4">
      {/* Search Context Header */}
      {searchParams && !isViewingSavedSearch && (
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span>
            Results for <span className="text-white font-medium">{searchParams.niche}</span> in <span className="text-white font-medium">{searchParams.location}</span>
          </span>
          {isCached && (
            <span className="px-2 py-0.5 text-xs bg-zinc-800 text-zinc-500 rounded">Cached</span>
          )}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-500/10 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 bg-zinc-900/60 rounded-xl shadow-lg shadow-black/20 overflow-x-auto">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-3 sm:px-4 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap ${activeTab === 'general'
              ? 'bg-zinc-800 text-white shadow-sm'
              : 'text-zinc-400 hover:text-white'
              }`}
          >
            All Results
            <span className="ml-1.5 sm:ml-2 text-zinc-500">({businesses.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('upgraded')}
            className={`px-3 sm:px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap ${activeTab === 'upgraded'
              ? 'bg-zinc-800 text-white shadow-sm'
              : 'text-zinc-400 hover:text-white'
              }`}
          >
            <span>Lead Intel</span>
            {isPremium ? (
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-emerald-500/20 text-emerald-400">
                PRO
              </span>
            ) : (
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-violet-500/20 text-violet-400">
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
          {/* New Search - only show when not viewing saved search (those use back button) */}
          {!isViewingSavedSearch && (
            <button
              onClick={handleNewSearch}
              className="px-3 py-2 text-sm font-medium rounded-lg bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="hidden sm:inline">New Search</span>
            </button>
          )}

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
            className="px-3 py-2 text-sm font-medium rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="hidden sm:inline">Export</span>
          </button>

          {/* Analyze Button - only show when we have businesses to analyze */}
          {activeTab === 'general' && businesses.length > 0 && (
            isPremium ? (
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="px-3 sm:px-4 py-2 text-sm font-medium rounded-lg bg-violet-600 text-white hover:bg-violet-500 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span className="hidden sm:inline">
                  {selectedBusinesses.size > 0
                    ? `Get Intel on ${selectedBusinesses.size}`
                    : 'Get Lead Intel'}
                </span>
                <span className="sm:hidden">Get Intel</span>
              </button>
            ) : (
              <button
                onClick={() => setShowBillingModal(true)}
                className="px-3 sm:px-4 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-500 hover:to-purple-500 transition-all flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="hidden sm:inline">Unlock Lead Intel</span>
                <span className="sm:hidden">Unlock</span>
              </button>
            )
          )}
        </div>
      </div>

      {/* Interrupted Analysis Banner */}
      {wasAnalysisInterrupted && !isAnalyzing && tableBusinesses.length > 0 && (
        <div className="p-3 rounded-lg bg-amber-500/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-sm text-amber-400">
              Analysis was interrupted. {tableBusinesses.filter(b => !isPendingBusiness(b)).length} of {businesses.length} businesses analyzed.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setWasAnalysisInterrupted(false)}
              className="text-xs text-zinc-400 hover:text-white px-2 py-1"
            >
              Dismiss
            </button>
            <button
              onClick={handleAnalyze}
              className="text-xs font-medium text-amber-400 hover:text-amber-300 px-3 py-1 rounded hover:bg-amber-500/10"
            >
              Continue Analysis
            </button>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {isAnalyzing && analyzeProgress && (
        <div className={`p-3 rounded-lg ${analyzeProgress.firstPageComplete
          ? 'bg-emerald-500/5'
          : 'bg-violet-500/5'
          }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                {[1, 2, 3].map((phase) => (
                  <div
                    key={phase}
                    className={`w-2 h-2 rounded-full transition-all ${phase < (analyzeProgress.phase || 0)
                      ? 'bg-emerald-500'
                      : phase === analyzeProgress.phase
                        ? 'bg-violet-500 animate-pulse'
                        : 'bg-zinc-700'
                      }`}
                  />
                ))}
              </div>
              <span className={`text-sm font-medium ${analyzeProgress.firstPageComplete ? 'text-emerald-400' : 'text-violet-400'
                }`}>
                {analyzeProgress.message}
              </span>
            </div>
            <span className={`text-sm ${analyzeProgress.firstPageComplete ? 'text-emerald-400' : 'text-violet-400'
              }`}>
              {analyzeProgress.completed}/{analyzeProgress.total}
            </span>
          </div>
          <div className={`h-1 rounded-full ${analyzeProgress.firstPageComplete ? 'bg-emerald-500/20' : 'bg-violet-500/20'
            }`}>
            <div
              className={`h-full rounded-full transition-all duration-300 ${analyzeProgress.firstPageComplete ? 'bg-emerald-500' : 'bg-violet-500'
                }`}
              style={{ width: `${(analyzeProgress.completed / analyzeProgress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className={`bg-zinc-900/60 rounded-xl shadow-lg shadow-black/20 overflow-hidden ${activeTab === 'upgraded' && isPremium
        ? 'ring-1 ring-violet-500/20'
        : ''
        }`}>
        {activeTab === 'general' ? (
          isViewingSavedSearch && businesses.length === 0 ? (
            // Viewing saved search - no general list available
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-xl bg-zinc-800/50 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-zinc-300 mb-1">Viewing Saved Search</h3>
              <p className="text-xs text-zinc-500 max-w-xs mb-4">
                This is your saved analysis data. Run a new search to see all results.
              </p>
              <button
                onClick={handleNewSearch}
                className="px-4 py-2 text-xs font-medium text-violet-400 hover:text-violet-300 transition-colors"
              >
                Start New Search
              </button>
            </div>
          ) : (
            <GeneralListTable
              businesses={businesses}
              selectedBusinesses={selectedBusinesses}
              onSelectionChange={setSelectedBusinesses}
            />
          )
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
  ) : null;

  // Handler to go back to library list
  const handleBackToLibraryList = () => {
    setSearchParams(null);
    setBusinesses([]);
    setTableBusinesses([]);
    setIsViewingSavedSearch(false);
    router.replace('/?tab=library');
  };

  // Search Tab content - shows form, and results inline after search (Google-style UX)
  const searchTabContent = (
    <>
      {isSearching ? (
        <div className="py-16">
          <LoadingState message="Scanning Google Business Profiles..." />
        </div>
      ) : hasResults && !isViewingSavedSearch ? (
        // Show results inline after successful search
        <div className="space-y-4">
          {/* Compact search form at top for easy refinement */}
          <div className="px-4 pt-4">
            <SearchForm
              onSearch={handleSearch}
              isLoading={isSearching}
              initialNiche={searchParams?.niche}
              initialLocation={searchParams?.location}
              compact={true}
            />
          </div>
          {/* Results below */}
          {resultsComponent}
        </div>
      ) : (
        <SearchTab
          searchForm={searchFormComponent}
          recentSearches={recentSearches}
          onRecentSearchClick={(search) => handleLoadFromHistory(search.niche, search.location)}
          onLookupClick={() => setShowLookupModal(true)}
          credits={credits}
          isSearching={isSearching}
        />
      )}
      {/* Error display */}
      {error && (
        <div className="max-w-2xl mx-auto px-4">
          <div className="p-4 bg-red-500/10 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        </div>
      )}
    </>
  );

  // Library Tab content - includes results when viewing a search
  const libraryTabContent = (
    <LibraryTab
      searches={savedSearchesList}
      isLoading={isLoadingLibrary}
      onSearchClick={handleLibrarySearchClick}
      onDeleteSearch={handleDeleteSearch}
      onClearAll={handleClearAllSearches}
      // Detail view props
      activeSearch={hasResults ? searchParams : null}
      resultsContent={hasResults ? resultsComponent : undefined}
      onBackToList={handleBackToLibraryList}
      isLoadingResults={isLoadingSaved}
    />
  );

  // Account Tab content
  const accountTabContent = (
    <AccountTab
      user={user}
      credits={credits}
      tier={tier}
      onOpenBilling={() => setShowBillingModal(true)}
      onOpenSettings={() => setShowSettingsModal(true)}
      onSignOut={handleSignOut}
    />
  );

  // Get user display name for sidebar
  const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';

  return (
    <>
      <AppShell
        credits={credits}
        tier={tier}
        userName={userName}
        recentSearches={recentSearches}
        libraryCount={savedAnalysesCount}
        onSearchSelect={(searchId) => {
          const search = savedSearchesList.find(s => s.id === searchId);
          if (search) {
            handleLoadFromHistory(search.niche, search.location);
          }
        }}
        // Force Library tab when viewing saved search to avoid race condition with URL update
        forceTab={isViewingSavedSearch && hasResults ? 'library' : undefined}
        // Reset state when user explicitly navigates to a different tab
        onTabChange={(tab) => {
          if (tab === 'search' && isViewingSavedSearch) {
            // User is navigating to Search tab while viewing a saved search
            // Reset all search-related state for a fresh search
            setBusinesses([]);
            setTableBusinesses([]);
            setSearchParams(null);
            setIsViewingSavedSearch(false);
            setError(null);
            setActiveTab('general');
          } else if (tab === 'library' && isViewingSavedSearch) {
            // Navigating back to library list while viewing a search
            setSearchParams(null);
            setBusinesses([]);
            setTableBusinesses([]);
            setIsViewingSavedSearch(false);
          }
        }}
      >
        {{
          search: searchTabContent,
          library: libraryTabContent,
          account: accountTabContent,
        }}
      </AppShell>

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

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        user={user}
      />

      {/* Business Lookup Modal */}
      <BusinessLookupModal
        isOpen={showLookupModal}
        onClose={() => setShowLookupModal(false)}
        isPremium={isPremium}
        onUpgradeClick={() => {
          setShowLookupModal(false);
          setShowBillingModal(true);
        }}
        onSaved={fetchSavedCount}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 md:bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className={`rounded-xl px-4 py-3 shadow-lg shadow-black/30 flex items-center gap-3 ${
            toastMessage.includes('Rate limited') || toastMessage.includes('wait')
              ? 'bg-red-500/10'
              : 'bg-zinc-900'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              toastMessage.includes('successful') ? 'bg-emerald-500'
              : toastMessage.includes('Rate limited') || toastMessage.includes('wait') ? 'bg-red-500'
              : 'bg-amber-500'
            }`} />
            <span className={`text-sm ${
              toastMessage.includes('Rate limited') || toastMessage.includes('wait')
                ? 'text-red-300'
                : 'text-zinc-200'
            }`}>{toastMessage}</span>
            {!rateLimitCountdown && (
              <button
                onClick={() => setToastMessage(null)}
                className="text-zinc-400 hover:text-white ml-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
