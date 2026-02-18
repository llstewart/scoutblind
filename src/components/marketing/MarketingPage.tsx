'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts';
import { SIGNAL_CATEGORY_COLORS, SIGNAL_CATEGORY_LABELS, type SignalCategory } from '@/lib/signals';
import { MarketingHeader } from './MarketingHeader';
import { MarketingFooter } from './MarketingFooter';

const faqItems = [
  {
    q: 'What is Scoutblind?',
    a: 'Scoutblind scans Google Business Profiles in any market and analyzes key GBP signals — like review response rates, owner activity, and local pack rankings — to help agencies and freelancers find prospects who actually need their services.',
  },
  {
    q: 'How do credits work?',
    a: 'Each search costs 1 credit. A search scans all GBP profiles for a given niche + location and returns a prioritized prospect list. You get 5 free credits on signup, and can purchase more anytime.',
  },
  {
    q: 'Is the data accurate?',
    a: 'We pull directly from Google\'s public business data — the same listings, reviews, and rankings you\'d find manually. Scoutblind automates the collection and scores each business based on concrete signals like reply rate, review recency, and local pack position. No guesswork, no AI-generated estimates.',
  },
  {
    q: 'Can I export my data?',
    a: 'Yes. Every search result can be exported as a CSV file with all prospect data and signal scores, ready for your outreach workflow.',
  },
];

// ─── Mock table data ────────────────────────────────────────────────
interface MockSignal {
  category: SignalCategory;
  text: string;
}

interface MockBusiness {
  name: string;
  score: number;
  rating: number;
  reviewCount: number;
  searchRank: string;
  claimed: boolean;
  signals: MockSignal[];
}

const MOCK_BUSINESSES: MockBusiness[] = [
  {
    name: 'Lone Star Plumbing Co',
    score: 82,
    rating: 3.8,
    reviewCount: 12,
    searchRank: 'Not ranked',
    claimed: false,
    signals: [
      { category: 'gbp', text: 'Unclaimed profile' },
      { category: 'gbp', text: '0% reply rate (280d)' },
      { category: 'rank', text: 'Not in local pack' },
      { category: 'web', text: 'No analytics detected' },
    ],
  },
  {
    name: 'Austin Family Dental',
    score: 61,
    rating: 4.1,
    reviewCount: 8,
    searchRank: '#14',
    claimed: true,
    signals: [
      { category: 'gbp', text: '18% reply rate (6 mo)' },
      { category: 'rank', text: 'Position #14 of 20' },
      { category: 'rep', text: '8 reviews (avg is 47)' },
    ],
  },
  {
    name: 'Garcia & Sons Law Firm',
    score: 47,
    rating: 3.2,
    reviewCount: 23,
    searchRank: '#5',
    claimed: true,
    signals: [
      { category: 'rank', text: 'Position #5 of 20' },
      { category: 'web', text: 'No website linked' },
      { category: 'rep', text: '3.2★ avg (market 4.1)' },
    ],
  },
  {
    name: 'Summit Mechanical HVAC',
    score: 73,
    rating: 4.5,
    reviewCount: 3,
    searchRank: 'Not ranked',
    claimed: true,
    signals: [
      { category: 'gbp', text: '0% reply rate (12 mo)' },
      { category: 'rank', text: 'Not in local pack' },
      { category: 'web', text: 'No analytics detected' },
      { category: 'rep', text: '3 reviews total' },
    ],
  },
  {
    name: 'Prestige Auto Detail',
    score: 38,
    rating: 4.2,
    reviewCount: 47,
    searchRank: '#3',
    claimed: true,
    signals: [
      { category: 'gbp', text: 'Last reply 45d ago' },
      { category: 'rep', text: '4.2★ (12 negative)' },
    ],
  },
];

// ─── Chart theme constants (matching MarketDashboard) ───────────────
const CHART_COLORS = {
  high: '#10b981',
  medium: '#f59e0b',
  low: '#ef4444',
  primary: '#8b5cf6',
  claimed: '#10b981',
  unclaimed: '#ef4444',
};

const CHART_TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    color: '#374151',
    fontSize: '13px',
  },
  cursor: { fill: 'rgba(139, 92, 246, 0.05)' },
};

const CHART_GRID_STROKE = '#e5e7eb';

// ─── Chart mock data ────────────────────────────────────────────────
const MOCK_OPPORTUNITY_DATA = [
  { level: 'High', count: 12, fill: CHART_COLORS.high },
  { level: 'Medium', count: 8, fill: CHART_COLORS.medium },
  { level: 'Low', count: 5, fill: CHART_COLORS.low },
];

const MOCK_CLAIM_DATA = [
  { name: 'Claimed', value: 15, fill: CHART_COLORS.claimed },
  { name: 'Unclaimed', value: 10, fill: CHART_COLORS.unclaimed },
];

const MOCK_RADAR_DATA = [
  { axis: 'Review Health', value: 35 },
  { axis: 'Response Rate', value: 20 },
  { axis: 'Posting Freq', value: 15 },
  { axis: 'Website Quality', value: 45 },
  { axis: 'Local Ranking', value: 10 },
];

// ─── Count-up hook (fires once on scroll) ────────────────────────────
function useCountUp(target: number, duration: number, trigger: boolean) {
  const [value, setValue] = useState(0);
  const hasRun = useRef(false);

  useEffect(() => {
    if (!trigger || hasRun.current) return;
    hasRun.current = true;

    const start = performance.now();
    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out: fast start, slow landing
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [trigger, target, duration]);

  return value;
}

// ─── Scroll-reveal hook (fires once) ────────────────────────────────
function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, visible };
}

export function MarketingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const router = useRouter();

  // Scroll-reveal triggers
  const stats = useReveal(0.3);
  const charts = useReveal(0.15);

  // Count-up animations — both start on scroll, different durations
  const signalCount = useCountUp(10, 700, stats.visible);      // 0.7s snap
  const businessCount = useCountUp(10000, 2200, stats.visible); // 2.2s heavy spin

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <MarketingHeader />

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative flex-1 flex items-center px-4 py-20 md:py-28 lg:py-32 overflow-hidden">
        <div className="max-w-6xl mx-auto w-full grid lg:grid-cols-[1fr,1.15fr] gap-12 lg:gap-16 items-center">
          {/* Left: Copy */}
          <div className="text-center lg:text-left order-1">
            <h1 className="text-3xl md:text-4xl lg:text-[2.75rem] font-semibold text-gray-900 mb-4 tracking-tight leading-[1.1]">
              Local leads enriched with the digital gaps that close deals.
            </h1>

            <p className="text-sm text-gray-600 mb-2 max-w-lg mx-auto lg:mx-0 leading-relaxed">
              Scan any local market. Surface weak online presence. Export and pitch.
            </p>
            <p className="text-sm text-gray-500 mb-8 max-w-lg mx-auto lg:mx-0 italic">
              The signals you hunt for — automated.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                router.push('/signup');
              }}
              className="max-w-md mx-auto lg:mx-0 flex flex-col gap-2"
            >
              <div className="flex flex-col gap-2">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    defaultValue="Plumbers"
                    placeholder="e.g. Plumbers"
                    className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-colors text-sm"
                  />
                  <input
                    type="text"
                    defaultValue="Austin, TX"
                    placeholder="e.g. Austin, TX"
                    className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-colors text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full px-6 py-3 text-sm font-semibold bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors"
                >
                  Scan market
                </button>
              </div>
            </form>

            <div className="flex items-center gap-3 mt-4 justify-center lg:justify-start">
              <p className="text-xs text-gray-500">No credit card required. 5 free searches.</p>
              <span className="text-xs text-gray-300">·</span>
              <Link
                href="/login"
                className="text-xs text-gray-600 hover:text-gray-900 transition-colors"
              >
                Sign in
              </Link>
            </div>
          </div>

          {/* Right: Product Preview — App Frame */}
          <div className="relative order-2">
                <div className="rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.08),0_8px_30px_rgba(0,0,0,0.08),0_30px_60px_-10px_rgba(0,0,0,0.06)] border border-gray-200/80">
                  {/* App shell: sidebar + main */}
                  <div className="flex bg-white">
                    {/* Thin sidebar */}
                    <div className="hidden lg:flex flex-col items-center w-11 bg-gray-50 border-r border-gray-200 py-3 gap-3 shrink-0">
                      <img src="/icon.svg" alt="" className="w-5 h-5" />
                      <div className="w-5 h-5 rounded bg-violet-500/10 flex items-center justify-center">
                        <svg className="w-3 h-3 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <div className="w-5 h-5 rounded bg-gray-200/60 flex items-center justify-center">
                        <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="w-5 h-5 rounded bg-gray-200/60 flex items-center justify-center">
                        <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                      </div>
                    </div>

                    {/* Main content area */}
                    <div className="flex-1 min-w-0">
                      {/* Toolbar */}
                      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-white">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 rounded-md border border-gray-200 text-[10px] text-gray-600">
                            <svg className="w-2.5 h-2.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            Plumbers in Austin, TX
                          </div>
                          <span className="px-1.5 py-0.5 text-[9px] font-medium bg-violet-500/10 text-violet-500 rounded">25 results</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button className="flex items-center gap-1 px-2 py-1 text-[10px] text-gray-500 bg-gray-50 border border-gray-200 rounded-md">
                            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                            </svg>
                            Export CSV
                          </button>
                        </div>
                      </div>

                      {/* Tab bar */}
                      <div className="flex items-center gap-0 px-3 border-b border-gray-100 bg-white">
                        <span className="px-3 py-1.5 text-[10px] font-medium text-gray-400 border-b border-transparent">All Results</span>
                        <span className="px-3 py-1.5 text-[10px] font-medium text-violet-600 border-b-2 border-violet-500">Lead Intel</span>
                        <span className="px-3 py-1.5 text-[10px] font-medium text-gray-400 border-b border-transparent">Market</span>
                      </div>

                      {/* Desktop table */}
                      <div className="hidden lg:block">
                        <table className="w-full text-[11px]">
                          <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/50">
                              <th className="text-left py-1.5 px-2.5 text-[9px] font-semibold text-gray-400 uppercase tracking-wider w-7">#</th>
                              <th className="text-left py-1.5 px-2.5 text-[9px] font-semibold text-gray-400 uppercase tracking-wider">Business</th>
                              <th className="text-left py-1.5 px-2.5 text-[9px] font-semibold text-gray-400 uppercase tracking-wider w-10">Rating</th>
                              <th className="text-left py-1.5 px-2.5 text-[9px] font-semibold text-gray-400 uppercase tracking-wider w-12">Reviews</th>
                              <th className="text-left py-1.5 px-2.5 text-[9px] font-semibold text-gray-400 uppercase tracking-wider w-16">Status</th>
                              <th className="text-left py-1.5 px-2.5 text-[9px] font-semibold text-gray-400 uppercase tracking-wider">Signals</th>
                            </tr>
                          </thead>
                          <tbody>
                            {MOCK_BUSINESSES.map((biz, i) => (
                              <tr key={i} className={`border-b border-gray-50 ${i === 0 ? 'bg-violet-500/[0.02]' : ''}`}>
                                <td className="py-2 px-2.5 text-gray-300 font-medium">{i + 1}</td>
                                <td className="py-2 px-2.5 whitespace-nowrap">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-gray-800 font-medium text-[11px]">{biz.name}</span>
                                    <span className={`text-[9px] font-bold px-1 py-px rounded ${
                                      biz.score >= 70 ? 'bg-rose-500/10 text-rose-500' :
                                      biz.score >= 40 ? 'bg-amber-500/10 text-amber-500' :
                                      'bg-emerald-500/10 text-emerald-500'
                                    }`}>
                                      {biz.score}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-2 px-2.5 text-gray-600">{biz.rating}</td>
                                <td className="py-2 px-2.5 text-gray-600">{biz.reviewCount}</td>
                                <td className="py-2 px-2.5">
                                  <span className={`inline-flex items-center px-1.5 py-px text-[9px] font-medium rounded ${
                                    biz.claimed
                                      ? 'bg-emerald-500/10 text-emerald-600'
                                      : 'bg-rose-500/10 text-rose-500'
                                  }`}>
                                    {biz.claimed ? 'Claimed' : 'Unclaimed'}
                                  </span>
                                </td>
                                <td className="py-2 px-2.5">
                                  <div className="flex flex-wrap gap-0.5">
                                    {biz.signals.slice(0, 2).map((signal, j) => {
                                      const colors = SIGNAL_CATEGORY_COLORS[signal.category];
                                      return (
                                        <span key={j} className={`inline-flex items-center gap-0.5 px-1.5 py-px text-[9px] rounded ${colors.bg}`}>
                                          <span className={`font-semibold ${colors.text}`}>{SIGNAL_CATEGORY_LABELS[signal.category]}</span>
                                          <span className={colors.text}>{signal.text}</span>
                                        </span>
                                      );
                                    })}
                                    {biz.signals.length > 2 && (
                                      <span className="text-[9px] text-violet-400 px-1 py-px cursor-pointer hover:text-violet-600">+{biz.signals.length - 2} more</span>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile cards */}
                      <div className="block lg:hidden divide-y divide-gray-100">
                        {MOCK_BUSINESSES.slice(0, 3).map((biz, i) => (
                          <div key={i} className="px-3 py-2.5">
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400 font-medium">{i + 1}.</span>
                                <span className="text-sm font-medium text-gray-900">{biz.name}</span>
                                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                                  biz.claimed
                                    ? 'bg-emerald-500/10 text-emerald-500'
                                    : 'bg-rose-500/10 text-rose-500'
                                }`}>
                                  {biz.claimed ? 'Claimed' : 'Unclaimed'}
                                </span>
                              </div>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                biz.score >= 70 ? 'bg-rose-500/10 text-rose-500' :
                                biz.score >= 40 ? 'bg-amber-500/10 text-amber-500' :
                                'bg-emerald-500/10 text-emerald-500'
                              }`}>
                                {biz.score}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-[10px] text-gray-500 mb-1.5">
                              <span>{biz.rating} stars</span>
                              <span>{biz.reviewCount} reviews</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {biz.signals.slice(0, 2).map((signal, j) => {
                                const colors = SIGNAL_CATEGORY_COLORS[signal.category];
                                return (
                                  <span key={j} className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] rounded ${colors.bg}`}>
                                    <span className={`font-semibold ${colors.text}`}>{SIGNAL_CATEGORY_LABELS[signal.category]}</span>
                                    <span className={colors.text}>{signal.text}</span>
                                  </span>
                                );
                              })}
                              {biz.signals.length > 2 && (
                                <span className="text-[10px] text-gray-500 px-1 py-0.5">+{biz.signals.length - 2} more</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
          </div>
        </div>
      </section>

      {/* ── PAIN POINT ─────────────────────────────────────────────── */}
      <section className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-3">
            Hours of manual research, done in minutes.
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed max-w-2xl mx-auto mb-10">
            Stop scrolling Google Maps one listing at a time. Scoutblind scans an entire market in one click.
          </p>

          <div ref={stats.ref} className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-4">
            <div>
              <div className="text-3xl md:text-4xl font-extrabold text-gray-900">
                {stats.visible ? `${signalCount}+` : '0+'}
              </div>
              <div className="text-xs text-gray-600 mt-1">Signals per business</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-extrabold text-gray-900">
                {stats.visible ? `${businessCount.toLocaleString()}+` : '0+'}
              </div>
              <div className="text-xs text-gray-600 mt-1">Businesses analyzed</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-extrabold text-gray-900">CSV</div>
              <div className="text-xs text-gray-600 mt-1">One-click export</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CHARTS ───────────────────────────────────────────────────── */}
      <section className="py-16 md:py-24">
        <div className="max-w-5xl mx-auto px-4">
          <div className="max-w-xl mb-12">
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-3">
              This is one scan of one market.
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Every scan surfaces opportunity breakdowns, claim gaps, and market health scores. Run it on your top niches and see what you&apos;ve been missing.
            </p>
          </div>

          <div ref={charts.ref} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Chart 1: Opportunity Breakdown */}
            <div
              className={`rounded-xl p-5 border border-gray-200 bg-white shadow-sm transition-all duration-700 ease-out ${
                charts.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}
            >
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-800">Opportunity Breakdown</h3>
                <p className="text-xs text-gray-600 mt-0.5">12 businesses need help now</p>
              </div>
              <div className="h-[200px]">
                {charts.visible && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={MOCK_OPPORTUNITY_DATA} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} horizontal={false} />
                      <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="level" tick={{ fill: '#374151', fontSize: 13 }} axisLine={false} tickLine={false} width={60} />
                      <Tooltip {...CHART_TOOLTIP_STYLE} />
                      <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={28} animationDuration={1200} animationEasing="ease-out">
                        {MOCK_OPPORTUNITY_DATA.map((entry, index) => (
                          <Cell key={index} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Chart 2: Claim Status (Donut) */}
            <div
              className={`rounded-xl p-5 border border-gray-200 bg-white shadow-sm transition-all duration-700 ease-out ${
                charts.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}
              style={{ transitionDelay: charts.visible ? '150ms' : '0ms' }}
            >
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-800">Unclaimed Profiles</h3>
                <p className="text-xs text-rose-400/80 mt-0.5">40% have no owner</p>
              </div>
              <div className="h-[200px]">
                {charts.visible && (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={MOCK_CLAIM_DATA}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={72}
                        paddingAngle={4}
                        dataKey="value"
                        strokeWidth={0}
                        animationDuration={1200}
                        animationEasing="ease-out"
                      >
                        {MOCK_CLAIM_DATA.map((entry, index) => (
                          <Cell key={index} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip {...CHART_TOOLTIP_STYLE} />
                      <Legend
                        verticalAlign="bottom"
                        iconType="circle"
                        iconSize={8}
                        formatter={(value: string) => <span className="text-xs text-gray-600">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Chart 3: Avg Market Health (Radar) */}
            <div
              className={`rounded-xl p-5 border border-gray-200 bg-white shadow-sm transition-all duration-700 ease-out ${
                charts.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}
              style={{ transitionDelay: charts.visible ? '300ms' : '0ms' }}
            >
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-800">Market Health</h3>
                <p className="text-xs text-gray-600 mt-0.5">Low scores = wide open opportunity</p>
              </div>
              <div className="h-[200px]">
                {charts.visible && (
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="65%" data={MOCK_RADAR_DATA}>
                      <PolarGrid stroke={CHART_GRID_STROKE} />
                      <PolarAngleAxis dataKey="axis" tick={{ fill: '#6b7280', fontSize: 10 }} />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar dataKey="value" stroke={CHART_COLORS.primary} fill={CHART_COLORS.primary} fillOpacity={0.25} strokeWidth={2} animationDuration={1400} animationEasing="ease-out" />
                      <Tooltip {...CHART_TOOLTIP_STYLE} />
                    </RadarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────── */}
      <section className="py-16 md:py-20 bg-violet-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid md:grid-cols-[1fr,1.5fr] gap-12 md:gap-16 items-start">
            <div className="md:sticky md:top-24">
              <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-3">
                Three steps,<br />no learning curve.
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                You don&apos;t need a tutorial. Enter a market, read the signals, close the deal.
              </p>
            </div>

            <div className="space-y-10">
              {[
                {
                  num: '01',
                  title: 'Pick a market',
                  desc: 'Enter any niche and location. "Plumbers in Austin" — that\'s all it takes to start a scan.',
                },
                {
                  num: '02',
                  title: 'Read the signals',
                  desc: 'Review rates, response times, rankings, claim status, website quality — 10+ signals analyzed per business.',
                },
                {
                  num: '03',
                  title: 'Export and pitch',
                  desc: 'Download a prioritized prospect list. Every business is sorted by who needs your services most.',
                },
              ].map((item, i) => (
                <div key={i} className="flex gap-5">
                  <span className="text-sm font-medium text-gray-300 mt-0.5 shrink-0 w-6">{item.num}</span>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-1.5">{item.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── EXPORT PREVIEW ─────────────────────────────────────────── */}
      <section className="py-20 md:py-28">
        <div className="max-w-5xl mx-auto px-4">
          <div className="max-w-xl mb-10">
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-3">
              Export-ready prospect lists
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Every scan produces a structured CSV with scores, signals, and contact info — ready for your CRM or outreach tool.
            </p>
          </div>

          {/* Real export screenshot */}
          <div className="rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_8px_30px_rgba(0,0,0,0.08)] overflow-hidden">
            <img
              src="/export-preview.png"
              alt="CSV export showing lead data with columns for Name, Phone, Website, Rating, Reviews, Response Rate, Search Visibility, and more"
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8">
            {[
              'Name, phone, website, and address for every business',
              'Rating, review count, response rate, and days dormant',
              'Search visibility, website tech, optimization status, and claim data',
            ].map((text) => (
              <div key={text} className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
                <span className="text-sm text-gray-600">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────── */}
      <section className="py-16 md:py-24 border-t border-gray-200">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            Frequently asked questions
          </h2>

          <div className="divide-y divide-gray-200">
            {faqItems.map((item, i) => (
              <div key={i}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  aria-expanded={openFaq === i}
                  className="w-full flex items-center justify-between py-4 text-left group"
                >
                  <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors pr-4">{item.q}</span>
                  <svg
                    className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === i && (
                  <div className="pb-4">
                    <p className="text-sm text-gray-600 leading-relaxed">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6">
            <Link
              href="/faq"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              View all questions
            </Link>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────── */}
      <section className="py-20 md:py-28 border-t border-gray-200">
        <div className="max-w-xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-4">
            Every day you prospect manually is a day someone else closes the deal.
          </h2>
          <p className="text-sm text-gray-600 mb-8">
            5 free searches. No credit card required.
          </p>
          <Link
            href="/signup"
            className="inline-block px-8 py-3.5 text-base font-semibold bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors"
          >
            Get started
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
