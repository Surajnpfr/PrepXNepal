/**
 * Formula tokenizer regression tests.
 * Run: npx tsx scripts/test-formula-math.ts
 */
import { tokenizeFormula } from '../src/lib/formulaTokens.ts';

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

const centripetal = tokenizeFormula('a_c = v² / r = ω² r');
assert(
  centripetal.some((t) => t.kind === 'sym' && t.base === 'a' && t.sub === 'c'),
  'a_c → subscript c'
);
assert(
  centripetal.some((t) => t.kind === 'text' && t.value.includes('v²')),
  'unicode superscript preserved'
);

const nernst = tokenizeFormula('E_cell = E°_cell - (0.0591 / n) log Q');
assert(
  nernst.some((t) => t.kind === 'sym' && t.base === 'E' && t.sub === 'cell'),
  'E_cell'
);
assert(
  nernst.some((t) => t.kind === 'sym' && t.base === 'E°' && t.sub === 'cell'),
  'E°_cell'
);

const escape = tokenizeFormula('v_e = √(2 g R) ≈ 11.2 km/s');
assert(
  escape.some((t) => t.kind === 'sym' && t.base === 'v' && t.sub === 'e'),
  'v_e'
);

const caret = tokenizeFormula('x^2 + y^3');
assert(
  caret.some((t) => t.kind === 'sym' && t.base === 'x' && t.sup === '2'),
  'x^2'
);

console.log('test-formula-math: OK');
