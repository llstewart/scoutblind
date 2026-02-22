'use client';

import { useState, useMemo } from 'react';
import { EnrichedBusiness } from '@/lib/types';
import { generateOutreachTemplates, OutreachTemplate } from '@/lib/outreach-templates';
import { calculateSeoNeedScore, getSeoNeedSummary, SIGNAL_CATEGORY_COLORS, SIGNAL_CATEGORY_LABELS } from '@/lib/signals';

interface OutreachTemplatesModalProps {
  business: EnrichedBusiness;
  niche: string;
  onClose: () => void;
}

export function OutreachTemplatesModal({ business, niche, onClose }: OutreachTemplatesModalProps) {
  const templates = generateOutreachTemplates(business, niche);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editedSubject, setEditedSubject] = useState('');
  const [editedBody, setEditedBody] = useState('');
  const [copiedField, setCopiedField] = useState<'subject' | 'body' | 'all' | null>(null);

  const score = calculateSeoNeedScore(business);
  const signals = getSeoNeedSummary(business);

  const activeTemplate = templates[activeIndex] || null;

  const currentSubject = isEditing ? editedSubject : (activeTemplate?.subject || '');
  const currentBody = isEditing ? editedBody : (activeTemplate?.body || '');

  const startEditing = () => {
    if (!activeTemplate) return;
    setEditedSubject(activeTemplate.subject);
    setEditedBody(activeTemplate.body);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  const handleTabChange = (index: number) => {
    setActiveIndex(index);
    setIsEditing(false);
  };

  const copyToClipboard = async (text: string, field: 'subject' | 'body' | 'all') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const copyAll = () => {
    const full = `Subject: ${currentSubject}\n\n${currentBody}`;
    copyToClipboard(full, 'all');
  };

  if (templates.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl mx-4 p-8 text-center">
          <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-2">Strong Online Presence</h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            <span className="font-medium text-gray-700">{business.name}</span> has a well-optimized digital presence. Gap-based outreach templates are not applicable. Consider a partnership or value-add pitch instead.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-3xl max-h-[88vh] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col mx-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Outreach Templates</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Personalized for <span className="font-medium text-gray-700">{business.name}</span>
              </p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Business context bar */}
          <div className="mt-3 flex items-center gap-4 text-xs">
            <div className="flex items-center gap-3 text-gray-500">
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                {business.rating}
              </span>
              <span>{business.reviewCount} reviews</span>
              {business.searchVisibility !== null ? (
                <span>Rank #{business.searchVisibility}</span>
              ) : (
                <span className="text-red-500">Not ranking</span>
              )}
              <span>Score: {score}/100</span>
            </div>
            <div className="flex items-center gap-1 ml-auto">
              {signals.groups.slice(0, 3).flatMap(g => g.signals.slice(0, 1).map((s, i) => (
                <span key={`${g.category}-${i}`} className={`px-1.5 py-0.5 text-[10px] rounded ${SIGNAL_CATEGORY_COLORS[g.category].bg} ${SIGNAL_CATEGORY_COLORS[g.category].text}`}>
                  {SIGNAL_CATEGORY_LABELS[g.category]}: {s}
                </span>
              )))}
            </div>
          </div>
        </div>

        {/* Template tabs */}
        <div className="flex items-center gap-1 px-6 pt-3 pb-0 flex-shrink-0">
          {templates.map((t, i) => (
            <button
              key={t.id}
              onClick={() => handleTabChange(i)}
              className={`px-3 py-2 text-xs font-semibold rounded-t-lg border border-b-0 transition-colors ${
                i === activeIndex
                  ? 'bg-white text-gray-900 border-gray-200'
                  : 'bg-gray-50 text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div>{t.title}</div>
              <div className={`text-[10px] mt-0.5 ${i === activeIndex ? 'text-violet-600' : 'text-gray-400'}`}>{t.trigger}</div>
            </button>
          ))}
        </div>

        {/* Email preview */}
        {activeTemplate && (
          <div className="flex-1 overflow-y-auto border-t border-gray-200">
            <div className="max-w-2xl mx-auto p-6">
              {/* Subject line */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Subject Line</span>
                  <button
                    onClick={() => copyToClipboard(currentSubject, 'subject')}
                    className="text-[10px] font-medium text-gray-500 hover:text-gray-800 flex items-center gap-1 transition-colors"
                  >
                    {copiedField === 'subject' ? (
                      <><svg className="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Copied</>
                    ) : (
                      <><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>Copy subject</>
                    )}
                  </button>
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedSubject}
                    onChange={(e) => setEditedSubject(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-medium text-gray-900 border border-violet-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                  />
                ) : (
                  <div className="px-3 py-2 text-sm font-medium text-gray-900 bg-gray-50 rounded-lg border border-gray-200">
                    {currentSubject}
                  </div>
                )}
              </div>

              {/* Email body */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Email Body</span>
                  <button
                    onClick={() => copyToClipboard(currentBody, 'body')}
                    className="text-[10px] font-medium text-gray-500 hover:text-gray-800 flex items-center gap-1 transition-colors"
                  >
                    {copiedField === 'body' ? (
                      <><svg className="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Copied</>
                    ) : (
                      <><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>Copy body</>
                    )}
                  </button>
                </div>
                {isEditing ? (
                  <textarea
                    value={editedBody}
                    onChange={(e) => setEditedBody(e.target.value)}
                    className="w-full h-72 px-4 py-3 text-sm text-gray-700 leading-relaxed border border-violet-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/30 font-sans"
                  />
                ) : (
                  <div className="px-4 py-3 text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-lg border border-gray-200 whitespace-pre-wrap font-sans">
                    {currentBody}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between flex-shrink-0 bg-gray-50">
          <div>
            {isEditing ? (
              <button
                onClick={cancelEditing}
                className="text-xs text-gray-500 hover:text-gray-700 font-medium transition-colors"
              >
                Discard edits
              </button>
            ) : (
              <button
                onClick={startEditing}
                className="text-xs text-gray-500 hover:text-gray-700 font-medium flex items-center gap-1.5 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                Customize before copying
              </button>
            )}
          </div>
          <button
            onClick={copyAll}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-violet-600 text-white hover:bg-violet-500 transition-colors"
          >
            {copiedField === 'all' ? (
              <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Copied to clipboard</>
            ) : (
              <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>Copy full email</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
