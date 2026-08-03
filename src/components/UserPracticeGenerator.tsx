import React, { useMemo, useState } from 'react';
import { Atom, BookOpen, FlaskConical, Leaf, Shuffle, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { MockScope, SubjectName } from '../types';
import type { ChapterQuestionCount, SubjectQuestionCount } from '../lib/questionsApi';
import {
  CEE_UNIT_BLUEPRINT,
  subjectQuota,
  unitsForSubject,
} from '../lib/ceeBlueprint';
import { useFeedback } from './FeedbackProvider';
import { AppIcon } from './ui';
const SUBJECTS: SubjectName[] = ['Physics', 'Chemistry', 'Zoology', 'Botany', 'MAT', 'Mixed'];

const SUBJECT_META: Record<
  SubjectName,
  { icon: LucideIcon; accent: string; selected: string; ring: string }
> = {
  Physics: {
    icon: Atom,
    accent: 'text-sky-700 bg-sky-50 border-sky-200 hover:border-sky-400',
    selected: 'bg-sky-600 text-white border-sky-600 shadow-sm shadow-sky-200',
    ring: 'ring-sky-300',
  },
  Chemistry: {
    icon: FlaskConical,
    accent: 'text-amber-800 bg-amber-50 border-amber-200 hover:border-amber-400',
    selected: 'bg-amber-600 text-white border-amber-600 shadow-sm shadow-amber-200',
    ring: 'ring-amber-300',
  },
  Zoology: {
    icon: BookOpen,
    accent: 'text-rose-800 bg-rose-50 border-rose-200 hover:border-rose-400',
    selected: 'bg-rose-600 text-white border-rose-600 shadow-sm shadow-rose-200',
    ring: 'ring-rose-300',
  },
  Botany: {
    icon: Leaf,
    accent: 'text-emerald-800 bg-emerald-50 border-emerald-200 hover:border-emerald-400',
    selected: 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-200',
    ring: 'ring-emerald-300',
  },
  MAT: {
    icon: Zap,
    accent: 'text-slate-700 bg-slate-50 border-slate-200 hover:border-slate-400',
    selected: 'bg-slate-800 text-white border-slate-800 shadow-sm shadow-slate-300',
    ring: 'ring-slate-300',
  },
  Mixed: {
    icon: Shuffle,
    accent: 'text-violet-800 bg-violet-50 border-violet-200 hover:border-violet-400',
    selected: 'bg-violet-700 text-white border-violet-700 shadow-sm shadow-violet-200',
    ring: 'ring-violet-300',
  },
};

export interface PracticeGeneratePayload {
  title?: string;
  scope: MockScope;
  subject?: string;
  chapterName?: string;
  durationSec?: number;
  questionsPerPage?: number;
}

interface UserPracticeGeneratorProps {
  scope: MockScope;
  questionStats: SubjectQuestionCount[];
  chapterStats: ChapterQuestionCount[];
  busy?: boolean;
  onGenerate: (payload: PracticeGeneratePayload) => void;
}

export const UserPracticeGenerator: React.FC<UserPracticeGeneratorProps> = ({
  scope,
  questionStats,
  chapterStats,
  busy,
  onGenerate,
}) => {
  const feedback = useFeedback();
  const [subject, setSubject] = useState<SubjectName>('Physics');
  const [chapter, setChapter] = useState('');

  const inventory = useMemo(() => {
    const map = new Map(questionStats.map((s) => [s.subject, s.count]));
    return SUBJECTS.map((s) => ({ subject: s, count: map.get(s) || 0 }));
  }, [questionStats]);

  const bankBySubject = useMemo(() => {
    const map = new Map(questionStats.map((s) => [s.subject, s.count]));
    return map;
  }, [questionStats]);

  const blueprintUnits = useMemo(() => unitsForSubject(subject), [subject]);

  const durationSec = scope === 'full' ? 10800 : scope === 'subject' ? 3600 : 1800;

  const availableSummary = useMemo(() => {
    if (scope === 'full') {
      return {
        target: 200,
        available: inventory.reduce((s, r) => s + r.count, 0),
      };
    }
    if (scope === 'subject') {
      return {
        target: subjectQuota(subject),
        available: inventory.find((x) => x.subject === subject)?.count || 0,
      };
    }
    const unit = blueprintUnits.find((u) => u.chapter === chapter);
    const bankCount =
      chapterStats.find(
        (c) =>
          c.subject === subject && c.chapter.toLowerCase() === chapter.trim().toLowerCase()
      )?.count || 0;
    return { target: unit?.count ?? 25, available: bankCount };
  }, [scope, inventory, subject, chapter, blueprintUnits, chapterStats]);

  const handleStart = async () => {
    if (scope === 'full') {
      onGenerate({
        title: 'My Dynamic Full CEE Mock',
        scope: 'full',
        subject: 'Combined',
        durationSec,
        questionsPerPage: 20,
      });
      return;
    }
    if (scope === 'subject') {
      onGenerate({
        title: `My ${subject} Subject Mock`,
        scope: 'subject',
        subject,
        durationSec,
        questionsPerPage: 10,
      });
      return;
    }
    const chapterName = chapter.trim();
    if (!chapterName) {
      await feedback.alert({
        variant: 'warning',
        title: 'Choose a chapter',
        message: 'Select a unit/chapter before generating a chapter mock.',
      });
      return;
    }
    onGenerate({
      title: `My ${subject} · ${chapterName} Chapter Mock`,
      scope: 'chapter',
      subject,
      chapterName,
      durationSec,
      questionsPerPage: 10,
    });
  };

  const canStart =
    availableSummary.available > 0 &&
    (scope !== 'chapter' || Boolean(chapter.trim()));

  const selectSubject = (next: SubjectName) => {
    setSubject(next);
    setChapter('');
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-100">
          <AppIcon icon={Shuffle} size="btn" />
        </div>
        <div>
          <h2 className="font-bold text-slate-900 text-base">
            {scope === 'full'
              ? 'Generate Dynamic Full Mock'
              : scope === 'subject'
                ? 'Generate Subject-wise Mock'
                : 'Generate Chapter-wise Mock'}
          </h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Follows the official CEE unit blueprint
            {scope === 'full'
              ? ' (200 questions by subject and unit).'
              : scope === 'subject'
                ? ` (${subjectQuota(subject)} questions across ${subject} units).`
                : ' for the selected unit.'}{' '}
            If a unit has fewer questions than needed, we fill from other questions in that subject.
          </p>
        </div>
      </div>

      {(scope === 'subject' || scope === 'chapter') && (
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-700">Subject</span>
              <span className="text-[10px] font-mono text-slate-400">
                Select a subject · question count shown
              </span>
            </div>
            <div
              role="radiogroup"
              aria-label="Select subject"
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2"
            >
              {SUBJECTS.map((s) => {
                const meta = SUBJECT_META[s];
                const Icon = meta.icon;
                const selected = subject === s;
                const bank = bankBySubject.get(s) || 0;
                const quota = subjectQuota(s);
                const empty = bank === 0;
                return (
                  <button
                    key={s}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => selectSubject(s)}
                    className={`group relative text-left rounded-xl border px-3 py-3 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 ${meta.ring} ${
                      selected ? meta.selected : meta.accent
                    } ${empty && !selected ? 'opacity-70' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${
                          selected ? 'bg-white/20' : 'bg-white/80 border border-black/5'
                        }`}
                      >
                        <AppIcon icon={Icon} size="btn" />
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate">{s}</div>
                        <div
                          className={`text-[10px] font-mono ${
                            selected ? 'text-white/85' : 'text-slate-500'
                          }`}
                        >
                          {quota} Qs
                        </div>
                      </div>
                    </div>
                    <div
                      className={`mt-2 text-[10px] font-semibold ${
                        selected
                          ? empty
                            ? 'text-white/90'
                            : 'text-white/80'
                          : empty
                            ? 'text-rose-600'
                            : 'text-slate-500'
                      }`}
                    >
                      {empty ? 'No questions yet' : `${bank} available`}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {scope === 'chapter' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-700">Unit / Chapter</span>
                <span className="text-[10px] font-mono text-slate-400">
                  {blueprintUnits.length} units in {subject}
                </span>
              </div>
              <div
                role="listbox"
                aria-label="Select chapter"
                className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1"
              >
                {blueprintUnits.map((u) => {
                  const selected = chapter === u.chapter;
                  const bankCount =
                    chapterStats.find(
                      (c) =>
                        c.subject === subject &&
                        c.chapter.toLowerCase() === u.chapter.toLowerCase()
                    )?.count || 0;
                  return (
                    <button
                      key={u.chapter}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => setChapter(u.chapter)}
                      className={`text-left rounded-xl border px-3 py-2.5 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 ${
                        selected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-slate-50 text-slate-800 border-slate-200 hover:border-blue-300 hover:bg-white'
                      }`}
                    >
                      <div className="text-xs font-bold leading-snug">{u.chapter}</div>
                      <div
                        className={`mt-1 text-[10px] font-mono ${
                          selected ? 'text-white/85' : 'text-slate-500'
                        }`}
                      >
                        Target {u.count} · Available {bankCount}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {scope === 'full' && (
        <div className="scroll-x-safe max-h-40 overflow-y-auto text-[11px] border border-slate-100 rounded-xl">
          <table className="w-full text-left min-w-[240px]">
            <thead className="bg-slate-50 sticky top-0 text-slate-500 font-mono uppercase text-[10px]">
              <tr>
                <th className="px-3 py-2">Subject / Unit</th>
                <th className="px-3 py-2 text-right">Qs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {CEE_UNIT_BLUEPRINT.map((u) => (
                <tr key={`${u.subject}-${u.chapter}`}>
                  <td className="px-3 py-1.5 text-slate-700">
                    {u.subject} → {u.chapter}
                  </td>
                  <td className="px-3 py-1.5 text-right font-mono font-bold text-slate-900">
                    {u.count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="text-xs bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 text-slate-600">
        Target <span className="font-mono font-bold text-slate-900">{availableSummary.target}</span>
        {' · '}
        Available{' '}
        <span className="font-mono font-bold text-slate-900">{availableSummary.available}</span>
        {availableSummary.available < availableSummary.target && availableSummary.available > 0 && (
          <span className="text-amber-700"> — will use all available questions</span>
        )}
        {availableSummary.available === 0 && (
          <span className="text-rose-600">
            {' '}
            — no questions for this selection yet. Try another subject or check back later.
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
        <div className="text-[11px] text-slate-500 font-mono">
          Duration ~{durationSec >= 3600 ? `${durationSec / 3600}h` : `${durationSec / 60}m`} · uses 1
          attempt when you start
        </div>
        <button
          type="button"
          disabled={busy || !canStart}
          onClick={handleStart}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl disabled:opacity-50 cursor-pointer shadow-xs transition-colors"
        >
          <AppIcon icon={Zap} size="btn" />
          {busy ? 'Preparing your test…' : 'Generate & Start'}
        </button>
      </div>
    </div>
  );
};
