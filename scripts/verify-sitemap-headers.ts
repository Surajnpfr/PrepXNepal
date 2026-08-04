/**
 * Live harness: SEO routes must return 200 + XML even with If-Modified-Since.
 * Also asserts no public/sitemap.xml (Hostinger would short-circuit Node).
 */
import assert from 'node:assert/strict';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { registerSeoStaticRoutes } from '../server/seoStaticFiles.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
assert.equal(
  fs.existsSync(path.join(root, 'public', 'sitemap.xml')),
  false,
  'public/sitemap.xml must not exist — Hostinger CDN serves it before Express'
);
assert.equal(
  fs.existsSync(path.join(root, 'public', 'robots.txt')),
  false,
  'public/robots.txt must not exist — served from Express bundle'
);

const app = express();
registerSeoStaticRoutes(app);
const publicDir = path.join(root, 'public');
app.use(express.static(publicDir, { index: false, maxAge: '1h' }));

const server = await new Promise((resolve) => {
  const s = app.listen(0, '127.0.0.1', () => resolve(s));
});
const { port } = server.address();
const base = `http://127.0.0.1:${port}`;

try {
  const fresh = await fetch(`${base}/sitemap.xml`);
  assert.equal(fresh.status, 200);
  assert.match(fresh.headers.get('content-type') || '', /application\/xml/);
  assert.match(fresh.headers.get('cache-control') || '', /public/);
  assert.equal(fresh.headers.get('etag'), null);
  assert.equal(fresh.headers.get('last-modified'), null);
  const xml = await fresh.text();
  assert.match(xml, /<urlset/);

  const conditional = await fetch(`${base}/sitemap.xml`, {
    headers: { 'If-Modified-Since': 'Wed, 04 Aug 2026 00:00:00 GMT' },
  });
  assert.equal(
    conditional.status,
    200,
    `Expected 200 on conditional GET, got ${conditional.status} (old bug: 304)`
  );
  const xml2 = await conditional.text();
  assert.match(xml2, /<urlset/, 'Conditional GET must return full sitemap body, not empty 304');

  const alt = await fetch(`${base}/sitemap`);
  assert.equal(alt.status, 200);
  assert.match(await alt.text(), /<urlset/);

  console.log('seo sitemap harness OK (always-200, no static short-circuit)');
} finally {
  await new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
}
