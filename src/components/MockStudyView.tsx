import React, { useMemo, useState } from 'react';
import { ArrowLeft, BookOpen, CheckCircle2, Search } from 'lucide-react';
import type { MockTest, Question, SubjectName } from '../types';
import { AppIcon } from './ui';

const SUBJECTS: Array<'All' | SubjectName> = [
  'All',
  'Physics',
  'Chemistry',
  'Zoology',
  'Botany',
  'MAT',
  'Mixed',
];

interface MockStudyViewProps {
  mockTest: MockTest;
  onExit: () => void;
  onGiveMockTest?: () => void;
}

export const MockStudyView: React.FC<MockStudyViewProps> = ({
  mockTest,
  onExit,
  onGiveMockTest,
}) => {
  const [selectedSubject, setSelectedSubject] = useState<'All' | SubjectName>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSolutions, setExpandedSolutions] = useState<Record<string, boolean>>({});
  const [page, setPage] = useState(0);

  const questions = mockTest.questions || [];
  const perPage = Math.max(5, mockTest.questionsPerPage || 20);

  const filtered = useMemo(() => {
    return questions.filter((q) => {
      if (selectedSubject !== 'All' && q.subject !== selectedSubject) return false;
      if (searchQuery) {
        const needle = searchQuery.toLowerCase();
        return (
          q.stem.toLowerCase().includes(needle) ||
          q.chapter.toLowerCase().includes(needle) ||
          q.id.toLowerCase().includes(needle)
        );
      }
      return true;
    });
  }, [questions, searchQuery, selectedSubject]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage = Math.min(page, totalPages - 1);
  const pageItems = filtered.slice(safePage * perPage, safePage * perPage + perPage);

  const renderQuestion = (q: Question, index: number) => {
    const absoluteIndex = safePage * perPage + index + 1;
    return (
      <article
        key={q.id}
        className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3"
      >
        <div className="flex items-center justify-between gap-2 text-xs border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <span className="font-mono text-[10px] font-bold text-slate-500">Q{absoluteIndex}</span>
            <span className="font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md font-mono text-[10px] uppercase">
              {q.subject}
            </span>
            <span className="text-slate-500 font-semibold truncate">{q.chapter}</span>
          </div>
          {q.correctOptionKey ? (
            <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg shrink-0">
              Key {q.correctOptionKey}
            </span>
          ) : null}
        </div>

        <p className="text-sm font-bold text-slate-900 leading-relaxed">{q.stem}</p>

        {q.imageUrl ? (
          <img
            src={q.imageUrl}
            alt="Question figure"
            className="max-h-56 w-auto rounded-xl border border-slate-200 object-contain bg-white"
            loading="lazy"
          />
        ) : null}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-medium pt-1">
          {(['A', 'B', 'C', 'D'] as const).map((key) => {
            const value = q.options[key];
            const isCorrect = q.correctOptionKey != null && key === q.correctOptionKey;
            const optionImage = q.optionImages?.[key];
            return (
              <div
                key={key}
                className={`p-2.5 rounded-xl border flex items-start justify-between gap-2 ${
                  isCorrect
                    ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900 font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <span className="flex items-start gap-2 min-w-0">
                  <span
                    className={`w-5 h-5 rounded-md flex items-center justify-center font-mono text-[10px] font-bold shrink-0 ${
                      isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {key}
                  </span>
                  <span className="space-y-1.5">
                    <span className="block">{value}</span>
                    {optionImage ? (
                      <img
                        src={optionImage}
                        alt={`Option ${key}`}
                        className="max-h-24 rounded-lg border border-slate-200 bg-white object-contain"
                        loading="lazy"
                      />
                    ) : null}
                  </span>
                </span>
                {isCorrect ? (
                  <AppIcon icon={CheckCircle2} size="btn" className="text-emerald-600 shrink-0" />
                ) : null}
              </div>
            );
          })}
        </div>

        {q.explanation ? (
          <div>
            <button
              type="button"
              onClick={() =>
                setExpandedSolutions((prev) => ({ ...prev, [q.id]: !prev[q.id] }))
              }
              className="text-[11px] font-bold text-[#2563EB] hover:underline cursor-pointer"
            >
              {expandedSolutions[q.id] ? 'Hide explanation' : 'Show explanation'}
            </button>
            {expandedSolutions[q.id] ? (
              <p className="mt-2 text-xs text-slate-600 leading-relaxed bg-slate-50 border border-slate-100 rounded-xl p-3">
                {q.explanation}
              </p>
            ) : null}
          </div>
        ) : null}
      </article>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="space-y-2 min-w-0">
          <button
            type="button"
            onClick={onExit}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            <AppIcon icon={ArrowLeft} size="btn" />
            Back to catalog
          </button>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <AppIcon icon={BookOpen} size="lg" className="text-emerald-600 shrink-0" />
            <span className="truncate">Study · {mockTest.title}</span>
          </h1>
          <p className="text-xs text-slate-500">
            Browse questions with correct answers shown. No timer, no answering, no score — this does
            not use a mock attempt.
          </p>
        </div>
        <div className="flex flex-col sm:items-end gap-2 shrink-0">
          <span className="text-xs font-mono font-bold bg-emerald-100 text-emerald-900 px-3 py-1 rounded-full">
            {filtered.length} / {questions.length} shown
          </span>
          {onGiveMockTest ? (
            <button
              type="button"
              onClick={onGiveMockTest}
              className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
            >
              Give Mock test instead
            </button>
          ) : null}
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
          {SUBJECTS.map((sub) => (
            <button
              key={sub}
              type="button"
              onClick={() => {
                setSelectedSubject(sub);
                setPage(0);
              }}
              className={`px-3 py-2 min-h-10 rounded-xl transition-all cursor-pointer ${
                selectedSubject === sub
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:max-w-sm">
          <AppIcon
            icon={Search}
            size="btn"
            className="text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          />
          <input
            type="search"
            placeholder="Search stem or chapter…"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(0);
            }}
            className="w-full pl-9 pr-3 py-2.5 min-h-11 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-[#2563EB]"
            aria-label="Search study questions"
          />
        </div>
      </div>

      {pageItems.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-10 text-center text-sm text-slate-500">
          No questions match this filter.
        </div>
      ) : (
        <div className="space-y-4">{pageItems.map(renderQuestion)}</div>
      )}

      {filtered.length > perPage ? (
        <div className="flex items-center justify-between gap-3 pb-8">
          <button
            type="button"
            disabled={safePage <= 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 disabled:opacity-40 cursor-pointer"
          >
            Previous
          </button>
          <span className="text-xs font-mono text-slate-500">
            Page {safePage + 1} / {totalPages}
          </span>
          <button
            type="button"
            disabled={safePage >= totalPages - 1}
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 disabled:opacity-40 cursor-pointer"
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
};
