'use client';

import { useState, useCallback } from 'react';
import { X, ChevronRight } from 'lucide-react';
import { Modal } from './ui/Modal';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SLIDES = [
  {
    title: 'Welcome to Packleads',
    description: 'Find businesses that need your help\u2009\u2014\u2009before your competitors do.',
    visual: 'welcome',
  },
  {
    title: 'Search any market',
    description: 'Enter a niche and location to scan Google Business Profiles in seconds.',
    visual: 'search',
  },
  {
    title: 'Read the signals',
    description: 'We analyze 10+ GBP signals per business and score them by opportunity level.',
    visual: 'analyze',
  },
  {
    title: "You're ready",
    description: 'You have 5 free credits. Run your first scan now.',
    visual: 'export',
  },
] as const;

function WelcomeVisual() {
  return (
    <div className="relative flex items-center justify-center w-full h-44">
      {/* Layered gradient orbs */}
      <div className="absolute w-40 h-40 rounded-full bg-gradient-to-br from-violet-600/20 to-violet-500/10 blur-2xl" />
      <div className="absolute w-24 h-24 rounded-full bg-gradient-to-tr from-violet-500/15 to-violet-400/10 blur-xl" style={{ top: '10%', right: '25%' }} />
      {/* Stylized wordmark */}
      <div className="relative">
        <span className="text-4xl font-black tracking-tight bg-gradient-to-r from-violet-400 via-violet-500 to-violet-600 bg-clip-text text-transparent">
          SB
        </span>
        <div className="absolute -inset-3 rounded-2xl bg-violet-500/5 border border-violet-500/10" />
      </div>
    </div>
  );
}

function SearchVisual() {
  return (
    <div className="relative flex flex-col items-center justify-center w-full h-44 gap-3">
      {/* Mini app mockup */}
      <div className="w-full max-w-xs">
        <div className="rounded-xl bg-gray-50 border border-gray-200 p-3 shadow-lg shadow-black/10">
          {/* Fake search bar */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200">
              <span className="text-xs text-gray-500">plumber</span>
            </div>
            <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200">
              <span className="text-xs text-gray-500">Austin, TX</span>
            </div>
          </div>
          <div className="w-full py-1.5 rounded-lg bg-violet-600 text-center">
            <span className="text-[11px] font-semibold text-white">Scan Market</span>
          </div>
        </div>
        {/* Fake results preview */}
        <div className="mt-2 mx-2 space-y-1">
          {[72, 58, 45].map((w, i) => (
            <div key={i} className="flex items-center gap-2 opacity-60" style={{ opacity: 0.7 - i * 0.2 }}>
              <div className="w-5 h-5 rounded bg-gray-100 border border-gray-200" />
              <div className="h-2 rounded-full bg-gray-200" style={{ width: `${w}%` }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AnalyzeVisual() {
  const signals = [
    { label: 'GBP', score: 3, max: 5, fill: 'bg-blue-500' },
    { label: 'Rank', score: 1, max: 5, fill: 'bg-amber-500' },
    { label: 'Web', score: 4, max: 5, fill: 'bg-emerald-500' },
    { label: 'Rep', score: 2, max: 5, fill: 'bg-rose-500' },
  ];

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-44">
      {/* Mini analysis card */}
      <div className="w-full max-w-xs rounded-xl bg-gray-50 border border-gray-200 p-4 shadow-lg shadow-black/10">
        {/* Business name placeholder */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-gray-200" />
          <div>
            <div className="h-2 w-24 rounded-full bg-gray-300 mb-1" />
            <div className="h-1.5 w-16 rounded-full bg-gray-200" />
          </div>
          <div className="ml-auto text-right">
            <span className="text-lg font-black text-violet-400">75</span>
            <div className="text-[9px] text-gray-500 -mt-0.5">SEO Need</div>
          </div>
        </div>
        {/* Signal bars */}
        <div className="space-y-1.5">
          {signals.map((s) => (
            <div key={s.label} className="flex items-center gap-2">
              <span className="text-[11px] text-gray-500 w-8 font-medium">{s.label}</span>
              <div className="flex-1 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                <div
                  className={`h-full rounded-full ${s.fill} transition-all`}
                  style={{ width: `${(s.score / s.max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReadyVisual() {
  return (
    <div className="relative flex items-center justify-center w-full h-44">
      {/* Background glow */}
      <div className="absolute w-36 h-36 rounded-full bg-gradient-to-br from-violet-600/15 to-violet-500/10 blur-2xl" />
      {/* Big credit number */}
      <div className="relative flex flex-col items-center">
        <span className="text-7xl font-black bg-gradient-to-b from-gray-900 to-gray-500 bg-clip-text text-transparent leading-none">
          5
        </span>
        <span className="text-xs font-semibold text-gray-500 tracking-widest uppercase mt-1">free credits</span>
      </div>
    </div>
  );
}

const VISUALS: Record<string, () => React.JSX.Element> = {
  welcome: WelcomeVisual,
  search: SearchVisual,
  analyze: AnalyzeVisual,
  export: ReadyVisual,
};

export function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const isLastSlide = currentSlide === SLIDES.length - 1;

  const handleNext = useCallback(() => {
    if (isLastSlide) {
      onClose();
      return;
    }
    setCurrentSlide((prev) => prev + 1);
  }, [isLastSlide, onClose]);

  const handleSkip = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleDotClick = useCallback((index: number) => {
    setCurrentSlide(index);
  }, []);

  const slide = SLIDES[currentSlide];
  const Visual = VISUALS[slide.visual];

  return (
    <Modal open={isOpen} onClose={handleSkip} size="md" hideClose>
      {/* Close button */}
      <button
        onClick={handleSkip}
        className="absolute top-4 right-4 z-10 p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        aria-label="Close onboarding"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Content area */}
      <div className="px-2 pt-4 pb-8">
        {/* Visual */}
        <div className="mb-6">
          <Visual />
        </div>

        {/* Text */}
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold tracking-tight text-gray-900">{slide.title}</h2>
          <p className="text-sm text-gray-500 leading-relaxed max-w-sm mx-auto">{slide.description}</p>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="px-2 pb-2">
        {/* Dot indicators */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {SLIDES.map((_, index) => (
            <button
              key={index}
              onClick={() => handleDotClick(index)}
              className={`rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? 'w-6 h-2 bg-violet-500'
                  : 'w-2 h-2 bg-gray-200 hover:bg-gray-300'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={handleSkip}
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Skip
          </button>

          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors shadow-lg shadow-violet-600/20"
          >
            {isLastSlide ? 'Get started' : 'Next'}
            {!isLastSlide && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </Modal>
  );
}
