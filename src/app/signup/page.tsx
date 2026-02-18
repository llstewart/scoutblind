'use client';

import Link from 'next/link';
import { AuthForm } from '@/components/auth/AuthForm';

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-white flex">
      {/* Left panel — value prop / conversion (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-[45%] relative flex-col justify-between overflow-hidden bg-gradient-to-br from-violet-600 via-violet-600 to-violet-700">
        {/* Floating orbs — layered depth */}
        <div className="absolute top-[8%] right-[10%] w-[280px] h-[280px] bg-violet-400/20 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute top-[5%] left-[-5%] w-[180px] h-[180px] bg-violet-300/15 rounded-full blur-[60px] pointer-events-none" />
        <div className="absolute top-[35%] right-[-8%] w-[120px] h-[120px] bg-purple-400/25 rounded-full blur-[40px] pointer-events-none" />
        <div className="absolute top-[50%] left-[15%] w-[350px] h-[350px] bg-violet-800/30 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[15%] right-[20%] w-[200px] h-[200px] bg-violet-400/15 rounded-full blur-[70px] pointer-events-none" />
        <div className="absolute bottom-[5%] left-[5%] w-[160px] h-[160px] bg-purple-300/10 rounded-full blur-[50px] pointer-events-none" />
        <div className="absolute top-[18%] left-[40%] w-[80px] h-[80px] bg-violet-300/20 rounded-full blur-[25px] pointer-events-none" />
        <div className="absolute bottom-[30%] left-[35%] w-[100px] h-[100px] bg-fuchsia-400/10 rounded-full blur-[35px] pointer-events-none" />

        {/* Content */}
        <div className="relative flex flex-col justify-center flex-1 px-12 xl:px-16">
          <div className="max-w-[360px]">
            <Link href="/" className="flex items-center gap-2.5 mb-12">
              <img src="/icon.svg" alt="" className="w-8 h-8" />
              <span className="text-2xl font-semibold text-white">
                Scoutblind<span className="text-violet-200">.</span>
              </span>
            </Link>

            <h1 className="text-2xl xl:text-3xl font-semibold text-white leading-tight mb-3">
              Find qualified prospects<br />
              <span className="text-violet-200">in half the time.</span>
            </h1>
            <p className="text-sm text-violet-200/80 leading-relaxed mb-12">
              Scan any local market and get a prioritized list of businesses that actually need your services.
            </p>

            {/* Stats — typographic, no boxes */}
            <div className="flex items-baseline gap-8 mb-14">
              <div>
                <div className="text-[2rem] font-extrabold text-white leading-none tracking-tight">4<span className="text-lg font-semibold text-violet-200 ml-0.5">min</span></div>
                <div className="text-[11px] text-violet-300 mt-1.5 tracking-wide uppercase">Avg scan</div>
              </div>
              <div className="w-px h-10 bg-white/15" />
              <div>
                <div className="text-[2rem] font-extrabold text-white leading-none tracking-tight">25<span className="text-lg font-semibold text-violet-200 ml-0.5">+</span></div>
                <div className="text-[11px] text-violet-300 mt-1.5 tracking-wide uppercase">Businesses</div>
              </div>
              <div className="w-px h-10 bg-white/15" />
              <div>
                <div className="text-[2rem] font-extrabold text-white leading-none tracking-tight">10<span className="text-lg font-semibold text-violet-200 ml-0.5">+</span></div>
                <div className="text-[11px] text-violet-300 mt-1.5 tracking-wide uppercase">Signals</div>
              </div>
            </div>

            {/* Signal categories — what you'll discover */}
            <div>
              <p className="text-[11px] text-violet-300 uppercase tracking-widest font-medium mb-4">What every scan reveals</p>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { color: 'bg-sky-400', label: 'GBP Health', desc: 'Claim status & activity' },
                  { color: 'bg-amber-400', label: 'Search Rank', desc: 'Local pack position' },
                  { color: 'bg-violet-300', label: 'Web Presence', desc: 'Site & tracking tools' },
                  { color: 'bg-rose-400', label: 'Reputation', desc: 'Reviews & ratings' },
                ].map((cat) => (
                  <div key={cat.label} className="flex items-start gap-2.5 rounded-lg bg-white/[0.07] px-3.5 py-3">
                    <span className={`w-2 h-2 rounded-full ${cat.color} mt-1 flex-shrink-0`} />
                    <div className="min-w-0">
                      <div className="text-[13px] font-medium text-white leading-tight">{cat.label}</div>
                      <div className="text-[11px] text-violet-300 leading-tight mt-0.5">{cat.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="relative px-12 xl:px-16 py-6 border-t border-white/10">
          <div className="flex items-center gap-4 text-xs text-violet-300">
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              No credit card
            </span>
            <span className="w-px h-3 bg-violet-400/30" />
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              5 free searches
            </span>
            <span className="w-px h-3 bg-violet-400/30" />
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              Cancel anytime
            </span>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col px-6 sm:px-12 py-12">
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Home
          </Link>
        </div>
        <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md">
          {/* Mobile-only logo */}
          <div className="text-center mb-8 lg:hidden">
            <Link href="/" className="inline-flex items-center gap-2">
              <img src="/icon.svg" alt="" className="w-7 h-7" />
              <span className="text-xl font-semibold text-gray-900">
                Scoutblind<span className="text-violet-500">.</span>
              </span>
            </Link>
          </div>

          <AuthForm
            defaultMode="signup"
            modeSwitchLinks
            onSuccess={() => {
              window.location.href = '/dashboard';
            }}
          />
        </div>
        </div>
      </div>
    </div>
  );
}
