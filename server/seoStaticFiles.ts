/**
 * SEO document routes for Googlebot / Search Console.
 *
 * Hostinger's CDN serves files that exist as *.xml / *.txt from disk BEFORE
 * Node. That static path emits Last-Modified → conditional 304 (empty body),
 * which GSC reports as "Sitemap could not be read" while Bing still works.
 *
 * Fix: embed sitemap/robots in the server bundle and always return 200 + body
 * with Google-safe headers. Do not ship sitemap.xml under public/dist.
 */

import type { Express, Request, Response } from 'express';
import { buildRobotsTxt, buildSitemapXml } from './seoDocuments.ts';

export const SITEMAP_CONTENT_TYPE = 'application/xml; charset=utf-8';
export const ROBOTS_CONTENT_TYPE = 'text/plain; charset=utf-8';
export const SEO_CACHE_CONTROL = 'public, max-age=3600';

/** Headers Google expects for a readable public sitemap. */
export function sitemapHeaders(): Record<string, string> {
  return {
    'Content-Type': SITEMAP_CONTENT_TYPE,
    'Cache-Control': SEO_CACHE_CONTROL,
  };
}

export function robotsHeaders(): Record<string, string> {
  return {
    'Content-Type': ROBOTS_CONTENT_TYPE,
    'Cache-Control': SEO_CACHE_CONTROL,
  };
}

/**
 * Send a full 200 response without Last-Modified / ETag so conditional GETs
 * cannot collapse into empty 304 bodies.
 */
export function sendAlwaysFresh(
  res: Response,
  body: Buffer | string,
  headers: Record<string, string>
): void {
  const buf = Buffer.isBuffer(body) ? body : Buffer.from(body, 'utf8');
  res.statusCode = 200;
  for (const [key, value] of Object.entries(headers)) {
    res.setHeader(key, value);
  }
  res.setHeader('Content-Length', String(buf.byteLength));
  res.removeHeader('ETag');
  res.removeHeader('Last-Modified');
  if (res.req?.method === 'HEAD') {
    res.end();
    return;
  }
  res.end(buf);
}

/**
 * Register before express.static / SPA fallback.
 * Paths must not collide with real files in dist/ (Hostinger static short-circuit).
 */
export function registerSeoStaticRoutes(app: Express, _distDir?: string): void {
  const sitemapHandler = (_req: Request, res: Response) => {
    sendAlwaysFresh(res, buildSitemapXml(), sitemapHeaders());
  };

  app.get(['/sitemap.xml', '/sitemap'], sitemapHandler);

  app.get('/robots.txt', (_req: Request, res: Response) => {
    sendAlwaysFresh(res, buildRobotsTxt(), robotsHeaders());
  });
}
