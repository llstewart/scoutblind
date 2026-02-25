'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/contexts/AppContext';
import { PipelineTab } from '@/components/app/PipelineTab';
import { AppLayout } from '@/components/app/AppLayout';
import { LayoutList, ArrowRight } from 'lucide-react';

export default function PipelinePage() {
  const router = useRouter();
  const { user, isAuthLoading, isPremium, fetchAllLeads, setShowBillingModal } = useAppContext();

  // Redirect to home if not logged in
  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.replace('/');
    }
  }, [user, isAuthLoading, router]);

  // Fetch leads on mount (premium only)
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

  if (!user) {
    return null;
  }

  // Free users see blurred preview with upgrade CTA
  if (!isPremium) {
    return (
      <AppLayout>
        <div className="relative min-h-[60vh]">
          {/* Blurred placeholder content */}
          <div className="blur-[6px] pointer-events-none select-none p-4 md:p-6" aria-hidden="true">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                  <LayoutList size={20} className="text-violet-500" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Pipeline</h1>
                  <p className="text-sm text-gray-500 mt-1">Track and manage your leads</p>
                </div>
              </div>
            </div>
            {/* Fake table rows */}
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100">
                  <div className="w-10 h-10 rounded-full bg-gray-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-48" />
                    <div className="h-2 bg-gray-100 rounded w-32" />
                  </div>
                  <div className="h-6 w-20 bg-violet-100 rounded-full" />
                  <div className="h-8 w-16 bg-gray-100 rounded-lg" />
                </div>
              ))}
            </div>
          </div>

          {/* Upgrade overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center max-w-sm mx-auto px-4">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-violet-50 mb-4">
                <LayoutList size={28} className="text-violet-500" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Manage leads with Pipeline
              </h2>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                Track lead status, add notes, and manage your outreach workflow. Available on paid plans.
              </p>
              <button
                onClick={() => setShowBillingModal(true)}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-violet-600/20"
              >
                Upgrade to unlock
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PipelineTab />
    </AppLayout>
  );
}
