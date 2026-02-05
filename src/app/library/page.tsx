'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/contexts/AppContext';
import { LibraryTab } from '@/components/app/LibraryTab';
import { ResultsView } from '@/components/app/ResultsView';
import { AppLayout } from '@/components/app/AppLayout';

export default function LibraryPage() {
  const router = useRouter();
  const {
    user,
    isAuthLoading,
    savedSearchesList,
    isLoadingLibrary,
    handleLoadFromHistory,
    handleDeleteSearch,
    handleClearAllSearches,
    hasResults,
    searchParams,
    isLoadingSaved,
    isViewingSavedSearch,
    setSearchParams,
    setBusinesses,
    setTableBusinesses,
    setIsViewingSavedSearch,
  } = useAppContext();

  // Redirect to home if not logged in
  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.replace('/');
    }
  }, [user, isAuthLoading, router]);

  // Show loading while checking auth
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#0f0f10] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Don't render if not authenticated
  if (!user) {
    return null;
  }

  // Handler to go back to library list
  const handleBackToList = () => {
    setSearchParams(null);
    setBusinesses([]);
    setTableBusinesses([]);
    setIsViewingSavedSearch(false);
  };

  // Handler for clicking a search from the library
  const handleSearchClick = (search: { id: string; niche: string; location: string }) => {
    handleLoadFromHistory(search.niche, search.location);
  };

  return (
    <AppLayout>
      <LibraryTab
        searches={savedSearchesList}
        isLoading={isLoadingLibrary}
        onSearchClick={handleSearchClick}
        onDeleteSearch={handleDeleteSearch}
        onClearAll={handleClearAllSearches}
        activeSearch={isViewingSavedSearch && hasResults ? searchParams : null}
        resultsContent={isViewingSavedSearch && hasResults ? <ResultsView /> : undefined}
        onBackToList={handleBackToList}
        isLoadingResults={isLoadingSaved}
      />
    </AppLayout>
  );
}
