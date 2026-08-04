import assert from 'node:assert/strict';
import {
  ABOUT_FAQS,
  ABOUT_US,
  PAGE_SEO,
  SITE_META_DESCRIPTION,
  buildGraph,
} from '../src/lib/siteSeo.ts';

assert.ok(SITE_META_DESCRIPTION.length >= 120 && SITE_META_DESCRIPTION.length <= 200);
assert.match(SITE_META_DESCRIPTION, /PrepX Nepal/);
assert.match(SITE_META_DESCRIPTION, /CEE/);
assert.match(ABOUT_US.definition, /Common Entrance Examination/);
assert.equal(PAGE_SEO.about.path, '/about');
assert.ok(ABOUT_FAQS.length >= 4);
assert.equal(PAGE_SEO.landing.description, SITE_META_DESCRIPTION);

const graph = buildGraph(PAGE_SEO.about);
const types = (graph['@graph'] as Array<{ '@type': string }>).map((n) => n['@type']);
assert.ok(types.includes('AboutPage'));
assert.ok(types.includes('Organization'));
assert.ok(types.includes('FAQPage'));

console.log('siteSeo AEO/GEO tests passed');
