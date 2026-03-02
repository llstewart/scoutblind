'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUI } from '@/contexts/UIContext';
import { useSearch } from '@/contexts/SearchContext';
import { Business, EnrichedBusiness, isEnrichedBusiness } from '@/lib/types';

export interface SavedSearch {
  id: string;
  niche: string;
  location: string;
  totalCount: number;
  analyzedCount: number;
  createdAt: Date;
  lastAccessed: Date;
}

interface LibraryContextValue {
  savedSearchesList: SavedSearch[];
  setSavedSearchesList: (searches: SavedSearch[]) => void;
  savedAnalysesCount: number;
  isLoadingLibrary: boolean;
  isLoadingSaved: boolean;

  // Computed
  recentSearches: SavedSearch[];

  // Functions
  fetchSavedSearchesList: () => Promise<void>;
  saveToLibrary: (businesses: (Business | EnrichedBusiness)[], niche: string, location: string) => Promise<void>;
  handleLoadFromHistory: (niche: string, location: string) => Promise<void>;
  handleDeleteSearch: (searchId: string) => Promise<void>;
  handleClearAllSearches: () => Promise<void>;
}

const LibraryContext = createContext<LibraryContextValue | null>(null);

export function useLibrary() {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error('useLibrary must be used within LibraryProvider');
  }
  return context;
}

interface LibraryProviderProps {
  children: ReactNode;
}

export function LibraryProvider({ children }: LibraryProviderProps) {
  const { user, isPremium } = useAuth();
  const { setToastMessage } = useUI();
  const {
    setBusinesses,
    setTableBusinesses,
    setSearchParams,
    setActiveTab,
    setIsViewingSavedSearch,
    setError,
  } = useSearch();

  // Library state
  const [savedSearchesList, setSavedSearchesList] = useState<SavedSearch[]>([]);
  const [savedAnalysesCount, setSavedAnalysesCount] = useState(0);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);

  // Computed
  const recentSearches = savedSearchesList.slice(0, 3);

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
      }
    } catch {
      // silently fail
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

  // Load saved search from library
  const loadSavedAnalyses = useCallback(async (niche: string, location: string) => {
    if (!user) return;
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
      }
    } catch (error) {
      console.error('[Session] Failed to load saved searches:', error);
    } finally {
      setIsLoadingSaved(false);
    }
  }, [user, setBusinesses, setTableBusinesses, setActiveTab]);

  // Handle load from history
  const handleLoadFromHistory = useCallback(async (niche: string, location: string) => {
    if (isLoadingSaved) return;

    setSearchParams({ niche, location });
    setIsViewingSavedSearch(true);
    setError(null);

    setBusinesses([]);
    setTableBusinesses([]);

    await loadSavedAnalyses(niche, location);
  }, [isLoadingSaved, loadSavedAnalyses, setSearchParams, setIsViewingSavedSearch, setError, setBusinesses, setTableBusinesses]);

  // Handle delete search
  const handleDeleteSearch = useCallback(async (searchId: string) => {
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
  }, [fetchSavedSearchesList]);

  // Handle clear all searches
  const handleClearAllSearches = useCallback(async () => {
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
  }, [setTableBusinesses]);

  // Fetch saved count and library list when user is logged in
  useEffect(() => {
    if (user) {
      fetchSavedCount();
      fetchSavedSearchesList();
    }
  }, [user, fetchSavedCount, fetchSavedSearchesList]);

  // Multi-tab sync: re-fetch stale data when tab becomes visible again
  useEffect(() => {
    if (!user || !isPremium) return;
    let hiddenAt = 0;
    const STALE_THRESHOLD = 30_000; // 30 seconds

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt = Date.now();
      } else if (document.visibilityState === 'visible' && hiddenAt > 0) {
        const elapsed = Date.now() - hiddenAt;
        if (elapsed >= STALE_THRESHOLD) {
          fetchSavedSearchesList();
        }
        hiddenAt = 0;
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [user, isPremium, fetchSavedSearchesList]);

  const value: LibraryContextValue = {
    savedSearchesList,
    setSavedSearchesList,
    savedAnalysesCount,
    isLoadingLibrary,
    isLoadingSaved,
    recentSearches,
    fetchSavedSearchesList,
    saveToLibrary,
    handleLoadFromHistory,
    handleDeleteSearch,
    handleClearAllSearches,
  };

  return (
    <LibraryContext.Provider value={value}>
      {children}
    </LibraryContext.Provider>
  );
}
