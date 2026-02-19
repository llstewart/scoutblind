'use client';

import { useState } from 'react';
import { EnrichedBusiness } from '@/lib/types';
import { generateOutreachTemplates, OutreachTemplate } from '@/lib/outreach-templates';

interface OutreachTemplatesModalProps {
  business: EnrichedBusiness;
  niche: string;
  onClose: () => void;
}

function CopyableField({ label, text }: { label: string; text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="group">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">{label}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded transition-colors bg-gray-100 hover:bg-gray-200 text-gray-600"
        >
          {copied ? (
            <>
              <svg className="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Copied
            </>
          ) : (
            <>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy
            </>
          )}
        </button>
      </div>
      <div className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 border border-gray-200 whitespace-pre-wrap font-mono text-xs leading-relaxed">
        {text}
      </div>
    </div>
  );
}

function TemplateCard({ template }: { template: OutreachTemplate }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3 text-left">
          <div>
            <div className="text-sm font-medium text-gray-900">{template.title}</div>
            <div className="text-xs text-gray-500 mt-0.5">{template.trigger}</div>
          </div>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-100">
          <div className="pt-3">
            <CopyableField label="Subject Line" text={template.subject} />
          </div>
          <CopyableField label="Email Body" text={template.body} />
        </div>
      )}
    </div>
  );
}

export function OutreachTemplatesModal({ business, niche, onClose }: OutreachTemplatesModalProps) {
  const templates = generateOutreachTemplates(business, niche);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[85vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col mx-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Outreach Templates</h2>
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
              <span className="font-medium text-gray-700">{business.name}</span>
              <span>&#8226;</span>
              <span>{business.rating} stars</span>
              <span>&#8226;</span>
              <span>{business.reviewCount} reviews</span>
              {business.searchVisibility !== null && (
                <>
                  <span>&#8226;</span>
                  <span>Rank #{business.searchVisibility}</span>
                </>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {templates.length > 0 ? (
            templates.map(template => (
              <TemplateCard key={template.id} template={template} />
            ))
          ) : (
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-1">Strong Online Presence</h3>
              <p className="text-xs text-gray-500 max-w-xs mx-auto">
                This business has a well-optimized online presence. Consider a partnership pitch instead of a gap-based outreach.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
