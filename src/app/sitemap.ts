import type { MetadataRoute } from 'next';

const BASE = 'https://www.venturethrust.com';

// The public, indexable pages. Helps Google discover and rank the marketing
// and legal pages quickly.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const pages: { path: string; priority: number; freq: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
    { path: '', priority: 1, freq: 'weekly' },
    { path: '/features', priority: 0.8, freq: 'weekly' },
    { path: '/docsend-alternative', priority: 0.8, freq: 'weekly' },
    { path: '/track-who-viewed-your-pitch-deck', priority: 0.8, freq: 'weekly' },
    { path: '/secure-data-room', priority: 0.8, freq: 'weekly' },
    { path: '/data-room-for-fundraising', priority: 0.8, freq: 'weekly' },
    { path: '/data-room-for-m-and-a', priority: 0.8, freq: 'weekly' },
    { path: '/data-room-for-legal', priority: 0.8, freq: 'weekly' },
    { path: '/data-room-for-startups', priority: 0.8, freq: 'weekly' },
    { path: '/send-documents-and-track-opens', priority: 0.8, freq: 'weekly' },
    { path: '/about', priority: 0.6, freq: 'monthly' },
    { path: '/contact', priority: 0.6, freq: 'monthly' },
    { path: '/privacy', priority: 0.3, freq: 'yearly' },
    { path: '/terms', priority: 0.3, freq: 'yearly' },
    { path: '/refund', priority: 0.3, freq: 'yearly' },
  ];
  return pages.map((p) => ({
    url: `${BASE}${p.path}`,
    lastModified: now,
    changeFrequency: p.freq,
    priority: p.priority,
  }));
}
