'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ArrowUpDown, ChevronUp, ChevronDown, Check, Copy, Pencil, Mail, FileBarChart, Phone, Globe, Loader2, Info, ArrowUp, MoreHorizontal, X, Star, MessageSquare, AlertTriangle, HelpCircle, AlignJustify } from 'lucide-react';
import { EnrichedBusiness, TableBusiness, isPendingBusiness, isEnrichedBusiness, LeadStatus } from '@/lib/types';
import { StatusTag } from './StatusTag';
import { CellSpinner } from './CellSpinner';
import ScoreRing from '@/components/ui/ScoreRing';
import { formatDate } from '@/utils/date';
import {
  getDormancyStatus,
  getSeoNeedSummary,
  calculateSeoNeedScore,
  sortEnrichedBusinesses,
  SORT_OPTIONS,
  SIGNAL_CATEGORY_COLORS,
  SIGNAL_CATEGORY_LABELS,
  type SortOption,
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

import { LEAD_STATUS_CONFIG, ALL_LEAD_STATUSES } from '@/lib/lead-constants';
export { LEAD_STATUS_CONFIG, ALL_LEAD_STATUSES } from '@/lib/lead-constants';

// Status dot popover — click the dot next to the name to change status
function StatusDotPopover({ status, onChange }: { status: LeadStatus; onChange: (s: LeadStatus) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const config = LEAD_STATUS_CONFIG[status];

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="group/dot flex items-center gap-1.5 pr-1 rounded-lg hover:bg-gray-100 transition-colors"
        title={`Status: ${config.label}`}
      >
        <span className={`w-2.5 h-2.5 rounded-full ${config.dot} ring-2 ring-white`} />
        <span className={`text-[11px] font-medium ${config.color} opacity-0 group-hover/dot:opacity-100 transition-opacity`}>{config.label}</span>
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 w-36 bg-white rounded-lg shadow-xl border border-gray-200 z-50 py-1">
          <div className="px-3 py-1.5 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Lead Status</div>
          {ALL_LEAD_STATUSES.map(s => {
            const c = LEAD_STATUS_CONFIG[s];
            return (
              <button
                key={s}
                onClick={(e) => { e.stopPropagation(); onChange(s); setOpen(false); }}
                className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center gap-2.5 ${status === s ? 'bg-gray-50' : ''}`}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${c.dot}`} />
                <span className={`font-medium ${c.color}`}>{c.label}</span>
                {status === s && (
                  <Check size={14} className="text-violet-600 ml-auto" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Notes popover component
function NotesPopover({ notes, onChange }: { notes: string; onChange: (n: string) => void }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(notes);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setValue(notes); }, [notes]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        if (value !== notes) onChange(value);
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, value, notes, onChange]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className={`p-1 rounded-lg hover:bg-gray-100 transition-colors ${notes ? 'text-violet-500' : 'text-gray-400'}`}
        title={notes ? 'Edit notes' : 'Add notes'}
      >
        <MessageSquare size={14} fill={notes ? 'currentColor' : 'none'} />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 w-72 bg-white rounded-lg shadow-xl border border-gray-200 z-50 p-3" onClick={(e) => e.stopPropagation()}>
          <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-2">Lead Notes</div>
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={() => { if (value !== notes) onChange(value); }}
            placeholder="Add notes about this lead..."
            className="w-full h-24 text-xs border border-gray-200 rounded-lg p-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400"
            autoFocus
          />
          <div className="text-[11px] text-gray-400 mt-1.5">Click outside to save</div>
        </div>
      )}
    </div>
  );
}

interface UpgradedListTableProps {
  businesses: TableBusiness[];
  niche?: string;
  location?: string;
  isLoadingMore?: boolean;
  expectedTotal?: number;
  onStatusChange?: (businessId: string, status: LeadStatus) => void;
  onNotesChange?: (businessId: string, notes: string) => void;
  onOutreachClick?: (business: EnrichedBusiness) => void;
  onReportClick?: (business: EnrichedBusiness) => void;
  statusFilter?: LeadStatus | null;
  onStatusFilterChange?: (filter: LeadStatus | null) => void;
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
      className="p-1 rounded-lg hover:bg-muted-foreground/20 transition-colors"
      title={`Copy ${label}`}
    >
      {copied ? (
        <Check size={14} className="text-green-500" />
      ) : (
        <Copy size={14} className="text-muted-foreground" />
      )}
    </button>
  );
}

export function UpgradedListTable({ businesses, niche, location, isLoadingMore, expectedTotal, onStatusChange, onNotesChange, onOutreachClick, onReportClick, statusFilter, onStatusFilterChange }: UpgradedListTableProps) {
  const [activeSortOption, setActiveSortOption] = useState<SortOption>('default');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedSignals, setExpandedSignals] = useState<Set<number>>(new Set());
  const [isCompact, setIsCompact] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showTopShadow, setShowTopShadow] = useState(false);
  const [focusedRow, setFocusedRow] = useState<number | null>(null);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [checkedRows, setCheckedRows] = useState<Set<string>>(new Set());

  const toggleRowCheck = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCheckedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const clearChecked = () => setCheckedRows(new Set());
  const toggleAllOnPage = () => {
    const pageIds = currentBusinesses
      .filter(b => !isPendingBusiness(b) && isEnrichedBusiness(b))
      .map(b => b.placeId || b.name);
    const allChecked = pageIds.every(id => checkedRows.has(id));
    if (allChecked) {
      setCheckedRows(prev => { const next = new Set(prev); pageIds.forEach(id => next.delete(id)); return next; });
    } else {
      setCheckedRows(prev => { const next = new Set(prev); pageIds.forEach(id => next.add(id)); return next; });
    }
  };
  const handleBulkStatus = (status: LeadStatus) => {
    if (!onStatusChange) return;
    checkedRows.forEach(id => onStatusChange(id, status));
    clearChecked();
  };

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

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
    let result: TableBusiness[] = businesses;
    if (activeSortOption !== 'default' && pendingCount === 0) {
      result = sortEnrichedBusinesses(enrichedBusinesses, activeSortOption) as TableBusiness[];
    }
    // Apply status filter
    if (statusFilter) {
      result = result.filter(b => {
        if (isPendingBusiness(b)) return false;
        if (!isEnrichedBusiness(b)) return false;
        return (b.leadStatus || 'new') === statusFilter;
      });
    }
    return result;
  }, [businesses, enrichedBusinesses, activeSortOption, pendingCount, statusFilter]);

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

  // Sort change handler
  const handleSortChange = (option: SortOption) => {
    setActiveSortOption(option);
    setSortDropdownOpen(false);
    setCurrentPage(1);
    setFocusedRow(null);
  };

  // Click-outside handler for sort dropdown
  useEffect(() => {
    if (!sortDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target as Node)) {
        setSortDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [sortDropdownOpen]);

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
                <h3 className="text-sm font-semibold text-foreground truncate pr-2">
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
                  <Star size={12} className="text-amber-400" fill="currentColor" />
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
                      <span key={i} className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] rounded border ${colors.bg} ${colors.border}`}>
                        <span className={`font-semibold ${colors.text}`}>{SIGNAL_CATEGORY_LABELS[signal.category]}</span>
                        <span className={colors.text}>{signal.text}</span>
                      </span>
                    );
                  })}
                  {flatSignals.length > 3 && (
                    <span className="text-[11px] text-muted-foreground px-1 py-0.5">+{flatSignals.length - 3} more</span>
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
                <Phone size={12} className="text-muted-foreground" />
                <span>{business.phone}</span>
              </div>
            )}
            {business.website && (
              <div className="flex items-center gap-1.5">
                <Globe size={12} className="text-muted-foreground" />
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
            <span className="text-gray-400">Claimed</span>
          ) : (
            <span className="text-violet-400 font-medium">Unclaimed</span>
          )}
          {business.sponsored ? (
            <span className="text-gray-400">Ads</span>
          ) : (
            <span className="text-violet-400 font-medium">No Ads</span>
          )}
          {isEnriched && (business as EnrichedBusiness).websiteTech !== 'Analysis Failed' && (
            <span className="text-[11px] bg-muted text-muted-foreground px-2 py-0.5 rounded border border-border">
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
          <FileBarChart size={32} className="text-muted-foreground" />
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
            <AlertTriangle size={16} className="text-amber-400" />
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
          className={`hidden md:flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-lg transition-colors ${isCompact
              ? 'bg-violet-600/20 text-violet-400'
              : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          <AlignJustify size={12} />
          {isCompact ? 'Compact' : 'Dense'}
        </button>
      </div>

      {/* Data Quality Banner - only show if significant issues */}
      {websiteFailedCount > 3 && (
        <div className="px-3 py-1 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-4 text-[11px]">
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
            <span className="text-[11px] text-violet-400 flex items-center gap-1">
              <Loader2 size={12} className="animate-spin" />
              {pendingCount} loading
            </span>
          )}
        </div>
        <div ref={sortDropdownRef} className="relative">
          <button
            onClick={() => pendingCount === 0 && setSortDropdownOpen(!sortDropdownOpen)}
            disabled={pendingCount > 0}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${activeSortOption !== 'default'
              ? 'bg-violet-600/15 text-violet-600'
              : 'text-gray-500 hover:text-gray-900'
              } ${pendingCount > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <ArrowUpDown size={12} />
            {activeSortOption !== 'default'
              ? `Sort: ${SORT_OPTIONS.find(o => o.value === activeSortOption)?.label}`
              : 'Sort'}
            <ChevronDown size={12} className={`transition-transform ${sortDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          {sortDropdownOpen && (
            <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-lg shadow-xl shadow-black/10 border border-gray-200 z-50 py-1">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSortChange(option.value)}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors flex items-center justify-between gap-2 ${activeSortOption === option.value ? 'bg-violet-50' : ''}`}
                >
                  <div>
                    <div className={`font-medium ${activeSortOption === option.value ? 'text-violet-600' : 'text-gray-800'}`}>
                      {option.label}
                    </div>
                    <div className="text-[11px] text-gray-400">{option.description}</div>
                  </div>
                  {activeSortOption === option.value && (
                    <Check size={14} className="text-violet-600 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pipeline Summary Bar */}
      {enrichedBusinesses.length > 0 && onStatusChange && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-gray-200 bg-gray-50/80 overflow-x-auto">
          <button
            onClick={() => onStatusFilterChange?.(null)}
            className={`px-2 py-0.5 text-[11px] font-medium rounded-lg transition-colors ${
              !statusFilter ? 'bg-violet-100 text-violet-700' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            All ({enrichedBusinesses.length})
          </button>
          {ALL_LEAD_STATUSES.map(s => {
            const count = enrichedBusinesses.filter(b => (b.leadStatus || 'new') === s).length;
            if (count === 0) return null;
            const c = LEAD_STATUS_CONFIG[s];
            return (
              <button
                key={s}
                onClick={() => onStatusFilterChange?.(statusFilter === s ? null : s)}
                className={`px-2 py-0.5 text-[11px] font-medium rounded-lg border transition-colors ${
                  statusFilter === s
                    ? `${c.bg} ${c.color} ${c.border}`
                    : 'text-gray-500 border-transparent hover:bg-gray-100'
                }`}
              >
                {c.label}: {count}
              </button>
            );
          })}
        </div>
      )}

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
              {onStatusChange && (
                <th className={`${headerPadding} w-8`}>
                  <input
                    type="checkbox"
                    checked={currentBusinesses.filter(b => !isPendingBusiness(b) && isEnrichedBusiness(b)).length > 0 && currentBusinesses.filter(b => !isPendingBusiness(b) && isEnrichedBusiness(b)).every(b => checkedRows.has(b.placeId || b.name))}
                    onChange={toggleAllOnPage}
                    onClick={(e) => e.stopPropagation()}
                    className="w-3.5 h-3.5 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                  />
                </th>
              )}
              <th className={`text-left ${headerPadding} font-medium text-gray-700 w-12`}>
                #
              </th>
              <th
                className={`text-left ${headerPadding} font-medium text-gray-700 min-w-[200px] relative group`}
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
                className={`text-left ${headerPadding} font-medium text-gray-700 relative group`}
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
              <th className={`text-left ${headerPadding} font-medium text-gray-700`}>
                Address
              </th>
              <th className={`text-left ${headerPadding} font-medium text-gray-700`}>
                Phone
              </th>
              <th className={`text-left ${headerPadding} font-medium text-gray-700`}>
                Website
              </th>
              <th className={`${headerPadding} font-medium text-gray-700 text-center w-14`}>
                Rating
              </th>
              <th className={`${headerPadding} font-medium text-gray-700 text-right w-16`}>
                Reviews
              </th>
              <th className={`text-left ${headerPadding} font-medium text-gray-700`}>
                Category
              </th>
              <th className={`${headerPadding} font-medium text-gray-700 w-20`}>
                <div className="flex items-center gap-1">
                  Status
                  <HeaderTooltip
                    content={
                      <>
                        <p className="text-xs text-gray-700 leading-relaxed font-normal">
                          <span className="font-semibold text-violet-400">Unclaimed:</span> No owner — open opportunity to offer services.
                        </p>
                        <p className="text-xs text-gray-700 leading-relaxed mt-1.5 font-normal">
                          <span className="font-semibold text-gray-400">Claimed:</span> Already managed by someone. Lower priority.
                        </p>
                      </>
                    }
                  >
                    <Info size={12} className="text-gray-400" />
                  </HeaderTooltip>
                </div>
              </th>
              <th className={`${headerPadding} font-medium text-gray-700 w-14`}>
                Ads
              </th>
              <th className={`text-left ${headerPadding} font-medium text-gray-700`}>
                Owner Name
              </th>
              <th className={`text-left ${headerPadding} font-medium text-gray-700`}>
                Owner Phone
              </th>
              <th className={`${headerPadding} font-medium text-gray-700`}>
                <div className="flex items-center gap-1">
                  Last Review
                  <HeaderTooltip
                    content={
                      <p className="text-xs text-gray-700 leading-relaxed font-normal">
                        Date of the most recent customer review
                      </p>
                    }
                  >
                    <Info size={12} className="text-gray-400" />
                  </HeaderTooltip>
                </div>
              </th>
              <th className={`${headerPadding} font-medium text-gray-700`}>
                <div className="flex items-center gap-1">
                  Owner Response
                  <HeaderTooltip
                    content={
                      <p className="text-xs text-gray-700 leading-relaxed font-normal">
                        Date of last owner action (reply to review or Google Business Profile post)
                      </p>
                    }
                  >
                    <Info size={12} className="text-gray-400" />
                  </HeaderTooltip>
                </div>
              </th>
              <th className={`${headerPadding} font-medium text-gray-700`}>
                <div className="flex items-center gap-1">
                  Profile Update
                  <HeaderTooltip
                    content={
                      <p className="text-xs text-gray-700 leading-relaxed font-normal">
                        Days since owner last engaged with their Google Business Profile
                      </p>
                    }
                  >
                    <Info size={12} className="text-gray-400" />
                  </HeaderTooltip>
                </div>
              </th>
              <th className={`${headerPadding} font-medium text-gray-700`}>
                <div className="flex items-center gap-1">
                  Search Visibility
                  <HeaderTooltip
                    content={
                      <p className="text-xs text-gray-700 leading-relaxed font-normal">
                        Shows if this business appears when searching for {niche || 'this niche'} in {location || 'this area'}
                      </p>
                    }
                  >
                    <Info size={12} className="text-gray-400" />
                  </HeaderTooltip>
                </div>
              </th>
              <th className={`${headerPadding} font-medium text-gray-700`}>
                <div className="flex items-center gap-1">
                  Response Rate
                  <HeaderTooltip
                    content={
                      <p className="text-xs text-gray-700 leading-relaxed font-normal">
                        Percentage of customer reviews the owner has replied to
                      </p>
                    }
                  >
                    <Info size={12} className="text-gray-400" />
                  </HeaderTooltip>
                </div>
              </th>
              <th className={`text-left ${headerPadding} font-medium text-gray-700`}>
                Location Type
              </th>
              <th className={`text-left ${headerPadding} font-medium text-gray-700`}>
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
                  {onStatusChange && (
                    <td className={`${cellPadding} w-8`} onClick={(e) => e.stopPropagation()}>
                      {isEnriched ? (
                        <input
                          type="checkbox"
                          checked={checkedRows.has(business.placeId || business.name)}
                          onChange={() => {}}
                          onClick={(e) => toggleRowCheck(business.placeId || business.name, e)}
                          className="w-3.5 h-3.5 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                        />
                      ) : null}
                    </td>
                  )}
                  <td className={`${cellPadding} text-gray-400 tabular-nums`}>
                    {startIndex + index + 1}
                  </td>
                  {/* SEO Signals column */}
                  <td className={cellPadding}>
                    {isPending ? (
                      <CellSpinner />
                    ) : !isEnriched ? (
                      <span className="text-xs text-amber-400 font-medium flex items-center gap-1">
                        <AlertTriangle size={12} className="text-amber-400" />
                        Not analyzed
                      </span>
                    ) : (
                      <div className="flex flex-col gap-1">
                        {activeSortOption === 'seo-score' && (
                          <span className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1">
                            Score: {score}/100
                            <span className="relative group/tooltip">
                              <HelpCircle size={12} className="text-muted-foreground cursor-help" />
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
                                  <span className={`text-[11px] font-semibold ${colors.text}`}>{SIGNAL_CATEGORY_LABELS[signal.category]}</span>
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
                  {/* Business Name with status dot + actions */}
                  <td className={`${cellPadding} font-medium text-gray-800`}>
                    <div className="flex items-center gap-1.5">
                      {isEnriched && (
                        <ScoreRing score={score} size="sm" />
                      )}
                      {isEnriched && onStatusChange && (
                        <StatusDotPopover
                          status={(business as EnrichedBusiness).leadStatus || 'new'}
                          onChange={(s) => onStatusChange(business.placeId || business.name, s)}
                        />
                      )}
                      <span className="truncate">{business.name}</span>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 flex items-center gap-0.5">
                        <CopyButton text={business.name} label="name" />
                        {isEnriched && onNotesChange && (
                          <NotesPopover
                            notes={(business as EnrichedBusiness).leadNotes || ''}
                            onChange={(n) => onNotesChange(business.placeId || business.name, n)}
                          />
                        )}
                        {isEnriched && onOutreachClick && (
                          <button
                            onClick={(e) => { e.stopPropagation(); onOutreachClick(business as EnrichedBusiness); }}
                            className="p-1 rounded-lg hover:bg-violet-50 text-gray-400 hover:text-violet-600 transition-colors"
                            title="Outreach templates"
                          >
                            <Mail size={14} />
                          </button>
                        )}
                        {isEnriched && onReportClick && (
                          <button
                            onClick={(e) => { e.stopPropagation(); onReportClick(business as EnrichedBusiness); }}
                            className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                            title="Generate report"
                          >
                            <FileBarChart size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className={`${cellPadding} text-gray-600 max-w-xs`}>
                    <div className="flex items-center gap-2">
                      <span className="truncate">{business.address}</span>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <CopyButton text={business.address} label="address" />
                      </div>
                    </div>
                  </td>
                  <td className={`${cellPadding} text-gray-600`}>
                    {business.phone ? (
                      <div className="flex items-center gap-2">
                        <span>{business.phone}</span>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <CopyButton text={business.phone} label="phone" />
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400">&mdash;</span>
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
                      <span className="text-gray-400">&mdash;</span>
                    )}
                  </td>
                  <td className={`${cellPadding} text-center tabular-nums`}>
                    {business.rating > 0 ? (
                      <span className="text-gray-700">{business.rating}</span>
                    ) : (
                      <span className="text-gray-400">&mdash;</span>
                    )}
                  </td>
                  <td className={`${cellPadding} text-right tabular-nums text-gray-600`}>
                    {business.reviewCount.toLocaleString()}
                  </td>
                  <td className={`${cellPadding} text-gray-600`}>
                    <span className="truncate block max-w-[100px]">{business.category}</span>
                  </td>
                  <td className={cellPadding}>
                    {business.claimed ? (
                      <span className="text-gray-400">Claimed</span>
                    ) : (
                      <span className="text-violet-400 font-medium">Unclaimed</span>
                    )}
                  </td>
                  <td className={cellPadding}>
                    {business.sponsored ? (
                      <span className="text-gray-400">Yes</span>
                    ) : (
                      <span className="text-violet-400 font-medium">No</span>
                    )}
                  </td>
                  {/* Upgraded List additional columns */}
                  <td className={`${cellPadding} text-sm`}>
                    <span className="text-muted-foreground/60 text-xs italic">Feature coming soon</span>
                  </td>
                  <td className={`${cellPadding} text-sm`}>
                    <span className="text-muted-foreground/60 text-xs italic">Feature coming soon</span>
                  </td>
                  <td className={`${cellPadding} text-gray-600`}>
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
                  <td className={`${cellPadding} text-gray-600`}>
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
                  <td className={`${cellPadding} text-gray-600`}>
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
                  <td className={`${cellPadding} text-gray-600`}>
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
        <ArrowUp size={20} />
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
                    className={`w-6 h-6 text-xs rounded-lg ${currentPage === page
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

      {/* Bulk Action Bar */}
      {checkedRows.size > 0 && onStatusChange && (
        <div className="sticky bottom-0 left-0 right-0 z-30 bg-white border-t-2 border-violet-500 shadow-[0_-4px_12px_rgba(0,0,0,0.1)] px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-gray-900">{checkedRows.size} selected</span>
              <button onClick={clearChecked} className="text-xs text-gray-500 hover:text-gray-900 underline">Clear</button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 mr-1">Set status:</span>
              {ALL_LEAD_STATUSES.map(s => {
                const c = LEAD_STATUS_CONFIG[s];
                return (
                  <button
                    key={s}
                    onClick={() => handleBulkStatus(s)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors hover:shadow-sm ${c.bg} ${c.color} ${c.border}`}
                  >
                    <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
