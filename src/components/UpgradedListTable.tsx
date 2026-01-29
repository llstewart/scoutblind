'use client';

import { useState, useMemo } from 'react';
import { EnrichedBusiness } from '@/lib/types';
import { StatusTag } from './StatusTag';
import { formatDate } from '@/utils/date';
import {
  getDormancyStatus,
  sortBySeoPriority,
  getSeoNeedSummary,
  calculateSeoNeedScore,
} from '@/lib/signals';

interface UpgradedListTableProps {
  businesses: EnrichedBusiness[];
  niche?: string;
  location?: string;
  isLoadingMore?: boolean;
  expectedTotal?: number;
}

const ITEMS_PER_PAGE = 20;

export function UpgradedListTable({ businesses, niche, location, isLoadingMore, expectedTotal }: UpgradedListTableProps) {
  const [sortByPriority, setSortByPriority] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedSignals, setExpandedSignals] = useState<Set<number>>(new Set());

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

  const displayedBusinesses = useMemo(() => {
    if (sortByPriority) {
      return sortBySeoPriority(businesses);
    }
    return businesses;
  }, [businesses, sortByPriority]);

  const totalPages = Math.ceil(displayedBusinesses.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentBusinesses = displayedBusinesses.slice(startIndex, endIndex);

  // Reset to page 1 when sorting changes
  const handleSortToggle = () => {
    setSortByPriority(!sortByPriority);
    setCurrentPage(1);
  };

  // Calculate data quality stats
  const reviewDataCount = businesses.filter(b => b.lastReviewDate || b.responseRate > 0).length;
  const websiteAnalyzedCount = businesses.filter(b => b.websiteTech && b.websiteTech !== 'Analysis Failed' && b.websiteTech !== 'No Website').length;
  const websiteFailedCount = businesses.filter(b => b.websiteTech === 'Analysis Failed').length;

  if (businesses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-foreground mb-1">No enriched data available</h3>
        <p className="text-muted-foreground max-w-sm">
          Run an analysis on your search results to unlock Hidden Signals and high-value data.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Data Quality Banner - only show if some data is missing */}
      {/* Data Quality Banner - only show if some data is missing */}
      {(reviewDataCount < businesses.length || websiteFailedCount > 0) && (
        <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs">
            <span className="text-amber-400 font-medium">Data Quality:</span>
            <span className="text-amber-400/90 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Review data: {reviewDataCount}/{businesses.length}
            </span>
            <span className="text-amber-400/90 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              Websites analyzed: {websiteAnalyzedCount}/{businesses.length}
            </span>
            {websiteFailedCount > 0 && (
              <span className="text-amber-400/90 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {websiteFailedCount} failed
              </span>
            )}
          </div>
          <span className="text-xs text-amber-400/80">
            Missing data shown as &quot;No data&quot; with hover explanations
          </span>
        </div>
      )}

      {/* Filter Controls */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/20">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {businesses.length}{expectedTotal && expectedTotal > businesses.length ? `/${expectedTotal}` : ''} businesses analyzed
          </span>
          {isLoadingMore && (
            <span className="text-xs text-primary flex items-center gap-1.5 animate-pulse">
              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading more...
            </span>
          )}
          {businesses.length > 0 && !isLoadingMore && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              With review data: {businesses.filter(b => b.lastReviewDate || b.responseRate > 0).length}
            </span>
          )}
        </div>
        <button
          onClick={handleSortToggle}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${sortByPriority
            ? 'bg-primary text-primary-foreground'
            : 'bg-card text-foreground border border-input hover:bg-muted'
            }`}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
            />
          </svg>
          {sortByPriority ? 'Sorted by SEO Priority' : 'Sort by SEO Priority'}
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto overflow-y-visible">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-4 px-4 text-sm font-semibold text-foreground w-12">
                #
              </th>
              {/* SEO Signals column */}
              <th className="text-left py-4 px-4 text-sm font-semibold text-foreground min-w-[200px]">
                SEO Signals
              </th>
              {/* General List columns */}
              <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">
                Business Name
              </th>
              <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">
                Address
              </th>
              <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">
                Phone
              </th>
              <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">
                Website
              </th>
              <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">
                Rating
              </th>
              <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">
                Reviews
              </th>
              <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">
                Category
              </th>
              <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">
                <span className="flex items-center gap-1">
                  Claim Status
                  <span className="relative group">
                    <svg
                      className="w-4 h-4 text-muted-foreground cursor-help"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="absolute left-0 top-full mt-2 px-3 py-2 text-xs font-normal text-primary-foreground bg-primary rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-lg">
                      Indicates if the business owner has claimed this profile
                      <span className="absolute left-3 bottom-full w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-primary"></span>
                    </span>
                  </span>
                </span>
              </th>
              <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">
                Ad Status
              </th>
              {/* Upgraded List additional columns */}
              <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">
                Owner Name
              </th>
              <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">
                Owner Phone
              </th>
              <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">
                <span className="flex items-center gap-1">
                  Last Review
                  <span className="relative group">
                    <svg
                      className="w-4 h-4 text-muted-foreground cursor-help"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="absolute left-0 top-full mt-2 px-3 py-2 text-xs font-normal text-primary-foreground bg-primary rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-lg">
                      Date of the most recent customer review
                      <span className="absolute left-3 bottom-full w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-primary"></span>
                    </span>
                  </span>
                </span>
              </th>
              <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">
                <span className="flex items-center gap-1">
                  Owner Response
                  <span className="relative group">
                    <svg
                      className="w-4 h-4 text-muted-foreground cursor-help"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="absolute left-0 top-full mt-2 px-3 py-2 text-xs font-normal text-primary-foreground bg-primary rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-lg">
                      Date of last owner action (reply to review or Google Business Profile post)
                      <span className="absolute left-3 bottom-full w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-primary"></span>
                    </span>
                  </span>
                </span>
              </th>
              <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">
                <span className="flex items-center gap-1">
                  Profile Update
                  <span className="relative group">
                    <svg
                      className="w-4 h-4 text-muted-foreground cursor-help"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="absolute left-0 top-full mt-2 px-3 py-2 text-xs font-normal text-primary-foreground bg-primary rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-lg">
                      Days since owner last engaged with their Google Business Profile
                      <span className="absolute left-3 bottom-full w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-primary"></span>
                    </span>
                  </span>
                </span>
              </th>
              <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">
                <span className="flex items-center gap-1">
                  Search Visibility
                  <span className="relative group">
                    <svg
                      className="w-4 h-4 text-muted-foreground cursor-help"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="absolute left-0 top-full mt-2 px-3 py-2 text-xs font-normal text-primary-foreground bg-primary rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-lg">
                      Tests if this business appears in the top 5 {niche || 'businesses'} in {location || 'this area'}
                      <span className="absolute left-3 bottom-full w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-primary"></span>
                    </span>
                  </span>
                </span>
              </th>
              <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">
                <span className="flex items-center gap-1">
                  Response Rate
                  <span className="relative group">
                    <svg
                      className="w-4 h-4 text-muted-foreground cursor-help"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="absolute left-0 top-full mt-2 px-3 py-2 text-xs font-normal text-primary-foreground bg-primary rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-lg">
                      Percentage of customer reviews the owner has replied to
                      <span className="absolute left-3 bottom-full w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-primary"></span>
                    </span>
                  </span>
                </span>
              </th>
              <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">
                Location Type
              </th>
              <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">
                Website Tech
              </th>
            </tr>
          </thead>
          <tbody>
            {currentBusinesses.map((business, index) => {
              const signals = getSeoNeedSummary(business);
              const score = calculateSeoNeedScore(business);

              return (
                <tr
                  key={index}
                  className="border-b border-border hover:bg-muted/30 transition-colors"
                >
                  <td className="py-4 px-4 text-sm font-medium text-muted-foreground">
                    {startIndex + index + 1}
                  </td>
                  {/* SEO Signals column */}
                  <td className="py-4 px-4">
                    <div className="flex flex-col gap-1">
                      {sortByPriority && (
                        <span className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1">
                          Score: {score}/100
                          <span className="relative group">
                            <svg
                              className="w-3 h-3 text-muted-foreground cursor-help"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <span className="absolute left-0 top-full mt-1 px-3 py-2 text-xs font-normal text-primary-foreground bg-primary rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-lg">
                              Higher score = more urgently needs SEO services
                              <span className="absolute left-3 bottom-full w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-primary"></span>
                            </span>
                          </span>
                        </span>
                      )}
                      {signals.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {(expandedSignals.has(startIndex + index) ? signals : signals.slice(0, 3)).map((signal, i) => (
                            <span
                              key={i}
                              className="inline-block px-2 py-0.5 text-xs bg-rose-500/10 text-rose-400 rounded border border-rose-500/20"
                            >
                              {signal}
                            </span>
                          ))}
                          {signals.length > 3 && (
                            <button
                              onClick={() => toggleSignals(startIndex + index)}
                              className="inline-block px-2 py-0.5 text-xs bg-muted text-muted-foreground rounded hover:bg-muted/80 cursor-pointer transition-colors"
                            >
                              {expandedSignals.has(startIndex + index)
                                ? 'Show less'
                                : `+${signals.length - 3} more`}
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-emerald-400 font-medium">
                          Well optimized
                        </span>
                      )}
                    </div>
                  </td>
                  {/* General List columns */}
                  <td className="py-4 px-4 text-sm font-medium text-foreground">
                    {business.name}
                  </td>
                  <td className="py-4 px-4 text-sm text-muted-foreground max-w-xs truncate">
                    {business.address}
                  </td>
                  <td className="py-4 px-4 text-sm text-muted-foreground">
                    {business.phone || (
                      <span className="text-muted-foreground/50">No Phone Listed</span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-sm">
                    {business.website ? (
                      <a
                        href={business.website.startsWith('http') ? business.website : `https://${business.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline hover:text-white truncate block max-w-[200px]"
                      >
                        {(() => {
                          try {
                            return new URL(business.website.startsWith('http') ? business.website : `https://${business.website}`).hostname;
                          } catch {
                            return business.website;
                          }
                        })()}
                      </a>
                    ) : (
                      <span className="text-muted-foreground/50">No Website Listed</span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-sm text-muted-foreground">
                    {business.rating > 0 ? `${business.rating} Stars` : 'No Rating'}
                  </td>
                  <td className="py-4 px-4 text-sm text-muted-foreground">
                    {business.reviewCount} Reviews
                  </td>
                  <td className="py-4 px-4 text-sm text-muted-foreground">
                    {business.category}
                  </td>
                  <td className="py-4 px-4">
                    <StatusTag status={business.claimed ? 'success' : 'warning'}>
                      {business.claimed ? 'Claimed' : 'Unclaimed'}
                    </StatusTag>
                  </td>
                  <td className="py-4 px-4">
                    <StatusTag status={business.sponsored ? 'success' : 'neutral'}>
                      {business.sponsored ? 'Active Ads' : 'No Ads'}
                    </StatusTag>
                  </td>
                  {/* Upgraded List additional columns */}
                  <td className="py-4 px-4 text-sm text-muted-foreground">
                    {business.ownerName || (
                      <span className="text-muted-foreground/50 text-xs">Not found</span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-sm text-muted-foreground">
                    {business.ownerPhone || (
                      <span className="text-muted-foreground/50 text-xs">Not found</span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-sm text-muted-foreground">
                    {business.lastReviewDate
                      ? formatDate(new Date(business.lastReviewDate))
                      : (
                        <span className="relative group">
                          <span className="text-muted-foreground/50 text-xs cursor-help">No data</span>
                          <span className="absolute left-0 top-full mt-1 px-2 py-1 text-xs text-primary-foreground bg-primary rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                            No recent reviews found
                          </span>
                        </span>
                      )}
                  </td>
                  <td className="py-4 px-4 text-sm text-muted-foreground">
                    {business.lastOwnerActivity
                      ? formatDate(new Date(business.lastOwnerActivity))
                      : (
                        <span className="relative group">
                          <span className="text-muted-foreground/50 text-xs cursor-help">No data</span>
                          <span className="absolute left-0 top-full mt-1 px-2 py-1 text-xs text-primary-foreground bg-primary rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                            No owner replies found in reviews
                          </span>
                        </span>
                      )}
                  </td>
                  <td className="py-4 px-4 text-sm text-muted-foreground">
                    {business.daysDormant !== null
                      ? <StatusTag status={getDormancyStatus(business.daysDormant)}>
                        {business.daysDormant} days ago
                      </StatusTag>
                      : (
                        <span className="relative group">
                          <span className="text-muted-foreground/50 text-xs cursor-help">Unknown</span>
                          <span className="absolute left-0 top-full mt-1 px-2 py-1 text-xs text-primary-foreground bg-primary rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                            Could not determine activity level
                          </span>
                        </span>
                      )}
                  </td>
                  <td className="py-4 px-4">
                    <StatusTag status={business.searchVisibility ? 'success' : 'error'}>
                      {business.searchVisibility ? 'Ranked' : 'Not Ranked'}
                    </StatusTag>
                  </td>
                  <td className="py-4 px-4">
                    {business.responseRate > 0 || business.lastOwnerActivity ? (
                      <StatusTag status={
                        business.responseRate >= 70 ? 'success' :
                          business.responseRate >= 30 ? 'warning' : 'error'
                      }>
                        {business.responseRate}%
                      </StatusTag>
                    ) : (
                      <span className="relative group">
                        <span className="text-muted-foreground/50 text-xs cursor-help">0%</span>
                        <span className="absolute left-0 top-full mt-1 px-2 py-1 text-xs text-primary-foreground bg-primary rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                          No owner responses found
                        </span>
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <StatusTag
                      status={business.locationType === 'residential' ? 'warning' : 'neutral'}
                    >
                      {business.locationType === 'residential' ? 'Residential' : 'Commercial'}
                    </StatusTag>
                  </td>
                  <td className="py-4 px-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      {business.websiteTech === 'Analysis Failed' ? (
                        <span className="relative group">
                          <span className="text-amber-400 text-xs cursor-help">Analysis Failed</span>
                          <span className="absolute left-0 top-full mt-1 px-2 py-1 text-xs text-primary-foreground bg-primary rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                            Website could not be analyzed (may be blocked or slow)
                          </span>
                        </span>
                      ) : (
                        <>
                          <span>{business.websiteTech}</span>
                          {business.seoOptimized && (
                            <StatusTag status="success">SEO</StatusTag>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-4 border-t border-border">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1}-{Math.min(endIndex, displayedBusinesses.length)} of {displayedBusinesses.length}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm font-medium rounded border border-input text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 text-sm font-medium rounded ${currentPage === page
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-muted'
                    }`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm font-medium rounded border border-input text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
