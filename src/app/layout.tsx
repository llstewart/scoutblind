import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css';
import { Providers } from './providers';

const siteUrl = 'https://packleads.io';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Packleads - Enriched Local Leads, Instantly',
    template: '%s | Packleads',
  },
  description: 'Scan Google Business Profiles to find local businesses with weak online presence. Identify unclaimed profiles, poor rankings, and dormant owners — then pitch them your services.',
  keywords: ['local lead generation', 'Google Business Profile', 'GBP signals', 'GMB signals', 'SEO leads', 'local SEO', 'SEO agency tool', 'web design leads', 'digital marketing leads', 'lead enrichment', 'business intelligence'],
  authors: [{ name: 'Packleads' }],
  creator: 'Packleads',
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'Packleads',
    title: 'Packleads - Enriched Local Leads, Instantly',
    description: 'Scan Google Business Profiles to find local businesses with weak online presence. The signals you hunt for — automated.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Packleads - Enriched Local Lead Generation',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Packleads - Enriched Local Leads, Instantly',
    description: 'Scan Google Business Profiles to find local businesses with weak online presence. The signals you hunt for — automated.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48' },
      { url: '/favicon.png', sizes: '48x48', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  other: {
    'msapplication-TileColor': '#ffffff',
  },
};

const jsonLdApp = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Packleads',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  url: siteUrl,
  description: 'Scan Google Business Profiles to find local businesses with weak online presence. Identify unclaimed profiles, poor rankings, and dormant owners — then pitch them your services.',
  offers: {
    '@type': 'AggregateOffer',
    priceCurrency: 'USD',
    lowPrice: '0',
    highPrice: '99',
    offerCount: '3',
  },
  featureList: [
    'Google Business Profile scanning',
    'Digital signal analysis',
    'Unclaimed profile detection',
    'Search visibility ranking',
    'Lead enrichment and scoring',
    'Market opportunity dashboard',
  ],
};

const jsonLdOrg = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Packleads',
  url: siteUrl,
  logo: `${siteUrl}/icon-512.png`,
  sameAs: [],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        {/* Browser chrome color — white for all public-facing pages */}
        <meta name="theme-color" content="#ffffff" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdApp) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrg) }}
        />
      </head>
      <body className="min-h-screen bg-background text-foreground font-sans">
        <Providers>
          {children}
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
