'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { useReveal, useCountUp } from './hooks';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts';
import { MarketingHeader } from './MarketingHeader';
import { MarketingFooter } from './MarketingFooter';

const faqItems = [
  {
    q: 'What is Packleads?',
    a: 'Packleads finds businesses that need your services and tells you exactly why — so you can pitch with proof instead of guessing. Enter a market, get a scored prospect list, and reach out with personalized audit reports and outreach templates.',
  },
  {
    q: 'How do credits work?',
    a: 'Each scan costs 1 credit and returns ~25 qualified prospects. You get free credits on signup to try it on a real market. Paid plans start at $29/month for 50 scans — that\'s over 1,200 leads.',
  },
  {
    q: 'Is the data accurate?',
    a: 'We pull directly from Google\'s public business data — the same listings, reviews, and rankings you\'d find manually. Packleads automates the collection and scores each business based on concrete signals like reply rate, review recency, and local pack position. No guesswork, no AI-generated estimates.',
  },
  {
    q: 'What do I get beyond a list of names?',
    a: 'Every enriched lead comes with a Need Score, specific gap analysis (search visibility, review health, web presence), a printable audit report you can send to the prospect, and personalized outreach templates. You\'re not just finding leads — you\'re walking into every pitch prepared.',
  },
];

// ─── Chart theme constants (matching MarketDashboard) ───────────────
const CHART_COLORS = {
  high: '#10b981',
  medium: '#f59e0b',
  low: '#ef4444',
  primary: '#0d7c7b',
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
  cursor: { fill: 'rgba(13, 124, 123, 0.05)' },
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

// Hooks imported from ./hooks

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
    <div className="force-light min-h-[100dvh] bg-white flex flex-col">
      <MarketingHeader />

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative px-4 pt-20 md:pt-28 lg:pt-32 pb-12 md:pb-16 overflow-hidden">
        {/* Copy — centered above screenshot */}
        <div className="max-w-2xl mx-auto text-center mb-12 md:mb-16">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-gray-900 mb-4 tracking-tight leading-[1.1]">
            Every weak Google listing in your market. One search.
          </h1>

          <p className="text-sm md:text-base text-gray-600 mb-8 max-w-xl mx-auto leading-relaxed">
            Know exactly which businesses need your services, why they need them, and what to say when you reach out — before you ever pick up the phone.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/signup"
              className="px-8 py-3 text-sm font-semibold bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors"
            >
              Start Your First Scan
            </Link>
            <p className="text-xs text-gray-400">
              No credit card required. Analyze your first market free.
            </p>
          </div>
        </div>

        {/* Product Screenshot — full width */}
        <div className="max-w-7xl mx-auto">
          <div className="rounded-xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.06),0_12px_40px_rgba(0,0,0,0.1),0_40px_80px_-20px_rgba(0,0,0,0.08)] border border-gray-200/60">
            <img
              src="/hero-screenshot.png"
              alt="Packleads Lead Intel — SEO signals, search visibility, and opportunity scores for every business in your market"
              className="w-full h-auto block"
              loading="eager"
            />
          </div>
        </div>
      </section>

      {/* ── PAIN POINT ─────────────────────────────────────────────── */}
      <section className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-3">
            Stop guessing which businesses to pitch.
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed max-w-2xl mx-auto mb-10">
            Enter a niche and location. In minutes you&apos;ll have a scored prospect list — sorted by who needs help the most — with the data you need to pitch each one.
          </p>

          <div ref={stats.ref} className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-4">
            <div>
              <div className="text-3xl md:text-4xl font-extrabold text-gray-900">
                ~25
              </div>
              <div className="text-xs text-gray-600 mt-1">Qualified leads per scan</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-extrabold text-gray-900">
                {stats.visible ? `${businessCount.toLocaleString()}+` : '0+'}
              </div>
              <div className="text-xs text-gray-600 mt-1">Businesses scored to date</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-extrabold text-gray-900">$0.02</div>
              <div className="text-xs text-gray-600 mt-1">Per lead on Starter</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CHARTS ───────────────────────────────────────────────────── */}
      <section className="py-16 md:py-24">
        <div className="max-w-5xl mx-auto px-4">
          <div className="max-w-xl mb-12">
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-3">
              This is one scan. One market. Look what you&apos;re missing.
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Every scan shows you which businesses are vulnerable — unclaimed profiles, zero review responses, no website. These are clients waiting to be closed.
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
                  title: 'See who needs you',
                  desc: 'Every business gets a Need Score based on real gaps — ignored reviews, missing websites, invisible search rankings. You\'ll know exactly why they need help.',
                },
                {
                  num: '03',
                  title: 'Pitch with proof',
                  desc: 'Generate a personalized audit report showing each prospect their gaps. Send it cold, or use it to open the call with something they can\'t ignore.',
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
              Everything you need to close — built in
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Packleads doesn&apos;t just find leads. It arms you with the outreach tools to convert them.
            </p>
          </div>

          {/* Real export screenshot */}
          <div className="rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_8px_30px_rgba(0,0,0,0.08)] overflow-hidden">
            <img
              src="/export-preview.png"
              alt="CSV export showing lead data with columns for Name, Phone, Website, Rating, Reviews, Response Rate, Search Visibility, and more"
              className="w-full"
              loading="lazy"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8">
            {[
              'Personalized audit reports you can send cold — showing each prospect exactly where they\'re losing customers',
              'Ready-to-send outreach templates pre-filled with the prospect\'s actual gaps and data',
              'CSV export with scores, contact info, and signals — ready for your CRM or outreach tool',
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
                  <ChevronDown
                    size={16}
                    className={`text-gray-400 flex-shrink-0 transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`}
                  />
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
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-3">
            There are unclaimed profiles in your market right now.
          </h2>
          <p className="text-sm text-gray-600 mb-2">
            Every day you spend scrolling Maps is a day someone else closes that client.
          </p>
          <p className="text-xs text-gray-500 mb-8">
            Try it free. No credit card. One closed client pays for 3 years of Pro.
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
