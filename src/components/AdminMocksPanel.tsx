import React, { useMemo, useRef, useState } from 'react';
import { FileCode, Plus, Trash2, Upload, RotateCcw } from 'lucide-react';
import type { MockAllocation, MockScope, MockTest, SubjectName } from '../types';
import type { ChapterQuestionCount, SubjectQuestionCount } from '../lib/questionsApi';
import type { MockImportBatch } from '../lib/mocksApi';
import { useFeedback } from './FeedbackProvider';
import { AppIcon } from './ui';
const SUBJECTS: SubjectName[] = ['Physics', 'Chemistry', 'Zoology', 'Botany', 'MAT'];

const MOCK_IMPORT_PLACEHOLDER = `[
  {
    "title": "CEE Grand Mock #1",
    "scope": "full",
    "durationSec": 10800,
    "questionsPerPage": 20,
    "correctMarks": 1,
    "wrongMarks": -0.25,
    "questions": [
      {
        "subject": "Physics",
        "chapter": "Electrostatics",
        "question": "Sample stem?",
        "options": { "A": "1", "B": "2", "C": "3", "D": "4" },
        "correctAnswer": "A"
      }
    ]
  }
]`;

interface AdminMocksPanelProps {
  mockTests: MockTest[];
  mockBatches: MockImportBatch[];
  mocksLoading?: boolean;
  mocksError?: string | null;
  questionStats: SubjectQuestionCount[];
  chapterStats: ChapterQuestionCount[];
  canEdit: boolean;
  onImportFixedMocks: (
    jsonStr: string,
    meta?: { filename?: string | null; label?: string | null }
  ) => Promise<{
    successCount: number;
    errors: string[];
    batchId: string | null;
    batch?: MockImportBatch | null;
  }>;
  onCreateDynamicMock: (payload: {
    title: string;
    scope: MockScope;
    subject?: string;
    chapterName?: string;
    durationSec?: number;
    questionsPerPage?: number;
    allocation?: MockAllocation;
    isPublished?: boolean;
  }) => Promise<void>;
  onUpdateMock: (id: string, patch: Record<string, unknown>) => Promise<void>;
  onDeleteMock: (id: string) => Promise<void>;
  onDeleteMockBatch: (batchId: string) => Promise<void>;
}

export const AdminMocksPanel: React.FC<AdminMocksPanelProps> = ({
  mockTests,
  mockBatches,
  mocksLoading,
  mocksError,
  questionStats,
  chapterStats,
  canEdit,
  onImportFixedMocks,
  onCreateDynamicMock,
  onUpdateMock,
  onDeleteMock,
  onDeleteMockBatch,
}) => {
  const feedback = useFeedback();
  const fileRef = useRef<HTMLInputElement>(null);
  const [jsonText, setJsonText] = useState('');
  const [importBusy, setImportBusy] = useState(false);
  const [importFileName, setImportFileName] = useState<string | null>(null);
  const [importFileError, setImportFileError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{
    successCount: number;
    errors: string[];
    batchId: string | null;
  } | null>(null);

  const [dynTitle, setDynTitle] = useState('CEE Dynamic Full Mock');
  const [dynScope, setDynScope] = useState<MockScope>('full');
  const [dynSubject, setDynSubject] = useState<SubjectName>('Physics');
  const [dynChapter, setDynChapter] = useState('');
  const [dynDuration, setDynDuration] = useState(10800);
  const [subjectCounts, setSubjectCounts] = useState<Record<SubjectName, number>>({
    Physics: 50,
    Chemistry: 50,
    Zoology: 40,
    Botany: 40,
    MAT: 20,
  });
  const [chapterRuleSubject, setChapterRuleSubject] = useState<SubjectName>('Physics');
  const [chapterRuleName, setChapterRuleName] = useState('');
  const [chapterRuleCount, setChapterRuleCount] = useState(5);
  const [chapterRules, setChapterRules] = useState<
    { subject: SubjectName; chapter: string; count: number }[]
  >([]);
  const [createBusy, setCreateBusy] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const inventoryBySubject = useMemo(() => {
    const map = new Map(questionStats.map((s) => [s.subject, s.count]));
    return SUBJECTS.map((s) => ({ subject: s, count: map.get(s) || 0 }));
  }, [questionStats]);

  const runImport = async (text: string, filename?: string | null) => {
    setImportBusy(true);
    setImportFileError(null);
    try {
      const result = await onImportFixedMocks(text, { filename: filename || null });
      setImportResult({
        successCount: result.successCount,
        errors: result.errors,
        batchId: result.batchId,
      });
    } finally {
      setImportBusy(false);
    }
  };

  const handleFile = async (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      setImportFileError('File is too large (max 2 MB).');
      return;
    }
    setImportFileName(file.name);
    const text = await file.text();
    setJsonText(text);
    await runImport(text, file.name);
  };

  const handleCreateDynamic = async () => {
    setCreateBusy(true);
    setCreateError(null);
    try {
      let allocation: MockAllocation;
      if (dynScope === 'full') {
        allocation = { subjects: { ...subjectCounts }, chapters: [...chapterRules] };
      } else if (dynScope === 'subject') {
        allocation = {
          subjects: { [dynSubject]: subjectCounts[dynSubject] || 25 },
          chapters: chapterRules.filter((r) => r.subject === dynSubject),
        };
      } else {
        const count = chapterRuleCount || 25;
        allocation = {
          subjects: { [dynSubject]: count },
          chapters: [
            {
              subject: dynSubject,
              chapter: dynChapter.trim() || 'General',
              count,
            },
          ],
        };
      }
      await onCreateDynamicMock({
        title: dynTitle.trim() || 'Dynamic Mock',
        scope: dynScope,
        subject: dynScope === 'full' ? 'Combined' : dynSubject,
        chapterName: dynScope === 'chapter' ? dynChapter.trim() || undefined : undefined,
        durationSec: dynDuration,
        questionsPerPage: dynScope === 'full' ? 20 : 10,
        allocation,
        isPublished: true,
      });
    } catch (err: any) {
      setCreateError(err?.message || 'Failed to create dynamic mock');
    } finally {
      setCreateBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {mocksError && (
        <div className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-3">
          {mocksError}
        </div>
      )}

      {/* List */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-900 text-base pb-2 border-b border-slate-100 flex items-center justify-between">
          <span>Published & draft mocks ({mockTests.length})</span>
          {mocksLoading && <span className="text-[10px] text-slate-400 font-mono">Loading…</span>}
        </h3>
        {mockTests.length === 0 ? (
          <p className="text-xs text-slate-500">No mocks yet. Import a Fixed batch or create a Dynamic blueprint below.</p>
        ) : (
          <div className="overflow-x-auto scroll-x-safe">
            <table className="w-full text-left text-xs border-collapse min-w-[640px]">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-mono uppercase text-[10px] border-b border-slate-200">
                  <th className="p-3">Title</th>
                  <th className="p-3">Mode</th>
                  <th className="p-3">Scope</th>
                  <th className="p-3">Qs</th>
                  <th className="p-3">Published</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mockTests.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="p-3 font-semibold text-slate-800">{m.title}</td>
                    <td className="p-3 font-mono uppercase">{m.mode || 'fixed'}</td>
                    <td className="p-3">
                      {m.scope || 'full'}
                      {m.subject ? ` · ${m.subject}` : ''}
                    </td>
                    <td className="p-3 font-mono">{m.totalQuestions}</td>
                    <td className="p-3">{m.isPublished ? 'Yes' : 'No'}</td>
                    <td className="p-3 text-right space-x-2">
                      {canEdit && (
                        <>
                          <button
                            type="button"
                            className="text-[11px] font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                            onClick={() =>
                              void onUpdateMock(m.id, { isPublished: !m.isPublished })
                            }
                          >
                            {m.isPublished ? 'Unpublish' : 'Publish'}
                          </button>
                          <button
                            type="button"
                            className="text-[11px] font-bold text-rose-600 hover:text-rose-800 cursor-pointer"
                            onClick={async () => {
                              const ok = await feedback.confirm({
                                title: 'Delete mock?',
                                message: `Delete “${m.title}”? This cannot be undone.`,
                                confirmLabel: 'Delete',
                                destructive: true,
                              });
                              if (ok) void onDeleteMock(m.id);
                            }}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {mockBatches.length > 0 && (
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Fixed import batches</h4>
            {mockBatches.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between gap-3 text-xs bg-slate-50 border border-slate-100 rounded-xl px-3 py-2"
              >
                <div>
                  <div className="font-semibold text-slate-800">{b.label}</div>
                  <div className="text-slate-500 font-mono text-[10px]">
                    {b.mockCount} mocks · {b.importedByName} · {new Date(b.createdAt).toLocaleString()}
                  </div>
                </div>
                {canEdit && (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-rose-600 font-bold cursor-pointer"
                    onClick={async () => {
                      const ok = await feedback.confirm({
                        title: 'Undo import batch?',
                        message: `Undo “${b.label}” and delete its mocks?`,
                        confirmLabel: 'Undo import',
                        destructive: true,
                      });
                      if (ok) void onDeleteMockBatch(b.id);
                    }}
                  >
                    <AppIcon icon={RotateCcw} size="btn" />
                    Undo
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fixed import */}
      {canEdit && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-base pb-2 border-b border-slate-100 flex items-center gap-2">
            <AppIcon icon={Upload} size="btn" className="text-blue-600" />
            Import Fixed Mock Tests (batch JSON)
          </h3>
          <p className="text-xs text-slate-500">
            Array of mocks with embedded questions. Questions are upserted into the bank; paper order is frozen.
          </p>
          <div
            className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center text-xs text-slate-500 cursor-pointer hover:border-blue-300"
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files?.[0];
              if (file) void handleFile(file);
            }}
          >
            Drag & drop or browse. Max 2 MB.
            {importFileName && <div className="mt-2 font-mono text-slate-700">{importFileName}</div>}
            {importFileError && <div className="mt-2 text-rose-600 font-semibold">{importFileError}</div>}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            placeholder={MOCK_IMPORT_PLACEHOLDER}
            className="w-full h-40 font-mono text-[11px] p-3 border border-slate-200 rounded-xl bg-slate-50"
          />
          <button
            type="button"
            disabled={importBusy || !jsonText.trim()}
            onClick={() => void runImport(jsonText)}
            className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl disabled:opacity-50 cursor-pointer"
          >
            {importBusy ? 'Importing…' : 'Validate & Import Fixed Mocks'}
          </button>
          {importResult && (
            <div className="text-xs space-y-1 bg-slate-50 border border-slate-100 rounded-xl p-3">
              <div className="font-bold text-emerald-700">Imported {importResult.successCount} mock(s)</div>
              {importResult.errors.map((err, i) => (
                <div key={i} className="text-rose-600">{err}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Dynamic create */}
      {canEdit && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-base pb-2 border-b border-slate-100 flex items-center gap-2">
            <AppIcon icon={Plus} size="btn" className="text-violet-600" />
            Optional: Create Dynamic Blueprint (admin)
          </h3>
          <p className="text-xs text-slate-500">
            Students generate Dynamic / Subject / Chapter mocks themselves in Mock Tests. Use this only if you need a shared published blueprint.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <label className="space-y-1 sm:col-span-2">
              <span className="font-bold text-slate-700">Title</span>
              <input
                value={dynTitle}
                onChange={(e) => setDynTitle(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg"
              />
            </label>
            <label className="space-y-1">
              <span className="font-bold text-slate-700">Scope</span>
              <select
                value={dynScope}
                onChange={(e) => setDynScope(e.target.value as MockScope)}
                className="w-full p-2 border border-slate-300 rounded-lg"
              >
                <option value="full">Full</option>
                <option value="subject">Subject-wise</option>
                <option value="chapter">Chapter-wise</option>
              </select>
            </label>
            <label className="space-y-1">
              <span className="font-bold text-slate-700">Duration (sec)</span>
              <input
                type="number"
                value={dynDuration}
                onChange={(e) => setDynDuration(Number(e.target.value) || 1800)}
                className="w-full p-2 border border-slate-300 rounded-lg"
              />
            </label>
            {dynScope !== 'full' && (
              <label className="space-y-1">
                <span className="font-bold text-slate-700">Subject</span>
                <select
                  value={dynSubject}
                  onChange={(e) => setDynSubject(e.target.value as SubjectName)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                >
                  {SUBJECTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {dynScope === 'chapter' && (
              <label className="space-y-1">
                <span className="font-bold text-slate-700">Chapter</span>
                <input
                  value={dynChapter}
                  onChange={(e) => setDynChapter(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                  placeholder="e.g. Electrostatics"
                />
              </label>
            )}
          </div>

          {(dynScope === 'full' || dynScope === 'subject') && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700">Subject allocation vs bank inventory</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {(dynScope === 'full' ? SUBJECTS : [dynSubject]).map((s) => {
                  const available = inventoryBySubject.find((x) => x.subject === s)?.count || 0;
                  const needed = subjectCounts[s] || 0;
                  const short = needed > available;
                  return (
                    <label
                      key={s}
                      className={`text-xs p-2 rounded-xl border ${short ? 'border-rose-300 bg-rose-50' : 'border-slate-200 bg-slate-50'}`}
                    >
                      <div className="flex justify-between font-bold text-slate-800 mb-1">
                        <span>{s}</span>
                        <span className="font-mono text-[10px] text-slate-500">bank {available}</span>
                      </div>
                      <input
                        type="number"
                        min={0}
                        value={subjectCounts[s]}
                        onChange={(e) =>
                          setSubjectCounts((prev) => ({
                            ...prev,
                            [s]: Math.max(0, Math.floor(Number(e.target.value) || 0)),
                          }))
                        }
                        className="w-full p-1.5 border border-slate-300 rounded-lg"
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {dynScope === 'chapter' && (
            <label className="text-xs space-y-1 block">
              <span className="font-bold text-slate-700">Questions from chapter</span>
              <input
                type="number"
                min={1}
                value={chapterRuleCount}
                onChange={(e) => setChapterRuleCount(Math.max(1, Number(e.target.value) || 1))}
                className="w-full p-2 border border-slate-300 rounded-lg"
              />
            </label>
          )}

          {dynScope === 'full' && (
            <div className="space-y-2 border-t border-slate-100 pt-3">
              <h4 className="text-xs font-bold text-slate-700">Optional chapter rules (count against subject quota)</h4>
              <div className="flex flex-wrap gap-2 items-end text-xs">
                <select
                  value={chapterRuleSubject}
                  onChange={(e) => setChapterRuleSubject(e.target.value as SubjectName)}
                  className="p-2 border border-slate-300 rounded-lg"
                >
                  {SUBJECTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <input
                  value={chapterRuleName}
                  onChange={(e) => setChapterRuleName(e.target.value)}
                  placeholder="Chapter name"
                  className="p-2 border border-slate-300 rounded-lg flex-1 min-w-[140px]"
                />
                <input
                  type="number"
                  min={1}
                  value={chapterRuleCount}
                  onChange={(e) => setChapterRuleCount(Math.max(1, Number(e.target.value) || 1))}
                  className="p-2 border border-slate-300 rounded-lg w-20"
                />
                <button
                  type="button"
                  className="px-3 py-2 bg-slate-800 text-white font-bold rounded-lg cursor-pointer"
                  onClick={() => {
                    if (!chapterRuleName.trim()) return;
                    setChapterRules((prev) => [
                      ...prev,
                      {
                        subject: chapterRuleSubject,
                        chapter: chapterRuleName.trim(),
                        count: chapterRuleCount,
                      },
                    ]);
                    setChapterRuleName('');
                  }}
                >
                  Add rule
                </button>
              </div>
              {chapterRules.length > 0 && (
                <ul className="text-[11px] space-y-1">
                  {chapterRules.map((r, i) => (
                    <li key={`${r.subject}-${r.chapter}-${i}`} className="flex justify-between gap-2">
                      <span>
                        {r.subject} / {r.chapter}: {r.count}
                        <span className="text-slate-400 ml-2">
                          (bank{' '}
                          {chapterStats.find(
                            (c) =>
                              c.subject === r.subject &&
                              c.chapter.toLowerCase() === r.chapter.toLowerCase()
                          )?.count || 0}
                          )
                        </span>
                      </span>
                      <button
                        type="button"
                        className="text-rose-600 font-bold cursor-pointer"
                        onClick={() => setChapterRules((prev) => prev.filter((_, idx) => idx !== i))}
                      >
                        <AppIcon icon={Trash2} size="btn" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {createError && (
            <div className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-2">
              {createError}
            </div>
          )}

          <button
            type="button"
            disabled={createBusy}
            onClick={() => void handleCreateDynamic()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-xs font-bold rounded-xl disabled:opacity-50 cursor-pointer"
          >
            <AppIcon icon={FileCode} size="btn" />
            {createBusy ? 'Creating…' : 'Create Dynamic Mock'}
          </button>
        </div>
      )}
    </div>
  );
};
