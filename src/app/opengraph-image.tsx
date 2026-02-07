import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Scoutblind - Market Intelligence for SEO Agencies';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0f0f10',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          position: 'relative',
        }}
      >
        {/* Top accent line */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: 'linear-gradient(90deg, transparent, #8b5cf6, transparent)',
          }}
        />

        {/* Subtle radial glow */}
        <div
          style={{
            position: 'absolute',
            top: '30%',
            left: '30%',
            width: '40%',
            height: '40%',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.08), transparent)',
            filter: 'blur(60px)',
          }}
        />

        {/* Eye icon */}
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            backgroundColor: '#1a1a1f',
            border: '2px solid rgba(139, 92, 246, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 28,
          }}
        >
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              backgroundColor: '#8b5cf6',
            }}
          />
        </div>

        {/* Logo text */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            marginBottom: 12,
          }}
        >
          <span
            style={{
              fontSize: 56,
              fontWeight: 700,
              color: '#fafafa',
              letterSpacing: -1,
            }}
          >
            Scoutblind
          </span>
          <span
            style={{
              fontSize: 56,
              fontWeight: 700,
              color: '#8b5cf6',
            }}
          >
            .
          </span>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 22,
            color: '#a1a1aa',
            marginBottom: 36,
            letterSpacing: 0.5,
          }}
        >
          Find SEO Prospects in Half the Time
        </div>

        {/* Divider */}
        <div
          style={{
            width: 120,
            height: 1,
            backgroundColor: '#8b5cf6',
            opacity: 0.4,
            marginBottom: 32,
          }}
        />

        {/* Feature pills */}
        <div style={{ display: 'flex', gap: 12 }}>
          {['Signal Analysis', 'Lead Enrichment', 'Market Intelligence'].map(
            (label) => (
              <div
                key={label}
                style={{
                  padding: '8px 20px',
                  borderRadius: 20,
                  backgroundColor: 'rgba(139, 92, 246, 0.08)',
                  border: '1px solid rgba(139, 92, 246, 0.2)',
                  fontSize: 14,
                  fontWeight: 500,
                  color: '#a78bfa',
                }}
              >
                {label}
              </div>
            ),
          )}
        </div>

        {/* URL */}
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            fontSize: 16,
            fontWeight: 500,
            color: '#71717a',
            letterSpacing: 2,
          }}
        >
          scoutblind.com
        </div>
      </div>
    ),
    { ...size },
  );
}
