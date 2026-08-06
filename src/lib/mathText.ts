/**
 * Split question/option text into plain + TeX segments and render via KaTeX.
 * Supports $inline$ and $$display$$ delimiters used in CEE bank imports.
 */

import katex from 'katex';

export type MathTextSegment =
  | { kind: 'text'; value: string }
  | { kind: 'tex'; value: string; displayMode: boolean };

/** Match $$...$$ first, then $...$ (non-greedy, single-line-friendly). */
const TEX_SEGMENT_RE = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g;

export function splitMathText(input: string): MathTextSegment[] {
  const raw = String(input ?? '');
  if (!raw) return [{ kind: 'text', value: '' }];

  const segments: MathTextSegment[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  TEX_SEGMENT_RE.lastIndex = 0;

  while ((match = TEX_SEGMENT_RE.exec(raw)) !== null) {
    if (match.index > last) {
      segments.push({ kind: 'text', value: raw.slice(last, match.index) });
    }
    if (match[1] != null) {
      segments.push({ kind: 'tex', value: match[1].trim(), displayMode: true });
    } else if (match[2] != null) {
      segments.push({ kind: 'tex', value: match[2].trim(), displayMode: false });
    }
    last = match.index + match[0].length;
  }

  if (last < raw.length) {
    segments.push({ kind: 'text', value: raw.slice(last) });
  }

  return segments.length > 0 ? segments : [{ kind: 'text', value: raw }];
}

export function renderTexToHtml(tex: string, displayMode = false): string {
  try {
    return katex.renderToString(tex, {
      throwOnError: false,
      displayMode,
      strict: 'ignore',
      trust: false,
      output: 'html',
    });
  } catch {
    return tex;
  }
}

/** True when the string contains at least one $...$ / $$...$$ segment. */
export function hasMathDelimiters(input: string): boolean {
  return /\$\$[\s\S]+?\$\$|\$[^$\n]+?\$/.test(String(input ?? ''));
}
