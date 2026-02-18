'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { EnrichedBusiness, TableBusiness, isPendingBusiness, isEnrichedBusiness } from '@/lib/types';
import { StatusTag } from './StatusTag';
import { CellSpinner } from './CellSpinner';
import { formatDate } from '@/utils/date';
import {
  getDormancyStatus,
  sortBySeoPriority,
  getSeoNeedSummary,
  calculateSeoNeedScore,
  SIGNAL_CATEGORY_COLORS,
  SIGNAL_CATEGORY_LABELS,
  type CategorizedSignals,
  type SignalCategory,
} from '@/lib/signals';

// Tooltip component that renders in a portal to avoid overflow clipping
function HeaderTooltip({
  children,
  content
}: {
  children: React.ReactNode;
  content: React.ReactNode;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8,
        left: Math.min(rect.left, window.innerWidth - 300),
      });
    }
  }, []);

  const handleMouseEnter = () => {
    updatePosition();
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="inline-flex cursor-help"
      >
        {children}
      </div>
      {isVisible && typeof window !== 'undefined' && createPortal(
        <div
          className="fixed w-72 p-3 bg-white rounded-lg shadow-2xl shadow-black/10 z-[9999] animate-in fade-in duration-150"
          style={{ top: position.top, left: position.left }}
          onMouseEnter={() => setIsVisible(true)}
          onMouseLeave={() => setIsVisible(false)}
        >
          {content}
        </div>,
        document.body
      )}
    </>
  );
}

interface UpgradedListTableProps {
  businesses: TableBusiness[];
  niche?: string;
  location?: string;
  isLoadingMore?: boolean;
  expectedTotal?: number;
}

const ITEMS_PER_PAGE = 25;

// Copy button component
function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1 rounded hover:bg-muted-foreground/20 transition-colors"
      title={`Copy ${label}`}
    >
      {copied ? (
        <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
    </button>
  );
}

export function UpgradedListTable({ businesses, niche, location, isLoadingMore, expectedTotal }: UpgradedListTableProps) {
  const [sortByPriority, setSortByPriority] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedSignals, setExpandedSignals] = useState<Set<number>>(new Set());
  const [isCompact, setIsCompact] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showTopShadow, setShowTopShadow] = useState(false);
  const [focusedRow, setFocusedRow] = useState<number | null>(null);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);

  const toggleSignals = (index: number) => {
    setExpandedSignals(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  // Filter out only truly enriched businesses (with SEO data) for sorting and stats
  const enrichedBusinesses = businesses.filter((b): b is EnrichedBusiness =>
    !isPendingBusiness(b) && isEnrichedBusiness(b)
  );
  const pendingCount = businesses.filter(isPendingBusiness).length;

  // Check if we have businesses that haven't been analyzed yet (basic data only)
  const unanalyzedCount = businesses.filter(b =>
    !isPendingBusiness(b) && !isEnrichedBusiness(b)
  ).length;

  const displayedBusinesses = useMemo(() => {
    if (sortByPriority && pendingCount === 0) {
      return sortBySeoPriority(enrichedBusinesses) as TableBusiness[];
    }
    return businesses;
  }, [businesses, enrichedBusinesses, sortByPriority, pendingCount]);

  const totalPages = Math.ceil(displayedBusinesses.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentBusinesses = displayedBusinesses.slice(startIndex, endIndex);

  // Handle scroll events
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollTop = container.scrollTop;
    setShowTopShadow(scrollTop > 10);
    setShowScrollTop(scrollTop > 200);
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept keyboard events when user is typing in an input or textarea
      const activeElement = document.activeElement;
      if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
        return;
      }

      if (!tableRef.current?.contains(document.activeElement) && focusedRow === null) return;

      switch (e.key) {
        case 'ArrowDown':
        case 'j':
          e.preventDefault();
          setFocusedRow(prev => {
            const next = prev === null ? 0 : Math.min(prev + 1, currentBusinesses.length - 1);
            return next;
          });
          break;
        case 'ArrowUp':
        case 'k':
          e.preventDefault();
          setFocusedRow(prev => {
            const next = prev === null ? 0 : Math.max(prev - 1, 0);
            return next;
          });
          break;
        case 'Escape':
          setFocusedRow(null);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [focusedRow, currentBusinesses.length]);

  // Scroll focused row into view
  useEffect(() => {
    if (focusedRow !== null && scrollContainerRef.current) {
      const row = scrollContainerRef.current.querySelector(`[data-row-index="${focusedRow}"]`);
      row?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [focusedRow]);

  const scrollToTop = () => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reset to page 1 when sorting changes
  const handleSortToggle = () => {
    setSortByPriority(!sortByPriority);
    setCurrentPage(1);
    setFocusedRow(null);
  };

  // Column resize handler
  const handleColumnResize = (columnId: string, delta: number) => {
    setColumnWidths(prev => ({
      ...prev,
      [columnId]: Math.max(60, (prev[columnId] || 150) + delta)
    }));
  };

  // Calculate data quality stats
  const reviewDataCount = enrichedBusinesses.filter(b => b.lastReviewDate || b.responseRate > 0).length;
  const websiteAnalyzedCount = enrichedBusinesses.filter(b => b.websiteTech && b.websiteTech !== 'Analysis Failed' && b.websiteTech !== 'No Website').length;
  const websiteFailedCount = enrichedBusinesses.filter(b => b.websiteTech === 'Analysis Failed').length;

  const cellPadding = isCompact ? 'py-1.5 px-2' : 'py-2 px-3';
  const headerPadding = isCompact ? 'py-1.5 px-2' : 'py-2 px-3';

  // Mobile Card Component for Upgraded Table
  const MobileCard = ({ business, index }: { business: TableBusiness; index: number }) => {
    const isPending = isPendingBusiness(business);
    const isEnriched = !isPending && isEnrichedBusiness(business);
    const categorizedSignals = isEnriched ? getSeoNeedSummary(business as EnrichedBusiness) : { groups: [], totalCount: 0 };
    const score = isEnriched ? calculateSeoNeedScore(business as EnrichedBusiness) : 0;

    // Flatten signals with category info for mobile display
    const flatSignals = categorizedSignals.groups.flatMap(g =>
      g.signals.map(s => ({ category: g.category, text: s }))
    );

    return (
      <div
        className={`p-4 border-b border-border bg-card hover:bg-muted/10 transition-colors ${isPending ? 'bg-primary/5' : ''
          }`}
        onClick={() => setFocusedRow(index)}
      >
        {/* Header: Name, Score, Rating */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-medium text-muted-foreground flex-shrink-0">
              {startIndex + index + 1}
            </div>
            <div className="min-w-0 w-full">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-medium text-gray-500 truncate pr-2">
                  {business.name}
                </h3>
                {isEnriched && (
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${score >= 70 ? 'bg-rose-500/10 text-rose-500' :
                      score >= 40 ? 'bg-amber-500/10 text-amber-500' :
                        'bg-emerald-500/10 text-emerald-500'
                    }`}>
                    Score: {score}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-muted-foreground">{business.category}</span>
                <span className="text-xs text-muted-foreground">•</span>
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-xs font-medium text-foreground">
                    {business.rating > 0 ? business.rating : 'N/A'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({business.reviewCount})
                  </span>
                </div>
              </div>

              {/* SEO Signals Chips */}
              {isPending ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CellSpinner /> Analyzing signals...
                </div>
              ) : isEnriched && flatSignals.length > 0 ? (
                <div className="flex flex-wrap gap-1 mb-2">
                  {flatSignals.slice(0, 3).map((signal, i) => {
                    const colors = SIGNAL_CATEGORY_COLORS[signal.category];
                    return (
                      <span key={i} className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] rounded border ${colors.bg} ${colors.border}`}>
                        <span className={`font-semibold ${colors.text}`}>{SIGNAL_CATEGORY_LABELS[signal.category]}</span>
                        <span className={colors.text}>{signal.text}</span>
                      </span>
                    );
                  })}
                  {flatSignals.length > 3 && (
                    <span className="text-[10px] text-muted-foreground px-1 py-0.5">+{flatSignals.length - 3} more</span>
                  )}
                </div>
              ) : isEnriched ? (
                <span className="text-xs text-emerald-400 font-medium">Well optimized</span>
              ) : (
                <span className="text-xs text-amber-400 font-medium">Analysis pending</span>
              )}
            </div>
          </div>
        </div>

        {/* Contact Info (Compact) */}
        <div className="space-y-1.5 mb-3 pl-9">
          <div className="text-xs text-muted-foreground break-words">{business.address}</div>
          <div className="flex items-center gap-4 text-xs">
            {business.phone && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>{business.phone}</span>
              </div>
            )}
            {business.website && (
              <div className="flex items-center gap-1.5">
                <svg className="w-3 h-3 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                <a href={business.website.startsWith('http') ? business.website : `https://${business.website}`} target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:text-violet-300 truncate max-w-[120px]">
                  {(() => { try { return new URL(business.website.startsWith('http') ? business.website : `https://${business.website}`).hostname.replace('www.', ''); } catch { return 'Website'; } })()}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Metrics Grid */}
        {isEnriched && (
          <div className="grid grid-cols-2 gap-2 mb-3 bg-muted/20 p-2 rounded-lg ml-9 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Response Rate:</span>
              <span className={
                (business as EnrichedBusiness).responseRate >= 70 ? 'text-emerald-500 font-medium' :
                  (business as EnrichedBusiness).responseRate >= 30 ? 'text-amber-500 font-medium' : 'text-rose-500 font-medium'
              }>
                {(business as EnrichedBusiness).responseRate}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Search Rank:</span>
              <span className={(business as EnrichedBusiness).searchVisibility !== null ? 'text-emerald-500 font-medium' : 'text-rose-500 font-medium'}>
                {(business as EnrichedBusiness).searchVisibility !== null
                  ? `#${(business as EnrichedBusiness).searchVisibility}`
                  : 'Not in Top 20'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Last Review:</span>
              <span className="text-foreground">
                {(business as EnrichedBusiness).lastReviewDate ? formatDate((business as EnrichedBusiness).lastReviewDate) : 'No data'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Owner Active:</span>
              <span className="text-foreground">
                {(business as EnrichedBusiness).lastOwnerActivity ? formatDate((business as EnrichedBusiness).lastOwnerActivity) : 'No data'}
              </span>
            </div>
          </div>
        )}

        {/* Footer: Tags */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border/50 pl-9 text-xs">
          {business.claimed ? (
            <span className="text-emerald-500">Claimed</span>
          ) : (
            <span className="text-amber-500">Unclaimed</span>
          )}
          {business.sponsored ? (
            <span className="text-emerald-500">Ads</span>
          ) : (
            <span className="text-gray-400">No Ads</span>
          )}
          {isEnriched && (business as EnrichedBusiness).websiteTech !== 'Analysis Failed' && (
            <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded border border-border">
              Tech: {(business as EnrichedBusiness).websiteTech}
            </span>
          )}
        </div>
      </div>
    );
  };


  // Show prompt to analyze when businesses exist but none have been analyzed
  if (businesses.length === 0 || (enrichedBusinesses.length === 0 && pendingCount === 0)) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-foreground mb-1">
          {unanalyzedCount > 0 ? 'Analysis Required' : 'No enriched data available'}
        </h3>
        <p className="text-muted-foreground max-w-sm">
          {unanalyzedCount > 0
            ? `You have ${unanalyzedCount} businesses ready. Go to the "All Results" tab and click "Get Lead Intel" to unlock qualification data.`
            : 'Click "Get Lead Intel" on your search results to unlock qualification signals and high-value data.'
          }
        </p>
        {unanalyzedCount > 0 && (
          <div className="mt-4 flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-sm text-amber-400">
              Data shown without analysis may be incomplete or inaccurate
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Header bar with result count and compact toggle */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-200 bg-white/95">
        <span className="text-xs text-gray-500">
          {businesses.length.toLocaleString()} analyzed
        </span>
        <button
          onClick={() => setIsCompact(!isCompact)}
          className={`hidden md:flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded transition-colors ${isCompact
              ? 'bg-violet-600/20 text-violet-400'
              : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          {isCompact ? 'Compact' : 'Dense'}
        </button>
      </div>

      {/* Data Quality Banner - only show if significant issues */}
      {websiteFailedCount > 3 && (
        <div className="px-3 py-1 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-4 text-[10px]">
          <span className="text-amber-400">{websiteFailedCount} websites failed analysis</span>
        </div>
      )}

      {/* Filter Controls */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-200 bg-white/95">
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">
            {enrichedBusinesses.length}/{businesses.length} enriched
          </span>
          {pendingCount > 0 && (
            <span className="text-[10px] text-violet-400 flex items-center gap-1">
              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {pendingCount} loading
            </span>
          )}
        </div>
        <button
          onClick={handleSortToggle}
          disabled={pendingCount > 0}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded transition-all ${sortByPriority
            ? 'bg-violet-600 text-white'
            : 'text-gray-500 hover:text-gray-900'
            } ${pendingCount > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
          </svg>
          {sortByPriority ? 'By Priority' : 'Sort'}
        </button>
      </div>

      {/* Scroll shadow indicator */}
      <div
        className={`absolute left-0 right-0 h-4 bg-gradient-to-b from-black/10 to-transparent z-20 pointer-events-none transition-opacity duration-200 ${showTopShadow ? 'opacity-100' : 'opacity-0'
          }`}
        style={{ top: '140px' }}
      />

      {/* Table */}
      <div
        ref={scrollContainerRef}
        className="overflow-auto max-h-[calc(100vh-380px)] min-h-[400px]"
        tabIndex={0}
        onFocus={() => focusedRow === null && setFocusedRow(0)}
      >
        {/* Mobile View */}
        <div className="block md:hidden">
          {currentBusinesses.map((business, index) => (
            <MobileCard key={`mobile-${index}`} business={business} index={index} />
          ))}
        </div>

        {/* Desktop Table View */}
        <table ref={tableRef} className="hidden md:table w-full min-w-full border-collapse text-left text-xs">
          <thead className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm">
            <tr className="border-b border-gray-200">
              <th className={`text-left ${headerPadding} font-medium text-gray-500 w-12`}>
                #
              </th>
              <th
                className={`text-left ${headerPadding} font-medium text-gray-500 min-w-[200px] relative group`}
                style={{ width: columnWidths['signals'] || 'auto' }}
              >
                <div className="flex items-center justify-between">
                  SEO Signals
                  <div
                    className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 opacity-0 group-hover:opacity-100 transition-opacity"
                    onMouseDown={(e) => {
                      const startX = e.clientX;
                      const handleMouseMove = (e: MouseEvent) => {
                        handleColumnResize('signals', e.clientX - startX);
                      };
                      const handleMouseUp = () => {
                        document.removeEventListener('mousemove', handleMouseMove);
                        document.removeEventListener('mouseup', handleMouseUp);
                      };
                      document.addEventListener('mousemove', handleMouseMove);
                      document.addEventListener('mouseup', handleMouseUp);
                    }}
                  />
                </div>
              </th>
              <th
                className={`text-left ${headerPadding} font-medium text-gray-500 relative group`}
                style={{ width: columnWidths['name'] || 'auto', minWidth: '120px' }}
              >
                <div className="flex items-center justify-between">
                  Business Name
                  <div
                    className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 opacity-0 group-hover:opacity-100 transition-opacity"
                    onMouseDown={(e) => {
                      const startX = e.clientX;
                      const handleMouseMove = (e: MouseEvent) => {
                        handleColumnResize('name', e.clientX - startX);
                      };
                      const handleMouseUp = () => {
                        document.removeEventListener('mousemove', handleMouseMove);
                        document.removeEventListener('mouseup', handleMouseUp);
                      };
                      document.addEventListener('mousemove', handleMouseMove);
                      document.addEventListener('mouseup', handleMouseUp);
                    }}
                  />
                </div>
              </th>
              <th className={`text-left ${headerPadding} font-medium text-gray-500`}>
                Address
              </th>
              <th className={`text-left ${headerPadding} font-medium text-gray-500`}>
                Phone
              </th>
              <th className={`text-left ${headerPadding} font-medium text-gray-500`}>
                Website
              </th>
              <th className={`${headerPadding} font-medium text-gray-500 text-center w-14`}>
                Rating
              </th>
              <th className={`${headerPadding} font-medium text-gray-500 text-right w-16`}>
                Reviews
              </th>
              <th className={`text-left ${headerPadding} font-medium text-gray-500`}>
                Category
              </th>
              <th className={`${headerPadding} font-medium text-gray-500 w-20`}>
                <div className="flex items-center gap-1">
                  Status
                  <HeaderTooltip
                    content={
                      <>
                        <p className="text-xs text-gray-700 leading-relaxed font-normal">
                          <span className="font-semibold text-emerald-400">Claimed:</span> Owner verified. Actively managed.
                        </p>
                        <p className="text-xs text-gray-700 leading-relaxed mt-1.5 font-normal">
                          <span className="font-semibold text-amber-400">Unclaimed:</span> No owner. Good opportunity.
                        </p>
                      </>
                    }
                  >
                    <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </HeaderTooltip>
                </div>
              </th>
              <th className={`${headerPadding} font-medium text-gray-500 w-14`}>
                Ads
              </th>
              <th className={`text-left ${headerPadding} font-medium text-gray-500`}>
                Owner Name
              </th>
              <th className={`text-left ${headerPadding} font-medium text-gray-500`}>
                Owner Phone
              </th>
              <th className={`${headerPadding} font-medium text-gray-500`}>
                <div className="flex items-center gap-1">
                  Last Review
                  <HeaderTooltip
                    content={
                      <p className="text-xs text-gray-700 leading-relaxed font-normal">
                        Date of the most recent customer review
                      </p>
                    }
                  >
                    <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </HeaderTooltip>
                </div>
              </th>
              <th className={`${headerPadding} font-medium text-gray-500`}>
                <div className="flex items-center gap-1">
                  Owner Response
                  <HeaderTooltip
                    content={
                      <p className="text-xs text-gray-700 leading-relaxed font-normal">
                        Date of last owner action (reply to review or Google Business Profile post)
                      </p>
                    }
                  >
                    <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </HeaderTooltip>
                </div>
              </th>
              <th className={`${headerPadding} font-medium text-gray-500`}>
                <div className="flex items-center gap-1">
                  Profile Update
                  <HeaderTooltip
                    content={
                      <p className="text-xs text-gray-700 leading-relaxed font-normal">
                        Days since owner last engaged with their Google Business Profile
                      </p>
                    }
                  >
                    <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </HeaderTooltip>
                </div>
              </th>
              <th className={`${headerPadding} font-medium text-gray-500`}>
                <div className="flex items-center gap-1">
                  Search Visibility
                  <HeaderTooltip
                    content={
                      <p className="text-xs text-gray-700 leading-relaxed font-normal">
                        Shows if this business appears when searching for {niche || 'this niche'} in {location || 'this area'}
                      </p>
                    }
                  >
                    <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </HeaderTooltip>
                </div>
              </th>
              <th className={`${headerPadding} font-medium text-gray-500`}>
                <div className="flex items-center gap-1">
                  Response Rate
                  <HeaderTooltip
                    content={
                      <p className="text-xs text-gray-700 leading-relaxed font-normal">
                        Percentage of customer reviews the owner has replied to
                      </p>
                    }
                  >
                    <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </HeaderTooltip>
                </div>
              </th>
              <th className={`text-left ${headerPadding} font-medium text-gray-500`}>
                Location Type
              </th>
              <th className={`text-left ${headerPadding} font-medium text-gray-500`}>
                Website Tech
              </th>
            </tr>
          </thead>
          <tbody>
            {currentBusinesses.map((business, index) => {
              const isPending = isPendingBusiness(business);
              const isEnriched = !isPending && isEnrichedBusiness(business);
              const categorizedSignals = isEnriched ? getSeoNeedSummary(business as EnrichedBusiness) : { groups: [], totalCount: 0 };
              const score = isEnriched ? calculateSeoNeedScore(business as EnrichedBusiness) : 0;
              const isFocused = focusedRow === index;

              // Flatten signals with category info for expand/collapse
              const flatSignals = categorizedSignals.groups.flatMap(g =>
                g.signals.map(s => ({ category: g.category, text: s }))
              );

              return (
                <tr
                  key={index}
                  data-row-index={index}
                  onClick={() => setFocusedRow(index)}
                  className={`border-b border-gray-200 transition-colors cursor-pointer group ${isFocused ? 'bg-violet-500/10' :
                      isPending ? 'bg-violet-500/5' : 'hover:bg-gray-50'
                    }`}
                >
                  <td className={`${cellPadding} text-gray-400 tabular-nums`}>
                    {startIndex + index + 1}
                  </td>
                  {/* SEO Signals column */}
                  <td className={cellPadding}>
                    {isPending ? (
                      <CellSpinner />
                    ) : !isEnriched ? (
                      <span className="text-xs text-amber-400 font-medium flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Not analyzed
                      </span>
                    ) : (
                      <div className="flex flex-col gap-1">
                        {sortByPriority && (
                          <span className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1">
                            Score: {score}/100
                            <span className="relative group/tooltip">
                              <svg className="w-3 h-3 text-muted-foreground cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="absolute left-0 top-full mt-1 px-3 py-2 text-xs font-normal text-primary-foreground bg-primary rounded-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-lg">
                                Higher score = more urgently needs SEO services
                              </span>
                            </span>
                          </span>
                        )}
                        {flatSignals.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {(expandedSignals.has(startIndex + index) ? flatSignals : flatSignals.slice(0, 3)).map((signal, i) => {
                              const colors = SIGNAL_CATEGORY_COLORS[signal.category];
                              return (
                                <span
                                  key={i}
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded ${colors.bg}`}
                                >
                                  <span className={`text-[10px] font-semibold ${colors.text}`}>{SIGNAL_CATEGORY_LABELS[signal.category]}</span>
                                  <span className={colors.text}>{signal.text}</span>
                                </span>
                              );
                            })}
                            {flatSignals.length > 3 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleSignals(startIndex + index);
                                }}
                                className="inline-block px-2 py-0.5 text-xs bg-muted text-muted-foreground rounded hover:bg-muted/80 cursor-pointer transition-colors"
                              >
                                {expandedSignals.has(startIndex + index)
                                  ? 'Show less'
                                  : `+${flatSignals.length - 3} more`}
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-emerald-400 font-medium">
                            Well optimized
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  {/* General List columns */}
                  <td className={`${cellPadding} text-sm font-medium text-foreground`}>
                    <div className="flex items-center gap-2">
                      <span className="truncate">{business.name}</span>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <CopyButton text={business.name} label="name" />
                      </div>
                    </div>
                  </td>
                  <td className={`${cellPadding} text-sm text-muted-foreground max-w-xs`}>
                    <div className="flex items-center gap-2">
                      <span className="truncate">{business.address}</span>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <CopyButton text={business.address} label="address" />
                      </div>
                    </div>
                  </td>
                  <td className={`${cellPadding} text-sm text-muted-foreground`}>
                    {business.phone ? (
                      <div className="flex items-center gap-2">
                        <span>{business.phone}</span>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <CopyButton text={business.phone} label="phone" />
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-300">&mdash;</span>
                    )}
                  </td>
                  <td className={cellPadding}>
                    {business.website ? (
                      <div className="flex items-center gap-1.5">
                        <a
                          href={business.website.startsWith('http') ? business.website : `https://${business.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-violet-400 hover:text-violet-300 truncate block max-w-[140px]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {(() => {
                            try {
                              return new URL(business.website.startsWith('http') ? business.website : `https://${business.website}`).hostname.replace('www.', '');
                            } catch {
                              return business.website;
                            }
                          })()}
                        </a>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <CopyButton text={business.website} label="website" />
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-300">&mdash;</span>
                    )}
                  </td>
                  <td className={`${cellPadding} text-center tabular-nums`}>
                    {business.rating > 0 ? (
                      <span className="text-gray-700">{business.rating}</span>
                    ) : (
                      <span className="text-gray-300">&mdash;</span>
                    )}
                  </td>
                  <td className={`${cellPadding} text-right tabular-nums text-gray-500`}>
                    {business.reviewCount.toLocaleString()}
                  </td>
                  <td className={`${cellPadding} text-gray-500`}>
                    <span className="truncate block max-w-[100px]">{business.category}</span>
                  </td>
                  <td className={cellPadding}>
                    {business.claimed ? (
                      <span className="text-emerald-500">Claimed</span>
                    ) : (
                      <span className="text-amber-500">Unclaimed</span>
                    )}
                  </td>
                  <td className={cellPadding}>
                    {business.sponsored ? (
                      <span className="text-emerald-500">Yes</span>
                    ) : (
                      <span className="text-gray-400">No</span>
                    )}
                  </td>
                  {/* Upgraded List additional columns */}
                  <td className={`${cellPadding} text-sm`}>
                    <span className="text-muted-foreground/60 text-xs italic">Feature coming soon</span>
                  </td>
                  <td className={`${cellPadding} text-sm`}>
                    <span className="text-muted-foreground/60 text-xs italic">Feature coming soon</span>
                  </td>
                  <td className={`${cellPadding} text-sm text-muted-foreground`}>
                    {isPending ? <CellSpinner /> : !isEnriched ? (
                      <span className="text-amber-400/70 text-xs">—</span>
                    ) : (
                      (business as EnrichedBusiness).lastReviewDate
                        ? formatDate((business as EnrichedBusiness).lastReviewDate)
                        : (
                          <span className="relative group/tooltip">
                            <span className="text-muted-foreground/50 text-xs cursor-help">No data</span>
                            <span className="absolute left-0 top-full mt-1 px-2 py-1 text-xs text-primary-foreground bg-primary rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                              No recent reviews found
                            </span>
                          </span>
                        )
                    )}
                  </td>
                  <td className={`${cellPadding} text-sm text-muted-foreground`}>
                    {isPending ? <CellSpinner /> : !isEnriched ? (
                      <span className="text-amber-400/70 text-xs">—</span>
                    ) : (
                      (business as EnrichedBusiness).lastOwnerActivity
                        ? formatDate((business as EnrichedBusiness).lastOwnerActivity)
                        : (
                          <span className="relative group/tooltip">
                            <span className="text-muted-foreground/50 text-xs cursor-help">No data</span>
                            <span className="absolute left-0 top-full mt-1 px-2 py-1 text-xs text-primary-foreground bg-primary rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                              No owner replies found in reviews
                            </span>
                          </span>
                        )
                    )}
                  </td>
                  <td className={`${cellPadding} text-sm text-muted-foreground`}>
                    {isPending ? <CellSpinner /> : !isEnriched ? (
                      <span className="text-amber-400/70 text-xs">—</span>
                    ) : (
                      (business as EnrichedBusiness).daysDormant !== null
                        ? <StatusTag status={getDormancyStatus((business as EnrichedBusiness).daysDormant)}>
                          {(business as EnrichedBusiness).daysDormant} days ago
                        </StatusTag>
                        : (
                          <span className="relative group/tooltip">
                            <span className="text-muted-foreground/50 text-xs cursor-help">Unknown</span>
                            <span className="absolute left-0 top-full mt-1 px-2 py-1 text-xs text-primary-foreground bg-primary rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                              Could not determine activity level
                            </span>
                          </span>
                        )
                    )}
                  </td>
                  <td className={cellPadding}>
                    {isPending ? <CellSpinner /> : !isEnriched ? (
                      <span className="text-amber-400/70 text-xs">—</span>
                    ) : (
                      <StatusTag status={(business as EnrichedBusiness).searchVisibility !== null ? 'success' : 'error'}>
                        {(business as EnrichedBusiness).searchVisibility !== null
                          ? `#${(business as EnrichedBusiness).searchVisibility}`
                          : 'Not Ranked'}
                      </StatusTag>
                    )}
                  </td>
                  <td className={cellPadding}>
                    {isPending ? <CellSpinner /> : !isEnriched ? (
                      <span className="text-amber-400/70 text-xs">—</span>
                    ) : (
                      (business as EnrichedBusiness).responseRate > 0 || (business as EnrichedBusiness).lastOwnerActivity ? (
                        <StatusTag status={
                          (business as EnrichedBusiness).responseRate >= 70 ? 'success' :
                            (business as EnrichedBusiness).responseRate >= 30 ? 'warning' : 'error'
                        }>
                          {(business as EnrichedBusiness).responseRate}%
                        </StatusTag>
                      ) : (
                        <span className="relative group/tooltip">
                          <span className="text-muted-foreground/50 text-xs cursor-help">0%</span>
                          <span className="absolute left-0 top-full mt-1 px-2 py-1 text-xs text-primary-foreground bg-primary rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                            No owner responses found
                          </span>
                        </span>
                      )
                    )}
                  </td>
                  <td className={cellPadding}>
                    {isPending ? <CellSpinner /> : !isEnriched ? (
                      <span className="text-amber-400/70 text-xs">—</span>
                    ) : (
                      <StatusTag
                        status={(business as EnrichedBusiness).locationType === 'residential' ? 'warning' : 'neutral'}
                      >
                        {(business as EnrichedBusiness).locationType === 'residential' ? 'Residential' : 'Commercial'}
                      </StatusTag>
                    )}
                  </td>
                  <td className={`${cellPadding} text-sm text-muted-foreground`}>
                    {isPending ? <CellSpinner /> : !isEnriched ? (
                      <span className="text-amber-400/70 text-xs">—</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        {(business as EnrichedBusiness).websiteTech === 'Analysis Failed' ? (
                          <span className="relative group/tooltip">
                            <span className="text-amber-400 text-xs cursor-help">Analysis Failed</span>
                            <span className="absolute left-0 top-full mt-1 px-2 py-1 text-xs text-primary-foreground bg-primary rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                              Website could not be analyzed (may be blocked or slow)
                            </span>
                          </span>
                        ) : (
                          <>
                            <span>{(business as EnrichedBusiness).websiteTech}</span>
                            {(business as EnrichedBusiness).seoOptimized && (
                              <StatusTag status="success">SEO</StatusTag>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Back to top button */}
      <button
        onClick={scrollToTop}
        className={`absolute bottom-20 right-4 p-2 bg-primary text-primary-foreground rounded-full shadow-lg transition-all duration-200 hover:bg-primary/90 ${showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
          }`}
        title="Back to top"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      </button>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-3 py-2 border-t border-gray-200 bg-gray-50">
          <div className="text-xs text-gray-500 tabular-nums">
            {startIndex + 1}–{Math.min(endIndex, displayedBusinesses.length)} of {displayedBusinesses.length.toLocaleString()}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2 py-1 text-xs text-gray-500 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Prev
            </button>
            <div className="flex items-center">
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let page: number;
                if (totalPages <= 7) {
                  page = i + 1;
                } else if (currentPage <= 4) {
                  page = i + 1;
                } else if (currentPage >= totalPages - 3) {
                  page = totalPages - 6 + i;
                } else {
                  page = currentPage - 3 + i;
                }
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-6 h-6 text-xs rounded ${currentPage === page
                      ? 'bg-violet-600 text-white'
                      : 'text-gray-500 hover:text-gray-900'
                      }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2 py-1 text-xs text-gray-500 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
