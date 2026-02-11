'use client';

import { useState, useCallback } from 'react';
import { X, Search, BarChart3, Rocket, Sparkles, MapPin, Globe, Star, ChevronRight } from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SLIDES = [
  {
    title: 'Welcome to Scoutblind',
    description: 'Find businesses that need SEO help\u2009\u2014\u2009before your competitors do.',
    visual: 'welcome',
  },
  {
    title: 'Search any market',
    description: 'Enter a niche and location to scan Google Business Profiles in seconds.',
    visual: 'search',
  },
  {
    title: 'Read the signals',
    description: 'We analyze 10+ GMB signals per business and score them by SEO need.',
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
    <div className="relative flex items-center justify-center w-full h-40">
      <div className="absolute w-32 h-32 rounded-full bg-violet-500/10 animate-pulse" />
      <div className="absolute w-24 h-24 rounded-full bg-violet-500/5" />
      <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25">
        <Sparkles className="w-8 h-8 text-white" />
      </div>
      <Sparkles className="absolute top-4 right-16 w-4 h-4 text-violet-400 animate-pulse" style={{ animationDelay: '0.5s' }} />
      <Sparkles className="absolute bottom-6 left-20 w-3 h-3 text-purple-400 animate-pulse" style={{ animationDelay: '1s' }} />
    </div>
  );
}

function SearchVisual() {
  return (
    <div className="relative flex items-center justify-center w-full h-40">
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700/50 shadow-lg">
        <Search className="w-4 h-4 text-zinc-500" />
        <span className="text-sm text-zinc-400">plumber</span>
        <div className="w-px h-4 bg-zinc-700" />
        <MapPin className="w-4 h-4 text-zinc-500" />
        <span className="text-sm text-zinc-400">Austin, TX</span>
        <div className="ml-2 px-3 py-1 rounded-lg bg-violet-600 text-xs text-white font-medium">Scan</div>
      </div>
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-1">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-violet-500/60 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}

function AnalyzeVisual() {
  const badges = [
    { label: 'GBP', color: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
    { label: 'Rank', color: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
    { label: 'Web', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
    { label: 'Rep', color: 'bg-rose-500/15 text-rose-400 border-rose-500/20' },
  ];

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-40 gap-3">
      <div className="flex items-center gap-2">
        {badges.map((badge) => (
          <span
            key={badge.label}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${badge.color}`}
          >
            {badge.label}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-1">
        <BarChart3 className="w-4 h-4 text-violet-400" />
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-zinc-500 font-medium">SEO Need Score</span>
          <div className="w-24 h-2 rounded-full bg-zinc-800 overflow-hidden">
            <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-violet-500 to-purple-500" />
          </div>
          <span className="text-xs font-bold text-violet-400">75</span>
        </div>
      </div>
    </div>
  );
}

function ExportVisual() {
  return (
    <div className="relative flex items-center justify-center w-full h-40">
      <div className="absolute w-28 h-28 rounded-full bg-violet-500/10 animate-pulse" />
      <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25">
        <Rocket className="w-7 h-7 text-white" />
      </div>
      <div className="absolute top-6 right-16">
        <div className="px-2 py-1 rounded-md bg-emerald-500/15 border border-emerald-500/20">
          <span className="text-[10px] font-semibold text-emerald-400">5 free credits</span>
        </div>
      </div>
    </div>
  );
}

const VISUALS: Record<string, () => JSX.Element> = {
  welcome: WelcomeVisual,
  search: SearchVisual,
  analyze: AnalyzeVisual,
  export: ExportVisual,
};

export function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');

  const isLastSlide = currentSlide === SLIDES.length - 1;

  const handleNext = useCallback(() => {
    if (isLastSlide) {
      onClose();
      return;
    }
    setDirection('next');
    setCurrentSlide((prev) => prev + 1);
  }, [isLastSlide, onClose]);

  const handleSkip = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleDotClick = useCallback((index: number) => {
    setDirection(index > currentSlide ? 'next' : 'prev');
    setCurrentSlide(index);
  }, [currentSlide]);

  if (!isOpen) return null;

  const slide = SLIDES[currentSlide];
  const Visual = VISUALS[slide.visual];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleSkip} role="presentation" />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Welcome to Scoutblind"
        className="relative bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl shadow-black/50 w-full max-w-lg m-4 overflow-hidden"
      >
        {/* Close button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 z-10 p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
          aria-label="Close onboarding"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content area */}
        <div className="px-8 pt-10 pb-8">
          {/* Visual */}
          <div className="mb-6">
            <Visual />
          </div>

          {/* Text */}
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold text-white">{slide.title}</h2>
            <p className="text-sm text-zinc-400 leading-relaxed max-w-sm mx-auto">{slide.description}</p>
          </div>
        </div>

        {/* Bottom controls */}
        <div className="px-8 pb-8">
          {/* Dot indicators */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {SLIDES.map((_, index) => (
              <button
                key={index}
                onClick={() => handleDotClick(index)}
                className={`rounded-full transition-all duration-300 ${
                  index === currentSlide
                    ? 'w-6 h-2 bg-violet-500'
                    : 'w-2 h-2 bg-zinc-700 hover:bg-zinc-600'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={handleSkip}
              className="px-4 py-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Skip
            </button>

            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors shadow-lg shadow-violet-600/20"
            >
              {isLastSlide ? 'Get started' : 'Next'}
              {!isLastSlide && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
