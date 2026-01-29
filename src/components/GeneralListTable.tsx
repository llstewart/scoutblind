'use client';

import { useState } from 'react';
import { Business } from '@/lib/types';
import { StatusTag } from './StatusTag';

interface GeneralListTableProps {
  businesses: Business[];
}

const ITEMS_PER_PAGE = 20;

export function GeneralListTable({ businesses }: GeneralListTableProps) {
  const [currentPage, setCurrentPage] = useState(1);

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

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-border">
              <th className="py-4 px-4 text-sm font-semibold text-foreground w-12">
                #
              </th>
              <th className="py-4 px-4 text-sm font-semibold text-foreground">
                Business Name
              </th>
              <th className="py-4 px-4 text-sm font-semibold text-foreground">
                Address
              </th>
              <th className="py-4 px-4 text-sm font-semibold text-foreground">
                Phone
              </th>
              <th className="py-4 px-4 text-sm font-semibold text-foreground">
                Website
              </th>
              <th className="py-4 px-4 text-sm font-semibold text-foreground">
                Rating
              </th>
              <th className="py-4 px-4 text-sm font-semibold text-foreground">
                Reviews
              </th>
              <th className="py-4 px-4 text-sm font-semibold text-foreground">
                Category
              </th>
              <th className="py-4 px-4 text-sm font-semibold text-foreground">
                Claim Status
              </th>
              <th className="py-4 px-4 text-sm font-semibold text-foreground">
                Ad Status
              </th>
            </tr>
          </thead>
          <tbody>
            {currentBusinesses.map((business, index) => (
              <tr
                key={index}
                className="border-b border-border hover:bg-muted/30 transition-colors"
              >
                <td className="py-4 px-4 text-sm font-medium text-muted-foreground">
                  {startIndex + index + 1}
                </td>
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-4 border-t border-border">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1}-{Math.min(endIndex, businesses.length)} of {businesses.length}
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
