import Link from 'next/link';
import { Metadata } from 'next';
import { MarketingHeader } from '@/components/marketing/MarketingHeader';
import { MarketingFooter } from '@/components/marketing/MarketingFooter';

export const metadata: Metadata = {
  title: 'Features — Scoutblind',
  description: 'Discover what Scoutblind analyzes: GBP signals, local rankings, web presence, and reputation metrics across every business in a market.',
};

const SIGNAL_CATEGORIES = [
  {
    label: 'GBP',
    fullName: 'Google Business Profile',
    desc: 'Is anyone home? We check if the listing is claimed, active, and engaging with customers.',
    badgeColor: 'bg-sky-500',
    glowColor: 'shadow-sky-500/20',
    borderColor: 'border-sky-500/20',
    textClass: 'text-sky-400',
    bgGlow: 'bg-sky-500/[0.04]',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
      </svg>
    ),
    signals: [
      { name: 'Claim status', detail: 'Unclaimed = easy pitch' },
      { name: 'Owner reply rate', detail: '% of reviews answered' },
      { name: 'Days dormant', detail: 'Last owner activity' },
      { name: 'Posting frequency', detail: 'GBP post cadence' },
    ],
  },
  {
    label: 'Rank',
    fullName: 'Search Visibility',
    desc: 'Where do they show up? We track local pack position and paid ad presence.',
    badgeColor: 'bg-amber-500',
    glowColor: 'shadow-amber-500/20',
    borderColor: 'border-amber-500/20',
    textClass: 'text-amber-400',
    bgGlow: 'bg-amber-500/[0.04]',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    signals: [
      { name: 'Local pack position', detail: '#1–20 or unranked' },
      { name: 'Search visibility', detail: 'Page 1 vs buried' },
      { name: 'Ads detection', detail: 'Running Google Ads?' },
    ],
  },
  {
    label: 'Web',
    fullName: 'Web Presence',
    desc: 'Do they even have a website? And if so, are they using any SEO tools at all?',
    badgeColor: 'bg-violet-500',
    glowColor: 'shadow-violet-500/20',
    borderColor: 'border-violet-500/20',
    textClass: 'text-violet-400',
    bgGlow: 'bg-violet-500/[0.04]',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
      </svg>
    ),
    signals: [
      { name: 'Website presence', detail: 'Has a site or not' },
      { name: 'SEO tools detection', detail: 'Analytics, tag managers, etc.' },
    ],
  },
  {
    label: 'Rep',
    fullName: 'Reputation',
    desc: 'What are customers saying? We analyze ratings, volume, and how recent the feedback is.',
    badgeColor: 'bg-rose-500',
    glowColor: 'shadow-rose-500/20',
    borderColor: 'border-rose-500/20',
    textClass: 'text-rose-400',
    bgGlow: 'bg-rose-500/[0.04]',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
      </svg>
    ),
    signals: [
      { name: 'Rating', detail: 'Star average (1–5)' },
      { name: 'Review count', detail: 'Total review volume' },
      { name: 'Review recency', detail: 'Last customer review date' },
    ],
  },
];

const SCORE_RANGES = [
  { range: '70–100', label: 'High need', color: 'text-rose-400', desc: 'Multiple critical gaps — ideal prospect' },
  { range: '40–69', label: 'Medium need', color: 'text-amber-400', desc: 'Some clear weaknesses to pitch' },
  { range: '0–39', label: 'Low need', color: 'text-emerald-400', desc: 'Already well-optimized' },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <MarketingHeader />

      {/* Hero */}
      <section className="py-20 md:py-28">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-5 tracking-tight leading-[1.1]">
            What Scoutblind analyzes
          </h1>
          <p className="text-base md:text-lg text-gray-500 leading-relaxed max-w-2xl mx-auto">
            Every scan evaluates 10+ signals across four categories to surface which businesses genuinely need SEO help — and which are already covered.
          </p>
        </div>
      </section>

      {/* Signal Categories */}
      <section className="py-16 md:py-24 border-t border-gray-200 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-violet-500/[0.015] rounded-full blur-[120px] pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 text-center">
            Signal categories
          </h2>
          <p className="text-sm text-gray-500 text-center mb-12 max-w-xl mx-auto">
            Each business is scored across four dimensions. Here&apos;s what we look at.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {SIGNAL_CATEGORIES.map((cat) => (
              <div
                key={cat.label}
                className={`group relative rounded-2xl border ${cat.borderColor} bg-white shadow-sm p-6 transition-all duration-300 hover:shadow-lg ${cat.glowColor} hover:border-opacity-40 overflow-hidden`}
              >
                {/* Card top glow accent */}
                <div className={`absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent ${cat.textClass === 'text-sky-400' ? 'via-sky-500/15' : cat.textClass === 'text-amber-400' ? 'via-amber-500/15' : cat.textClass === 'text-violet-400' ? 'via-violet-500/15' : 'via-rose-500/15'} to-transparent`} />
                {/* Subtle corner glow */}
                <div className={`absolute -top-12 -right-12 w-32 h-32 ${cat.bgGlow} rounded-full blur-2xl pointer-events-none transition-opacity duration-300 opacity-30 group-hover:opacity-60`} />

                <div className="relative">
                  {/* Header: badge + label */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`flex items-center justify-center w-9 h-9 rounded-lg ${cat.badgeColor}/15 ${cat.textClass}`}>
                      {cat.icon}
                    </div>
                    <div>
                      <span className={`text-xs font-bold uppercase tracking-wider ${cat.textClass}`}>{cat.label}</span>
                      <h3 className="text-base font-semibold text-gray-900 -mt-0.5">{cat.fullName}</h3>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-gray-500 leading-relaxed mb-5">{cat.desc}</p>

                  {/* Signal list */}
                  <div className="space-y-2.5">
                    {cat.signals.map((signal) => (
                      <div key={signal.name} className="flex items-start gap-2.5">
                        <span className={`mt-1.5 w-1.5 h-1.5 rounded-full ${cat.badgeColor} shrink-0`} />
                        <div>
                          <span className="text-sm text-gray-800">{signal.name}</span>
                          <span className="text-xs text-gray-400 ml-1.5">{signal.detail}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Scoring */}
      <section className="py-16 md:py-24 border-t border-gray-200">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 text-center">
            SEO Need Score
          </h2>
          <p className="text-sm text-gray-500 text-center mb-10 max-w-xl mx-auto">
            Every business receives a 0–100 score based on how urgently they need SEO services. Higher means more opportunity for you.
          </p>

          <div className="space-y-4">
            {SCORE_RANGES.map((item) => (
              <div
                key={item.range}
                className="flex items-center gap-4 rounded-lg border border-gray-200 bg-gray-50 px-5 py-4"
              >
                <span className={`text-lg font-bold ${item.color} w-20 shrink-0`}>{item.range}</span>
                <div>
                  <div className={`text-sm font-semibold ${item.color}`}>{item.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Export */}
      <section className="py-16 md:py-24 border-t border-gray-200">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            Export to CSV
          </h2>
          <p className="text-sm text-gray-500 leading-relaxed max-w-xl mx-auto mb-8">
            Every scan can be exported as a structured spreadsheet with scores, signals, contact info, and more — ready for your CRM or outreach tool.
          </p>

          <div className="flex items-center justify-center gap-4">
            <img
              src="/excel-logo.png"
              alt="Export to Excel"
              className="w-16 h-16 object-contain drop-shadow-[0_0_20px_rgba(16,185,129,0.1)]"
            />
            <span className="text-sm text-gray-700">One-click CSV download</span>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-28 border-t border-gray-200">
        <div className="max-w-xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            See it in action
          </h2>
          <p className="text-sm text-gray-500 mb-8">
            5 free scans. No credit card required.
          </p>
          <Link
            href="/"
            className="inline-flex px-8 py-3.5 text-base font-semibold bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors"
          >
            Get started free
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
