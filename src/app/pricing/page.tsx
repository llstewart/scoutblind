'use client';

import { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { AuthModal } from '@/components/auth/AuthModal';
import { MarketingLayout } from '@/components/marketing/MarketingLayout';

export default function PricingPage() {
  const {
    showAuthModal,
    setShowAuthModal,
    authMode,
    setAuthMode,
  } = useAppContext();

  const openSignUp = () => {
    setAuthMode('signup');
    setShowAuthModal(true);
  };

  const openSignIn = () => {
    setAuthMode('signin');
    setShowAuthModal(true);
  };

  const steps = [
    {
      step: '1',
      title: 'Search',
      description: 'Enter a niche and location to scan Google Business Profiles in any market.',
    },
    {
      step: '2',
      title: 'Analyze',
      description: 'Get SEO signals, review gaps, and visibility scores for every business found.',
    },
    {
      step: '3',
      title: 'Export',
      description: 'Download your results to CSV and start outreach with qualified leads.',
    },
  ];

  return (
    <MarketingLayout onSignIn={openSignIn} onSignUp={openSignUp}>
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
        <h1 className="text-2xl md:text-3xl font-bold text-white text-center mb-2">
          Simple, Transparent Pricing
        </h1>
        <p className="text-sm text-zinc-500 text-center mb-12">
          One scan could pay for a year of Scoutblind.
        </p>

        {/* How It Works */}
        <div className="mb-14">
          <h2 className="text-lg font-semibold text-white text-center mb-8">How it works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-9 h-9 rounded-full bg-violet-600/20 text-violet-400 text-sm font-bold flex items-center justify-center mx-auto mb-3">
                  {s.step}
                </div>
                <h3 className="text-sm font-semibold text-white mb-1">{s.title}</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">{s.description}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <button
              onClick={openSignUp}
              className="px-6 py-2.5 text-sm font-medium text-white bg-violet-600 hover:bg-violet-500 rounded-lg transition-colors"
            >
              Try it free
            </button>
            <p className="text-xs text-zinc-600 mt-2">No credit card required. 5 free scans.</p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-zinc-800/50 mb-12" />

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Free */}
          <div className="p-6 rounded-xl border border-zinc-800/50 bg-zinc-800/20">
            <h2 className="text-base font-semibold text-white mb-1">Free</h2>
            <div className="mb-5">
              <span className="text-3xl font-bold text-white">$0</span>
            </div>
            <p className="text-xs text-zinc-500 mb-5">Get started with no commitment.</p>
            <ul className="space-y-2.5 mb-7">
              {['5 market scans', 'Full signal analysis', 'CSV export', 'Search history'].map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-zinc-400">
                  <svg className="w-4 h-4 text-violet-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={openSignUp}
              className="block w-full py-2.5 text-sm font-medium text-white bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors text-center"
            >
              Start Free
            </button>
          </div>

          {/* Starter */}
          <div className="p-6 rounded-xl border border-violet-500/30 bg-violet-500/[0.05] relative">
            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-violet-600 text-white text-[10px] font-semibold rounded-full uppercase tracking-wider">
              Most Popular
            </div>
            <h2 className="text-base font-semibold text-white mb-1">Starter</h2>
            <div className="mb-5">
              <span className="text-3xl font-bold text-white">$29</span>
              <span className="text-sm text-zinc-500">/mo</span>
            </div>
            <p className="text-xs text-zinc-500 mb-5">For agencies actively prospecting.</p>
            <ul className="space-y-2.5 mb-7">
              {['50 scans/month', 'Everything in Free', 'Priority support', 'Saved search library'].map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-zinc-400">
                  <svg className="w-4 h-4 text-violet-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={openSignUp}
              className="block w-full py-2.5 text-sm font-medium text-white bg-violet-600 hover:bg-violet-500 rounded-lg transition-colors text-center"
            >
              Start Now
            </button>
          </div>

          {/* Pro */}
          <div className="p-6 rounded-xl border border-zinc-800/50 bg-zinc-800/20">
            <h2 className="text-base font-semibold text-white mb-1">Pro</h2>
            <div className="mb-5">
              <span className="text-3xl font-bold text-white">$79</span>
              <span className="text-sm text-zinc-500">/mo</span>
            </div>
            <p className="text-xs text-zinc-500 mb-5">For teams running high volume.</p>
            <ul className="space-y-2.5 mb-7">
              {['200 scans/month', 'Everything in Starter', 'Bulk analysis', 'API access (coming soon)'].map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-zinc-400">
                  <svg className="w-4 h-4 text-violet-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={openSignUp}
              className="block w-full py-2.5 text-sm font-medium text-white bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors text-center"
            >
              Start Now
            </button>
          </div>
        </div>

        {/* FAQ link */}
        <div className="mt-12 text-center">
          <p className="text-sm text-zinc-500">
            Have questions? Check our{' '}
            <a href="/faq" className="text-violet-400 hover:text-violet-300 transition-colors">
              FAQ
            </a>
            {' '}or{' '}
            <a href="/contact" className="text-violet-400 hover:text-violet-300 transition-colors">
              contact us
            </a>.
          </p>
        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultMode={authMode}
      />
    </MarketingLayout>
  );
}
