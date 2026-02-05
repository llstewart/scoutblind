'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/contexts/AppContext';
import { AccountTab } from '@/components/app/AccountTab';
import { AppLayout } from '@/components/app/AppLayout';

export default function AccountPage() {
  const router = useRouter();
  const {
    user,
    isAuthLoading,
    credits,
    tier,
    setShowBillingModal,
    setShowSettingsModal,
    handleSignOut,
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

  return (
    <AppLayout>
      <AccountTab
        user={user}
        credits={credits}
        tier={tier}
        onOpenBilling={() => setShowBillingModal(true)}
        onOpenSettings={() => setShowSettingsModal(true)}
        onSignOut={handleSignOut}
      />
    </AppLayout>
  );
}
