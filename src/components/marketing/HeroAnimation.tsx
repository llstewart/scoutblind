'use client';

/**
 * Animated SVG hero — simulates a user scanning a market in Packleads.
 *
 * Sequence (~10s loop):
 *   0.0s  Dashboard idle, search bar empty
 *   0.5s  Cursor moves to search bar
 *   1.0s  Text types "Dentists in Austin, TX"
 *   3.0s  Cursor clicks "Scan" button
 *   3.5s  Results table rows slide in with stagger
 *   5.5s  Need Score badges animate in
 *   7.0s  Cursor moves to a high-score row, row highlights
 *   8.0s  Audit panel slides open from right
 *   9.5s  Hold
 *  10.0s  Reset / loop
 */

export function HeroAnimation() {
  return (
    <div className="w-full aspect-[16/10] rounded-xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.06),0_12px_40px_rgba(0,0,0,0.1)] border border-gray-200/60 bg-[#fafaf9]">
      <svg
        viewBox="0 0 800 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          {/* Clip for the audit panel slide */}
          <clipPath id="audit-clip">
            <rect x="520" y="60" width="270" height="430" />
          </clipPath>
        </defs>

        <style>{`
          /* ─── Cursor ──────────────────────────────────────── */
          @keyframes cursor-move {
            0%, 4%    { transform: translate(200px, 80px); opacity: 0; }
            5%        { opacity: 1; }
            10%       { transform: translate(270px, 80px); opacity: 1; }
            10.1%, 30% { transform: translate(270px, 80px); }
            30%       { transform: translate(508px, 80px); }
            32%       { transform: translate(508px, 80px); }
            35%       { transform: translate(508px, 80px); }
            55%, 65%  { transform: translate(508px, 80px); opacity: 1; }
            70%       { transform: translate(400px, 268px); opacity: 1; }
            72%, 80%  { transform: translate(400px, 268px); }
            95%       { transform: translate(400px, 268px); opacity: 1; }
            97%       { opacity: 0; }
            100%      { transform: translate(200px, 80px); opacity: 0; }
          }
          .hero-cursor {
            animation: cursor-move 10s ease-in-out infinite;
          }

          /* ─── Search text typing ──────────────────────────── */
          @keyframes type-text {
            0%, 10%   { width: 0; }
            28%       { width: 180px; }
            100%      { width: 180px; }
          }
          .type-text {
            animation: type-text 10s steps(20, end) infinite;
            overflow: hidden;
            white-space: nowrap;
          }

          /* ─── Scan button press ───────────────────────────── */
          @keyframes btn-press {
            0%, 29%   { opacity: 1; transform: scale(1); }
            31%       { opacity: 0.7; transform: scale(0.96); }
            33%       { opacity: 1; transform: scale(1); }
            100%      { opacity: 1; transform: scale(1); }
          }
          .scan-btn {
            animation: btn-press 10s ease-out infinite;
            transform-origin: center;
          }

          /* ─── Loading bar ─────────────────────────────────── */
          @keyframes loading-bar {
            0%, 32%   { width: 0; opacity: 1; }
            50%       { width: 800px; opacity: 1; }
            52%       { opacity: 0; }
            100%      { opacity: 0; width: 0; }
          }
          .loading-bar {
            animation: loading-bar 10s ease-out infinite;
          }

          /* ─── Table rows slide in ─────────────────────────── */
          @keyframes row-in {
            0%, 48%   { opacity: 0; transform: translateY(12px); }
            55%       { opacity: 1; transform: translateY(0); }
            97%       { opacity: 1; }
            100%      { opacity: 0; }
          }
          .row-1 { animation: row-in 10s ease-out infinite; animation-delay: 0s; }
          .row-2 { animation: row-in 10s ease-out infinite; animation-delay: 0.15s; }
          .row-3 { animation: row-in 10s ease-out infinite; animation-delay: 0.3s; }
          .row-4 { animation: row-in 10s ease-out infinite; animation-delay: 0.45s; }
          .row-5 { animation: row-in 10s ease-out infinite; animation-delay: 0.6s; }

          /* ─── Score badges pop in ─────────────────────────── */
          @keyframes score-pop {
            0%, 54%   { opacity: 0; transform: scale(0.5); }
            60%       { opacity: 1; transform: scale(1.1); }
            63%       { transform: scale(1); }
            97%       { opacity: 1; }
            100%      { opacity: 0; }
          }
          .score-1 { animation: score-pop 10s ease-out infinite; animation-delay: 0.1s; }
          .score-2 { animation: score-pop 10s ease-out infinite; animation-delay: 0.25s; }
          .score-3 { animation: score-pop 10s ease-out infinite; animation-delay: 0.4s; }
          .score-4 { animation: score-pop 10s ease-out infinite; animation-delay: 0.55s; }
          .score-5 { animation: score-pop 10s ease-out infinite; animation-delay: 0.7s; }

          /* ─── Row highlight on cursor hover ───────────────── */
          @keyframes row-highlight {
            0%, 68%   { fill: transparent; }
            72%       { fill: rgba(13,124,123,0.06); }
            95%       { fill: rgba(13,124,123,0.06); }
            100%      { fill: transparent; }
          }
          .row-hl {
            animation: row-highlight 10s ease-out infinite;
          }

          /* ─── Audit panel slide in ────────────────────────── */
          @keyframes panel-slide {
            0%, 74%   { transform: translateX(280px); }
            80%       { transform: translateX(0); }
            95%       { transform: translateX(0); }
            100%      { transform: translateX(280px); }
          }
          .audit-panel {
            animation: panel-slide 10s cubic-bezier(0.16, 1, 0.3, 1) infinite;
          }

          /* ─── Cursor click ring ───────────────────────────── */
          @keyframes click-ring {
            0%, 29%   { r: 0; opacity: 0; }
            31%       { r: 8; opacity: 0.4; }
            35%       { r: 14; opacity: 0; }
            69%       { r: 0; opacity: 0; }
            72%       { r: 8; opacity: 0.4; }
            76%       { r: 14; opacity: 0; }
            100%      { r: 0; opacity: 0; }
          }
          .click-ring {
            animation: click-ring 10s ease-out infinite;
          }
        `}</style>

        {/* ─── Background ────────────────────────────────────── */}
        <rect width="800" height="500" fill="#fafaf9" />

        {/* ─── Sidebar ───────────────────────────────────────── */}
        <rect x="0" y="0" width="56" height="500" fill="#0c0a09" />
        {/* Sidebar logo */}
        <rect x="16" y="16" width="24" height="24" rx="6" fill="#0d7c7b" opacity="0.8" />
        {/* Sidebar nav items */}
        <rect x="16" y="56" width="24" height="24" rx="4" fill="#292524" />
        <rect x="20" y="62" width="16" height="3" rx="1.5" fill="#78716c" />
        <rect x="20" y="69" width="12" height="3" rx="1.5" fill="#57534e" />
        <rect x="16" y="92" width="24" height="24" rx="4" fill="#0d7c7b" opacity="0.2" />
        <rect x="20" y="98" width="16" height="3" rx="1.5" fill="#3acfca" />
        <rect x="20" y="105" width="12" height="3" rx="1.5" fill="#0d7c7b" />
        <rect x="16" y="128" width="24" height="24" rx="4" fill="#292524" />
        <rect x="20" y="134" width="16" height="3" rx="1.5" fill="#78716c" />
        <rect x="20" y="141" width="12" height="3" rx="1.5" fill="#57534e" />

        {/* ─── Top bar ───────────────────────────────────────── */}
        <rect x="56" y="0" width="744" height="50" fill="white" />
        <line x1="56" y1="50" x2="800" y2="50" stroke="#e5e7eb" strokeWidth="1" />
        {/* Page title */}
        <text x="76" y="31" fill="#1c1917" fontSize="13" fontWeight="600" fontFamily="system-ui, sans-serif">Market Scanner</text>

        {/* ─── Search bar ────────────────────────────────────── */}
        <rect x="76" y="64" width="420" height="36" rx="8" fill="white" stroke="#e5e7eb" strokeWidth="1.5" />
        {/* Placeholder / typed text */}
        <g className="type-text">
          <text x="88" y="87" fill="#1c1917" fontSize="12" fontFamily="system-ui, sans-serif">
            Dentists in Austin, TX
          </text>
        </g>
        {/* Search icon */}
        <circle cx="90" cy="82" r="0" stroke="#a8a29e" strokeWidth="1.5" fill="none" opacity="0" />

        {/* Scan button */}
        <g className="scan-btn">
          <rect x="504" y="64" width="72" height="36" rx="8" fill="#0d7c7b" />
          <text x="540" y="87" fill="white" fontSize="12" fontWeight="600" fontFamily="system-ui, sans-serif" textAnchor="middle">Scan</text>
        </g>

        {/* ─── Loading bar ───────────────────────────────────── */}
        <rect x="0" y="50" height="2" fill="#0d7c7b" className="loading-bar" rx="1" />

        {/* ─── Table header ──────────────────────────────────── */}
        <g opacity="0.9">
          <rect x="76" y="116" width="500" height="28" rx="4" fill="#f5f4f2" />
          <text x="92" y="134" fill="#78716c" fontSize="10" fontWeight="600" fontFamily="system-ui, sans-serif">BUSINESS</text>
          <text x="280" y="134" fill="#78716c" fontSize="10" fontWeight="600" fontFamily="system-ui, sans-serif">CATEGORY</text>
          <text x="390" y="134" fill="#78716c" fontSize="10" fontWeight="600" fontFamily="system-ui, sans-serif">RATING</text>
          <text x="470" y="134" fill="#78716c" fontSize="10" fontWeight="600" fontFamily="system-ui, sans-serif">NEED SCORE</text>
        </g>

        {/* ─── Table rows ────────────────────────────────────── */}

        {/* Row 1 */}
        <g className="row-1">
          <line x1="76" y1="176" x2="576" y2="176" stroke="#f5f4f2" strokeWidth="1" />
          <text x="92" y="165" fill="#1c1917" fontSize="11.5" fontFamily="system-ui, sans-serif">Austin Family Dental</text>
          <text x="280" y="165" fill="#78716c" fontSize="11" fontFamily="system-ui, sans-serif">Dentist</text>
          <text x="390" y="165" fill="#78716c" fontSize="11" fontFamily="system-ui, sans-serif">3.2</text>
          {/* Stars */}
          <g transform="translate(410, 156)">
            <circle r="2.5" cx="0" cy="5" fill="#f59e0b" />
            <circle r="2.5" cx="7" cy="5" fill="#f59e0b" />
            <circle r="2.5" cx="14" cy="5" fill="#f59e0b" />
            <circle r="2.5" cx="21" cy="5" fill="#e5e7eb" />
            <circle r="2.5" cx="28" cy="5" fill="#e5e7eb" />
          </g>
        </g>
        <g className="score-1">
          <rect x="470" y="150" width="42" height="20" rx="10" fill="#ef4444" opacity="0.12" />
          <text x="491" y="164" fill="#ef4444" fontSize="11" fontWeight="700" fontFamily="system-ui, sans-serif" textAnchor="middle">82</text>
        </g>

        {/* Row 2 */}
        <g className="row-2">
          <line x1="76" y1="216" x2="576" y2="216" stroke="#f5f4f2" strokeWidth="1" />
          <text x="92" y="205" fill="#1c1917" fontSize="11.5" fontFamily="system-ui, sans-serif">Bright Smile Dentistry</text>
          <text x="280" y="205" fill="#78716c" fontSize="11" fontFamily="system-ui, sans-serif">Dentist</text>
          <text x="390" y="205" fill="#78716c" fontSize="11" fontFamily="system-ui, sans-serif">4.1</text>
          <g transform="translate(410, 196)">
            <circle r="2.5" cx="0" cy="5" fill="#f59e0b" />
            <circle r="2.5" cx="7" cy="5" fill="#f59e0b" />
            <circle r="2.5" cx="14" cy="5" fill="#f59e0b" />
            <circle r="2.5" cx="21" cy="5" fill="#f59e0b" />
            <circle r="2.5" cx="28" cy="5" fill="#e5e7eb" />
          </g>
        </g>
        <g className="score-2">
          <rect x="470" y="190" width="42" height="20" rx="10" fill="#f59e0b" opacity="0.12" />
          <text x="491" y="204" fill="#f59e0b" fontSize="11" fontWeight="700" fontFamily="system-ui, sans-serif" textAnchor="middle">54</text>
        </g>

        {/* Row 3 — this is the one the cursor will click */}
        <rect x="76" y="222" width="500" height="40" rx="0" className="row-hl" />
        <g className="row-3">
          <line x1="76" y1="256" x2="576" y2="256" stroke="#f5f4f2" strokeWidth="1" />
          <text x="92" y="245" fill="#1c1917" fontSize="11.5" fontFamily="system-ui, sans-serif">Hill Country Dental Care</text>
          <text x="280" y="245" fill="#78716c" fontSize="11" fontFamily="system-ui, sans-serif">Dentist</text>
          <text x="390" y="245" fill="#78716c" fontSize="11" fontFamily="system-ui, sans-serif">2.8</text>
          <g transform="translate(410, 236)">
            <circle r="2.5" cx="0" cy="5" fill="#f59e0b" />
            <circle r="2.5" cx="7" cy="5" fill="#f59e0b" />
            <circle r="2.5" cx="14" cy="5" fill="#f59e0b" />
            <circle r="2.5" cx="21" cy="5" fill="#e5e7eb" />
            <circle r="2.5" cx="28" cy="5" fill="#e5e7eb" />
          </g>
        </g>
        <g className="score-3">
          <rect x="470" y="230" width="42" height="20" rx="10" fill="#ef4444" opacity="0.12" />
          <text x="491" y="244" fill="#ef4444" fontSize="11" fontWeight="700" fontFamily="system-ui, sans-serif" textAnchor="middle">91</text>
        </g>

        {/* Row 4 */}
        <g className="row-4">
          <line x1="76" y1="296" x2="576" y2="296" stroke="#f5f4f2" strokeWidth="1" />
          <text x="92" y="285" fill="#1c1917" fontSize="11.5" fontFamily="system-ui, sans-serif">Lakeway Smiles</text>
          <text x="280" y="285" fill="#78716c" fontSize="11" fontFamily="system-ui, sans-serif">Dentist</text>
          <text x="390" y="285" fill="#78716c" fontSize="11" fontFamily="system-ui, sans-serif">4.6</text>
          <g transform="translate(410, 276)">
            <circle r="2.5" cx="0" cy="5" fill="#f59e0b" />
            <circle r="2.5" cx="7" cy="5" fill="#f59e0b" />
            <circle r="2.5" cx="14" cy="5" fill="#f59e0b" />
            <circle r="2.5" cx="21" cy="5" fill="#f59e0b" />
            <circle r="2.5" cx="28" cy="5" fill="#f59e0b" />
          </g>
        </g>
        <g className="score-4">
          <rect x="470" y="270" width="42" height="20" rx="10" fill="#10b981" opacity="0.12" />
          <text x="491" y="284" fill="#10b981" fontSize="11" fontWeight="700" fontFamily="system-ui, sans-serif" textAnchor="middle">18</text>
        </g>

        {/* Row 5 */}
        <g className="row-5">
          <line x1="76" y1="336" x2="576" y2="336" stroke="#f5f4f2" strokeWidth="1" />
          <text x="92" y="325" fill="#1c1917" fontSize="11.5" fontFamily="system-ui, sans-serif">Cedar Park Orthodontics</text>
          <text x="280" y="325" fill="#78716c" fontSize="11" fontFamily="system-ui, sans-serif">Orthodontist</text>
          <text x="390" y="325" fill="#78716c" fontSize="11" fontFamily="system-ui, sans-serif">3.9</text>
          <g transform="translate(410, 316)">
            <circle r="2.5" cx="0" cy="5" fill="#f59e0b" />
            <circle r="2.5" cx="7" cy="5" fill="#f59e0b" />
            <circle r="2.5" cx="14" cy="5" fill="#f59e0b" />
            <circle r="2.5" cx="21" cy="5" fill="#f59e0b" />
            <circle r="2.5" cx="28" cy="5" fill="#e5e7eb" />
          </g>
        </g>
        <g className="score-5">
          <rect x="470" y="310" width="42" height="20" rx="10" fill="#f59e0b" opacity="0.12" />
          <text x="491" y="324" fill="#f59e0b" fontSize="11" fontWeight="700" fontFamily="system-ui, sans-serif" textAnchor="middle">47</text>
        </g>

        {/* ─── Audit panel (slides in from right) ────────────── */}
        <g clipPath="url(#audit-clip)">
          <g className="audit-panel">
            {/* Panel bg */}
            <rect x="524" y="60" width="270" height="430" fill="white" />
            <line x1="524" y1="60" x2="524" y2="490" stroke="#e5e7eb" strokeWidth="1" />

            {/* Panel header */}
            <text x="544" y="90" fill="#1c1917" fontSize="13" fontWeight="700" fontFamily="system-ui, sans-serif">Audit Report</text>
            <text x="544" y="108" fill="#78716c" fontSize="10" fontFamily="system-ui, sans-serif">Hill Country Dental Care</text>

            {/* Score badge */}
            <rect x="544" y="120" width="56" height="24" rx="12" fill="#ef4444" opacity="0.12" />
            <text x="572" y="136" fill="#ef4444" fontSize="12" fontWeight="700" fontFamily="system-ui, sans-serif" textAnchor="middle">Score: 91</text>

            {/* Divider */}
            <line x1="544" y1="156" x2="774" y2="156" stroke="#f5f4f2" strokeWidth="1" />

            {/* GBP section */}
            <text x="544" y="176" fill="#0ea5e9" fontSize="10" fontWeight="600" fontFamily="system-ui, sans-serif">GBP HEALTH</text>
            <rect x="544" y="184" width="210" height="6" rx="3" fill="#f5f4f2" />
            <rect x="544" y="184" width="42" height="6" rx="3" fill="#ef4444" opacity="0.7" />
            <text x="544" y="204" fill="#78716c" fontSize="9.5" fontFamily="system-ui, sans-serif">Unclaimed listing, no owner activity</text>

            {/* Rank section */}
            <text x="544" y="226" fill="#f59e0b" fontSize="10" fontWeight="600" fontFamily="system-ui, sans-serif">SEARCH VISIBILITY</text>
            <rect x="544" y="234" width="210" height="6" rx="3" fill="#f5f4f2" />
            <rect x="544" y="234" width="84" height="6" rx="3" fill="#f59e0b" opacity="0.7" />
            <text x="544" y="254" fill="#78716c" fontSize="9.5" fontFamily="system-ui, sans-serif">Not in local pack, page 2+</text>

            {/* Web section */}
            <text x="544" y="276" fill="#0d7c7b" fontSize="10" fontWeight="600" fontFamily="system-ui, sans-serif">WEB PRESENCE</text>
            <rect x="544" y="284" width="210" height="6" rx="3" fill="#f5f4f2" />
            <rect x="544" y="284" width="63" height="6" rx="3" fill="#ef4444" opacity="0.7" />
            <text x="544" y="304" fill="#78716c" fontSize="9.5" fontFamily="system-ui, sans-serif">No website found, no analytics</text>

            {/* Rep section */}
            <text x="544" y="326" fill="#e11d48" fontSize="10" fontWeight="600" fontFamily="system-ui, sans-serif">REPUTATION</text>
            <rect x="544" y="334" width="210" height="6" rx="3" fill="#f5f4f2" />
            <rect x="544" y="334" width="126" height="6" rx="3" fill="#f59e0b" opacity="0.7" />
            <text x="544" y="354" fill="#78716c" fontSize="9.5" fontFamily="system-ui, sans-serif">2.8 stars, 12 reviews, no replies</text>

            {/* Action buttons */}
            <rect x="544" y="380" width="100" height="28" rx="6" fill="#0d7c7b" />
            <text x="594" y="398" fill="white" fontSize="10" fontWeight="600" fontFamily="system-ui, sans-serif" textAnchor="middle">Send Report</text>
            <rect x="654" y="380" width="100" height="28" rx="6" fill="white" stroke="#e5e7eb" strokeWidth="1" />
            <text x="704" y="398" fill="#1c1917" fontSize="10" fontWeight="500" fontFamily="system-ui, sans-serif" textAnchor="middle">Export CSV</text>
          </g>
        </g>

        {/* ─── Cursor ────────────────────────────────────────── */}
        <g className="hero-cursor">
          {/* Click ring effect */}
          <circle cx="0" cy="0" fill="none" stroke="#0d7c7b" strokeWidth="1.5" className="click-ring" />
          {/* Cursor pointer */}
          <path
            d="M0 0 L0 14 L4 11 L7 17 L10 16 L7 10 L12 10 Z"
            fill="white"
            stroke="#1c1917"
            strokeWidth="1"
            strokeLinejoin="round"
          />
        </g>

        {/* ─── Bottom fade (hides cut-off rows) ──────────────── */}
        <defs>
          <linearGradient id="bottom-fade" x1="0" y1="420" x2="0" y2="500" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fafaf9" stopOpacity="0" />
            <stop offset="100%" stopColor="#fafaf9" stopOpacity="1" />
          </linearGradient>
        </defs>
        <rect x="56" y="400" width="470" height="100" fill="url(#bottom-fade)" />
      </svg>
    </div>
  );
}
