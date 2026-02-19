'use client';

import { useMemo } from 'react';
import { EnrichedBusiness } from '@/lib/types';
import { generatePitchReportData } from '@/lib/pitch-report';
import { SIGNAL_CATEGORY_COLORS, SIGNAL_CATEGORY_LABELS } from '@/lib/signals';

interface PitchReportModalProps {
  business: EnrichedBusiness;
  niche?: string;
  location?: string;
  onClose: () => void;
}

export function PitchReportModal({ business, niche, location, onClose }: PitchReportModalProps) {
  const report = useMemo(() => generatePitchReportData(business, niche, location), [business, niche, location]);

  const handlePrint = () => {
    window.print();
  };

  const scoreColor = report.seoNeedLevel === 'high'
    ? 'text-red-600'
    : report.seoNeedLevel === 'medium'
      ? 'text-amber-600'
      : 'text-emerald-600';

  const scoreBg = report.seoNeedLevel === 'high'
    ? 'bg-red-50 border-red-200'
    : report.seoNeedLevel === 'medium'
      ? 'bg-amber-50 border-amber-200'
      : 'bg-emerald-50 border-emerald-200';

  const levelLabel = report.seoNeedLevel === 'high'
    ? 'High Need'
    : report.seoNeedLevel === 'medium'
      ? 'Medium Need'
      : 'Low Need';

  return (
    <>
      {/* Print-specific styles */}
      <style>{`
        @media print {
          body > *:not(.pitch-report-overlay) { display: none !important; }
          .pitch-report-overlay { position: static !important; }
          .pitch-report-overlay > .pitch-report-backdrop { display: none !important; }
          .pitch-report-overlay > .pitch-report-container {
            position: static !important;
            max-height: none !important;
            max-width: none !important;
            margin: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            overflow: visible !important;
          }
          .pitch-report-actions { display: none !important; }
          .pitch-report-content {
            overflow: visible !important;
            max-height: none !important;
          }
          .pitch-report-content section {
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div className="fixed inset-0 z-50 flex items-center justify-center pitch-report-overlay">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm pitch-report-backdrop" onClick={onClose} />

        {/* Modal */}
        <div className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col mx-4 pitch-report-container">
          {/* Action bar */}
          <div className="px-6 py-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0 pitch-report-actions">
            <h2 className="text-lg font-semibold text-gray-900">Digital Presence Audit</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-violet-600 text-white hover:bg-violet-500 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Save as PDF
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Report Content */}
          <div className="flex-1 overflow-y-auto pitch-report-content" id="pitch-report-content">
            <div className="p-8 space-y-6">
              {/* Header */}
              <section className="text-center pb-6 border-b border-gray-200">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">{report.businessName}</h1>
                <p className="text-sm text-gray-500">{report.address}</p>
                <p className="text-xs text-gray-400 mt-1">{report.category}</p>
                <p className="text-xs text-gray-400 mt-2">
                  Report generated {report.generatedAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </section>

              {/* Score Section */}
              <section className="flex items-center justify-center gap-8">
                <div className={`text-center px-8 py-6 rounded-xl border ${scoreBg}`}>
                  <div className={`text-5xl font-bold ${scoreColor}`}>{report.seoNeedScore}</div>
                  <div className="text-xs text-gray-500 mt-1">SEO Need Score</div>
                  <div className={`text-sm font-semibold mt-2 ${scoreColor}`}>{levelLabel}</div>
                </div>
                <div className="text-left space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400 text-lg">&#9733;</span>
                    <span className="text-sm text-gray-700">{report.rating > 0 ? `${report.rating} rating` : 'No rating'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    <span className="text-sm text-gray-700">{report.reviewCount} reviews</span>
                  </div>
                  {report.marketPosition.searchRank !== null && (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <span className="text-sm text-gray-700">Rank #{report.marketPosition.searchRank}</span>
                    </div>
                  )}
                </div>
              </section>

              {/* Signal Breakdown */}
              {report.signalGroups.totalCount > 0 && (
                <section>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Signal Breakdown</h3>
                  <div className="flex flex-wrap gap-2">
                    {report.signalGroups.groups.flatMap(g =>
                      g.signals.map((signal, i) => {
                        const colors = SIGNAL_CATEGORY_COLORS[g.category];
                        return (
                          <span
                            key={`${g.category}-${i}`}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg ${colors.bg} border ${colors.border}`}
                          >
                            <span className={`font-semibold ${colors.text}`}>{SIGNAL_CATEGORY_LABELS[g.category]}</span>
                            <span className={colors.text}>{signal}</span>
                          </span>
                        );
                      })
                    )}
                  </div>
                </section>
              )}

              {/* Key Findings */}
              {report.keyFindings.length > 0 && (
                <section>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Key Findings</h3>
                  <ul className="space-y-2">
                    {report.keyFindings.map((finding, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-red-400 mt-0.5 flex-shrink-0">&#8226;</span>
                        <span className="text-sm text-gray-700">{finding}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Metrics Grid */}
              <section>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Market Position</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <MetricCard
                    label="Search Rank"
                    value={report.marketPosition.searchRank !== null ? `#${report.marketPosition.searchRank}` : 'Not Ranked'}
                    status={report.marketPosition.searchRank !== null ? (report.marketPosition.searchRank <= 3 ? 'good' : 'warn') : 'bad'}
                  />
                  <MetricCard
                    label="Response Rate"
                    value={`${report.marketPosition.responseRate}%`}
                    status={report.marketPosition.responseRate >= 70 ? 'good' : report.marketPosition.responseRate >= 30 ? 'warn' : 'bad'}
                  />
                  <MetricCard
                    label="Days Dormant"
                    value={report.marketPosition.daysDormant !== null ? `${report.marketPosition.daysDormant}` : 'Unknown'}
                    status={report.marketPosition.daysDormant === null ? 'warn' : report.marketPosition.daysDormant <= 30 ? 'good' : report.marketPosition.daysDormant <= 180 ? 'warn' : 'bad'}
                  />
                  <MetricCard
                    label="Claim Status"
                    value={report.marketPosition.claimed ? 'Claimed' : 'Unclaimed'}
                    status={report.marketPosition.claimed ? 'good' : 'bad'}
                  />
                  <MetricCard
                    label="Website"
                    value={report.marketPosition.hasWebsite ? 'Yes' : 'None'}
                    status={report.marketPosition.hasWebsite ? 'good' : 'bad'}
                  />
                  <MetricCard
                    label="SEO Tools"
                    value={report.marketPosition.seoOptimized ? 'Detected' : 'Not Found'}
                    status={report.marketPosition.seoOptimized ? 'good' : 'bad'}
                  />
                </div>
              </section>

              {/* Footer */}
              <section className="pt-6 border-t border-gray-200 text-center">
                <p className="text-xs text-gray-400">
                  Digital Presence Audit &mdash; Prepared {report.generatedAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  This business has opportunities for improvement. A focused digital strategy could significantly enhance their online visibility and customer acquisition.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function MetricCard({ label, value, status }: { label: string; value: string; status: 'good' | 'warn' | 'bad' }) {
  const colors = {
    good: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    warn: 'bg-amber-50 border-amber-200 text-amber-700',
    bad: 'bg-red-50 border-red-200 text-red-700',
  };

  return (
    <div className={`p-3 rounded-lg border ${colors[status]}`}>
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}
