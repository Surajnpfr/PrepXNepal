/**
 * SEO static file routes for Googlebot / Search Console.
 *
 * Root issue we fix here:
 * express.static serves sitemap.xml with Last-Modified/ETag, so conditional
 * requests (If-Modified-Since) return 304 with an empty body. Bing often
 * tolerates that; Google Search Console frequently reports
 * "Sitemap could not be read" when it gets 304 instead of XML.
 *
 * These routes always return 200 + full body with Google-safe headers.
 */

import fs from 'node:fs';
import path from 'node:path';
import type { Express, Request, Response } from 'express';

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
 * Send a file as a full 200 response without Last-Modified / ETag so
 * conditional GETs cannot collapse into empty 304 bodies.
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
  // Explicitly clear validators Express/static may have set earlier.
  res.removeHeader('ETag');
  res.removeHeader('Last-Modified');
  if (res.req?.method === 'HEAD') {
    res.end();
    return;
  }
  res.end(buf);
}

function sendDistFile(
  res: Response,
  distDir: string,
  fileName: string,
  headers: Record<string, string>,
  missingLabel: string
): void {
  const filePath = path.join(distDir, fileName);
  if (!fs.existsSync(filePath)) {
    res.status(404).type('text/plain; charset=utf-8').send(`${missingLabel} not found`);
    return;
  }
  sendAlwaysFresh(res, fs.readFileSync(filePath), headers);
}

/**
 * Register before express.static / SPA fallback so Google never hits
 * conditional static middleware for these paths.
 */
export function registerSeoStaticRoutes(app: Express, distDir: string): void {
  const sitemapHandler = (_req: Request, res: Response) => {
    sendDistFile(res, distDir, 'sitemap.xml', sitemapHeaders(), 'Sitemap');
  };

  app.get(['/sitemap.xml', '/sitemap'], sitemapHandler);

  app.get('/robots.txt', (_req: Request, res: Response) => {
    sendDistFile(res, distDir, 'robots.txt', robotsHeaders(), 'robots.txt');
  });
}
