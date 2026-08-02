import React, { useMemo, useState } from 'react';
import { Sparkles, Zap } from 'lucide-react';
import type { MockScope, SubjectName } from '../types';
import type { ChapterQuestionCount, SubjectQuestionCount } from '../lib/questionsApi';
import {
  CEE_UNIT_BLUEPRINT,
  subjectQuota,
  unitsForSubject,
} from '../lib/ceeBlueprint';

const SUBJECTS: SubjectName[] = ['Physics', 'Chemistry', 'Zoology', 'Botany', 'MAT'];

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
  const [subject, setSubject] = useState<SubjectName>('Physics');
  const [chapter, setChapter] = useState('');

  const inventory = useMemo(() => {
    const map = new Map(questionStats.map((s) => [s.subject, s.count]));
    return SUBJECTS.map((s) => ({ subject: s, count: map.get(s) || 0 }));
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

  const handleStart = () => {
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
      alert('Choose a unit/chapter first.');
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

  return (
    <div className="bg-white rounded-2xl border border-violet-200 shadow-xs p-6 space-y-4">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-violet-100 text-violet-700">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <h2 className="font-bold text-slate-900 text-base">
            {scope === 'full'
              ? 'Generate Dynamic Full Mock'
              : scope === 'subject'
                ? 'Generate Subject-wise Mock'
                : 'Generate Chapter-wise Mock'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Uses the official CEE unit blueprint
            {scope === 'full'
              ? ' (200 Qs by subject/unit).'
              : scope === 'subject'
                ? ` (${subjectQuota(subject)} Qs across ${subject} units).`
                : ' for the selected unit.'}{' '}
            Short units are filled from available bank questions in that subject.
          </p>
        </div>
      </div>

      {(scope === 'subject' || scope === 'chapter') && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <label className="space-y-1">
            <span className="font-bold text-slate-700">Subject</span>
            <select
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value as SubjectName);
                setChapter('');
              }}
              className="w-full p-2 border border-slate-300 rounded-lg bg-white"
            >
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>
                  {s} ({subjectQuota(s)} Qs)
                </option>
              ))}
            </select>
          </label>

          {scope === 'chapter' && (
            <label className="space-y-1">
              <span className="font-bold text-slate-700">Unit / Chapter</span>
              <select
                value={chapter}
                onChange={(e) => setChapter(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="">Select unit…</option>
                {blueprintUnits.map((u) => (
                  <option key={u.chapter} value={u.chapter}>
                    {u.chapter} ({u.count})
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      )}

      {scope === 'full' && (
        <div className="max-h-40 overflow-y-auto text-[11px] border border-slate-100 rounded-xl">
          <table className="w-full text-left">
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

      <div className="text-xs bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-slate-600">
        Target <span className="font-mono font-bold text-slate-900">{availableSummary.target}</span>
        {' · '}
        Available in bank{' '}
        <span className="font-mono font-bold text-slate-900">{availableSummary.available}</span>
        {availableSummary.available < availableSummary.target && availableSummary.available > 0 && (
          <span className="text-amber-700"> — will use all available</span>
        )}
        {availableSummary.available === 0 && (
          <span className="text-rose-600"> — no questions yet; import into the bank first</span>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
        <div className="text-[11px] text-slate-500 font-mono">
          Duration ~{durationSec >= 3600 ? `${durationSec / 3600}h` : `${durationSec / 60}m`} · 1 quota on
          start
        </div>
        <button
          type="button"
          disabled={busy || !canStart}
          onClick={handleStart}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl disabled:opacity-50 cursor-pointer"
        >
          <Zap className="w-4 h-4 fill-current" />
          {busy ? 'Building paper…' : 'Generate & Start'}
        </button>
      </div>
    </div>
  );
};
