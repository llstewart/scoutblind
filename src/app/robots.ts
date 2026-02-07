import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard', '/account', '/library', '/history', '/api/', '/auth/'],
      },
    ],
    sitemap: 'https://scoutblind.com/sitemap.xml',
  };
}
