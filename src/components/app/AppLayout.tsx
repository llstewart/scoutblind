'use client';

import { ReactNode } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { AppShell } from './AppShell';
import { AuthModal } from '@/components/auth/AuthModal';
import { BillingModal } from '@/components/BillingModal';
import { SettingsModal } from '@/components/SettingsModal';
import { BusinessLookupModal } from '@/components/BusinessLookupModal';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const {
    user,
    credits,
    tier,
    isPremium,
    recentSearches,
    savedAnalysesCount,
    savedSearchesList,
    handleLoadFromHistory,
    showAuthModal,
    setShowAuthModal,
    authMode,
    showBillingModal,
    setShowBillingModal,
    showSettingsModal,
    setShowSettingsModal,
    showLookupModal,
    setShowLookupModal,
    refreshUser,
    fetchSavedSearchesList,
    toastMessage,
    setToastMessage,
    rateLimitCountdown,
  } = useAppContext();

  // Get user display name for sidebar
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

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
      >
        {children}
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
      {user && (
        <SettingsModal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          user={user}
        />
      )}

      {/* Business Lookup Modal */}
      <BusinessLookupModal
        isOpen={showLookupModal}
        onClose={() => setShowLookupModal(false)}
        isPremium={isPremium}
        onUpgradeClick={() => {
          setShowLookupModal(false);
          setShowBillingModal(true);
        }}
        onSaved={fetchSavedSearchesList}
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
