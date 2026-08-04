/**
 * Canonical sitemap + robots bodies (served only by Express).
 * Do NOT put sitemap.xml in public/ — Hostinger CDN serves *.xml as static
 * files before Node, which reintroduces empty 304 responses for Google.
 */

const ORIGIN = 'https://prepxnepal.com';

/** Public indexable surfaces (keep in sync with PAGE_SEO / marketing routes). */
const SITEMAP_ENTRIES: { path: string; changefreq: string; priority: string }[] = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/about', changefreq: 'monthly', priority: '0.9' },
  { path: '/reports', changefreq: 'weekly', priority: '0.8' },
  { path: '/catalog', changefreq: 'weekly', priority: '0.8' },
  { path: '/formulas', changefreq: 'weekly', priority: '0.7' },
  { path: '/payment', changefreq: 'monthly', priority: '0.8' },
  { path: '/help', changefreq: 'monthly', priority: '0.7' },
  { path: '/contact', changefreq: 'monthly', priority: '0.7' },
];

export function buildSitemapXml(lastmod = new Date().toISOString().slice(0, 10)): string {
  const urls = SITEMAP_ENTRIES.map(
    (e) => `  <url>
    <loc>${ORIGIN}${e.path === '/' ? '/' : e.path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>
  </url>`
  ).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

export function buildRobotsTxt(): string {
  return `User-agent: *
Allow: /

Sitemap: ${ORIGIN}/sitemap.xml
`;
}
