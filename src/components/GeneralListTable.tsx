'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Business } from '@/lib/types';
import { StatusTag } from './StatusTag';

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
        left: Math.min(rect.left, window.innerWidth - 300), // Keep tooltip within viewport
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
          className="fixed w-72 p-3 bg-zinc-900 rounded-lg shadow-2xl shadow-black/40 z-[9999] animate-in fade-in duration-150"
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

interface GeneralListTableProps {
  businesses: Business[];
  selectedBusinesses?: Set<number>;
  onSelectionChange?: (selected: Set<number>) => void;
  isPremium?: boolean;
  onUpgradeClick?: () => void;
}

// Deterministic fake values for premium teaser columns
function fakeClaimScore(index: number) {
  return (index * 37 + 13) % 100;
}
function claimScoreBarColor(score: number) {
  if (score >= 70) return 'bg-emerald-500';
  if (score >= 40) return 'bg-amber-500';
  return 'bg-red-500';
}
function claimScoreTextColor(score: number) {
  if (score >= 70) return 'text-emerald-400';
  if (score >= 40) return 'text-amber-400';
  return 'text-red-400';
}

const LOCATION_TYPES = ['Storefront', 'Service Area', 'Hybrid', 'Virtual'];
function fakeLocationType(index: number) {
  return LOCATION_TYPES[(index * 23 + 5) % LOCATION_TYPES.length];
}

const WEBSITE_TECHS = ['WordPress', 'Shopify', 'Wix', 'Custom', 'Squarespace', 'GoDaddy', 'Webflow'];
function fakeWebsiteTech(index: number) {
  return WEBSITE_TECHS[(index * 41 + 11) % WEBSITE_TECHS.length];
}

function fakeLastReviewDays(index: number) {
  return ((index * 17 + 7) % 28) + 1;
}

function fakeSearchVisibility(index: number) {
  return (index * 53 + 29) % 100;
}
function visibilityBarColor(score: number) {
  if (score >= 60) return 'bg-emerald-500';
  if (score >= 30) return 'bg-amber-500';
  return 'bg-red-500';
}
function visibilityTextColor(score: number) {
  if (score >= 60) return 'text-emerald-400';
  if (score >= 30) return 'text-amber-400';
  return 'text-red-400';
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

export function GeneralListTable({
  businesses,
  selectedBusinesses = new Set(),
  onSelectionChange,
  isPremium,
  onUpgradeClick
}: GeneralListTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [isCompact, setIsCompact] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showTopShadow, setShowTopShadow] = useState(false);
  const [focusedRow, setFocusedRow] = useState<number | null>(null);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);

  // Reset page when businesses change
  useEffect(() => {
    setCurrentPage(1);
    setFocusedRow(null);
  }, [businesses]);

  // Handle scroll events for shadow and back-to-top button
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

  // Refs for keyboard navigation to avoid stale closures
  const pageStateRef = useRef({ startIndex: 0, endIndex: 0, pageSize: ITEMS_PER_PAGE });
  const selectionRef = useRef({ selectedBusinesses, onSelectionChange });

  // Update refs when values change
  useEffect(() => {
    selectionRef.current = { selectedBusinesses, onSelectionChange };
  }, [selectedBusinesses, onSelectionChange]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept keyboard events when user is typing in an input or textarea
      const activeElement = document.activeElement;
      if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
        return;
      }

      if (!tableRef.current?.contains(document.activeElement) && focusedRow === null) return;

      const { startIndex: si, pageSize } = pageStateRef.current;
      const maxIndex = Math.min(pageSize, businesses.length - si) - 1;

      switch (e.key) {
        case 'ArrowDown':
        case 'j':
          e.preventDefault();
          setFocusedRow(prev => {
            const next = prev === null ? 0 : Math.min(prev + 1, maxIndex);
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
        case 'Enter':
        case ' ':
          if (focusedRow !== null && selectionRef.current.onSelectionChange) {
            e.preventDefault();
            const globalIndex = pageStateRef.current.startIndex + focusedRow;
            const newSelected = new Set(selectionRef.current.selectedBusinesses);
            if (newSelected.has(globalIndex)) {
              newSelected.delete(globalIndex);
            } else {
              newSelected.add(globalIndex);
            }
            selectionRef.current.onSelectionChange(newSelected);
          }
          break;
        case 'Escape':
          setFocusedRow(null);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [focusedRow, businesses.length]);

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

  // Column resize handler
  const handleColumnResize = (columnId: string, delta: number) => {
    setColumnWidths(prev => ({
      ...prev,
      [columnId]: Math.max(60, (prev[columnId] || 150) + delta)
    }));
  };

  if (businesses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-foreground mb-1">No businesses found</h3>
        <p className="text-muted-foreground max-w-sm">
          We couldn&apos;t find any businesses matching your search. Try adjusting your terms or location.
        </p>
      </div>
    );
  }

  const totalPages = Math.ceil(businesses.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentBusinesses = businesses.slice(startIndex, endIndex);

  // Update ref for keyboard navigation
  pageStateRef.current = { startIndex, endIndex, pageSize: currentBusinesses.length };

  const handleToggleSelect = (index: number) => {
    if (!onSelectionChange) return;
    const newSelected = new Set(selectedBusinesses);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    onSelectionChange(newSelected);
  };

  const handleSelectAll = () => {
    if (!onSelectionChange) return;
    const currentPageIndices = currentBusinesses.map((_, i) => startIndex + i);
    const allCurrentSelected = currentPageIndices.every(i => selectedBusinesses.has(i));

    const newSelected = new Set(selectedBusinesses);
    if (allCurrentSelected) {
      currentPageIndices.forEach(i => newSelected.delete(i));
    } else {
      currentPageIndices.forEach(i => newSelected.add(i));
    }
    onSelectionChange(newSelected);
  };

  const handleSelectAllPages = () => {
    if (!onSelectionChange) return;
    const allSelected = selectedBusinesses.size === businesses.length;
    if (allSelected) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(businesses.map((_, i) => i)));
    }
  };

  const currentPageAllSelected = currentBusinesses.every((_, i) => selectedBusinesses.has(startIndex + i));
  const currentPageSomeSelected = currentBusinesses.some((_, i) => selectedBusinesses.has(startIndex + i));

  const cellPadding = isCompact ? 'py-1.5 px-2' : 'py-2 px-3';
  const headerPadding = isCompact ? 'py-1.5 px-2' : 'py-2 px-3';

  // Mobile Card Component
  const MobileCard = ({ business, index }: { business: Business; index: number }) => {
    const globalIndex = startIndex + index;
    const isSelected = selectedBusinesses.has(globalIndex);

    return (
      <div
        className={`p-4 border-b border-border bg-card hover:bg-muted/10 transition-colors ${isSelected ? 'bg-primary/5' : ''
          }`}
        onClick={() => {
          if (onSelectionChange) handleToggleSelect(globalIndex);
        }}
      >
        {/* Header: Name and Rating */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-medium text-muted-foreground flex-shrink-0">
              {globalIndex + 1}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-foreground truncate pr-2">
                {business.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
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
            </div>
          </div>

          {onSelectionChange && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => handleToggleSelect(globalIndex)}
              className="w-5 h-5 rounded border-border bg-background text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer flex-shrink-0 ml-2"
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>

        {/* Contact Info */}
        <div className="space-y-2 mb-3">
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="break-words">{business.address}</span>
          </div>

          {business.phone && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span>{business.phone}</span>
              <CopyButton text={business.phone} label="phone" />
            </div>
          )}

          {business.website && (
            <div className="flex items-center gap-2 text-sm">
              <svg className="w-4 h-4 text-muted-foreground flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              <a
                href={business.website.startsWith('http') ? business.website : `https://${business.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline hover:text-white truncate max-w-[200px]"
                onClick={(e) => e.stopPropagation()}
              >
                {(() => {
                  try {
                    return new URL(business.website.startsWith('http') ? business.website : `https://${business.website}`).hostname;
                  } catch {
                    return business.website;
                  }
                })()}
              </a>
              <CopyButton text={business.website} label="website" />
            </div>
          )}
        </div>

        {/* Footer: Tags */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
          <StatusTag status={business.claimed ? 'success' : 'warning'}>
            {business.claimed ? 'Claimed' : 'Unclaimed'}
          </StatusTag>
          <StatusTag status={business.sponsored ? 'success' : 'neutral'}>
            {business.sponsored ? 'Ads' : 'No Ads'}
          </StatusTag>
        </div>

        {/* Blurred Premium Signals Preview (free tier only) */}
        {!isPremium && (
          <div className="mt-3 pt-3 border-t border-border/50 relative">
            <div className="flex items-center gap-1.5 mb-2">
              <svg className="w-3 h-3 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="text-[10px] font-medium text-violet-400 uppercase tracking-wide">Premium Signals</span>
            </div>
            <div className="grid grid-cols-3 gap-3 blur-[5px] select-none pointer-events-none">
              <div>
                <div className="text-[10px] text-zinc-500 mb-0.5">Claim Status</div>
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 flex-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${claimScoreBarColor(fakeClaimScore(index))}`} style={{ width: `${fakeClaimScore(index)}%` }} />
                  </div>
                  <span className={`text-xs font-medium ${claimScoreTextColor(fakeClaimScore(index))}`}>{fakeClaimScore(index)}</span>
                </div>
              </div>
              <div>
                <div className="text-[10px] text-zinc-500 mb-0.5">Location Type</div>
                <span className="text-xs text-zinc-300">{fakeLocationType(index)}</span>
              </div>
              <div>
                <div className="text-[10px] text-zinc-500 mb-0.5">Website Tech</div>
                <span className="text-xs text-zinc-300">{fakeWebsiteTech(index)}</span>
              </div>
              <div>
                <div className="text-[10px] text-zinc-500 mb-0.5">Last Review</div>
                <span className="text-xs text-zinc-300">{fakeLastReviewDays(index)}d ago</span>
              </div>
              <div>
                <div className="text-[10px] text-zinc-500 mb-0.5">Search Visibility</div>
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 flex-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${visibilityBarColor(fakeSearchVisibility(index))}`} style={{ width: `${fakeSearchVisibility(index)}%` }} />
                  </div>
                  <span className={`text-xs font-medium ${visibilityTextColor(fakeSearchVisibility(index))}`}>{fakeSearchVisibility(index)}%</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative">
      {/* Header bar with result count and compact toggle */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-zinc-800/50 bg-zinc-900/50">
        <span className="text-xs text-zinc-400">
          {businesses.length.toLocaleString()} businesses
        </span>
        <button
          onClick={() => setIsCompact(!isCompact)}
          className={`hidden md:flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded transition-colors ${isCompact
              ? 'bg-violet-600/20 text-violet-400'
              : 'text-zinc-500 hover:text-zinc-300'
            }`}
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          {isCompact ? 'Compact' : 'Dense'}
        </button>
      </div>

      {/* Selection toolbar */}
      {onSelectionChange && selectedBusinesses.size > 0 && (
        <div className="px-3 py-1.5 bg-violet-500/10 border-b border-violet-500/20 flex items-center justify-between">
          <span className="text-xs font-medium text-violet-400">
            {selectedBusinesses.size} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSelectAllPages}
              className="text-xs text-violet-400 hover:text-violet-300"
            >
              {selectedBusinesses.size === businesses.length ? 'Deselect all' : `Select all ${businesses.length}`}
            </button>
            <span className="text-zinc-600">|</span>
            <button
              onClick={() => onSelectionChange(new Set())}
              className="text-xs text-zinc-500 hover:text-zinc-300"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Scroll shadow indicator */}
      <div
        className={`absolute left-0 right-0 h-4 bg-gradient-to-b from-black/10 to-transparent z-20 pointer-events-none transition-opacity duration-200 ${showTopShadow ? 'opacity-100' : 'opacity-0'
          }`}
        style={{ top: onSelectionChange && selectedBusinesses.size > 0 ? '106px' : '41px' }}
      />

      <div
        ref={scrollContainerRef}
        className="overflow-auto max-h-[calc(100vh-320px)] min-h-[400px]"
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
          <thead className="sticky top-0 z-10 bg-zinc-900/95 backdrop-blur-sm">
            <tr className="border-b border-zinc-800/50">
              {onSelectionChange && (
                <th className={`${headerPadding} w-12`}>
                  <input
                    type="checkbox"
                    checked={currentPageAllSelected && currentBusinesses.length > 0}
                    ref={el => {
                      if (el) el.indeterminate = currentPageSomeSelected && !currentPageAllSelected;
                    }}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-border bg-background text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer"
                  />
                </th>
              )}
              <th className={`${headerPadding} font-medium text-zinc-500 w-8`}>
                #
              </th>
              <th
                className={`${headerPadding} font-medium text-zinc-500 relative group`}
                style={{ width: columnWidths['name'] || 'auto', minWidth: '100px' }}
              >
                <div className="flex items-center justify-between">
                  Name
                  <div
                    className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-violet-500/50 opacity-0 group-hover:opacity-100 transition-opacity"
                    onMouseDown={(e) => {
                      const startX = e.clientX;
                      const startWidth = columnWidths['name'] || 150;

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
              <th
                className={`${headerPadding} font-medium text-zinc-500 relative group`}
                style={{ width: columnWidths['address'] || 'auto', minWidth: '80px' }}
              >
                <div className="flex items-center justify-between">
                  Address
                  <div
                    className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-violet-500/50 opacity-0 group-hover:opacity-100 transition-opacity"
                    onMouseDown={(e) => {
                      const startX = e.clientX;
                      const handleMouseMove = (e: MouseEvent) => {
                        handleColumnResize('address', e.clientX - startX);
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
              <th className={`${headerPadding} font-medium text-zinc-500`}>
                Phone
              </th>
              <th className={`${headerPadding} font-medium text-zinc-500`}>
                Website
              </th>
              <th className={`${headerPadding} font-medium text-zinc-500 text-center w-14`}>
                Rating
              </th>
              <th className={`${headerPadding} font-medium text-zinc-500 text-right w-16`}>
                Reviews
              </th>
              <th className={`${headerPadding} font-medium text-zinc-500`}>
                Category
              </th>
              <th className={`${headerPadding} font-medium text-zinc-500 w-20`}>
                <div className="flex items-center gap-1">
                  Status
                  <HeaderTooltip
                    content={
                      <>
                        <p className="text-xs text-zinc-300 leading-relaxed font-normal">
                          <span className="font-semibold text-emerald-400">Claimed:</span> Owner verified. Actively managed.
                        </p>
                        <p className="text-xs text-zinc-300 leading-relaxed mt-1.5 font-normal">
                          <span className="font-semibold text-amber-400">Unclaimed:</span> No owner. Good opportunity.
                        </p>
                      </>
                    }
                  >
                    <svg className="w-3 h-3 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </HeaderTooltip>
                </div>
              </th>
              <th className={`${headerPadding} font-medium text-zinc-500 w-14`}>
                Ads
              </th>
              {!isPremium && (
                <>
                  <th className={`${headerPadding} font-medium text-violet-400/80 w-28`}>
                    <div className="flex items-center gap-1">
                      <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Claim Status
                      <HeaderTooltip
                        content={
                          <p className="text-xs text-zinc-300 leading-relaxed font-normal">
                            How optimized the Google Business Profile claim is. A higher score means the listing is more complete and actively managed.
                          </p>
                        }
                      >
                        <svg className="w-3 h-3 text-violet-500/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </HeaderTooltip>
                    </div>
                  </th>
                  <th className={`${headerPadding} font-medium text-violet-400/80 w-28`}>
                    <div className="flex items-center gap-1">
                      <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Location Type
                      <HeaderTooltip
                        content={
                          <p className="text-xs text-zinc-300 leading-relaxed font-normal">
                            The type of business location — storefront, service area, virtual, or hybrid. Helps identify how customers interact with the business.
                          </p>
                        }
                      >
                        <svg className="w-3 h-3 text-violet-500/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </HeaderTooltip>
                    </div>
                  </th>
                  <th className={`${headerPadding} font-medium text-violet-400/80 w-28`}>
                    <div className="flex items-center gap-1">
                      <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Website Tech
                      <HeaderTooltip
                        content={
                          <p className="text-xs text-zinc-300 leading-relaxed font-normal">
                            The CMS or website platform detected on the business website. Reveals tech sophistication and potential integration opportunities.
                          </p>
                        }
                      >
                        <svg className="w-3 h-3 text-violet-500/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </HeaderTooltip>
                    </div>
                  </th>
                  <th className={`${headerPadding} font-medium text-violet-400/80 w-24`}>
                    <div className="flex items-center gap-1">
                      <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Last Review
                      <HeaderTooltip
                        content={
                          <p className="text-xs text-zinc-300 leading-relaxed font-normal">
                            When the most recent customer review was posted. Recent reviews indicate an active, engaged customer base.
                          </p>
                        }
                      >
                        <svg className="w-3 h-3 text-violet-500/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </HeaderTooltip>
                    </div>
                  </th>
                  <th className={`${headerPadding} font-medium text-violet-400/80 w-32`}>
                    <div className="flex items-center gap-1">
                      <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Search Visibility
                      <HeaderTooltip
                        content={
                          <p className="text-xs text-zinc-300 leading-relaxed font-normal">
                            How visible this business is in local search results for relevant keywords. Higher visibility means more organic discovery.
                          </p>
                        }
                      >
                        <svg className="w-3 h-3 text-violet-500/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </HeaderTooltip>
                    </div>
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {currentBusinesses.map((business, index) => {
              const globalIndex = startIndex + index;
              const isSelected = selectedBusinesses.has(globalIndex);
              const isFocused = focusedRow === index;

              return (
                <tr
                  key={index}
                  data-row-index={index}
                  onClick={() => setFocusedRow(index)}
                  className={`border-b border-zinc-800/30 transition-colors cursor-pointer group ${isFocused ? 'bg-violet-500/10' :
                      isSelected ? 'bg-violet-500/5' : 'hover:bg-white/[0.02]'
                    }`}
                >
                  {onSelectionChange && (
                    <td className={cellPadding}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(globalIndex)}
                        className="w-4 h-4 rounded border-border bg-background text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer"
                      />
                    </td>
                  )}
                  <td className={`${cellPadding} text-zinc-600 tabular-nums`}>
                    {globalIndex + 1}
                  </td>
                  <td className={`${cellPadding} font-medium text-zinc-200`}>
                    <div className="flex items-center gap-1.5">
                      <span className="truncate max-w-[180px]">{business.name}</span>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <CopyButton text={business.name} label="name" />
                      </div>
                    </div>
                  </td>
                  <td className={`${cellPadding} text-zinc-500`}>
                    <div className="flex items-center gap-1.5">
                      <span className="truncate max-w-[160px]">{business.address}</span>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <CopyButton text={business.address} label="address" />
                      </div>
                    </div>
                  </td>
                  <td className={`${cellPadding} text-zinc-400`}>
                    {business.phone ? (
                      <div className="flex items-center gap-1.5">
                        <span className="tabular-nums">{business.phone}</span>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <CopyButton text={business.phone} label="phone" />
                        </div>
                      </div>
                    ) : (
                      <span className="text-zinc-700">—</span>
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
                      <span className="text-zinc-700">—</span>
                    )}
                  </td>
                  <td className={`${cellPadding} text-center tabular-nums`}>
                    {business.rating > 0 ? (
                      <span className="text-zinc-300">{business.rating}</span>
                    ) : (
                      <span className="text-zinc-700">—</span>
                    )}
                  </td>
                  <td className={`${cellPadding} text-right tabular-nums text-zinc-400`}>
                    {business.reviewCount.toLocaleString()}
                  </td>
                  <td className={`${cellPadding} text-zinc-500`}>
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
                      <span className="text-zinc-600">No</span>
                    )}
                  </td>
                  {!isPremium && (
                    <>
                      <td className={`${cellPadding} blur-[5px] select-none`}>
                        <div className="flex items-center gap-1.5">
                          <div className="h-1.5 w-12 bg-zinc-800 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${claimScoreBarColor(fakeClaimScore(index))}`} style={{ width: `${fakeClaimScore(index)}%` }} />
                          </div>
                          <span className={`tabular-nums text-xs font-medium ${claimScoreTextColor(fakeClaimScore(index))}`}>{fakeClaimScore(index)}</span>
                        </div>
                      </td>
                      <td className={`${cellPadding} blur-[5px] select-none`}>
                        <span className="text-zinc-300">{fakeLocationType(index)}</span>
                      </td>
                      <td className={`${cellPadding} blur-[5px] select-none`}>
                        <span className="text-zinc-300">{fakeWebsiteTech(index)}</span>
                      </td>
                      <td className={`${cellPadding} blur-[5px] select-none`}>
                        <span className="text-zinc-300 tabular-nums">{fakeLastReviewDays(index)}d ago</span>
                      </td>
                      <td className={`${cellPadding} blur-[5px] select-none`}>
                        <div className="flex items-center gap-1.5">
                          <div className="h-1.5 w-12 bg-zinc-800 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${visibilityBarColor(fakeSearchVisibility(index))}`} style={{ width: `${fakeSearchVisibility(index)}%` }} />
                          </div>
                          <span className={`tabular-nums text-xs font-medium ${visibilityTextColor(fakeSearchVisibility(index))}`}>{fakeSearchVisibility(index)}%</span>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
          {!isPremium && (
            <tfoot>
              <tr>
                <td colSpan={99}>
                  <div className="flex items-center justify-center gap-3 py-3 px-4 bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-violet-500/10 border-t border-violet-500/20">
                    <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span className="text-xs text-zinc-400">Claim status, website tech, search visibility &amp; more hidden</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpgradeClick?.();
                      }}
                      className="px-3 py-1 text-xs font-medium rounded-md bg-violet-600 text-white hover:bg-violet-500 transition-colors"
                    >
                      Unlock Premium Signals
                    </button>
                  </div>
                </td>
              </tr>
            </tfoot>
          )}
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
        <div className="flex items-center justify-between px-3 py-2 border-t border-zinc-800/50 bg-zinc-900/30">
          <div className="text-xs text-zinc-500 tabular-nums">
            {startIndex + 1}–{Math.min(endIndex, businesses.length)} of {businesses.length.toLocaleString()}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2 py-1 text-xs text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
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
                      : 'text-zinc-500 hover:text-white'
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
              className="px-2 py-1 text-xs text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
