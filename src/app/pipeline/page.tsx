'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/contexts/AppContext';
import { PipelineTab } from '@/components/app/PipelineTab';
import { AppLayout } from '@/components/app/AppLayout';

export default function PipelinePage() {
  const router = useRouter();
  const { user, isAuthLoading, isPremium, fetchAllLeads } = useAppContext();

  // Redirect to home if not logged in
  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.replace('/');
    }
  }, [user, isAuthLoading, router]);

  // Redirect free users to dashboard
  useEffect(() => {
    if (!isAuthLoading && user && !isPremium) {
      router.replace('/dashboard');
    }
  }, [user, isAuthLoading, isPremium, router]);

  // Fetch leads on mount
  useEffect(() => {
    if (user && isPremium) {
      fetchAllLeads();
    }
  }, [user, isPremium, fetchAllLeads]);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || !isPremium) {
    return null;
  }

  return (
    <AppLayout>
      <PipelineTab />
    </AppLayout>
  );
}
