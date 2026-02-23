'use client';

import { useState } from 'react';
import { Check, Copy, Pencil, Star } from 'lucide-react';
import { Modal } from './ui/Modal';
import { EnrichedBusiness } from '@/lib/types';
import { generateOutreachTemplates } from '@/lib/outreach-templates';
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
      <Modal open onClose={onClose} size="sm" title="Strong Online Presence">
        <div className="pb-6 text-center">
          <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check size={28} className="text-emerald-500" />
          </div>
          <p className="text-sm text-gray-500 leading-relaxed">
            <span className="font-medium text-gray-700">{business.name}</span> has a well-optimized digital presence. Gap-based outreach templates are not applicable. Consider a partnership or value-add pitch instead.
          </p>
        </div>
      </Modal>
    );
  }

  const headerContent = (
    <div className="w-full">
      <div>
        <h2 className="text-base font-semibold text-gray-900">Outreach Templates</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Personalized for <span className="font-medium text-gray-700">{business.name}</span>
        </p>
      </div>

      {/* Business context bar */}
      <div className="mt-3 flex items-center gap-4 text-xs">
        <div className="flex items-center gap-3 text-gray-500">
          <span className="flex items-center gap-1">
            <Star size={12} className="text-amber-400" fill="currentColor" />
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
            <span key={`${g.category}-${i}`} className={`px-1.5 py-0.5 text-[11px] rounded ${SIGNAL_CATEGORY_COLORS[g.category].bg} ${SIGNAL_CATEGORY_COLORS[g.category].text}`}>
              {SIGNAL_CATEGORY_LABELS[g.category]}: {s}
            </span>
          )))}
        </div>
      </div>
    </div>
  );

  const footerContent = (
    <div className="flex items-center justify-between">
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
            <Pencil size={14} />
            Customize before copying
          </button>
        )}
      </div>
      <button
        onClick={copyAll}
        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-violet-600 text-white hover:bg-violet-500 transition-colors"
      >
        {copiedField === 'all' ? (
          <><Check size={16} />Copied to clipboard</>
        ) : (
          <><Copy size={16} />Copy full email</>
        )}
      </button>
    </div>
  );

  return (
    <Modal open onClose={onClose} size="xl" customHeader={headerContent} footer={footerContent}>
      {/* Template tabs */}
      <div className="flex items-center gap-1 pt-1 pb-0 -mx-6 px-6 flex-shrink-0">
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
            <div className={`text-[11px] mt-0.5 ${i === activeIndex ? 'text-violet-600' : 'text-gray-400'}`}>{t.trigger}</div>
          </button>
        ))}
      </div>

      {/* Email preview */}
      {activeTemplate && (
        <div className="border-t border-gray-200 -mx-6 px-6">
          <div className="max-w-2xl mx-auto py-6">
            {/* Subject line */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Subject Line</span>
                <button
                  onClick={() => copyToClipboard(currentSubject, 'subject')}
                  className="text-[11px] font-medium text-gray-500 hover:text-gray-800 flex items-center gap-1 transition-colors"
                >
                  {copiedField === 'subject' ? (
                    <><Check size={12} className="text-emerald-500" />Copied</>
                  ) : (
                    <><Copy size={12} />Copy subject</>
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
                <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Email Body</span>
                <button
                  onClick={() => copyToClipboard(currentBody, 'body')}
                  className="text-[11px] font-medium text-gray-500 hover:text-gray-800 flex items-center gap-1 transition-colors"
                >
                  {copiedField === 'body' ? (
                    <><Check size={12} className="text-emerald-500" />Copied</>
                  ) : (
                    <><Copy size={12} />Copy body</>
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
    </Modal>
  );
}
