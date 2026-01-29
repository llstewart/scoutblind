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
      <div className="text-center py-12 text-gray-500">
        No enriched data available. Run analysis first.
      </div>
    );
  }

  return (
    <div>
      {/* Data Quality Banner - only show if some data is missing */}
      {(reviewDataCount < businesses.length || websiteFailedCount > 0) && (
        <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs">
            <span className="text-amber-700 font-medium">Data Quality:</span>
            <span className="text-amber-600 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Review data: {reviewDataCount}/{businesses.length}
            </span>
            <span className="text-amber-600 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              Websites analyzed: {websiteAnalyzedCount}/{businesses.length}
            </span>
            {websiteFailedCount > 0 && (
              <span className="text-amber-600 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {websiteFailedCount} failed
              </span>
            )}
          </div>
          <span className="text-xs text-amber-500">
            Missing data shown as &quot;No data&quot; with hover explanations
          </span>
        </div>
      )}

      {/* Filter Controls */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">
            {businesses.length}{expectedTotal && expectedTotal > businesses.length ? `/${expectedTotal}` : ''} businesses analyzed
          </span>
          {isLoadingMore && (
            <span className="text-xs text-blue-600 flex items-center gap-1.5 animate-pulse">
              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading more...
            </span>
          )}
          {businesses.length > 0 && !isLoadingMore && (
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              With review data: {businesses.filter(b => b.lastReviewDate || b.responseRate > 0).length}
            </span>
          )}
        </div>
        <button
          onClick={handleSortToggle}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
            sortByPriority
              ? 'bg-black text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
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
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 w-12">
                #
              </th>
              {/* SEO Signals column */}
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 min-w-[200px]">
                SEO Signals
              </th>
              {/* General List columns */}
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                Business Name
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                Address
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                Phone
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                Website
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                Rating
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                Reviews
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                Category
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                Claim Status
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                Ad Status
              </th>
              {/* Upgraded List additional columns */}
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                Owner Name
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                Owner Phone
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                <span className="flex items-center gap-1">
                  Last Review
                  <span className="relative group">
                    <svg
                      className="w-4 h-4 text-gray-400 cursor-help"
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
                    <span className="absolute left-0 top-full mt-2 px-3 py-2 text-xs font-normal text-white bg-gray-900 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-lg">
                      Date of the most recent customer review
                      <span className="absolute left-3 bottom-full w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"></span>
                    </span>
                  </span>
                </span>
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                <span className="flex items-center gap-1">
                  Last Activity
                  <span className="relative group">
                    <svg
                      className="w-4 h-4 text-gray-400 cursor-help"
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
                    <span className="absolute left-0 top-full mt-2 px-3 py-2 text-xs font-normal text-white bg-gray-900 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-lg">
                      Date of last owner action (reply to review or GBP post)
                      <span className="absolute left-3 bottom-full w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"></span>
                    </span>
                  </span>
                </span>
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                <span className="flex items-center gap-1">
                  Last GBP Activity
                  <span className="relative group">
                    <svg
                      className="w-4 h-4 text-gray-400 cursor-help"
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
                    <span className="absolute left-0 top-full mt-2 px-3 py-2 text-xs font-normal text-white bg-gray-900 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-lg">
                      Days since owner last engaged with their Google Business Profile
                      <span className="absolute left-3 bottom-full w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"></span>
                    </span>
                  </span>
                </span>
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                <span className="flex items-center gap-1">
                  Search Visibility
                  <span className="relative group">
                    <svg
                      className="w-4 h-4 text-gray-400 cursor-help"
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
                    <span className="absolute left-0 top-full mt-2 px-3 py-2 text-xs font-normal text-white bg-gray-900 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-lg">
                      Tests if this business appears in the top 5 {niche || 'businesses'} in {location || 'this area'}
                      <span className="absolute left-3 bottom-full w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"></span>
                    </span>
                  </span>
                </span>
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                <span className="flex items-center gap-1">
                  Response Rate
                  <span className="relative group">
                    <svg
                      className="w-4 h-4 text-gray-400 cursor-help"
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
                    <span className="absolute left-0 top-full mt-2 px-3 py-2 text-xs font-normal text-white bg-gray-900 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-lg">
                      Percentage of customer reviews the owner has replied to
                      <span className="absolute left-3 bottom-full w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"></span>
                    </span>
                  </span>
                </span>
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                Location Type
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
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
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="py-3 px-4 text-sm font-medium text-gray-500">
                    {startIndex + index + 1}
                  </td>
                  {/* SEO Signals column */}
                  <td className="py-3 px-4">
                    <div className="flex flex-col gap-1">
                      {sortByPriority && (
                        <span className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
                          Score: {score}/100
                          <span className="relative group">
                            <svg
                              className="w-3 h-3 text-gray-400 cursor-help"
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
                            <span className="absolute left-0 top-full mt-1 px-3 py-2 text-xs font-normal text-white bg-gray-900 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-lg">
                              Higher score = more urgently needs SEO services
                              <span className="absolute left-3 bottom-full w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"></span>
                            </span>
                          </span>
                        </span>
                      )}
                      {signals.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {(expandedSignals.has(startIndex + index) ? signals : signals.slice(0, 3)).map((signal, i) => (
                            <span
                              key={i}
                              className="inline-block px-2 py-0.5 text-xs bg-red-50 text-red-700 rounded border border-red-200"
                            >
                              {signal}
                            </span>
                          ))}
                          {signals.length > 3 && (
                            <button
                              onClick={() => toggleSignals(startIndex + index)}
                              className="inline-block px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 cursor-pointer transition-colors"
                            >
                              {expandedSignals.has(startIndex + index)
                                ? 'Show less'
                                : `+${signals.length - 3} more`}
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-green-600 font-medium">
                          Well optimized
                        </span>
                      )}
                    </div>
                  </td>
                  {/* General List columns */}
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">
                    {business.name}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600 max-w-xs truncate">
                    {business.address}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {business.phone || (
                      <span className="text-gray-400">No Phone Listed</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {business.website ? (
                      <a
                        href={business.website.startsWith('http') ? business.website : `https://${business.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline truncate block max-w-[200px]"
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
                      <span className="text-gray-400">No Website Listed</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {business.rating > 0 ? `${business.rating} Stars` : 'No Rating'}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {business.reviewCount} Reviews
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {business.category}
                  </td>
                  <td className="py-3 px-4">
                    <StatusTag status={business.claimed ? 'success' : 'warning'}>
                      {business.claimed ? 'Claimed' : 'Unclaimed'}
                    </StatusTag>
                  </td>
                  <td className="py-3 px-4">
                    <StatusTag status={business.sponsored ? 'success' : 'neutral'}>
                      {business.sponsored ? 'Active Ads' : 'No Ads'}
                    </StatusTag>
                  </td>
                  {/* Upgraded List additional columns */}
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {business.ownerName || (
                      <span className="text-gray-400 text-xs">Not found</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {business.ownerPhone || (
                      <span className="text-gray-400 text-xs">Not found</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {business.lastReviewDate
                      ? formatDate(new Date(business.lastReviewDate))
                      : (
                        <span className="relative group">
                          <span className="text-gray-400 text-xs cursor-help">No data</span>
                          <span className="absolute left-0 top-full mt-1 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                            No recent reviews found
                          </span>
                        </span>
                      )}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {business.lastOwnerActivity
                      ? formatDate(new Date(business.lastOwnerActivity))
                      : (
                        <span className="relative group">
                          <span className="text-gray-400 text-xs cursor-help">No data</span>
                          <span className="absolute left-0 top-full mt-1 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                            No owner replies found in reviews
                          </span>
                        </span>
                      )}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {business.daysDormant !== null
                      ? <StatusTag status={getDormancyStatus(business.daysDormant)}>
                          {business.daysDormant} days ago
                        </StatusTag>
                      : (
                        <span className="relative group">
                          <span className="text-gray-400 text-xs cursor-help">Unknown</span>
                          <span className="absolute left-0 top-full mt-1 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                            Could not determine activity level
                          </span>
                        </span>
                      )}
                  </td>
                  <td className="py-3 px-4">
                    <StatusTag status={business.searchVisibility ? 'success' : 'error'}>
                      {business.searchVisibility ? 'Ranked' : 'Not Ranked'}
                    </StatusTag>
                  </td>
                  <td className="py-3 px-4">
                    {business.responseRate > 0 || business.lastOwnerActivity ? (
                      <StatusTag status={
                        business.responseRate >= 70 ? 'success' :
                        business.responseRate >= 30 ? 'warning' : 'error'
                      }>
                        {business.responseRate}%
                      </StatusTag>
                    ) : (
                      <span className="relative group">
                        <span className="text-gray-400 text-xs cursor-help">0%</span>
                        <span className="absolute left-0 top-full mt-1 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                          No owner responses found
                        </span>
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <StatusTag
                      status={business.locationType === 'residential' ? 'warning' : 'neutral'}
                    >
                      {business.locationType === 'residential' ? 'Residential' : 'Commercial'}
                    </StatusTag>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      {business.websiteTech === 'Analysis Failed' ? (
                        <span className="relative group">
                          <span className="text-amber-600 text-xs cursor-help">Analysis Failed</span>
                          <span className="absolute left-0 top-full mt-1 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
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
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Showing {startIndex + 1}-{Math.min(endIndex, displayedBusinesses.length)} of {displayedBusinesses.length}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm font-medium rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 text-sm font-medium rounded ${
                    currentPage === page
                      ? 'bg-black text-white'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm font-medium rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
