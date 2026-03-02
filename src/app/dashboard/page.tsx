'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUI } from '@/contexts/UIContext';
import { useSearch } from '@/contexts/SearchContext';
import { useLibrary } from '@/contexts/LibraryContext';
import { SearchForm } from '@/components/SearchForm';
import { LoadingState } from '@/components/LoadingState';
import { AppLayout } from '@/components/app/AppLayout';
import { SearchTab } from '@/components/app/SearchTab';
import { ResultsView } from '@/components/app/ResultsView';

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const router = useRouter();
  const urlSearchParams = useSearchParams();

  const { user, isAuthLoading, credits, refreshUser, getCredits } = useAuth();
  const { setShowLookupModal, setToastMessage } = useUI();
  const { handleSearch, isSearching, hasResults, searchParams, isViewingSavedSearch, error } = useSearch();
  const { recentSearches, handleLoadFromHistory } = useLibrary();

  // Handle checkout success/cancel from Stripe redirect
  useEffect(() => {
    const checkout = urlSearchParams.get('checkout');
    if (checkout === 'success') {
      // Clear the query parameter first
      const params = new URLSearchParams(window.location.search);
      params.delete('checkout');
      params.delete('session_id');
      const newUrl = params.toString() ? `/dashboard?${params.toString()}` : '/dashboard';
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
      const newUrl = params.toString() ? `/dashboard?${params.toString()}` : '/dashboard';
      router.replace(newUrl, { scroll: false });
      setTimeout(() => setToastMessage(null), 3000);
    }
  }, [urlSearchParams, refreshUser, router, getCredits, setToastMessage]);

  // Redirect to marketing page if not authenticated
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    router.replace('/');
    return null;
  }

  const searchFormComponent = (
    <SearchForm
      onSearch={handleSearch}
      isLoading={isSearching}
      initialNiche={isViewingSavedSearch ? undefined : searchParams?.niche}
      initialLocation={isViewingSavedSearch ? undefined : searchParams?.location}
      compact={false}
    />
  );

  // Search Tab content - shows form, and results inline after search
  const searchTabContent = (
    <>
      {isSearching ? (
        <div className="py-16">
          <LoadingState message="Scanning your market..." />
        </div>
      ) : hasResults && !isViewingSavedSearch ? (
        // Show results inline after successful search
        <div className="space-y-4 p-4 md:p-6">
          {/* Compact search form at top for easy refinement */}
          <SearchForm
            onSearch={handleSearch}
            isLoading={isSearching}
            initialNiche={searchParams?.niche}
            initialLocation={searchParams?.location}
            compact={true}
          />
          {/* Results below */}
          <ResultsView />
        </div>
      ) : (
        <SearchTab
          searchForm={searchFormComponent}
          recentSearches={recentSearches}
          onRecentSearchClick={(search) => {
            handleLoadFromHistory(search.niche, search.location);
            router.push('/library');
          }}
          onLookupClick={() => setShowLookupModal(true)}
          credits={credits}
          isSearching={isSearching}
        />
      )}
      {/* Error display */}
      {error && !hasResults && (
        <div className="max-w-2xl mx-auto px-4">
          <div className="p-4 bg-red-500/10 rounded-lg flex items-center justify-between gap-3">
            <span className="text-red-400 text-sm">{error}</span>
            {searchParams && (
              <button
                onClick={() => handleSearch(searchParams.niche, searchParams.location)}
                className="flex-shrink-0 px-3 py-1.5 text-xs font-semibold text-red-400 hover:text-red-300 border border-red-400/30 hover:border-red-400/50 rounded-lg transition-colors"
              >
                Retry
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );

  return (
    <AppLayout>
      {searchTabContent}
    </AppLayout>
  );
}
