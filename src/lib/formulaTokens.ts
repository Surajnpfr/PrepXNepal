/**
 * Shared formula tokenizer — used by FormulaMath UI and PDF export.
 * Pure (no React).
 */

export type FormulaToken =
  | { kind: 'text'; value: string }
  | { kind: 'sym'; base: string; sub?: string; sup?: string };

const LETTER_RE =
  /[A-Za-z\u0370-\u03FF\u0394\u03C0\u03B8\u03C6\u03C8\u03BC\u03C9\u03BB\u03C1\u03C3\u03C4\u03BE\u03B6\u03B7\u03C7\u03BD]/;

/**
 * Parse revision-sheet formulas into text + symbol tokens.
 * Examples: a_c → a + sub(c), E°_cell → E° + sub(cell), x^2 → x + sup(2)
 * Unicode subscripts/superscripts (H₂O, v²) pass through as text.
 */
export function tokenizeFormula(input: string): FormulaToken[] {
  const tokens: FormulaToken[] = [];
  const s = input;
  let i = 0;
  const isLetter = (ch: string) => LETTER_RE.test(ch);

  while (i < s.length) {
    if (isLetter(s[i]!)) {
      const baseStart = i;
      i += 1;
      let base = s[baseStart]!;
      let degree = '';
      if (s[i] === '°' || s[i] === '˚') {
        degree = s[i]!;
        i += 1;
      }
      let sub: string | undefined;
      let sup: string | undefined;
      if (s[i] === '_') {
        i += 1;
        const subStart = i;
        while (i < s.length && /[A-Za-z0-9.%]/.test(s[i]!)) i += 1;
        sub = s.slice(subStart, i) || undefined;
      }
      if (s[i] === '^') {
        i += 1;
        const supStart = i;
        while (i < s.length && /[0-9n+\-]/.test(s[i]!)) i += 1;
        sup = s.slice(supStart, i) || undefined;
      }
      base = base + degree;
      if (sub || sup) {
        tokens.push({ kind: 'sym', base, sub, sup });
      } else {
        tokens.push({ kind: 'text', value: base });
      }
      continue;
    }

    const textStart = i;
    i += 1;
    while (i < s.length && !isLetter(s[i]!)) i += 1;
    tokens.push({ kind: 'text', value: s.slice(textStart, i) });
  }

  const merged: FormulaToken[] = [];
  for (const t of tokens) {
    const prev = merged[merged.length - 1];
    if (t.kind === 'text' && prev?.kind === 'text') {
      prev.value += t.value;
    } else {
      merged.push({ ...t });
    }
  }
  return merged;
}

/** Approximate width in “em” units for layout estimates (PDF / wrap). */
export function formulaPlainPreview(formula: string): string {
  return tokenizeFormula(formula)
    .map((t) => {
      if (t.kind === 'text') return t.value;
      let s = t.base;
      if (t.sub) s += t.sub;
      if (t.sup) s += t.sup;
      return s;
    })
    .join('');
}
