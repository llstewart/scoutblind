'use client';

import { useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

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
  const pathname = usePathname();

  // Derive active tab from pathname
  const getActiveTab = (): AppTab => {
    if (pathname === '/library') return 'library';
    if (pathname === '/account') return 'account';
    if (pathname === '/dashboard') return 'search';
    return 'search';
  };

  const activeTab = getActiveTab();

  // Navigate to a specific tab via route
  const setActiveTab = useCallback((tab: AppTab) => {
    switch (tab) {
      case 'library':
        router.push('/library');
        break;
      case 'account':
        router.push('/account');
        break;
      case 'search':
      default:
        router.push('/dashboard');
        break;
    }
  }, [router]);

  const navigateToSearch = useCallback((searchId?: string) => {
    if (searchId) {
      router.push(`/dashboard?search=${searchId}`);
    } else {
      router.push('/dashboard');
    }
  }, [router]);

  const navigateToLibrary = useCallback(() => {
    router.push('/library');
  }, [router]);

  const navigateToAccount = useCallback(() => {
    router.push('/account');
  }, [router]);

  return {
    activeTab,
    setActiveTab,
    navigateToSearch,
    navigateToLibrary,
    navigateToAccount,
  };
}
