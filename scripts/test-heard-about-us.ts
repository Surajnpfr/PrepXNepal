/**
 * Run: npx tsx scripts/test-heard-about-us.ts
 */
import assert from 'node:assert/strict';
import {
  HEARD_ABOUT_US_LABELS,
  heardAboutUsLabel,
  isHeardAboutUs,
  normalizeHeardAboutUs,
} from '../server/heardAboutUsDomain.ts';

assert.equal(isHeardAboutUs('instagram'), true);
assert.equal(isHeardAboutUs('myspace'), false);
assert.equal(normalizeHeardAboutUs(' Instagram '), 'instagram');
assert.equal(normalizeHeardAboutUs('nope'), null);
assert.equal(heardAboutUsLabel('youtube'), 'YouTube');
assert.equal(heardAboutUsLabel(undefined), '—');
assert.equal(HEARD_ABOUT_US_LABELS.facebook, 'Facebook');

console.log('heardAboutUs OK');
