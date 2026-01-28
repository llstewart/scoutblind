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
      <div className="text-center py-12 text-gray-500">
        No businesses found. Try a different search.
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
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 w-12">
                #
              </th>
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
            </tr>
          </thead>
          <tbody>
            {currentBusinesses.map((business, index) => (
              <tr
                key={index}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <td className="py-3 px-4 text-sm font-medium text-gray-500">
                  {startIndex + index + 1}
                </td>
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Showing {startIndex + 1}-{Math.min(endIndex, businesses.length)} of {businesses.length}
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
