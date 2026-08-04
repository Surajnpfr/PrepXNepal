import assert from 'node:assert/strict';
import {
  TENTATIVE_EXAM_LABEL,
  daysUntilExamDate,
  isExamDateSet,
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

function testLabel() {
  assert.equal(TENTATIVE_EXAM_LABEL, 'Tentative · Ashoj–Kartik');
}

testUnsetAndLegacyPlaceholder();
testRealDate();
testLabel();
console.log('examSchedule tests passed');
