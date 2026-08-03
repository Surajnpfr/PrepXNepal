import React, { useMemo } from 'react';
import { tokenizeFormula, type FormulaToken } from '../lib/formulaTokens';

function TokenView({ token }: { token: FormulaToken }) {
  if (token.kind === 'text') return <>{token.value}</>;
  return (
    <span className="formula-sym inline-flex items-baseline">
      <span>{token.base}</span>
      {token.sub ? <sub className="formula-sub">{token.sub}</sub> : null}
      {token.sup ? <sup className="formula-sup">{token.sup}</sup> : null}
    </span>
  );
}

export function FormulaMath({
  formula,
  className = '',
}: {
  formula: string;
  className?: string;
}) {
  const tokens = useMemo(() => tokenizeFormula(formula), [formula]);

  return (
    <div
      className={[
        'formula-math inline-block max-w-full',
        'bg-[var(--px-surface)] px-3.5 py-2.5 rounded-[12px]',
        'border border-[var(--px-border)] shadow-[var(--px-shadow)]',
        className,
      ].join(' ')}
    >
      <span
        className="formula-math__expr font-display text-[1.05rem] sm:text-[1.125rem] font-semibold text-[var(--px-primary)] tracking-tight leading-[1.65] whitespace-pre-wrap break-words"
        aria-label={formula}
      >
        {tokens.map((t, idx) => (
          <React.Fragment key={idx}>
            <TokenView token={t} />
          </React.Fragment>
        ))}
      </span>
    </div>
  );
}

export { tokenizeFormula } from '../lib/formulaTokens';
