'use client';

import Link from 'next/link';
import { MarketingLayout } from '@/components/marketing/MarketingLayout';

export default function PricingPage() {
  const steps = [
    {
      step: '1',
      title: 'Search',
      description: 'Enter a niche and location to scan Google Business Profiles in any market.',
    },
    {
      step: '2',
      title: 'Analyze',
      description: 'Get digital signals, review gaps, and visibility scores for every business found.',
    },
    {
      step: '3',
      title: 'Export',
      description: 'Download your results to CSV and start outreach with qualified leads.',
    },
  ];

  return (
    <MarketingLayout>
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 text-center mb-2">
          Simple, Transparent Pricing
        </h1>
        <p className="text-sm text-gray-600 text-center mb-4">
          One closed client pays for 3 years of Pro.
        </p>

        {/* ROI Math Strip */}
        <div className="flex items-center justify-center gap-6 md:gap-10 mb-12 py-4 px-6 rounded-xl bg-gray-50 border border-gray-200 max-w-lg mx-auto">
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">$0.58</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider">per scan</div>
          </div>
          <div className="w-px h-8 bg-gray-200" />
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">~25</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider">leads per scan</div>
          </div>
          <div className="w-px h-8 bg-gray-200" />
          <div className="text-center">
            <div className="text-lg font-bold text-violet-600">$0.02</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider">per lead</div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Free */}
          <div className="p-6 rounded-xl border border-gray-200 bg-white shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 mb-1">Free</h2>
            <div className="mb-5">
              <span className="text-3xl font-bold text-gray-900">$0</span>
            </div>
            <p className="text-xs text-gray-600 mb-5">Get started with no commitment.</p>
            <ul className="space-y-2.5 mb-7">
              {['5 market scans', 'Full signal analysis', 'CSV export', 'Search history'].map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-4 h-4 text-violet-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className="block w-full py-2.5 text-sm font-medium text-gray-900 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors text-center"
            >
              Start Free
            </Link>
          </div>

          {/* Starter */}
          <div className="p-6 rounded-xl border border-violet-500/30 bg-violet-500/[0.05] relative">
            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-violet-600 text-white text-[10px] font-semibold rounded-full uppercase tracking-wider">
              Most Popular
            </div>
            <h2 className="text-base font-semibold text-gray-900 mb-1">Starter</h2>
            <div className="mb-5">
              <span className="text-3xl font-bold text-gray-900">$29</span>
              <span className="text-sm text-gray-600">/mo</span>
            </div>
            <p className="text-xs text-gray-600 mb-5">For agencies actively prospecting.</p>
            <ul className="space-y-2.5 mb-7">
              {['50 scans/month', 'Everything in Free', 'Priority support', 'Saved search library'].map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-4 h-4 text-violet-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className="block w-full py-2.5 text-sm font-medium text-white bg-violet-600 hover:bg-violet-500 rounded-lg transition-colors text-center"
            >
              Start Now
            </Link>
          </div>

          {/* Pro */}
          <div className="p-6 rounded-xl border border-gray-200 bg-white shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 mb-1">Pro</h2>
            <div className="mb-5">
              <span className="text-3xl font-bold text-gray-900">$79</span>
              <span className="text-sm text-gray-600">/mo</span>
            </div>
            <p className="text-xs text-gray-600 mb-5">For teams running high volume.</p>
            <ul className="space-y-2.5 mb-7">
              {['200 scans/month', 'Everything in Starter', 'Bulk analysis', 'API access (coming soon)'].map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-4 h-4 text-violet-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className="block w-full py-2.5 text-sm font-medium text-gray-900 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors text-center"
            >
              Start Now
            </Link>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 mt-14 mb-12" />

        {/* How It Works */}
        <div className="mb-12">
          <h2 className="text-lg font-semibold text-gray-900 text-center mb-8">How it works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-9 h-9 rounded-full bg-violet-600/20 text-violet-400 text-sm font-bold flex items-center justify-center mx-auto mb-3">
                  {s.step}
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">{s.title}</h3>
                <p className="text-xs text-gray-600 leading-relaxed">{s.description}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link
              href="/signup"
              className="inline-block px-6 py-2.5 text-sm font-medium text-white bg-violet-600 hover:bg-violet-500 rounded-lg transition-colors"
            >
              Start with 5 free scans
            </Link>
            <p className="text-xs text-gray-500 mt-2">No credit card required. ~125 businesses analyzed free.</p>
          </div>
        </div>

        {/* FAQ link */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-600">
            Have questions? Check our{' '}
            <a href="/faq" className="text-violet-600 hover:text-violet-500 transition-colors">
              FAQ
            </a>
            {' '}or{' '}
            <a href="/contact" className="text-violet-600 hover:text-violet-500 transition-colors">
              contact us
            </a>.
          </p>
        </div>
      </div>
    </MarketingLayout>
  );
}
