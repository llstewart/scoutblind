interface InlineScoreBarProps {
  score: number; // 0-100
  className?: string;
}

export function InlineScoreBar({ score, className = '' }: InlineScoreBarProps) {
  const clampedScore = Math.max(0, Math.min(100, score));

  return (
    <div className={`w-16 h-1.5 rounded-full bg-gray-100 overflow-hidden ${className}`}>
      <div
        className={`h-full rounded-full transition-all ${
          clampedScore >= 70
            ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
            : clampedScore >= 40
            ? 'bg-gradient-to-r from-amber-400 to-amber-500'
            : 'bg-gradient-to-r from-gray-300 to-gray-400'
        }`}
        style={{ width: `${clampedScore}%` }}
      />
    </div>
  );
}
