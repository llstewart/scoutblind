'use client';

import { useState } from 'react';

interface SessionIndicatorProps {
  isConnected: boolean;
  savedCount: number;
  onOpenHistory: () => void;
}

export function SessionIndicator({ isConnected, savedCount, onOpenHistory }: SessionIndicatorProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={onOpenHistory}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
      >
        {/* Status dot */}
        <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-500'}`} />

        {/* History icon */}
        <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>

        {/* Count badge */}
        {savedCount > 0 && (
          <span className="text-xs font-medium text-gray-700">
            {savedCount}
          </span>
        )}
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute top-full right-0 mt-2 px-3 py-2 bg-gray-100 rounded-lg shadow-xl shadow-black/10 z-50 whitespace-nowrap">
          <div className="text-sm text-gray-900 font-medium">
            {isConnected ? 'Session Active' : 'Session Offline'}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            {savedCount > 0
              ? `${savedCount} saved ${savedCount === 1 ? 'analysis' : 'analyses'}`
              : 'No saved analyses yet'}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Click to view history
          </div>
        </div>
      )}
    </div>
  );
}
