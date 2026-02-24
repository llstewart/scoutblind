'use client';

import Link from 'next/link';
import { Building2, Search, Globe, Star, FileText, Mail, Download, Briefcase, User, Users } from 'lucide-react';
import { useReveal, useCountUp, useMouseParallax } from './hooks';
import { MarketingHeader } from './MarketingHeader';
import { MarketingFooter } from './MarketingFooter';

// ─── Data ───────────────────────────────────────────────────────────

const SIGNAL_CATEGORIES = [
  {
    icon: Building2,
    label: 'GBP',
    fullName: 'Profile Health',
    desc: 'Unclaimed listings, ignored reviews, dead accounts — the easiest conversations you\'ll ever start.',
    accentColor: 'border-l-sky-500',
    bgAccent: 'bg-sky-50',
    textColor: 'text-sky-600',
    signals: ['Unclaimed or unmanaged listings', 'Review reply rate & owner activity', 'Missing contact info or photos'],
  },
  {
    icon: Search,
    label: 'Rank',
    fullName: 'Search Visibility',
    desc: 'Show prospects they\'re invisible on Google — with receipts.',
    accentColor: 'border-l-amber-500',
    bgAccent: 'bg-amber-50',
    textColor: 'text-amber-600',
    signals: ['Local pack position (#1–20)', 'Page 1 presence vs. buried', 'Paid ad activity detection'],
  },
  {
    icon: Globe,
    label: 'Web',
    fullName: 'Web Presence',
    desc: 'No website? No analytics? No way to measure ROI? That\'s your opening.',
    accentColor: 'border-l-violet-500',
    bgAccent: 'bg-violet-50',
    textColor: 'text-violet-600',
    signals: ['Website exists or missing', 'Analytics & tag manager detection', 'Mobile responsiveness check'],
  },
  {
    icon: Star,
    label: 'Rep',
    fullName: 'Reputation',
    desc: 'Bad ratings and stale feedback scare customers away. You can spot it instantly.',
    accentColor: 'border-l-rose-500',
    bgAccent: 'bg-rose-50',
    textColor: 'text-rose-600',
    signals: ['Star rating vs. competitors', 'Review volume & recency', 'Sentiment trend analysis'],
  },
];

const SCORE_RANGES = [
  { range: '70–100', label: 'High need', color: 'text-rose-500', barColor: 'bg-rose-500', desc: 'Multiple critical gaps — call these first', width: 30 },
  { range: '40–69', label: 'Medium need', color: 'text-amber-500', barColor: 'bg-amber-500', desc: 'Clear weaknesses to pitch specific services for', width: 30 },
  { range: '0–39', label: 'Low need', color: 'text-emerald-500', barColor: 'bg-emerald-500', desc: 'Already well-managed — skip or upsell', width: 40 },
];

const SALES_TOOLS = [
  {
    icon: FileText,
    title: 'Audit Reports',
    desc: 'Generate a printable report showing a prospect their exact gaps — search ranking, review health, web presence. Send it cold or use it to open the call.',
  },
  {
    icon: Mail,
    title: 'Outreach Templates',
    desc: 'Ready-to-send email templates pre-filled with each prospect\'s actual data. Every message references their specific problems.',
  },
  {
    icon: Download,
    title: 'CSV Export',
    desc: 'Download your full prospect list with scores, signals, and contact info — structured and ready for your CRM or outreach tool.',
  },
];

const PERSONAS = [
  { icon: Briefcase, title: 'Agency Owners', desc: 'Stop cold-calling blind. Walk into every pitch with proof of exactly what\'s broken.' },
  { icon: User, title: 'Freelance Marketers', desc: 'Find clients who actually need you — and can see it in the data before you even pick up the phone.' },
  { icon: Users, title: 'Sales Teams', desc: 'Fill your pipeline with pre-qualified, data-backed leads. No more guessing who to call first.' },
];

// ─── SVG Illustrations ──────────────────────────────────────────────

function AuditReportSVG() {
  return (
    <svg viewBox="0 0 280 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
      {/* Document */}
      <rect x="40" y="10" width="200" height="160" rx="8" fill="#fafaf9" stroke="#e5e7eb" strokeWidth="1.5" />
      {/* Header bar */}
      <rect x="56" y="26" width="120" height="8" rx="4" fill="#0d7c7b" opacity="0.2" />
      <rect x="56" y="42" width="80" height="6" rx="3" fill="#d6d3cf" />
      {/* Bar chart */}
      <rect x="56" y="62" width="168" height="1" fill="#e5e7eb" />
      <rect x="56" y="72" width="140" height="12" rx="3" fill="#0d7c7b" opacity="0.15" />
      <rect x="56" y="72" width="120" height="12" rx="3" fill="#0d7c7b" opacity="0.6" />
      <rect x="56" y="90" width="140" height="12" rx="3" fill="#f59e0b" opacity="0.15" />
      <rect x="56" y="90" width="85" height="12" rx="3" fill="#f59e0b" opacity="0.6" />
      <rect x="56" y="108" width="140" height="12" rx="3" fill="#ef4444" opacity="0.15" />
      <rect x="56" y="108" width="45" height="12" rx="3" fill="#ef4444" opacity="0.6" />
      {/* Check marks */}
      <circle cx="216" cy="78" r="8" fill="#10b981" opacity="0.15" />
      <path d="M212 78l3 3 5-5" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="216" cy="96" r="8" fill="#f59e0b" opacity="0.15" />
      <path d="M213 96h6" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="216" cy="114" r="8" fill="#ef4444" opacity="0.15" />
      <path d="M213 111l6 6M219 111l-6 6" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
      {/* Footer text lines */}
      <rect x="56" y="134" width="100" height="5" rx="2.5" fill="#d6d3cf" />
      <rect x="56" y="146" width="70" height="5" rx="2.5" fill="#e5e7eb" />
    </svg>
  );
}

function OutreachSVG() {
  return (
    <svg viewBox="0 0 280 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
      {/* Email window */}
      <rect x="30" y="10" width="220" height="160" rx="8" fill="#fafaf9" stroke="#e5e7eb" strokeWidth="1.5" />
      {/* Toolbar */}
      <rect x="30" y="10" width="220" height="28" rx="8" fill="#f5f4f2" />
      <rect x="30" y="30" width="220" height="1" fill="#e5e7eb" />
      <circle cx="46" cy="24" r="4" fill="#ef4444" opacity="0.5" />
      <circle cx="58" cy="24" r="4" fill="#f59e0b" opacity="0.5" />
      <circle cx="70" cy="24" r="4" fill="#10b981" opacity="0.5" />
      {/* To field */}
      <rect x="46" y="44" width="16" height="6" rx="3" fill="#a8a29e" />
      <rect x="70" y="44" width="100" height="6" rx="3" fill="#d6d3cf" />
      {/* Subject line */}
      <rect x="46" y="58" width="28" height="6" rx="3" fill="#a8a29e" />
      <rect x="82" y="58" width="140" height="6" rx="3" fill="#0d7c7b" opacity="0.3" />
      <rect x="46" y="72" width="188" height="1" fill="#e5e7eb" />
      {/* Body with highlighted data */}
      <rect x="46" y="82" width="160" height="5" rx="2.5" fill="#d6d3cf" />
      <rect x="46" y="94" width="130" height="5" rx="2.5" fill="#d6d3cf" />
      {/* Highlighted personalized fields */}
      <rect x="46" y="108" width="60" height="14" rx="4" fill="#0d7c7b" opacity="0.1" />
      <rect x="50" y="112" width="52" height="6" rx="3" fill="#0d7c7b" opacity="0.5" />
      <rect x="114" y="108" width="50" height="14" rx="4" fill="#0d7c7b" opacity="0.1" />
      <rect x="118" y="112" width="42" height="6" rx="3" fill="#0d7c7b" opacity="0.5" />
      {/* More body */}
      <rect x="46" y="132" width="140" height="5" rx="2.5" fill="#d6d3cf" />
      <rect x="46" y="144" width="100" height="5" rx="2.5" fill="#e5e7eb" />
    </svg>
  );
}

function ExportSVG() {
  return (
    <svg viewBox="0 0 280 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
      {/* Spreadsheet */}
      <rect x="30" y="10" width="220" height="160" rx="8" fill="#fafaf9" stroke="#e5e7eb" strokeWidth="1.5" />
      {/* Header row */}
      <rect x="30" y="10" width="220" height="24" rx="8" fill="#f5f4f2" />
      <rect x="30" y="26" width="220" height="1" fill="#e5e7eb" />
      {/* Column headers */}
      <rect x="42" y="18" width="36" height="6" rx="3" fill="#78716c" />
      <rect x="98" y="18" width="28" height="6" rx="3" fill="#78716c" />
      <rect x="148" y="18" width="24" height="6" rx="3" fill="#78716c" />
      <rect x="196" y="18" width="36" height="6" rx="3" fill="#78716c" />
      {/* Column dividers */}
      <line x1="88" y1="10" x2="88" y2="170" stroke="#e5e7eb" strokeWidth="1" />
      <line x1="138" y1="10" x2="138" y2="170" stroke="#e5e7eb" strokeWidth="1" />
      <line x1="186" y1="10" x2="186" y2="170" stroke="#e5e7eb" strokeWidth="1" />
      {/* Row 1 */}
      <rect x="42" y="38" width="32" height="5" rx="2.5" fill="#d6d3cf" />
      <rect x="101" y="36" width="24" height="10" rx="5" fill="#ef4444" opacity="0.15" />
      <rect x="105" y="39" width="16" height="5" rx="2.5" fill="#ef4444" opacity="0.7" />
      <rect x="148" y="38" width="20" height="5" rx="2.5" fill="#d6d3cf" />
      <rect x="196" y="38" width="28" height="5" rx="2.5" fill="#d6d3cf" />
      <line x1="30" y1="50" x2="250" y2="50" stroke="#e5e7eb" strokeWidth="1" />
      {/* Row 2 */}
      <rect x="42" y="58" width="28" height="5" rx="2.5" fill="#d6d3cf" />
      <rect x="101" y="56" width="24" height="10" rx="5" fill="#f59e0b" opacity="0.15" />
      <rect x="105" y="59" width="16" height="5" rx="2.5" fill="#f59e0b" opacity="0.7" />
      <rect x="148" y="58" width="24" height="5" rx="2.5" fill="#d6d3cf" />
      <rect x="196" y="58" width="32" height="5" rx="2.5" fill="#d6d3cf" />
      <line x1="30" y1="70" x2="250" y2="70" stroke="#e5e7eb" strokeWidth="1" />
      {/* Row 3 */}
      <rect x="42" y="78" width="36" height="5" rx="2.5" fill="#d6d3cf" />
      <rect x="101" y="76" width="24" height="10" rx="5" fill="#10b981" opacity="0.15" />
      <rect x="105" y="79" width="16" height="5" rx="2.5" fill="#10b981" opacity="0.7" />
      <rect x="148" y="78" width="18" height="5" rx="2.5" fill="#d6d3cf" />
      <rect x="196" y="78" width="24" height="5" rx="2.5" fill="#d6d3cf" />
      <line x1="30" y1="90" x2="250" y2="90" stroke="#e5e7eb" strokeWidth="1" />
      {/* Row 4 */}
      <rect x="42" y="98" width="30" height="5" rx="2.5" fill="#d6d3cf" />
      <rect x="101" y="96" width="24" height="10" rx="5" fill="#ef4444" opacity="0.15" />
      <rect x="105" y="99" width="16" height="5" rx="2.5" fill="#ef4444" opacity="0.7" />
      <rect x="148" y="98" width="22" height="5" rx="2.5" fill="#d6d3cf" />
      <rect x="196" y="98" width="30" height="5" rx="2.5" fill="#d6d3cf" />
      <line x1="30" y1="110" x2="250" y2="110" stroke="#e5e7eb" strokeWidth="1" />
      {/* Row 5 */}
      <rect x="42" y="118" width="34" height="5" rx="2.5" fill="#d6d3cf" />
      <rect x="101" y="116" width="24" height="10" rx="5" fill="#f59e0b" opacity="0.15" />
      <rect x="105" y="119" width="16" height="5" rx="2.5" fill="#f59e0b" opacity="0.7" />
      <rect x="148" y="118" width="20" height="5" rx="2.5" fill="#d6d3cf" />
      <rect x="196" y="118" width="26" height="5" rx="2.5" fill="#d6d3cf" />
      <line x1="30" y1="130" x2="250" y2="130" stroke="#e5e7eb" strokeWidth="1" />
      {/* More rows faded */}
      <rect x="42" y="138" width="30" height="5" rx="2.5" fill="#e5e7eb" />
      <rect x="105" y="139" width="16" height="5" rx="2.5" fill="#e5e7eb" />
      <rect x="148" y="138" width="22" height="5" rx="2.5" fill="#e5e7eb" />
      <rect x="196" y="138" width="28" height="5" rx="2.5" fill="#e5e7eb" />
      <line x1="30" y1="150" x2="250" y2="150" stroke="#e5e7eb" strokeWidth="1" />
      <rect x="42" y="156" width="26" height="5" rx="2.5" fill="#f5f4f2" />
      <rect x="105" y="157" width="16" height="5" rx="2.5" fill="#f5f4f2" />
      <rect x="148" y="156" width="18" height="5" rx="2.5" fill="#f5f4f2" />
      <rect x="196" y="156" width="24" height="5" rx="2.5" fill="#f5f4f2" />
    </svg>
  );
}

// ─── Animated Score Bar SVG ─────────────────────────────────────────

function ScoreBarSVG({ animate }: { animate: boolean }) {
  return (
    <svg viewBox="0 0 600 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
      {/* Track */}
      <rect x="0" y="12" width="600" height="24" rx="12" fill="#f5f4f2" />
      {/* Segments — animate width */}
      <rect
        x="0" y="12" rx="12"
        height="24"
        fill="#10b981"
        style={{
          width: animate ? 240 : 0,
          transition: 'width 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      />
      <rect
        x="240" y="12"
        height="24"
        fill="#f59e0b"
        style={{
          width: animate ? 180 : 0,
          transition: 'width 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.2s',
        }}
      />
      <rect
        x="420" y="12"
        height="24"
        fill="#ef4444"
        style={{
          width: animate ? 180 : 0,
          borderRadius: '0 12px 12px 0',
          transition: 'width 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.4s',
        }}
      />
      {/* Labels */}
      <text x="120" y="30" textAnchor="middle" fill="white" fontSize="11" fontWeight="600"
        style={{ opacity: animate ? 1 : 0, transition: 'opacity 0.5s ease 0.8s' }}>
        Low need (0–39)
      </text>
      <text x="330" y="30" textAnchor="middle" fill="white" fontSize="11" fontWeight="600"
        style={{ opacity: animate ? 1 : 0, transition: 'opacity 0.5s ease 1s' }}>
        Medium (40–69)
      </text>
      <text x="510" y="30" textAnchor="middle" fill="white" fontSize="11" fontWeight="600"
        style={{ opacity: animate ? 1 : 0, transition: 'opacity 0.5s ease 1.2s' }}>
        High (70–100)
      </text>
    </svg>
  );
}

// ─── Component ──────────────────────────────────────────────────────

const TOOL_SVGS = [AuditReportSVG, OutreachSVG, ExportSVG];

export function FeaturesContent() {
  // Scroll reveals
  const hero = useReveal(0.1);
  const signals = useReveal(0.15);
  const score = useReveal(0.2);
  const tools = useReveal(0.15);
  const personas = useReveal(0.15);
  const cta = useReveal(0.2);

  // Mouse parallax for hero
  const parallax = useMouseParallax(15);

  // Count-ups for score section
  const scoreHigh = useCountUp(70, 800, score.visible);
  const scoreMed = useCountUp(40, 800, score.visible);

  return (
    <div className="force-light min-h-screen bg-white flex flex-col">
      <MarketingHeader />

      {/* ─── Hero ──────────────────────────────────────────────────── */}
      <section className="pt-16 pb-12 md:pt-24 md:pb-20">
        <div
          ref={hero.ref}
          className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center"
        >
          {/* Text */}
          <div className={`transition-all duration-700 ease-out ${hero.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <h1 className="text-3xl md:text-4xl lg:text-[2.75rem] font-semibold text-gray-900 mb-5 tracking-tight leading-[1.1]">
              Walk into every pitch knowing exactly what to say
            </h1>
            <p className="text-base md:text-lg text-gray-600 leading-relaxed mb-8">
              Packleads scores every business in a market across four dimensions — so you know who needs help, why they need it, and how to open the conversation.
            </p>
            <Link
              href="/signup"
              className="inline-flex px-7 py-3 text-sm font-semibold bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors"
            >
              Start your first scan
            </Link>
          </div>

          {/* Screenshot with parallax accents */}
          <div
            ref={parallax.ref}
            className={`relative transition-all duration-700 ease-out ${hero.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            style={{ transitionDelay: hero.visible ? '200ms' : '0ms' }}
          >
            {/* Floating accent — top-right teal circle */}
            <div
              className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-violet-100 opacity-60 blur-sm"
              style={{
                transform: `translate(${parallax.offset.x * 1.5}px, ${parallax.offset.y * 1.5}px)`,
                transition: 'transform 0.15s ease-out',
              }}
            />
            {/* Floating accent — bottom-left teal dot */}
            <div
              className="absolute -bottom-3 -left-3 w-12 h-12 rounded-full bg-violet-200 opacity-50 blur-sm"
              style={{
                transform: `translate(${parallax.offset.x * -1.2}px, ${parallax.offset.y * -1.2}px)`,
                transition: 'transform 0.15s ease-out',
              }}
            />
            {/* Floating accent — mid-left small ring */}
            <div
              className="absolute top-1/3 -left-6 w-8 h-8 rounded-full border-2 border-violet-300 opacity-40"
              style={{
                transform: `translate(${parallax.offset.x * -0.8}px, ${parallax.offset.y * -0.8}px)`,
                transition: 'transform 0.15s ease-out',
              }}
            />
            {/* Screenshot */}
            <img
              src="/hero-screenshot.png"
              alt="Packleads dashboard showing scored business leads"
              className="relative z-10 w-full rounded-xl shadow-lg border border-gray-200"
              style={{
                transform: `translate(${parallax.offset.x * 0.3}px, ${parallax.offset.y * 0.3}px)`,
                transition: 'transform 0.15s ease-out',
              }}
            />
          </div>
        </div>
      </section>

      {/* ─── Signal Categories ─────────────────────────────────────── */}
      <section className="py-16 md:py-24 border-t border-gray-200">
        <div ref={signals.ref} className="max-w-5xl mx-auto px-4">
          <h2 className={`text-2xl md:text-3xl font-semibold text-gray-900 mb-3 text-center transition-all duration-700 ease-out ${signals.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            Four reasons a business needs you — found automatically
          </h2>
          <p className={`text-sm text-gray-600 text-center mb-12 max-w-xl mx-auto transition-all duration-700 ease-out ${signals.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ transitionDelay: signals.visible ? '100ms' : '0ms' }}>
            Every business is scored across four signal dimensions. You know exactly who to call first — and what to lead with.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {SIGNAL_CATEGORIES.map((cat, i) => {
              const Icon = cat.icon;
              return (
                <div
                  key={cat.label}
                  className={`group rounded-lg border border-gray-200 border-l-[3px] ${cat.accentColor} bg-white p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${signals.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                  style={{
                    transitionDelay: signals.visible ? `${150 + i * 100}ms` : '0ms',
                    transitionProperty: 'opacity, transform, box-shadow',
                    transitionDuration: '700ms, 700ms, 200ms',
                  }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-9 h-9 rounded-lg ${cat.bgAccent} flex items-center justify-center`}>
                      <Icon size={18} className={cat.textColor} />
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-xs font-semibold uppercase tracking-wider ${cat.textColor}`}>{cat.label}</span>
                      <h3 className="text-base font-semibold text-gray-900">{cat.fullName}</h3>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 leading-relaxed mb-3">{cat.desc}</p>

                  <ul className="space-y-1.5">
                    {cat.signals.map((signal) => (
                      <li key={signal} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className={`mt-1 shrink-0 w-1.5 h-1.5 rounded-full ${cat.textColor.replace('text-', 'bg-')} opacity-50`} />
                        {signal}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Need Score ────────────────────────────────────────────── */}
      <section className="py-16 md:py-24 border-t border-gray-200 bg-gray-50">
        <div ref={score.ref} className="max-w-3xl mx-auto px-4">
          <h2 className={`text-2xl md:text-3xl font-semibold text-gray-900 mb-3 text-center transition-all duration-700 ease-out ${score.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            One number that tells you who to call first
          </h2>
          <p className={`text-sm text-gray-600 text-center mb-10 max-w-xl mx-auto transition-all duration-700 ease-out ${score.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ transitionDelay: score.visible ? '100ms' : '0ms' }}>
            Every business gets a 0–100 Need Score. Higher = more gaps = easier conversation.
          </p>

          {/* Animated score bar */}
          <div className={`mb-10 transition-all duration-700 ease-out ${score.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ transitionDelay: score.visible ? '200ms' : '0ms' }}>
            <ScoreBarSVG animate={score.visible} />
          </div>

          {/* Score ranges */}
          <div className="space-y-3">
            {SCORE_RANGES.map((item, i) => (
              <div
                key={item.range}
                className={`flex items-center gap-4 rounded-lg border border-gray-200 bg-white px-5 py-4 transition-all duration-700 ease-out ${score.visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}
                style={{ transitionDelay: score.visible ? `${300 + i * 100}ms` : '0ms' }}
              >
                <span className={`text-2xl font-bold ${item.color} w-20 shrink-0 tabular-nums`}>
                  {i === 0 ? scoreHigh : i === 1 ? scoreMed : 0}–{i === 0 ? 100 : i === 1 ? 69 : 39}
                </span>
                <div className={`w-1 h-8 rounded-full ${item.barColor} opacity-30 shrink-0`} />
                <div>
                  <div className={`text-sm font-semibold ${item.color}`}>{item.label}</div>
                  <div className="text-xs text-gray-600 mt-0.5">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Sales Tools ───────────────────────────────────────────── */}
      <section className="py-16 md:py-24 border-t border-gray-200">
        <div ref={tools.ref} className="max-w-5xl mx-auto px-4">
          <h2 className={`text-2xl md:text-3xl font-semibold text-gray-900 mb-3 text-center transition-all duration-700 ease-out ${tools.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            From lead to pitch — without leaving Packleads
          </h2>
          <p className={`text-sm text-gray-600 text-center mb-12 max-w-xl mx-auto transition-all duration-700 ease-out ${tools.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ transitionDelay: tools.visible ? '100ms' : '0ms' }}>
            Finding leads is half the job. Packleads gives you the tools to close them.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {SALES_TOOLS.map((tool, i) => {
              const ToolIcon = tool.icon;
              const ToolSVG = TOOL_SVGS[i];
              return (
                <div
                  key={tool.title}
                  className={`group rounded-xl border border-gray-200 bg-white overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${tools.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                  style={{
                    transitionDelay: tools.visible ? `${200 + i * 120}ms` : '0ms',
                    transitionProperty: 'opacity, transform, box-shadow',
                    transitionDuration: '700ms, 700ms, 200ms',
                  }}
                >
                  {/* SVG Illustration */}
                  <div className="bg-gray-50 border-b border-gray-100 p-4 overflow-hidden">
                    <div className="transition-transform duration-300 group-hover:scale-[1.02]">
                      <ToolSVG />
                    </div>
                  </div>
                  {/* Text */}
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <ToolIcon size={16} className="text-violet-600" />
                      <h3 className="text-base font-semibold text-gray-900">{tool.title}</h3>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{tool.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Who Is This For ───────────────────────────────────────── */}
      <section className="py-16 md:py-24 border-t border-gray-200 bg-gray-50">
        <div ref={personas.ref} className="max-w-4xl mx-auto px-4">
          <h2 className={`text-2xl md:text-3xl font-semibold text-gray-900 mb-3 text-center transition-all duration-700 ease-out ${personas.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            Built for people who sell marketing services
          </h2>
          <p className={`text-sm text-gray-600 text-center mb-12 max-w-xl mx-auto transition-all duration-700 ease-out ${personas.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ transitionDelay: personas.visible ? '100ms' : '0ms' }}>
            Whether you&apos;re running an agency, freelancing solo, or managing a sales team — Packleads gives you the leads and the leverage.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {PERSONAS.map((p, i) => {
              const PIcon = p.icon;
              return (
                <div
                  key={p.title}
                  className={`text-center rounded-xl border border-gray-200 bg-white p-6 transition-all duration-700 ease-out ${personas.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                  style={{ transitionDelay: personas.visible ? `${200 + i * 100}ms` : '0ms' }}
                >
                  <div className="w-12 h-12 rounded-xl bg-violet-50 flex items-center justify-center mx-auto mb-4">
                    <PIcon size={22} className="text-violet-600" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">{p.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{p.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── CTA ───────────────────────────────────────────────────── */}
      <section className="relative py-20 md:py-28 border-t border-gray-200 overflow-hidden">
        {/* Subtle gradient backdrop */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-50/80 via-white to-violet-50/40" />
        <div
          ref={cta.ref}
          className={`relative max-w-xl mx-auto px-4 text-center transition-all duration-700 ease-out ${cta.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
        >
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-4">
            Try it on your market — free
          </h2>
          <p className="text-sm text-gray-600 mb-8">
            No credit card. Scan a real market and see the leads you&apos;ve been missing.
          </p>
          <Link
            href="/signup"
            className="inline-flex px-8 py-3.5 text-base font-semibold bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors shadow-sm"
          >
            Start your first scan
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
