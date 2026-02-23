'use client';

import Link from 'next/link';
import { Check } from 'lucide-react';
import { MarketingLayout } from '@/components/marketing/MarketingLayout';

export default function PricingPage() {
  const steps = [
    {
      step: '1',
      title: 'Pick a market',
      description: 'Enter any niche and location — "Plumbers in Austin" — and get ~25 scored prospects back.',
    },
    {
      step: '2',
      title: 'See who needs you',
      description: 'Every business gets a Need Score based on real gaps. You\'ll know who to call first and why.',
    },
    {
      step: '3',
      title: 'Pitch with proof',
      description: 'Send a personalized audit report, use a pre-filled outreach template, or export to your CRM.',
    },
  ];

  return (
    <MarketingLayout>
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 text-center mb-2">
          Close one client and Packleads pays for itself
        </h1>
        <p className="text-sm text-gray-600 text-center mb-4">
          Every plan includes full lead scoring, audit reports, and outreach tools.
        </p>

        {/* ROI Math Strip */}
        <div className="flex items-center justify-center gap-6 md:gap-10 mb-12 py-4 px-6 rounded-xl bg-gray-50 border border-gray-200 max-w-lg mx-auto">
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">~25</div>
            <div className="text-[11px] text-gray-500 uppercase tracking-wider">leads per scan</div>
          </div>
          <div className="w-px h-8 bg-gray-200" />
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">$0.02</div>
            <div className="text-[11px] text-gray-500 uppercase tracking-wider">per lead</div>
          </div>
          <div className="w-px h-8 bg-gray-200" />
          <div className="text-center">
            <div className="text-lg font-bold text-violet-600">18x</div>
            <div className="text-[11px] text-gray-500 uppercase tracking-wider">ROI per client closed</div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Free */}
          <div className="p-6 rounded-xl border border-gray-200 bg-white dark:bg-card shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 mb-1">Free</h2>
            <div className="mb-5">
              <span className="text-3xl font-bold text-gray-900">$0</span>
            </div>
            <p className="text-xs text-gray-600 mb-5">See the data on a real market before you commit.</p>
            <ul className="space-y-2.5 mb-7">
              {[
                '5 scans — ~125 leads to evaluate',
                'Need Scores for every business',
                'CSV export',
                'Search history',
              ].map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                  <Check size={16} className="text-violet-400 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className="block w-full py-2.5 text-sm font-medium text-gray-900 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors text-center"
            >
              Try it free
            </Link>
          </div>

          {/* Starter */}
          <div className="p-6 rounded-xl border border-violet-500/30 bg-violet-500/[0.05] relative">
            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-violet-600 text-white text-[11px] font-semibold rounded-full uppercase tracking-wider">
              Most Popular
            </div>
            <h2 className="text-base font-semibold text-gray-900 mb-1">Starter</h2>
            <div className="mb-5">
              <span className="text-3xl font-bold text-gray-900">$29</span>
              <span className="text-sm text-gray-600">/mo</span>
            </div>
            <p className="text-xs text-gray-600 mb-5">Everything you need to prospect and pitch.</p>
            <ul className="space-y-2.5 mb-7">
              {[
                '50 scans/month — ~1,250 leads',
                'Personalized audit reports',
                'Ready-to-send outreach templates',
                'Saved search library',
                'Priority support',
              ].map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                  <Check size={16} className="text-violet-400 flex-shrink-0" />
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
          <div className="p-6 rounded-xl border border-gray-200 bg-white dark:bg-card shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 mb-1">Pro</h2>
            <div className="mb-5">
              <span className="text-3xl font-bold text-gray-900">$79</span>
              <span className="text-sm text-gray-600">/mo</span>
            </div>
            <p className="text-xs text-gray-600 mb-5">For teams closing multiple markets at once.</p>
            <ul className="space-y-2.5 mb-7">
              {[
                '200 scans/month — ~5,000 leads',
                'Everything in Starter',
                'Bulk analysis',
                'Pipeline tracking',
              ].map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                  <Check size={16} className="text-violet-400 flex-shrink-0" />
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
              Try it on your market — free
            </Link>
            <p className="text-xs text-gray-500 mt-2">No credit card required.</p>
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
