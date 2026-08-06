/**
 * Math text / KaTeX segment tests.
 * Run: npx tsx scripts/test-math-text.ts
 */
import assert from 'node:assert/strict';
import { hasMathDelimiters, renderTexToHtml, splitMathText } from '../src/lib/mathText.ts';

const ice = splitMathText(
  'A $50\\text{ g}$ piece of ice at $0^\\circ\\text{C}$ is mixed with water.'
);
assert.equal(ice.filter((s) => s.kind === 'tex').length, 2);
assert.equal(ice[0]?.kind, 'text');
assert.ok(ice.some((s) => s.kind === 'tex' && s.value.includes('50')));

const alpha = splitMathText(
  'relation between $\\alpha$, area expansion $\\beta$, and volume expansion $\\gamma$?'
);
assert.equal(alpha.filter((s) => s.kind === 'tex').length, 3);
assert.ok(alpha.some((s) => s.kind === 'tex' && s.value === '\\alpha'));

const entropy = splitMathText(
  'What is the change in entropy $\\Delta S$ when $1\\text{ kg}$ of ice melts?'
);
assert.ok(entropy.some((s) => s.kind === 'tex' && s.value.includes('\\Delta S')));

const display = splitMathText('Energy $$E = mc^2$$ rest.');
assert.ok(display.some((s) => s.kind === 'tex' && s.displayMode === true));

assert.equal(hasMathDelimiters('plain stem'), false);
assert.equal(hasMathDelimiters('has $\\alpha$'), true);

const html = renderTexToHtml('\\alpha', false);
assert.ok(html.includes('katex') || html.includes('α') || html.includes('\\alpha'));
assert.ok(!html.includes('$'));

console.log('test-math-text: OK');
