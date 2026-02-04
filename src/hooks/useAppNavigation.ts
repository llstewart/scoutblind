'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export type AppTab = 'search' | 'library' | 'account';

interface UseAppNavigationReturn {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  navigateToSearch: (searchId?: string) => void;
  navigateToLibrary: () => void;
  navigateToAccount: () => void;
}

export function useAppNavigation(): UseAppNavigationReturn {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize from URL or default to 'search'
  const getInitialTab = (): AppTab => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'library' || tabParam === 'account') {
      return tabParam;
    }
    return 'search';
  };

  const [activeTab, setActiveTabState] = useState<AppTab>(getInitialTab);

  // Sync URL when tab changes
  const setActiveTab = useCallback((tab: AppTab) => {
    setActiveTabState(tab);

    // Update URL without full navigation
    const params = new URLSearchParams(searchParams.toString());

    if (tab === 'search') {
      // Remove tab param for search (it's the default)
      params.delete('tab');
      // Also clear search-related params when switching to search tab
      // This ensures a clean state for new searches
      params.delete('niche');
      params.delete('location');
      params.delete('view');
    } else {
      params.set('tab', tab);
      // Clear search params when navigating away
      params.delete('niche');
      params.delete('location');
      params.delete('view');
    }

    const newUrl = params.toString() ? `?${params.toString()}` : '/';
    router.replace(newUrl, { scroll: false });
  }, [router, searchParams]);

  // Sync state when URL changes externally
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'library' || tabParam === 'account') {
      setActiveTabState(tabParam);
    } else {
      setActiveTabState('search');
    }
  }, [searchParams]);

  const navigateToSearch = useCallback((searchId?: string) => {
    setActiveTabState('search');
    if (searchId) {
      router.replace(`/?search=${searchId}`, { scroll: false });
    } else {
      router.replace('/', { scroll: false });
    }
  }, [router]);

  const navigateToLibrary = useCallback(() => {
    setActiveTab('library');
  }, [setActiveTab]);

  const navigateToAccount = useCallback(() => {
    setActiveTab('account');
  }, [setActiveTab]);

  return {
    activeTab,
    setActiveTab,
    navigateToSearch,
    navigateToLibrary,
    navigateToAccount,
  };
}
