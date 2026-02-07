import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

const siteUrl = 'https://scoutblind.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Scoutblind - Find SEO Prospects in Half the Time',
    template: '%s | Scoutblind',
  },
  description: 'Scan Google Business Profiles to find businesses with weak SEO presence. Identify unclaimed profiles, poor rankings, and dormant owners — then pitch them your services.',
  keywords: ['SEO prospecting', 'Google Business Profile', 'GMB signals', 'SEO leads', 'local SEO', 'SEO agency tool', 'lead generation', 'business intelligence'],
  authors: [{ name: 'Scoutblind' }],
  creator: 'Scoutblind',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'Scoutblind',
    title: 'Scoutblind - Find SEO Prospects in Half the Time',
    description: 'Scan Google Business Profiles to find businesses with weak SEO presence. The signals you hunt for — automated.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Scoutblind - Market Intelligence for SEO Agencies',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Scoutblind - Find SEO Prospects in Half the Time',
    description: 'Scan Google Business Profiles to find businesses with weak SEO presence. The signals you hunt for — automated.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  other: {
    'theme-color': '#0f0f10',
    'msapplication-TileColor': '#0f0f10',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Scoutblind',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  url: siteUrl,
  description: 'Scan Google Business Profiles to find businesses with weak SEO presence. Identify unclaimed profiles, poor rankings, and dormant owners — then pitch them your services.',
  offers: {
    '@type': 'AggregateOffer',
    priceCurrency: 'USD',
    lowPrice: '0',
    highPrice: '99',
    offerCount: '3',
  },
  featureList: [
    'Google Business Profile scanning',
    'SEO signal analysis',
    'Unclaimed profile detection',
    'Search visibility ranking',
    'Lead enrichment and scoring',
    'Market opportunity dashboard',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-background text-foreground font-sans">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
