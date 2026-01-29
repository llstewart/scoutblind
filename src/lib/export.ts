import { Business, EnrichedBusiness, TableBusiness, isPendingBusiness } from './types';

/**
 * Escape a value for CSV (handle commas, quotes, newlines)
 */
function escapeCSV(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Format a date for CSV export
 */
function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Export general business list to CSV
 */
export function exportGeneralListToCSV(
  businesses: Business[],
  niche?: string,
  location?: string
): void {
  const headers = [
    'Name',
    'Phone',
    'Website',
    'Address',
    'Rating',
    'Reviews',
    'Category',
    'Claimed',
  ];

  const rows = businesses.map((b) => [
    escapeCSV(b.name),
    escapeCSV(b.phone),
    escapeCSV(b.website),
    escapeCSV(b.address),
    escapeCSV(b.rating),
    escapeCSV(b.reviewCount),
    escapeCSV(b.category),
    escapeCSV(b.claimed ? 'Yes' : 'No'),
  ]);

  downloadCSV(headers, rows, `leads-${niche || 'export'}-${location || 'all'}`);
}

/**
 * Export enriched business list (with signals) to CSV
 */
export function exportEnrichedListToCSV(
  businesses: TableBusiness[],
  niche?: string,
  location?: string
): void {
  // Filter out pending businesses (still loading)
  const enrichedBusinesses = businesses.filter(
    (b): b is EnrichedBusiness => !isPendingBusiness(b)
  );

  const headers = [
    'Name',
    'Phone',
    'Website',
    'Address',
    'Rating',
    'Reviews',
    'Category',
    'Claimed',
    'Days Dormant',
    'Response Rate %',
    'Search Visibility',
    'Last Review',
    'Last Owner Activity',
    'Location Type',
    'Website Tech',
    'SEO Optimized',
    'Owner Name',
    'Owner Phone',
  ];

  const rows = enrichedBusinesses.map((b) => [
    escapeCSV(b.name),
    escapeCSV(b.phone),
    escapeCSV(b.website),
    escapeCSV(b.address),
    escapeCSV(b.rating),
    escapeCSV(b.reviewCount),
    escapeCSV(b.category),
    escapeCSV(b.claimed ? 'Yes' : 'No'),
    escapeCSV(b.daysDormant ?? 'N/A'),
    escapeCSV(b.responseRate),
    escapeCSV(b.searchVisibility ? 'Yes' : 'No'),
    escapeCSV(formatDate(b.lastReviewDate)),
    escapeCSV(formatDate(b.lastOwnerActivity)),
    escapeCSV(b.locationType),
    escapeCSV(b.websiteTech),
    escapeCSV(b.seoOptimized ? 'Yes' : 'No'),
    escapeCSV(b.ownerName),
    escapeCSV(b.ownerPhone),
  ]);

  downloadCSV(headers, rows, `leads-signals-${niche || 'export'}-${location || 'all'}`);
}

/**
 * Create and download a CSV file
 */
function downloadCSV(headers: string[], rows: string[][], filename: string): void {
  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${sanitizeFilename(filename)}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Sanitize filename for download
 */
function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
}
