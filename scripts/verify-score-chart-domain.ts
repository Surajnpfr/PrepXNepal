/**
 * Verifies relative score-chart domain (zoomed Y-axis).
 * Run: npx tsx scripts/verify-score-chart-domain.ts
 */
import assert from 'node:assert/strict';
import { computeRelativeScoreDomain } from '../src/lib/scoreChartDomain';

// Mid scores should NOT force a 0–200 axis
{
  const d = computeRelativeScoreDomain([72, 85, 91, 88], { examMax: 200 });
  assert.ok(d.yMax < 200, `yMax should zoom below 200, got ${d.yMax}`);
  assert.ok(d.yMin > 0, `yMin should rise above 0 for mid scores, got ${d.yMin}`);
  assert.ok(d.yMax - d.yMin < 120, `span should be tight, got ${d.yMax - d.yMin}`);
  assert.ok(d.ticks.length >= 2, 'needs ticks');
  assert.equal(d.targetAboveBand, false);
}

// Far target stays out of band (does not flatten chart)
{
  const d = computeRelativeScoreDomain([80, 90, 95], { targetScore: 180, examMax: 200 });
  assert.ok(d.yMax < 160, `far target must not expand yMax, got ${d.yMax}`);
  assert.equal(d.targetAboveBand, true);
}

// Near target is included
{
  const d = computeRelativeScoreDomain([100, 110, 115], { targetScore: 130, examMax: 200 });
  assert.ok(d.yMax >= 130, `near target should be in band, yMax=${d.yMax}`);
  assert.equal(d.targetAboveBand, false);
}

// Single score still gets readable span
{
  const d = computeRelativeScoreDomain([95], { examMax: 200 });
  assert.ok(d.yMax - d.yMin >= 40, `min span for single score, got ${d.yMax - d.yMin}`);
  assert.ok(d.yMin <= 95 && d.yMax >= 95, 'score inside domain');
}

// Never exceed exam max
{
  const d = computeRelativeScoreDomain([190, 195], { examMax: 200 });
  assert.ok(d.yMax <= 200, `yMax capped at exam max, got ${d.yMax}`);
}

console.log('OK: relative score domain zooms to user scores without faking absolute marks');
