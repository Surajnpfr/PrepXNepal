import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, CircleHelp, Loader2, XCircle } from 'lucide-react';
import type { Question } from '../types';
import { fetchActiveDailyQuick } from '../lib/dailyQuickApi';
import { AppIcon } from './ui';
import { MathText } from './MathText';

const SUBJECT_ORDER = ['Physics', 'Chemistry', 'Botany', 'Zoology'] as const;
type OptionKey = 'A' | 'B' | 'C' | 'D';

type Props = {
  /** Landing vs home surface styling. */
  variant?: 'landing' | 'dashboard';
  className?: string;
};

/**
 * Guest + signed-in Daily Quick practice.
 * Grades in the browser only — no attempt/result is sent to the server.
 */
export const DailyQuickPractice: React.FC<Props> = ({
  variant = 'dashboard',
  className = '',
}) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSubject, setActiveSubject] = useState<string>(SUBJECT_ORDER[0]);
  const [selected, setSelected] = useState<Partial<Record<string, OptionKey>>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchActiveDailyQuick();
        if (cancelled) return;
        setQuestions(data.questions);
        const first = SUBJECT_ORDER.find((s) =>
          data.questions.some((q) => q.subject === s)
        );
        if (first) setActiveSubject(first);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Could not load Daily Quick');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const bySubject = useMemo(() => {
    const map = new Map<string, Question>();
    for (const q of questions) map.set(q.subject, q);
    return map;
  }, [questions]);

  const current = bySubject.get(activeSubject);
  const chosen = current ? selected[current.id] : undefined;
  const revealed = Boolean(chosen && current?.correctOptionKey);

  const shell =
    variant === 'landing'
      ? 'bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm'
      : 'rounded-2xl border border-[var(--px-border)] bg-[var(--px-surface)] p-4 sm:p-5';

  if (loading) {
    return (
      <div className={`${shell} ${className} flex items-center gap-2 text-sm text-slate-500`}>
        <AppIcon icon={Loader2} size="btn" className="animate-spin" />
        Loading Daily Quick…
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${shell} ${className} text-sm text-rose-600`}>{error}</div>
    );
  }

  if (questions.length === 0) {
    return null;
  }

  return (
    <section className={`${shell} ${className} space-y-4`} id="daily-quick-section">
      <div className="space-y-1">
        <p
          className={
            variant === 'landing'
              ? 'text-[10px] font-black uppercase tracking-widest text-blue-700'
              : 'text-[10px] font-black uppercase tracking-widest text-[var(--px-muted)]'
          }
        >
          Daily Quick · try 4 questions
        </p>
        <h2
          className={
            variant === 'landing'
              ? 'text-xl sm:text-2xl font-bold text-slate-900 tracking-tight'
              : 'font-display text-lg font-bold text-[var(--px-heading)]'
          }
        >
          Physics · Chemistry · Botany · Zoology
        </h2>
        <p className="text-xs sm:text-sm text-slate-500">
          Pick an answer to see if you are correct. Nothing is saved — practice freely.
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 snap-x">
        {SUBJECT_ORDER.map((subject) => {
          const available = bySubject.has(subject);
          const isActive = activeSubject === subject;
          return (
            <button
              key={subject}
              type="button"
              disabled={!available}
              onClick={() => available && setActiveSubject(subject)}
              className={`snap-start shrink-0 min-h-10 px-3.5 rounded-xl text-xs font-bold border transition-colors ${
                isActive
                  ? 'bg-slate-900 text-white border-slate-900'
                  : available
                    ? 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                    : 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
              }`}
            >
              {subject}
            </button>
          );
        })}
      </div>

      {current ? (
        <div className="space-y-3">
          <p className="text-sm sm:text-base font-medium text-slate-900 leading-relaxed">
            <MathText text={current.stem} />
          </p>
          <div className="grid grid-cols-1 gap-2">
            {(['A', 'B', 'C', 'D'] as OptionKey[]).map((key) => {
              const text = current.options[key];
              const isChosen = chosen === key;
              const isCorrect = current.correctOptionKey === key;
              let tone =
                'border-slate-200 bg-white hover:border-slate-400 text-slate-800';
              if (revealed && isCorrect) {
                tone = 'border-emerald-500 bg-emerald-50 text-emerald-900';
              } else if (revealed && isChosen && !isCorrect) {
                tone = 'border-rose-400 bg-rose-50 text-rose-900';
              } else if (isChosen) {
                tone = 'border-blue-500 bg-blue-50 text-blue-900';
              }
              return (
                <button
                  key={key}
                  type="button"
                  disabled={revealed}
                  onClick={() =>
                    setSelected((prev) => ({ ...prev, [current.id]: key }))
                  }
                  className={`w-full min-h-12 text-left px-3.5 py-3 rounded-xl border text-sm font-medium flex gap-3 items-start transition-colors ${tone} disabled:cursor-default`}
                >
                  <span className="font-black shrink-0 w-5">{key}.</span>
                  <span className="flex-1 leading-snug"><MathText text={text} /></span>
                  {revealed && isCorrect ? (
                    <AppIcon icon={CheckCircle2} size="btn" className="text-emerald-600 shrink-0" />
                  ) : null}
                  {revealed && isChosen && !isCorrect ? (
                    <AppIcon icon={XCircle} size="btn" className="text-rose-500 shrink-0" />
                  ) : null}
                </button>
              );
            })}
          </div>

          {revealed && current.explanation ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                <AppIcon icon={CircleHelp} size="btn" />
                {chosen === current.correctOptionKey ? 'Correct' : 'Explanation'}
              </p>
              <p className="text-sm text-slate-700 leading-relaxed">
                <MathText text={current.explanation} />
              </p>
            </div>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-slate-500">No question for this subject yet.</p>
      )}
    </section>
  );
};
