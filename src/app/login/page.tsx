'use client';

import Link from 'next/link';
import { AuthForm } from '@/components/auth/AuthForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-white flex">
      {/* Left panel — brand / trust (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-[45%] relative bg-gray-50 flex-col justify-between overflow-hidden">
        {/* Subtle dot pattern */}
        <div
          className="absolute inset-0 opacity-[0.4]"
          style={{
            backgroundImage: 'radial-gradient(circle, #d4d4d8 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Decorative gradient orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-violet-500/[0.06] rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/4 w-[250px] h-[250px] bg-violet-400/[0.04] rounded-full blur-[80px] pointer-events-none" />

        {/* Content */}
        <div className="relative flex flex-col justify-center flex-1 px-12 xl:px-16">
          <div className="max-w-sm">
            <Link href="/" className="flex items-center gap-2.5 mb-12">
              <img src="/icon.svg" alt="" className="w-8 h-8" />
              <span className="text-2xl font-semibold text-gray-900">
                Packleads<span className="text-violet-500">.</span>
              </span>
            </Link>

            <h1 className="text-2xl xl:text-3xl font-semibold text-gray-900 leading-tight mb-4">
              Your prospects are waiting.
            </h1>
            <p className="text-sm text-gray-600 leading-relaxed mb-10">
              Pick up right where you left off. Your saved searches, market insights, and exported reports are all here.
            </p>

            {/* Trust signals */}
            <div className="space-y-4">
              {[
                {
                  text: 'Saved searches & scan history',
                  icon: (
                    <svg className="w-4 h-4 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ),
                },
                {
                  text: 'Export-ready prospect lists',
                  icon: (
                    <svg className="w-4 h-4 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                  ),
                },
                {
                  text: 'Real-time market signal data',
                  icon: (
                    <svg className="w-4 h-4 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                    </svg>
                  ),
                },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 shadow-sm">
                    {item.icon}
                  </div>
                  <span className="text-sm text-gray-600">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="relative px-12 xl:px-16 py-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Trusted by agencies and freelancers to scan 1,000+ businesses across 100+ markets.
          </p>
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
                Packleads<span className="text-violet-500">.</span>
              </span>
            </Link>
          </div>

          <AuthForm
            defaultMode="signin"
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
