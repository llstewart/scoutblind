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
    fullName: 'Profile Health',
    desc: 'Spot businesses that aren\'t managing their listing. Unclaimed profiles, ignored reviews, and dormant accounts are your easiest wins.',
    accentColor: 'border-l-sky-500',
    textColor: 'text-sky-600',
    signals: [
      'Unclaimed listings ready to pitch',
      'Review reply rates and response gaps',
      'Days since last owner activity',
      'Post frequency and engagement',
      'Missing phone or contact info',
    ],
  },
  {
    label: 'Rank',
    fullName: 'Search Visibility',
    desc: 'See who\'s invisible in local search. Businesses buried past page one are actively losing customers to competitors.',
    accentColor: 'border-l-amber-500',
    textColor: 'text-amber-600',
    signals: [
      'Local pack position (#1–20 or unranked)',
      'Page 1 presence vs buried',
      'Paid ad activity',
    ],
  },
  {
    label: 'Web',
    fullName: 'Web Presence',
    desc: 'Find businesses with no website or zero tracking tools. If they don\'t have analytics installed, they\'re not measuring anything.',
    accentColor: 'border-l-violet-500',
    textColor: 'text-violet-600',
    signals: [
      'Website exists or missing entirely',
      'Analytics and tag manager detection',
    ],
  },
  {
    label: 'Rep',
    fullName: 'Reputation',
    desc: 'Surface businesses with poor ratings, few reviews, or stale feedback. Reputation gaps are one of the easiest problems to pitch.',
    accentColor: 'border-l-rose-500',
    textColor: 'text-rose-600',
    signals: [
      'Star rating benchmarks',
      'Review volume benchmarks',
      'How recently customers left feedback',
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
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-gray-900 mb-5 tracking-tight leading-[1.1]">
            What Scoutblind analyzes
          </h1>
          <p className="text-base md:text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">
            Every scan evaluates 10+ signals across four categories to surface which businesses genuinely need help — and which are already covered.
          </p>
        </div>
      </section>

      {/* Signal Categories */}
      <section className="py-16 md:py-24 border-t border-gray-200">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-3 text-center">
            Four dimensions, one score
          </h2>
          <p className="text-sm text-gray-600 text-center mb-12 max-w-xl mx-auto">
            Every business is evaluated across four categories. The result is a single Need Score that tells you exactly who to call first.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {SIGNAL_CATEGORIES.map((cat) => (
              <div
                key={cat.label}
                className={`rounded-lg border border-gray-200 border-l-[3px] ${cat.accentColor} bg-white p-6`}
              >
                <div className="flex items-baseline gap-2 mb-2">
                  <span className={`text-xs font-semibold uppercase tracking-wider ${cat.textColor}`}>{cat.label}</span>
                  <h3 className="text-base font-semibold text-gray-900">{cat.fullName}</h3>
                </div>

                <p className="text-sm text-gray-600 leading-relaxed mb-4">{cat.desc}</p>

                <ul className="space-y-1.5">
                  {cat.signals.map((signal) => (
                    <li key={signal} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-gray-300 mt-0.5 shrink-0">&ndash;</span>
                      {signal}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Scoring */}
      <section className="py-16 md:py-24 border-t border-gray-200">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-3 text-center">
            Need Score
          </h2>
          <p className="text-sm text-gray-600 text-center mb-10 max-w-xl mx-auto">
            Every business receives a 0–100 score based on how urgently they need digital services. Higher means more opportunity for you.
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
                  <div className="text-xs text-gray-600 mt-0.5">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Export */}
      <section className="py-16 md:py-24 border-t border-gray-200">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-3">
            Export to CSV
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed max-w-xl mx-auto mb-8">
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
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-4">
            See it in action
          </h2>
          <p className="text-sm text-gray-600 mb-8">
            5 free searches. No credit card required.
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
