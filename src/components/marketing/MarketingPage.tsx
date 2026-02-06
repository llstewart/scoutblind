'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MarketingHeader } from './MarketingHeader';
import { MarketingFooter } from './MarketingFooter';

interface MarketingPageProps {
  onSignIn: () => void;
  onSignUp: () => void;
}

const faqItems = [
  {
    q: 'What is TrueSignal?',
    a: 'TrueSignal scans Google Business Profiles in any market and analyzes key GMB signals — like review response rates, owner activity, and local pack rankings — to help SEO agencies find prospects who actually need their services.',
  },
  {
    q: 'How do credits work?',
    a: 'Each search costs 1 credit. A search scans all GMB profiles for a given niche + location and returns a prioritized prospect list. You get 5 free credits on signup, and can purchase more anytime.',
  },
  {
    q: 'Is the data accurate?',
    a: 'TrueSignal employs high-performance algorithms that integrate real-time GMB data with the same analytical methodologies used by SEO experts. Our system processes complex signals—like review trends and response metrics—through a technical lens to provide consistent, actionable intelligence. We prioritize high-integrity data to ensure you are always working with a reliable competitive advantage.',
  },
  {
    q: 'Can I export my data?',
    a: 'Yes. Every search result can be exported as a CSV file with all prospect data and signal scores, ready for your outreach workflow.',
  },
];

export function MarketingPage({ onSignIn, onSignUp }: MarketingPageProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#0f0f10] flex flex-col">
      <MarketingHeader onSignIn={onSignIn} onSignUp={onSignUp} />

      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center px-4 py-12 md:py-16">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 mb-4 bg-violet-500/10 rounded-full">
            <svg className="w-3.5 h-3.5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-xs font-medium text-violet-400">GMB Signal Analysis for SEO Agencies</span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight leading-tight">
            Find SEO prospects
            <br />
            <span className="text-violet-400">in half the time</span>
          </h1>

          {/* Subheadline */}
          <p className="text-base md:text-lg text-zinc-400 mb-8 max-w-xl mx-auto leading-relaxed">
            Scan Google Business Profiles to identify businesses with weak GMB presence, poor review engagement, and local SEO gaps. The signals you hunt for — automated.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
            <button
              onClick={onSignUp}
              className="w-full sm:w-auto px-6 py-3 text-base font-semibold bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-all shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 flex items-center justify-center gap-2"
            >
              <span>Get Started Free</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
            <button
              onClick={onSignIn}
              className="w-full sm:w-auto px-6 py-3 text-base font-medium text-zinc-400 hover:text-white transition-colors"
            >
              Sign in
            </button>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 text-sm">
            <div className="text-center">
              <div className="text-xl font-bold text-white">5</div>
              <div className="text-xs text-zinc-500">Free Credits</div>
            </div>
            <div className="w-px h-8 bg-zinc-800" />
            <div className="text-center">
              <div className="text-xl font-bold text-white">20+</div>
              <div className="text-xs text-zinc-500">Prospects/Search</div>
            </div>
            <div className="w-px h-8 bg-zinc-800" />
            <div className="text-center">
              <div className="text-xl font-bold text-white">10+</div>
              <div className="text-xs text-zinc-500">GMB Signals</div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Bar */}
      <section className="py-8 border-t border-zinc-800/50 bg-violet-500/[0.03]">
        <div className="max-w-4xl mx-auto px-4">
          <p className="text-xs text-zinc-500 text-center mb-5 uppercase tracking-wider font-medium">
            Trusted by SEO professionals
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { stat: '500+', label: 'Searches Run' },
              { stat: '10,000+', label: 'Businesses Scanned' },
              { stat: '10+', label: 'GMB Signals Tracked' },
              { stat: '95%', label: 'Data Accuracy' },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="text-lg md:text-xl font-bold text-white">{item.stat}</div>
                <div className="text-xs text-zinc-500">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-10 md:py-14 border-t border-zinc-800/50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl md:text-2xl font-bold text-white text-center mb-2">
            How It Works
          </h2>
          <p className="text-sm text-zinc-500 text-center mb-8">
            Automate the prospecting research you already do manually
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-9 h-9 mx-auto mb-3 rounded-lg bg-violet-500/10 flex items-center justify-center">
                <span className="text-base font-bold text-violet-400">1</span>
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">Pick a Market</h3>
              <p className="text-xs text-zinc-500">
                Search any niche + location. We pull every GMB profile in that market.
              </p>
            </div>
            <div className="text-center">
              <div className="w-9 h-9 mx-auto mb-3 rounded-lg bg-violet-500/10 flex items-center justify-center">
                <span className="text-base font-bold text-violet-400">2</span>
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">Scan GMB Signals</h3>
              <p className="text-xs text-zinc-500">
                We analyze review response rates, owner activity, search visibility, and more.
              </p>
            </div>
            <div className="text-center">
              <div className="w-9 h-9 mx-auto mb-3 rounded-lg bg-violet-500/10 flex items-center justify-center">
                <span className="text-base font-bold text-violet-400">3</span>
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">Export Prospects</h3>
              <p className="text-xs text-zinc-500">
                Get a prioritized list sorted by who needs SEO help most. Start outreach.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* GMB Signals We Analyze */}
      <section className="py-10 md:py-14 border-t border-zinc-800/50 bg-zinc-900/30">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl md:text-2xl font-bold text-white text-center mb-2">
            GMB Signals We Analyze
          </h2>
          <p className="text-sm text-zinc-500 text-center mb-8">
            The same signals you look for manually — now automated
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                ),
                title: 'Local Pack Ranking',
                description: 'Not in top 20? Big opportunity.',
              },
              {
                icon: (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                ),
                title: 'Review Response Rate',
                description: '0% response = disengaged owner',
              },
              {
                icon: (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: 'Last Owner Activity',
                description: 'Months of silence = cold lead',
              },
              {
                icon: (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: 'Profile Claim Status',
                description: 'Unclaimed = not managing GMB',
              },
              {
                icon: (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                ),
                title: 'Website Tech Stack',
                description: 'Outdated builder? Needs help.',
              },
              {
                icon: (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                ),
                title: 'SEO Need Score',
                description: 'Ranked by who needs you most',
              },
            ].map((feature, index) => (
              <div key={index} className="flex gap-3 p-3 rounded-lg bg-zinc-800/30">
                <div className="w-8 h-8 rounded-md bg-violet-500/10 flex items-center justify-center text-violet-400 flex-shrink-0">
                  {feature.icon}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-medium text-white">{feature.title}</h3>
                  <p className="text-xs text-zinc-500">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-10 md:py-14 border-t border-zinc-800/50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl md:text-2xl font-bold text-white text-center mb-2">
            Built for GMB SEO Agencies
          </h2>
          <p className="text-sm text-zinc-500 text-center mb-8">
            Whether you&apos;re solo or scaling, TrueSignal fits your workflow
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: 'Cold Outreach Prospecting',
                description: 'Find businesses with weak GMB presence in any market. Export prospect lists sorted by who needs SEO help most, ready for your outreach campaigns.',
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                ),
              },
              {
                title: 'Market Research',
                description: 'Scan an entire niche in a new city before pitching. See how many businesses have poor review engagement, unclaimed profiles, and outdated websites.',
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                ),
              },
              {
                title: 'Competitor Analysis',
                description: 'Identify which competitors in a market are investing in GMB and which are neglecting it. Use the data to position your pitch against specific gaps.',
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                ),
              },
            ].map((useCase, i) => (
              <div key={i} className="p-5 rounded-xl bg-zinc-800/30 border border-zinc-800/50">
                <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-400 mb-4">
                  {useCase.icon}
                </div>
                <h3 className="text-sm font-semibold text-white mb-2">{useCase.title}</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">{useCase.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section id="pricing" className="py-10 md:py-14 border-t border-zinc-800/50 bg-zinc-900/30">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl md:text-2xl font-bold text-white text-center mb-2">
            Simple, Transparent Pricing
          </h2>
          <p className="text-sm text-zinc-500 text-center mb-8">
            Start free. Scale as you grow.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Free */}
            <div className="p-5 rounded-xl border border-zinc-800/50 bg-zinc-800/20">
              <h3 className="text-sm font-semibold text-white mb-1">Free</h3>
              <div className="mb-4">
                <span className="text-2xl font-bold text-white">$0</span>
              </div>
              <ul className="space-y-2 mb-6">
                {['5 credits on signup', 'Full signal analysis', 'CSV export', 'Search history'].map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-zinc-400">
                    <svg className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={onSignUp}
                className="w-full py-2 text-sm font-medium text-white bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors"
              >
                Get Started
              </button>
            </div>

            {/* Starter */}
            <div className="p-5 rounded-xl border border-violet-500/30 bg-violet-500/[0.05] relative">
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-violet-600 text-white text-[10px] font-semibold rounded-full uppercase tracking-wider">
                Popular
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">Starter</h3>
              <div className="mb-4">
                <span className="text-2xl font-bold text-white">$29</span>
                <span className="text-xs text-zinc-500">/mo</span>
              </div>
              <ul className="space-y-2 mb-6">
                {['50 credits/month', 'Everything in Free', 'Priority support', 'Saved search library'].map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-zinc-400">
                    <svg className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={onSignUp}
                className="w-full py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-500 rounded-lg transition-colors"
              >
                Start Now
              </button>
            </div>

            {/* Pro */}
            <div className="p-5 rounded-xl border border-zinc-800/50 bg-zinc-800/20">
              <h3 className="text-sm font-semibold text-white mb-1">Pro</h3>
              <div className="mb-4">
                <span className="text-2xl font-bold text-white">$79</span>
                <span className="text-xs text-zinc-500">/mo</span>
              </div>
              <ul className="space-y-2 mb-6">
                {['200 credits/month', 'Everything in Starter', 'Bulk analysis', 'API access (coming soon)'].map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-zinc-400">
                    <svg className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={onSignUp}
                className="w-full py-2 text-sm font-medium text-white bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors"
              >
                Start Now
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Preview */}
      <section className="py-10 md:py-14 border-t border-zinc-800/50">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-xl md:text-2xl font-bold text-white text-center mb-2">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-zinc-500 text-center mb-8">
            Quick answers to common questions
          </p>

          <div className="space-y-3">
            {faqItems.map((item, i) => (
              <div key={i} className="border border-zinc-800/50 rounded-lg overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-zinc-800/20 transition-colors"
                >
                  <span className="text-sm font-medium text-white pr-4">{item.q}</span>
                  <svg
                    className={`w-4 h-4 text-zinc-500 flex-shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4">
                    <p className="text-xs text-zinc-400 leading-relaxed">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-6">
            <Link
              href="/faq"
              className="text-sm text-violet-400 hover:text-violet-300 transition-colors"
            >
              View all FAQs &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-12 md:py-16 border-t border-zinc-800/50 bg-gradient-to-b from-violet-500/[0.03] to-transparent">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-2">
            Stop manual prospecting. Start closing.
          </h2>
          <p className="text-sm text-zinc-500 mb-6">
            5 free credits to try. No credit card required.
          </p>
          <button
            onClick={onSignUp}
            className="px-6 py-3 text-base font-semibold bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-all shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 inline-flex items-center gap-2"
          >
            <span>Create Free Account</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
          <p className="mt-4 text-xs text-zinc-600">
            Join hundreds of SEO professionals already using TrueSignal
          </p>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
