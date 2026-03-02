'use client';

import { useState, useEffect, useCallback, useLayoutEffect, useRef } from 'react';
import { X, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

const TOUR_COMPLETE_KEY = 'packleads_tour_complete';

interface TourStep {
  target: string;
  mobileTarget?: string;
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  mobilePosition?: 'top' | 'bottom' | 'left' | 'right';
}

const TOUR_STEPS: TourStep[] = [
  {
    target: 'search-form',
    title: 'Start here',
    content: 'Type a business niche and location to scan Google Business Profiles in your market.',
    position: 'bottom',
  },
  {
    target: 'search-button',
    title: 'Run your first scan',
    content: 'Each search costs 1 credit. You have 5 free credits to start.',
    position: 'top',
  },
  {
    target: 'library-tab',
    mobileTarget: 'library-tab-mobile',
    title: 'Your searches live here',
    content: 'Every search is saved. Come back to view, analyze, or export anytime.',
    position: 'right',
    mobilePosition: 'top',
  },
  {
    target: 'credits-display',
    mobileTarget: 'credits-display-mobile',
    title: 'Track your credits',
    content: 'See how many scans you have left. Click to purchase more when you need them.',
    position: 'right',
    mobilePosition: 'top',
  },
];

function getTargetElement(step: TourStep, isMobile: boolean): Element | null {
  const attr = isMobile && step.mobileTarget ? step.mobileTarget : step.target;
  return document.querySelector(`[data-tour="${attr}"]`);
}

function getPosition(step: TourStep, isMobile: boolean) {
  return isMobile && step.mobilePosition ? step.mobilePosition : step.position;
}

interface TooltipCoords {
  top: number;
  left: number;
}

function computeTooltipCoords(
  rect: DOMRect,
  position: 'top' | 'bottom' | 'left' | 'right',
  tooltipWidth: number,
  tooltipHeight: number,
  isMobile: boolean,
): TooltipCoords {
  const GAP = 12;
  let top = 0;
  let left = 0;

  switch (position) {
    case 'bottom':
      top = rect.bottom + GAP;
      left = rect.left + rect.width / 2 - tooltipWidth / 2;
      break;
    case 'top':
      top = rect.top - tooltipHeight - GAP;
      left = rect.left + rect.width / 2 - tooltipWidth / 2;
      break;
    case 'right':
      top = rect.top + rect.height / 2 - tooltipHeight / 2;
      left = rect.right + GAP;
      break;
    case 'left':
      top = rect.top + rect.height / 2 - tooltipHeight / 2;
      left = rect.left - tooltipWidth - GAP;
      break;
  }

  // Clamp to viewport — account for mobile bottom nav (~80px)
  const pad = 16;
  const bottomPad = isMobile ? 88 : pad;
  left = Math.max(pad, Math.min(left, window.innerWidth - tooltipWidth - pad));
  top = Math.max(pad, Math.min(top, window.innerHeight - tooltipHeight - bottomPad));

  return { top, left };
}

export function TourOverlay() {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipCoords, setTooltipCoords] = useState<TooltipCoords>({ top: 0, left: 0 });
  const [positioned, setPositioned] = useState(false);
  const rafRef = useRef<number>(0);

  // Check if tour should show
  // Priority: user_metadata flag → fallback to account age
  useEffect(() => {
    if (!user) return;

    const flag = user.user_metadata?.onboarding_completed;

    // Explicitly completed → cache and skip
    if (flag === true || localStorage.getItem(TOUR_COMPLETE_KEY)) {
      localStorage.setItem(TOUR_COMPLETE_KEY, 'true');
      return;
    }

    // Explicitly stamped false at signup → show
    // OR: flag undefined + account < 1 hour old → new user, callback may not have stamped yet
    const isExplicitlyNew = flag === false;
    const accountAgeMs = Date.now() - new Date(user.created_at).getTime();
    const isRecentAccount = flag === undefined && accountAgeMs < 60 * 60 * 1000;

    if (!isExplicitlyNew && !isRecentAccount) return;

    // Clear any stale localStorage from a previous account
    localStorage.removeItem(TOUR_COMPLETE_KEY);

    // Small delay to let the dashboard render first
    const timer = setTimeout(() => setIsActive(true), 800);
    return () => clearTimeout(timer);
  }, [user]);

  // Track mobile breakpoint
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Reset positioned flag when step changes
  useEffect(() => {
    setPositioned(false);
  }, [currentStep]);

  // Measure target element and reposition
  const measure = useCallback(() => {
    if (!isActive) return;

    const step = TOUR_STEPS[currentStep];
    const el = getTargetElement(step, isMobile);

    if (!el) {
      setTargetRect(null);
      return;
    }

    const rect = el.getBoundingClientRect();

    // Skip if element has zero dimensions (not rendered yet)
    if (rect.width === 0 && rect.height === 0) {
      setTargetRect(null);
      return;
    }

    setTargetRect(rect);

    // Position the tooltip — only mark as positioned when we have real tooltip dimensions
    if (tooltipRef.current) {
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      if (tooltipRect.width > 0 && tooltipRect.height > 0) {
        const pos = getPosition(step, isMobile);
        const coords = computeTooltipCoords(rect, pos, tooltipRect.width, tooltipRect.height, isMobile);
        setTooltipCoords(coords);
        setPositioned(true);
      }
    }
  }, [isActive, currentStep, isMobile]);

  // Measure on step change, resize, scroll
  useLayoutEffect(() => {
    measure();
  }, [measure]);

  useEffect(() => {
    if (!isActive) return;

    const handleUpdate = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(measure);
    };

    window.addEventListener('resize', handleUpdate);
    window.addEventListener('scroll', handleUpdate, true);
    return () => {
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('scroll', handleUpdate, true);
      cancelAnimationFrame(rafRef.current);
    };
  }, [isActive, measure]);

  // Re-measure after tooltip mounts (first render has no dimensions)
  // Poll until positioned to handle late-rendering targets
  useEffect(() => {
    if (!isActive) return;

    // Immediate RAF for when tooltip just mounted
    const raf = requestAnimationFrame(measure);

    // If not positioned yet, poll every 100ms until we get valid measurements
    // (handles cases where the target element renders after the tour activates)
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    if (!positioned) {
      pollTimer = setInterval(() => {
        measure();
      }, 100);
    }

    return () => {
      cancelAnimationFrame(raf);
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [isActive, currentStep, measure, positioned]);

  const completeTour = useCallback(() => {
    // Fast local cache
    localStorage.setItem(TOUR_COMPLETE_KEY, 'true');
    setIsActive(false);

    // Persist to user account (source of truth)
    const supabase = createClient();
    supabase.auth.updateUser({ data: { onboarding_completed: true } });
  }, []);

  const handleNext = useCallback(() => {
    if (currentStep >= TOUR_STEPS.length - 1) {
      completeTour();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, completeTour]);

  const handleSkip = useCallback(() => {
    completeTour();
  }, [completeTour]);

  if (!isActive || !targetRect) return null;

  const step = TOUR_STEPS[currentStep];
  const isLastStep = currentStep === TOUR_STEPS.length - 1;
  const position = getPosition(step, isMobile);

  // Arrow direction (opposite of tooltip position)
  const arrowClass = {
    bottom: '-top-2 left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-white',
    top: '-bottom-2 left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-white',
    right: '-left-2 top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-white border-l-transparent',
    left: '-right-2 top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-white border-r-transparent',
  }[position];

  const PAD = 8;

  return (
    <div className="fixed inset-0 z-[60]" style={{ pointerEvents: 'auto' }}>
      {/* Spotlight cutout — everything outside is dimmed */}
      <div
        className={`absolute rounded-xl transition-all duration-300 ease-out ${positioned ? 'opacity-100' : 'opacity-0'}`}
        style={{
          top: targetRect.top - PAD,
          left: targetRect.left - PAD,
          width: targetRect.width + PAD * 2,
          height: targetRect.height + PAD * 2,
          boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)',
          pointerEvents: 'none',
        }}
      />

      {/* Backdrop — blocks clicks but doesn't dismiss tour */}
      <div
        className="absolute inset-0"
        style={{ zIndex: -1 }}
      />

      {/* Tooltip — hidden until positioned to prevent flash at (0,0) */}
      <div
        ref={tooltipRef}
        className={`absolute w-[calc(100vw-32px)] max-w-72 bg-white rounded-xl shadow-2xl shadow-black/20 border border-gray-100 p-4 transition-all duration-300 ease-out ${
          positioned ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
        }`}
        style={{
          top: tooltipCoords.top,
          left: tooltipCoords.left,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Arrow */}
        <div className={`absolute w-0 h-0 border-[8px] ${arrowClass}`} />

        {/* Close button */}
        <button
          onClick={handleSkip}
          className="absolute top-2.5 right-2.5 p-1 text-gray-400 hover:text-gray-600 rounded-md transition-colors"
          aria-label="Skip tour"
        >
          <X size={14} />
        </button>

        {/* Content */}
        <div className="pr-6">
          <h3 className="text-sm font-semibold text-gray-900">{step.title}</h3>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">{step.content}</p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-4">
          <span className="text-[11px] text-gray-400">
            {currentStep + 1} of {TOUR_STEPS.length}
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSkip}
              className="text-[11px] text-gray-400 hover:text-gray-600 transition-colors"
            >
              Skip tour
            </button>
            <button
              onClick={handleNext}
              className="flex items-center gap-1 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              {isLastStep ? 'Done' : 'Next'}
              {!isLastStep && <ChevronRight size={12} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
