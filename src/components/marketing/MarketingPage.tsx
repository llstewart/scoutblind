'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts';
import { SIGNAL_CATEGORY_COLORS, SIGNAL_CATEGORY_LABELS, type SignalCategory } from '@/lib/signals';
import { MarketingHeader } from './MarketingHeader';
import { MarketingFooter } from './MarketingFooter';

interface MarketingPageProps {
  onSignIn: () => void;
  onSignUp: () => void;
}

const faqItems = [
  {
    q: 'What is Scoutblind?',
    a: 'Scoutblind scans Google Business Profiles in any market and analyzes key GMB signals — like review response rates, owner activity, and local pack rankings — to help SEO agencies find prospects who actually need their services.',
  },
  {
    q: 'How do credits work?',
    a: 'Each search costs 1 credit. A search scans all GMB profiles for a given niche + location and returns a prioritized prospect list. You get 5 free credits on signup, and can purchase more anytime.',
  },
  {
    q: 'Is the data accurate?',
    a: 'Scoutblind employs high-performance algorithms that integrate real-time GMB data with the same analytical methodologies used by SEO experts. Our system processes complex signals—like review trends and response metrics—through a technical lens to provide consistent, actionable intelligence. We prioritize high-integrity data to ensure you are always working with a reliable competitive advantage.',
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
    name: "Mike's Plumbing",
    score: 82,
    rating: 3.8,
    reviewCount: 12,
    searchRank: 'Not ranked',
    claimed: false,
    signals: [
      { category: 'gbp', text: 'Unclaimed profile' },
      { category: 'gbp', text: 'No reply in 280d' },
      { category: 'rank', text: 'Not ranking' },
      { category: 'web', text: 'No SEO tools' },
    ],
  },
  {
    name: 'Bright Smile Dental',
    score: 61,
    rating: 4.1,
    reviewCount: 8,
    searchRank: '#14',
    claimed: true,
    signals: [
      { category: 'gbp', text: 'Low reply rate (18%)' },
      { category: 'rank', text: 'Buried #14' },
      { category: 'rep', text: 'Few reviews (8)' },
    ],
  },
  {
    name: 'Garcia & Associates Law',
    score: 47,
    rating: 3.2,
    reviewCount: 23,
    searchRank: '#5',
    claimed: true,
    signals: [
      { category: 'rank', text: 'Mid-pack #5' },
      { category: 'web', text: 'No website' },
      { category: 'rep', text: 'Below avg (3.2)' },
    ],
  },
  {
    name: 'Summit HVAC Services',
    score: 73,
    rating: 4.5,
    reviewCount: 3,
    searchRank: 'Not ranked',
    claimed: true,
    signals: [
      { category: 'gbp', text: 'No reply in 1yr' },
      { category: 'rank', text: 'Not ranking' },
      { category: 'web', text: 'No SEO tools' },
      { category: 'rep', text: 'Few reviews (3)' },
    ],
  },
  {
    name: 'Elite Auto Detailing',
    score: 38,
    rating: 4.2,
    reviewCount: 47,
    searchRank: '#3',
    claimed: true,
    signals: [
      { category: 'gbp', text: 'Last reply 45d ago' },
      { category: 'rep', text: 'Could improve (4.2)' },
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
    backgroundColor: '#18181b',
    border: '1px solid #27272a',
    borderRadius: '8px',
    color: '#e4e4e7',
    fontSize: '13px',
  },
  cursor: { fill: 'rgba(113, 113, 122, 0.1)' },
};

const CHART_GRID_STROKE = '#27272a';

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

export function MarketingPage({ onSignIn, onSignUp }: MarketingPageProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [chartsVisible, setChartsVisible] = useState(false);
  const chartsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = chartsRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setChartsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-[#0f0f10] flex flex-col">
      <MarketingHeader onSignIn={onSignIn} onSignUp={onSignUp} />

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative flex-1 flex items-center px-4 py-20 md:py-28 lg:py-32 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] bg-violet-500/[0.03] rounded-full blur-[100px] pointer-events-none" />

        <div className="relative max-w-6xl mx-auto w-full grid lg:grid-cols-[1fr,1.15fr] gap-12 lg:gap-16 items-center">
          {/* Left: Copy */}
          <div className="text-center lg:text-left order-1">
            <h1 className="text-3xl md:text-4xl lg:text-[2.75rem] font-bold text-white mb-5 tracking-tight leading-[1.1]">
              Find SEO prospects{' '}
              <span className="text-violet-400">in half the time</span>
            </h1>

            <p className="text-base md:text-lg text-zinc-400 mb-10 max-w-lg mx-auto lg:mx-0 leading-relaxed">
              Scan Google Business Profiles to identify businesses with weak GMB presence, poor review engagement, and local SEO gaps. The signals you hunt for — automated.
            </p>

            <div className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-3">
              <button
                onClick={onSignUp}
                className="w-full sm:w-auto px-6 py-3 text-base font-semibold bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors"
              >
                Scan Your First Market Free
              </button>
              <button
                onClick={onSignIn}
                className="w-full sm:w-auto px-6 py-3 text-base font-medium text-zinc-500 hover:text-white transition-colors"
              >
                Sign in
              </button>
            </div>

            <p className="text-xs text-zinc-600 mt-4 text-center lg:text-left">No credit card required. 5 free scans.</p>
          </div>

          {/* Right: Mock Table */}
          <div className="relative order-2">
            <div className="absolute -inset-6 bg-violet-500/[0.04] rounded-3xl blur-3xl pointer-events-none" />

            <div className="relative rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#1e1e24]/95 to-[#141417]/98 backdrop-blur-xl shadow-[0_24px_80px_-12px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.03)_inset] overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/[0.12] to-transparent" />
              <div className="absolute top-0 left-[15%] right-[15%] h-20 bg-gradient-to-b from-white/[0.025] to-transparent pointer-events-none" />

              {/* Table header */}
              <div className="relative flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-semibold text-white">Plumbers in Austin, TX</h3>
                  <span className="px-2 py-0.5 text-[10px] font-medium bg-rose-500/10 text-rose-400 rounded-full">12 high-opportunity</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-[10px] text-emerald-400 font-medium">Live</span>
                </div>
              </div>

              {/* Desktop table */}
              <div className="hidden lg:block">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.04]">
                      <th className="text-left py-2 px-3 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider w-8">#</th>
                      <th className="text-left py-2 px-3 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Business</th>
                      <th className="text-left py-2 px-3 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Why They Need You</th>
                      <th className="text-left py-2 px-3 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_BUSINESSES.slice(0, 4).map((biz, i) => (
                      <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.015] transition-colors">
                        <td className="py-2.5 px-3 text-zinc-600 font-medium">{i + 1}</td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="text-zinc-200 font-medium">{biz.name}</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              biz.score >= 70 ? 'bg-rose-500/10 text-rose-400' :
                              biz.score >= 40 ? 'bg-amber-500/10 text-amber-400' :
                              'bg-emerald-500/10 text-emerald-400'
                            }`}>
                              {biz.score}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
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
                              <span className="text-[10px] text-zinc-600 px-1 py-0.5">+{biz.signals.length - 2}</span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full ${
                            biz.claimed
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-rose-500/10 text-rose-400'
                          }`}>
                            {biz.claimed ? 'Claimed' : 'Unclaimed'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="block lg:hidden divide-y divide-white/[0.04]">
                {MOCK_BUSINESSES.slice(0, 3).map((biz, i) => (
                  <div key={i} className="px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-600 font-medium">{i + 1}.</span>
                        <span className="text-sm font-medium text-white">{biz.name}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        biz.score >= 70 ? 'bg-rose-500/10 text-rose-400' :
                        biz.score >= 40 ? 'bg-amber-500/10 text-amber-400' :
                        'bg-emerald-500/10 text-emerald-400'
                      }`}>
                        {biz.score}
                      </span>
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
                        <span className="text-[10px] text-zinc-500 px-1 py-0.5">+{biz.signals.length - 2} more</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom fade */}
              <div className="relative h-12 bg-gradient-to-t from-[#141417] to-transparent">
                <div className="absolute bottom-2 inset-x-0 text-center">
                  <span className="text-[11px] text-zinc-600">+ 21 more results</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CHARTS ───────────────────────────────────────────────────── */}
      <section className="py-16 md:py-24 border-t border-zinc-800/40">
        <div className="max-w-5xl mx-auto px-4">
          <div className="max-w-xl mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              This is one scan of one market.
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Every scan surfaces opportunity breakdowns, claim gaps, and market health scores. Run it on your top niches and see what you&apos;ve been missing.
            </p>
          </div>

          <div ref={chartsRef} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Chart 1: Opportunity Breakdown */}
            <div
              className={`rounded-xl p-5 border border-zinc-800/40 bg-zinc-900/40 transition-all duration-700 ease-out ${
                chartsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}
            >
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-zinc-200">Opportunity Breakdown</h3>
                <p className="text-xs text-zinc-500 mt-0.5">12 businesses need help now</p>
              </div>
              <div className="h-[200px]">
                {chartsVisible && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={MOCK_OPPORTUNITY_DATA} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} horizontal={false} />
                      <XAxis type="number" tick={{ fill: '#a1a1aa', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="level" tick={{ fill: '#e4e4e7', fontSize: 13 }} axisLine={false} tickLine={false} width={60} />
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
              className={`rounded-xl p-5 border border-zinc-800/40 bg-zinc-900/40 transition-all duration-700 ease-out ${
                chartsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}
              style={{ transitionDelay: chartsVisible ? '150ms' : '0ms' }}
            >
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-zinc-200">Unclaimed Profiles</h3>
                <p className="text-xs text-rose-400/80 mt-0.5">40% have no owner</p>
              </div>
              <div className="h-[200px]">
                {chartsVisible && (
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
                        formatter={(value: string) => <span className="text-xs text-zinc-400">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Chart 3: Avg Market Health (Radar) */}
            <div
              className={`rounded-xl p-5 border border-zinc-800/40 bg-zinc-900/40 transition-all duration-700 ease-out ${
                chartsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}
              style={{ transitionDelay: chartsVisible ? '300ms' : '0ms' }}
            >
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-zinc-200">Market Health</h3>
                <p className="text-xs text-zinc-500 mt-0.5">Low scores = wide open opportunity</p>
              </div>
              <div className="h-[200px]">
                {chartsVisible && (
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="65%" data={MOCK_RADAR_DATA}>
                      <PolarGrid stroke={CHART_GRID_STROKE} />
                      <PolarAngleAxis dataKey="axis" tick={{ fill: '#a1a1aa', fontSize: 10 }} />
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
      <section className="py-16 md:py-24 border-t border-zinc-800/40">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid md:grid-cols-[1fr,1.5fr] gap-12 md:gap-16 items-start">
            <div className="md:sticky md:top-24">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                Three steps,<br />no learning curve.
              </h2>
              <p className="text-sm text-zinc-500 leading-relaxed">
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
                  desc: 'Download a prioritized prospect list. Every business is sorted by who needs SEO help most.',
                },
              ].map((item, i) => (
                <div key={i} className="flex gap-5">
                  <span className="text-sm font-medium text-zinc-700 mt-0.5 shrink-0 w-6">{item.num}</span>
                  <div>
                    <h3 className="text-base font-semibold text-white mb-1.5">{item.title}</h3>
                    <p className="text-sm text-zinc-500 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────── */}
      <section className="py-16 md:py-24 border-t border-zinc-800/40">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-lg font-semibold text-white mb-6">
            Frequently asked questions
          </h2>

          <div className="divide-y divide-zinc-800/50">
            {faqItems.map((item, i) => (
              <div key={i}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  aria-expanded={openFaq === i}
                  className="w-full flex items-center justify-between py-4 text-left group"
                >
                  <span className="text-sm font-medium text-zinc-300 group-hover:text-white transition-colors pr-4">{item.q}</span>
                  <svg
                    className={`w-4 h-4 text-zinc-500 flex-shrink-0 transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === i && (
                  <div className="pb-4">
                    <p className="text-sm text-zinc-500 leading-relaxed">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6">
            <Link
              href="/faq"
              className="text-sm text-zinc-500 hover:text-white transition-colors"
            >
              View all questions
            </Link>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────── */}
      <section className="py-20 md:py-28 border-t border-zinc-800/40">
        <div className="max-w-xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Every day you prospect manually is a day someone else closes the deal.
          </h2>
          <p className="text-sm text-zinc-500 mb-8">
            5 free scans. No credit card required.
          </p>
          <button
            onClick={onSignUp}
            className="px-8 py-3.5 text-base font-semibold bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors"
          >
            Get started
          </button>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
