'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { SearchForm } from '@/components/SearchForm';
import { LoadingState } from '@/components/LoadingState';
import { AuthModal } from '@/components/auth/AuthModal';
import { MarketingPage } from '@/components/marketing/MarketingPage';
import { AppLayout } from '@/components/app/AppLayout';
import { SearchTab } from '@/components/app/SearchTab';
import { ResultsView } from '@/components/app/ResultsView';

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

  const {
    user,
    isAuthLoading,
    credits,
    showAuthModal,
    setShowAuthModal,
    authMode,
    setAuthMode,
    handleSearch,
    isSearching,
    hasResults,
    searchParams,
    isViewingSavedSearch,
    recentSearches,
    error,
    setShowLookupModal,
    handleLoadFromHistory,
    refreshUser,
    getCredits,
    setToastMessage,
  } = useAppContext();

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
  }, [urlSearchParams, refreshUser, router, getCredits, setToastMessage]);

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
  // RENDER: Search Tab (Logged In)
  // ============================================

  // Build the search form component
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
          <ResultsView />
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
      {error && !hasResults && (
        <div className="max-w-2xl mx-auto px-4">
          <div className="p-4 bg-red-500/10 rounded-lg text-red-400 text-sm">
            {error}
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
