'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useUI } from '@/contexts/UIContext';
import { AccountTab } from '@/components/app/AccountTab';
import { AppLayout } from '@/components/app/AppLayout';

export default function AccountPage() {
  const router = useRouter();
  const { user, isAuthLoading, credits, tier, handleSignOut } = useAuth();
  const { setShowBillingModal, setShowSettingsModal } = useUI();

  // Redirect to home if not logged in
  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.replace('/');
    }
  }, [user, isAuthLoading, router]);

  // Show loading while checking auth
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
