import React, { useMemo } from 'react';
import { renderTexToHtml, splitMathText } from '../lib/mathText';

type Props = {
  text: string;
  className?: string;
  /** Use a block wrapper (default span for inline stems/options). */
  as?: 'span' | 'div' | 'p';
};

/**
 * Renders bank text with inline/display TeX ($...$ / $$...$$) via KaTeX.
 * Plain text passes through unchanged.
 */
export const MathText: React.FC<Props> = ({ text, className = '', as = 'span' }) => {
  const segments = useMemo(() => splitMathText(text), [text]);
  const Tag = as;

  return (
    <Tag className={`math-text ${className}`.trim()}>
      {segments.map((seg, idx) => {
        if (seg.kind === 'text') {
          return <React.Fragment key={idx}>{seg.value}</React.Fragment>;
        }
        return (
          <span
            key={idx}
            className={seg.displayMode ? 'math-text__display' : 'math-text__inline'}
            dangerouslySetInnerHTML={{
              __html: renderTexToHtml(seg.value, seg.displayMode),
            }}
          />
        );
      })}
    </Tag>
  );
};
