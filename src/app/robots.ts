import type { MetadataRoute } from 'next';

// Public marketing pages are crawlable; the signed-in app, API, and private
// share/view links are kept out of search results.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/dashboard',
        '/spaces',
        '/shared',
        '/view',
        '/request',
        '/answer',
        '/api',
        '/watchlist',
        '/deal-watch',
        '/account-manager',
        '/audit-log',
        '/analytics',
        '/content-library',
        '/agreements',
        '/file-requests',
        '/enquiries',
        '/settings',
        '/invite',
        '/paddle-sandbox',
        '/paddle-test',
        '/forgot-password',
        '/reset-password',
      ],
    },
    sitemap: 'https://www.venturethrust.com/sitemap.xml',
    host: 'https://www.venturethrust.com',
  };
}
