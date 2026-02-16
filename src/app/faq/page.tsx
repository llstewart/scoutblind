'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MarketingLayout } from '@/components/marketing/MarketingLayout';

const faqItems = [
  {
    q: 'What is Scoutblind?',
    a: 'Scoutblind is a prospecting tool for SEO agencies. It scans Google Business Profiles in any market and analyzes key GMB signals — like review response rates, owner activity, profile completeness, and local pack rankings — to help you find businesses that actually need your SEO services.',
  },
  {
    q: 'How do credits work?',
    a: 'Each search costs 1 credit. A search scans all GMB profiles for a given niche + location combination and returns a prioritized prospect list with signal analysis. You get 5 free credits when you sign up, and can purchase additional credits or subscribe to a monthly plan.',
  },
  {
    q: 'What GMB signals are analyzed?',
    a: 'We analyze 10+ signals including: local pack ranking, review count and average rating, review response rate, last owner activity date, profile claim status, website presence and tech stack, business category optimization, photo count, and more. These signals are combined into an overall SEO Need Score.',
  },
  {
    q: 'Where does the data come from?',
    a: 'All business data comes from publicly available Google Maps and Google Business Profile listings. We retrieve this data in real-time when you run a search, so results reflect current public information.',
  },
  {
    q: 'Is the data accurate?',
    a: 'Scoutblind employs high-performance algorithms that integrate real-time GMB data with the same analytical methodologies used by SEO experts. Our system processes complex signals—like review trends and response metrics—through a technical lens to provide consistent, actionable intelligence. We prioritize high-integrity data to ensure you are always working with a reliable competitive advantage.',
  },
  {
    q: 'How does pricing work?',
    a: 'Scoutblind offers a free tier (5 credits), a Starter plan ($29/mo for 50 credits), and a Pro plan ($79/mo for 200 credits). All plans include full signal analysis, CSV export, and search history. Subscriptions are billed monthly via Stripe and can be canceled anytime.',
  },
  {
    q: 'Can I export my data?',
    a: 'Yes. Every search result can be exported as a CSV file containing all prospect data, signal scores, and contact information. The export is ready for import into your CRM or outreach tools.',
  },
  {
    q: 'How do I delete my account?',
    a: 'You can delete your account from the Account settings page. This will permanently remove your personal data, search history, and saved searches. If you have an active subscription, please cancel it before deleting your account.',
  },
  {
    q: 'What payment methods are accepted?',
    a: 'We accept all major credit and debit cards (Visa, Mastercard, American Express) through Stripe. We do not store your card details — all payment processing is handled securely by Stripe.',
  },
];

export default function FaqPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <MarketingLayout>
      <div className="max-w-2xl mx-auto px-4 py-12 md:py-16">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Frequently Asked Questions</h1>
        <p className="text-sm text-gray-500 mb-10">
          Everything you need to know about Scoutblind.
        </p>

        <div className="space-y-3">
          {faqItems.map((item, i) => (
            <div key={i} className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                aria-expanded={openIndex === i}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="text-sm font-medium text-gray-900 pr-4">{item.q}</span>
                <svg
                  className={`w-4 h-4 text-gray-500 flex-shrink-0 transition-transform ${openIndex === i ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openIndex === i && (
                <div className="px-4 pb-4">
                  <p className="text-sm text-gray-500 leading-relaxed">{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Still have questions? */}
        <div className="mt-12 p-6 rounded-xl bg-gray-50 border border-gray-200 text-center">
          <h3 className="text-base font-semibold text-gray-900 mb-2">Still have questions?</h3>
          <p className="text-sm text-gray-500 mb-4">
            Can&apos;t find what you&apos;re looking for? Our team is happy to help.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <span>Contact Us</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </div>
    </MarketingLayout>
  );
}
