'use client';

import { useState } from 'react';
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
      { category: 'gbp', text: 'No review reply in 280 days' },
      { category: 'rank', text: 'Not ranking in search' },
      { category: 'web', text: 'No SEO tools detected' },
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
      { category: 'gbp', text: 'Low review reply rate (18%)' },
      { category: 'rank', text: 'Buried in search (#14)' },
      { category: 'rep', text: 'Very few reviews (8)' },
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
      { category: 'rank', text: 'Mid-pack rank (#5)' },
      { category: 'web', text: 'No website' },
      { category: 'rep', text: 'Below avg rating (3.2)' },
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
      { category: 'gbp', text: 'No review reply in 1+ year' },
      { category: 'rank', text: 'Not ranking in search' },
      { category: 'web', text: 'No SEO tools detected' },
      { category: 'rep', text: 'Very few reviews (3)' },
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
      { category: 'gbp', text: 'Last review reply 45 days ago' },
      { category: 'rep', text: 'Could improve rating (4.2)' },
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

  return (
    <div className="min-h-screen bg-[#0f0f10] flex flex-col">
      <MarketingHeader onSignIn={onSignIn} onSignUp={onSignUp} />

      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center px-4 py-12 md:py-16">
        <div className="max-w-5xl mx-auto text-center">
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

          {/* Mock Table Panel */}
          <div className="mt-12 mx-auto max-w-4xl" style={{ perspective: '1200px' }}>
            <div
              className="rounded-xl border border-zinc-700/50 bg-zinc-900 shadow-2xl overflow-hidden"
              style={{ transform: 'rotateX(2deg)' }}
            >
              {/* Table header bar */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/60">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-semibold text-white">Plumbers in Austin, TX</h3>
                  <span className="px-2 py-0.5 text-[10px] font-medium bg-zinc-800 text-zinc-400 rounded-full">25 results</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] text-emerald-400 font-medium">Live scan</span>
                </div>
              </div>

              {/* Desktop table */}
              <div className="hidden md:block">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-zinc-800/40">
                      <th className="text-left py-2 px-3 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider w-8">#</th>
                      <th className="text-left py-2 px-3 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Business Name</th>
                      <th className="text-left py-2 px-3 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">SEO Signals</th>
                      <th className="text-left py-2 px-3 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Rating</th>
                      <th className="text-left py-2 px-3 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Search Rank</th>
                      <th className="text-left py-2 px-3 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Claim Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_BUSINESSES.map((biz, i) => (
                      <tr key={i} className="border-b border-zinc-800/30 hover:bg-white/[0.02] transition-colors">
                        <td className="py-2.5 px-3 text-zinc-500 font-medium">{i + 1}</td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium">{biz.name}</span>
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
                            {biz.signals.slice(0, 3).map((signal, j) => {
                              const colors = SIGNAL_CATEGORY_COLORS[signal.category];
                              return (
                                <span key={j} className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] rounded ${colors.bg}`}>
                                  <span className={`font-semibold ${colors.text}`}>{SIGNAL_CATEGORY_LABELS[signal.category]}</span>
                                  <span className={colors.text}>{signal.text}</span>
                                </span>
                              );
                            })}
                            {biz.signals.length > 3 && (
                              <span className="text-[10px] text-zinc-500 px-1 py-0.5">+{biz.signals.length - 3} more</span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1">
                            <svg className="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span className="text-zinc-300">{biz.rating}</span>
                            <span className="text-zinc-600">({biz.reviewCount})</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={biz.searchRank === 'Not ranked' ? 'text-rose-400' : 'text-zinc-300'}>
                            {biz.searchRank}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
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

              {/* Mobile card view */}
              <div className="block md:hidden divide-y divide-zinc-800/30">
                {MOCK_BUSINESSES.slice(0, 3).map((biz, i) => (
                  <div key={i} className="px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-500 font-medium">{i + 1}.</span>
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

              {/* Gradient fade-out */}
              <div className="relative h-12">
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[10px] text-zinc-500">Scroll to see all 25 results...</span>
                </div>
              </div>
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

      {/* Market Intelligence at a Glance */}
      <section className="py-10 md:py-14 border-t border-zinc-800/50 bg-zinc-900/30">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-xl md:text-2xl font-bold text-white text-center mb-2">
            Market Intelligence at a Glance
          </h2>
          <p className="text-sm text-zinc-500 text-center mb-8">
            See exactly where the opportunities are before you start outreach
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Chart 1: Opportunity Breakdown (Horizontal Bar) */}
            <div className="bg-zinc-900/60 rounded-xl p-5 shadow-lg shadow-black/20">
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-zinc-200">Opportunity Breakdown</h3>
                <p className="text-xs text-zinc-500 mt-0.5">Plumbers in Austin, TX</p>
              </div>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={MOCK_OPPORTUNITY_DATA} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} horizontal={false} />
                    <XAxis type="number" tick={{ fill: '#a1a1aa', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="level" tick={{ fill: '#e4e4e7', fontSize: 13 }} axisLine={false} tickLine={false} width={60} />
                    <Tooltip {...CHART_TOOLTIP_STYLE} />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={28}>
                      {MOCK_OPPORTUNITY_DATA.map((entry, index) => (
                        <Cell key={index} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Claim Status (Donut) */}
            <div className="bg-zinc-900/60 rounded-xl p-5 shadow-lg shadow-black/20">
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-zinc-200">Claim Status</h3>
                <p className="text-xs text-zinc-500 mt-0.5">25 businesses scanned</p>
              </div>
              <div className="h-[200px]">
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
              </div>
            </div>

            {/* Chart 3: Avg Market Health (Radar) */}
            <div className="bg-zinc-900/60 rounded-xl p-5 shadow-lg shadow-black/20">
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-zinc-200">Avg Market Health</h3>
                <p className="text-xs text-zinc-500 mt-0.5">Lower = more opportunity</p>
              </div>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="65%" data={MOCK_RADAR_DATA}>
                    <PolarGrid stroke={CHART_GRID_STROKE} />
                    <PolarAngleAxis dataKey="axis" tick={{ fill: '#a1a1aa', fontSize: 10 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar dataKey="value" stroke={CHART_COLORS.primary} fill={CHART_COLORS.primary} fillOpacity={0.25} strokeWidth={2} />
                    <Tooltip {...CHART_TOOLTIP_STYLE} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
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
            Whether you&apos;re solo or scaling, Scoutblind fits your workflow
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
            Join hundreds of SEO professionals already using Scoutblind
          </p>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
