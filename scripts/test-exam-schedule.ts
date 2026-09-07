import assert from 'node:assert/strict';
import {
  OFFICIAL_MBBS_EXAM_DATE_ISO,
  OFFICIAL_MBBS_EXAM_LABEL,
  daysUntilExamDate,
  isExamDateSet,
  resolveExamDate,
} from '../src/lib/examSchedule.ts';

function testUnsetAndLegacyPlaceholder() {
  assert.equal(isExamDateSet(''), false);
  assert.equal(isExamDateSet(null), false);
  assert.equal(isExamDateSet(undefined), false);
  assert.equal(isExamDateSet('2026-09-15'), false);
  assert.equal(isExamDateSet('  '), false);
}

function testRealDate() {
  assert.equal(isExamDateSet('2026-10-20'), true);
  assert.ok(daysUntilExamDate('2099-01-01') > 0);
  assert.equal(daysUntilExamDate('2000-01-01'), 0);
}

function testOfficialMbbs() {
  assert.equal(OFFICIAL_MBBS_EXAM_DATE_ISO, '2026-10-31');
  assert.equal(OFFICIAL_MBBS_EXAM_LABEL, 'Kartik 14, 2083 · 31 Oct 2026');
  assert.equal(resolveExamDate(''), OFFICIAL_MBBS_EXAM_DATE_ISO);
  assert.equal(resolveExamDate(null), OFFICIAL_MBBS_EXAM_DATE_ISO);
  assert.equal(resolveExamDate('2026-09-15'), OFFICIAL_MBBS_EXAM_DATE_ISO);
  assert.equal(resolveExamDate('2026-11-05'), '2026-11-05');
}

testUnsetAndLegacyPlaceholder();
testRealDate();
testOfficialMbbs();
console.log('examSchedule tests passed');
