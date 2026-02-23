import Link from 'next/link';
import { Metadata } from 'next';
import { MarketingHeader } from '@/components/marketing/MarketingHeader';
import { MarketingFooter } from '@/components/marketing/MarketingFooter';

export const metadata: Metadata = {
  title: 'Features — Packleads',
  description: 'Find businesses that need your services. Get scored leads, personalized audit reports, and ready-to-send outreach — all from a single search.',
};

const SIGNAL_CATEGORIES = [
  {
    label: 'GBP',
    fullName: 'Profile Health',
    desc: 'Find owners who haven\'t touched their listing in months. Unclaimed profiles, unanswered reviews, and dead accounts — these are the easiest conversations you\'ll ever start.',
    accentColor: 'border-l-sky-500',
    textColor: 'text-sky-600',
    signals: [
      'Unclaimed listings — no one is managing them',
      'Review reply rates — see who\'s ignoring customers',
      'Days since last owner activity',
      'Post frequency and engagement',
      'Missing phone or contact info',
    ],
  },
  {
    label: 'Rank',
    fullName: 'Search Visibility',
    desc: 'Show prospects they\'re invisible on Google — with receipts. Businesses buried past page one are losing customers to competitors right now, and you can prove it.',
    accentColor: 'border-l-amber-500',
    textColor: 'text-amber-600',
    signals: [
      'Local pack position (#1\u201320 or unranked)',
      'Page 1 presence vs buried',
      'Paid ad activity',
    ],
  },
  {
    label: 'Web',
    fullName: 'Web Presence',
    desc: 'No website? No analytics? No way to measure ROI? That\'s your opening. These businesses have zero visibility into what\'s working and what isn\'t.',
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
    desc: 'Bad ratings, few reviews, and stale feedback scare away customers. You can spot these gaps instantly — and reputation management is one of the easiest services to sell.',
    accentColor: 'border-l-rose-500',
    textColor: 'text-rose-600',
    signals: [
      'Star rating benchmarks',
      'Review volume compared to competitors',
      'How recently customers left feedback',
    ],
  },
];

const SCORE_RANGES = [
  { range: '70–100', label: 'High need', color: 'text-rose-400', desc: 'Multiple critical gaps — call these first' },
  { range: '40–69', label: 'Medium need', color: 'text-amber-400', desc: 'Clear weaknesses you can pitch specific services for' },
  { range: '0–39', label: 'Low need', color: 'text-emerald-400', desc: 'Already well-managed — skip these' },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col">
      <MarketingHeader />

      {/* Hero */}
      <section className="py-20 md:py-28">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-gray-900 mb-5 tracking-tight leading-[1.1]">
            Walk into every pitch knowing exactly what to say
          </h1>
          <p className="text-base md:text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">
            Packleads scores every business in a market across four dimensions — so you know who needs help, why they need it, and how to open the conversation.
          </p>
        </div>
      </section>

      {/* Signal Categories */}
      <section className="py-16 md:py-24 border-t border-gray-200">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-3 text-center">
            Four reasons a business needs you — found automatically
          </h2>
          <p className="text-sm text-gray-600 text-center mb-12 max-w-xl mx-auto">
            Every business is scored across four dimensions. The result: you know exactly who to call first — and what to lead with.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {SIGNAL_CATEGORIES.map((cat) => (
              <div
                key={cat.label}
                className={`rounded-lg border border-gray-200 border-l-[3px] ${cat.accentColor} bg-white dark:bg-card p-6`}
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
            One number that tells you who to call first
          </h2>
          <p className="text-sm text-gray-600 text-center mb-10 max-w-xl mx-auto">
            Every business gets a 0–100 Need Score. Higher score = more gaps = easier conversation. Stop wasting calls on businesses that don&apos;t need you.
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

      {/* Sales Tools */}
      <section className="py-16 md:py-24 border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-3 text-center">
            From lead to pitch — without leaving Packleads
          </h2>
          <p className="text-sm text-gray-600 text-center mb-12 max-w-xl mx-auto">
            Finding leads is half the job. Packleads gives you the tools to close them.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="rounded-lg border border-gray-200 bg-white dark:bg-card p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-2">Audit Reports</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Generate a printable report showing a prospect their exact gaps — search ranking, review health, web presence. Send it cold or use it to open the call.
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white dark:bg-card p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-2">Outreach Templates</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Get ready-to-send email templates pre-filled with each prospect&apos;s actual data. No more generic cold emails — every message references their specific problems.
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white dark:bg-card p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-2">CSV Export</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Download your full prospect list with scores, signals, and contact info — structured and ready for your CRM or outreach tool.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-28 border-t border-gray-200">
        <div className="max-w-xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-4">
            Try it on your market — free
          </h2>
          <p className="text-sm text-gray-600 mb-8">
            No credit card. Scan a real market and see the leads you&apos;ve been missing.
          </p>
          <Link
            href="/signup"
            className="inline-flex px-8 py-3.5 text-base font-semibold bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors"
          >
            Start your first scan
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
