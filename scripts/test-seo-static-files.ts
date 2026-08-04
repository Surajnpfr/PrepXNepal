import assert from 'node:assert/strict';
import {
  SEO_CACHE_CONTROL,
  SITEMAP_CONTENT_TYPE,
  ROBOTS_CONTENT_TYPE,
  sitemapHeaders,
  robotsHeaders,
} from '../server/seoStaticFiles.ts';
import { buildRobotsTxt, buildSitemapXml } from '../server/seoDocuments.ts';

const sitemapXml = buildSitemapXml('2026-08-04');
assert.ok(sitemapXml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
assert.match(sitemapXml, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
assert.match(sitemapXml, /<loc>https:\/\/prepxnepal\.com\/<\/loc>/);
assert.match(sitemapXml, /<lastmod>2026-08-04<\/lastmod>/);
assert.doesNotMatch(sitemapXml, /\uFEFF/);

const robotsTxt = buildRobotsTxt();
assert.match(robotsTxt, /^User-agent:\s*\*/m);
assert.match(robotsTxt, /^Allow:\s*\//m);
assert.match(robotsTxt, /^Sitemap:\s*https:\/\/prepxnepal\.com\/sitemap\.xml$/m);

const smHeaders = sitemapHeaders();
assert.equal(smHeaders['Content-Type'], SITEMAP_CONTENT_TYPE);
assert.equal(smHeaders['Cache-Control'], SEO_CACHE_CONTROL);
assert.ok(!('Last-Modified' in smHeaders));
assert.ok(!('ETag' in smHeaders));

const rbHeaders = robotsHeaders();
assert.equal(rbHeaders['Content-Type'], ROBOTS_CONTENT_TYPE);
assert.equal(rbHeaders['Cache-Control'], SEO_CACHE_CONTROL);

console.log('seoStaticFiles / sitemap regression tests passed');
