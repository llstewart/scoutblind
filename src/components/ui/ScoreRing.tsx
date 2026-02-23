'use client';

interface ScoreRingProps {
  score: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  label?: string;
}

const SIZE_CONFIG = {
  sm: { wh: 28, r: 10, stroke: 2.5, fontSize: '8px', viewBox: 24 },
  md: { wh: 36, r: 14, stroke: 3, fontSize: '10px', viewBox: 36 },
  lg: { wh: 56, r: 22, stroke: 3.5, fontSize: '14px', viewBox: 52 },
  xl: { wh: 80, r: 32, stroke: 4, fontSize: '18px', viewBox: 72 },
};

export default function ScoreRing({ score, size = 'md', label }: ScoreRingProps) {
  const config = SIZE_CONFIG[size];
  const circumference = 2 * Math.PI * config.r;
  const offset = circumference - (score / 100) * circumference;
  const cx = config.viewBox / 2;
  const cy = config.viewBox / 2;

  const gradientId = `score-gradient-${size}-${score}`;

  let gradientColors: [string, string];
  if (score >= 70) {
    gradientColors = ['#34d399', '#059669']; // emerald-400 -> emerald-600
  } else if (score >= 40) {
    gradientColors = ['#fbbf24', '#d97706']; // amber-400 -> amber-600
  } else {
    gradientColors = ['#d1d5db', '#9ca3af']; // gray-300 -> gray-400
  }

  return (
    <div className="relative inline-flex flex-col items-center justify-center">
      <div className="relative inline-flex items-center justify-center" style={{ width: config.wh, height: config.wh }}>
        <svg
          className="-rotate-90"
          width={config.wh}
          height={config.wh}
          viewBox={`0 0 ${config.viewBox} ${config.viewBox}`}
        >
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={gradientColors[0]} />
              <stop offset="100%" stopColor={gradientColors[1]} />
            </linearGradient>
          </defs>
          <circle
            cx={cx}
            cy={cy}
            r={config.r}
            fill="none"
            stroke="#f3f4f6"
            strokeWidth={config.stroke}
          />
          <circle
            cx={cx}
            cy={cy}
            r={config.r}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={config.stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        <span
          className="absolute font-bold text-gray-700"
          style={{ fontSize: config.fontSize }}
        >
          {score}
        </span>
      </div>
      {label && (
        <span className="text-[9px] text-gray-400 mt-0.5 uppercase tracking-wide">{label}</span>
      )}
    </div>
  );
}
