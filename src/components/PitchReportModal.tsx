'use client';

import { useMemo } from 'react';
import { Download, X } from 'lucide-react';
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

  const scoreRingColor = report.seoNeedLevel === 'high'
    ? '#dc2626'
    : report.seoNeedLevel === 'medium'
      ? '#d97706'
      : '#059669';

  const levelLabel = report.seoNeedLevel === 'high'
    ? 'High Priority'
    : report.seoNeedLevel === 'medium'
      ? 'Moderate Priority'
      : 'Low Priority';

  // Derive a circumference for the score ring
  const circumference = 2 * Math.PI * 40;
  const scoreOffset = circumference - (report.seoNeedScore / 100) * circumference;

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
        <div className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-xl elevation-3 overflow-hidden flex flex-col mx-4 pitch-report-container">
          {/* Action bar */}
          <div className="px-6 py-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0 pitch-report-actions bg-white">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-semibold text-gray-900">Digital Presence Audit</h2>
              <span className="text-xs text-gray-400">|</span>
              <span className="text-xs text-gray-500">{report.businessName}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-violet-600 text-white hover:bg-violet-500 transition-colors"
              >
                <Download size={14} />
                Save as PDF
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>
          </div>

          {/* Report Content */}
          <div className="flex-1 overflow-y-auto pitch-report-content" id="pitch-report-content">
            <div className="p-8 space-y-8">
              {/* Header Section */}
              <section className="text-center pb-6 border-b border-gray-100">
                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-[0.2em] mb-3">Digital Presence Audit</p>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{report.businessName}</h1>
                <p className="text-sm text-gray-500">{report.address}</p>
                {report.category && (
                  <p className="text-xs text-gray-400 mt-1">{report.category}</p>
                )}
                <p className="text-[11px] text-gray-400 mt-3">
                  Prepared {report.generatedAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </section>

              {/* Score + Summary Row */}
              <section className="flex items-start gap-8">
                {/* Score Ring */}
                <div className="flex-shrink-0 text-center">
                  <div className="relative w-28 h-28">
                    <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#f3f4f6" strokeWidth="6" />
                      <circle
                        cx="50" cy="50" r="40" fill="none"
                        stroke={scoreRingColor}
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={scoreOffset}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={`text-2xl font-bold ${scoreColor}`}>{report.seoNeedScore}</span>
                      <span className="text-[9px] text-gray-400 mt-0.5">/ 100</span>
                    </div>
                  </div>
                  <div className={`text-xs font-semibold mt-2 ${scoreColor}`}>{levelLabel}</div>
                </div>

                {/* Quick Stats */}
                <div className="flex-1 grid grid-cols-3 gap-3">
                  <QuickStat
                    label="Rating"
                    value={report.rating > 0 ? `${report.rating}` : '--'}
                    sub={report.rating > 0 ? `${report.reviewCount} reviews` : 'No reviews'}
                  />
                  <QuickStat
                    label="Search Rank"
                    value={report.marketPosition.searchRank !== null ? `#${report.marketPosition.searchRank}` : '--'}
                    sub={report.marketPosition.searchRank !== null
                      ? (report.marketPosition.searchRank <= 3 ? 'Visible' : 'Below fold')
                      : 'Not ranking'
                    }
                  />
                  <QuickStat
                    label="Response Rate"
                    value={`${report.marketPosition.responseRate}%`}
                    sub={report.marketPosition.responseRate >= 70 ? 'Healthy' : report.marketPosition.responseRate >= 30 ? 'Below avg' : 'Very low'}
                  />
                </div>
              </section>

              {/* Key Findings */}
              {report.keyFindings.length > 0 && (
                <section>
                  <SectionHeading>Key Findings</SectionHeading>
                  <div className="space-y-2.5 mt-3">
                    {report.keyFindings.map((finding, i) => (
                      <div key={i} className="flex items-start gap-3 text-sm text-gray-700">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-red-50 text-red-500 flex items-center justify-center text-[11px] font-bold mt-0.5">
                          {i + 1}
                        </span>
                        <span className="leading-relaxed">{finding}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Signal Breakdown */}
              {report.signalGroups.totalCount > 0 && (
                <section>
                  <SectionHeading>Signal Breakdown</SectionHeading>
                  <div className="flex flex-wrap gap-2 mt-3">
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

              {/* Market Position Grid */}
              <section>
                <SectionHeading>Market Position</SectionHeading>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                  <MetricCard
                    label="Search Rank"
                    value={report.marketPosition.searchRank !== null ? `#${report.marketPosition.searchRank}` : 'Not Ranked'}
                    status={report.marketPosition.searchRank !== null ? (report.marketPosition.searchRank <= 3 ? 'good' : 'warn') : 'bad'}
                  />
                  <MetricCard
                    label="Review Response"
                    value={`${report.marketPosition.responseRate}%`}
                    status={report.marketPosition.responseRate >= 70 ? 'good' : report.marketPosition.responseRate >= 30 ? 'warn' : 'bad'}
                  />
                  <MetricCard
                    label="Days Dormant"
                    value={report.marketPosition.daysDormant !== null ? `${report.marketPosition.daysDormant}` : 'Unknown'}
                    status={report.marketPosition.daysDormant === null ? 'warn' : report.marketPosition.daysDormant <= 30 ? 'good' : report.marketPosition.daysDormant <= 180 ? 'warn' : 'bad'}
                  />
                  <MetricCard
                    label="Profile Status"
                    value={report.marketPosition.claimed ? 'Claimed' : 'Unclaimed'}
                    status={report.marketPosition.claimed ? 'good' : 'bad'}
                  />
                  <MetricCard
                    label="Website"
                    value={report.marketPosition.hasWebsite ? 'Active' : 'None'}
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
              <section className="pt-6 border-t border-gray-100 text-center space-y-2">
                <p className="text-[11px] text-gray-400 uppercase tracking-wider">
                  Digital Presence Audit &mdash; {report.generatedAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
                <p className="text-xs text-gray-500 max-w-lg mx-auto leading-relaxed">
                  This business has measurable opportunities for improvement. A focused digital strategy could significantly enhance their online visibility and customer acquisition.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">{children}</h3>
  );
}

function QuickStat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-100">
      <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1">{label}</div>
      <div className="text-lg font-bold text-gray-900">{value}</div>
      <div className="text-[11px] text-gray-500 mt-0.5">{sub}</div>
    </div>
  );
}

function MetricCard({ label, value, status }: { label: string; value: string; status: 'good' | 'warn' | 'bad' }) {
  const statusStyles = {
    good: 'border-emerald-200 bg-emerald-50',
    warn: 'border-amber-200 bg-amber-50',
    bad: 'border-red-200 bg-red-50',
  };

  const dotStyles = {
    good: 'bg-emerald-500',
    warn: 'bg-amber-500',
    bad: 'bg-red-500',
  };

  return (
    <div className={`p-3 rounded-lg border ${statusStyles[status]}`}>
      <div className="flex items-center gap-1.5 mb-1">
        <span className={`w-1.5 h-1.5 rounded-full ${dotStyles[status]}`} />
        <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-sm font-semibold text-gray-900">{value}</div>
    </div>
  );
}
