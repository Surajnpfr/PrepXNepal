import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Download, FileCode, Pencil, Plus, Trash2, Upload, RotateCcw } from 'lucide-react';
import type { MockAllocation, MockScope, MockTest, SubjectName } from '../types';
import type { ChapterQuestionCount, SubjectQuestionCount } from '../lib/questionsApi';
import type { MockImportBatch } from '../lib/mocksApi';
import { useFeedback } from './FeedbackProvider';
import { AppIcon, Select } from './ui';
const SUBJECTS: SubjectName[] = ['Physics', 'Chemistry', 'Zoology', 'Botany', 'MAT', 'Mixed'];

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
  /** Import file / Set deletion — Admin only. */
  canDeleteFiles?: boolean;
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
  onUpdateMockBatch?: (
    batchId: string,
    patch: { label?: string; filename?: string | null }
  ) => Promise<void>;
  onExportMockSets?: (selection: {
    batchIds?: string[];
    mockIds?: string[];
  }) => Promise<{ fileCount: number }>;
}

export const AdminMocksPanel: React.FC<AdminMocksPanelProps> = ({
  mockTests,
  mockBatches,
  mocksLoading,
  mocksError,
  questionStats,
  chapterStats,
  canEdit,
  canDeleteFiles = false,
  onImportFixedMocks,
  onCreateDynamicMock,
  onUpdateMock,
  onDeleteMock,
  onDeleteMockBatch,
  onUpdateMockBatch,
  onExportMockSets,
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
    fileCount?: number;
    fileResults?: {
      filename: string;
      successCount: number;
      errors: string[];
      batchId: string | null;
    }[];
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
    Mixed: 0,
  });
  const [chapterRuleSubject, setChapterRuleSubject] = useState<SubjectName>('Physics');
  const [chapterRuleName, setChapterRuleName] = useState('');
  const [chapterRuleCount, setChapterRuleCount] = useState(5);
  const [chapterRules, setChapterRules] = useState<
    { subject: SubjectName; chapter: string; count: number }[]
  >([]);
  const [createBusy, setCreateBusy] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
  const [batchUndoBusy, setBatchUndoBusy] = useState(false);
  const [exportBusy, setExportBusy] = useState(false);
  const [renameBusyId, setRenameBusyId] = useState<string | null>(null);
  const [selectedMockIds, setSelectedMockIds] = useState<string[]>([]);

  const inventoryBySubject = useMemo(() => {
    const map = new Map(questionStats.map((s) => [s.subject, s.count]));
    return SUBJECTS.map((s) => ({ subject: s, count: map.get(s) || 0 }));
  }, [questionStats]);

  const sortedBatches = useMemo(
    () =>
      [...mockBatches].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [mockBatches]
  );

  const fixedMocks = useMemo(
    () => mockTests.filter((m) => (m.mode || 'fixed') === 'fixed'),
    [mockTests]
  );

  useEffect(() => {
    const alive = new Set(mockBatches.map((b) => b.id));
    setSelectedBatchIds((prev) => prev.filter((id) => alive.has(id)));
  }, [mockBatches]);

  useEffect(() => {
    const alive = new Set(fixedMocks.map((m) => m.id));
    setSelectedMockIds((prev) => prev.filter((id) => alive.has(id)));
  }, [fixedMocks]);

  const allBatchIds = useMemo(() => sortedBatches.map((b) => b.id), [sortedBatches]);
  const allBatchesSelected =
    allBatchIds.length > 0 && allBatchIds.every((id) => selectedBatchIds.includes(id));

  const allFixedMockIds = useMemo(() => fixedMocks.map((m) => m.id), [fixedMocks]);
  const allFixedMocksSelected =
    allFixedMockIds.length > 0 && allFixedMockIds.every((id) => selectedMockIds.includes(id));

  const toggleBatchSelected = (id: string) => {
    setSelectedBatchIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAllBatches = () => {
    setSelectedBatchIds((prev) =>
      allBatchIds.length > 0 && allBatchIds.every((id) => prev.includes(id)) ? [] : [...allBatchIds]
    );
  };

  const toggleMockSelected = (id: string) => {
    setSelectedMockIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAllFixedMocks = () => {
    setSelectedMockIds((prev) =>
      allFixedMockIds.length > 0 && allFixedMockIds.every((id) => prev.includes(id))
        ? []
        : [...allFixedMockIds]
    );
  };

  const handleExportSelected = async () => {
    if (!onExportMockSets || !canDeleteFiles) return;
    const batchIds = selectedBatchIds;
    const mockIds = selectedMockIds;
    if (batchIds.length === 0 && mockIds.length === 0) {
      await feedback.alert({
        variant: 'warning',
        title: 'Nothing selected',
        message: 'Select one or more Fixed import batches and/or Fixed mocks to export.',
      });
      return;
    }
    setExportBusy(true);
    try {
      const result = await onExportMockSets({ batchIds, mockIds });
      feedback.toast({
        variant: 'success',
        message: `Downloaded ${result.fileCount} Set JSON file(s).`,
      });
    } catch (err: any) {
      await feedback.alert({
        variant: 'error',
        title: 'Export failed',
        message: err?.message || 'Could not export Set JSON',
      });
    } finally {
      setExportBusy(false);
    }
  };

  const handleUndoSelectedBatches = async () => {
    if (!canDeleteFiles || selectedBatchIds.length === 0) return;
    const labels = sortedBatches
      .filter((b) => selectedBatchIds.includes(b.id))
      .map((b) => b.label);
    const ok = await feedback.confirm({
      title: `Delete ${selectedBatchIds.length} import file(s)?`,
      message: `Permanently delete these Fixed Set import(s). Orphan Question Bank rows from those papers are removed too:\n${labels
        .slice(0, 8)
        .map((l) => `• ${l}`)
        .join('\n')}${labels.length > 8 ? `\n(+${labels.length - 8} more)` : ''}`,
      confirmLabel: 'Delete selected',
      destructive: true,
    });
    if (!ok) return;
    setBatchUndoBusy(true);
    try {
      for (const id of selectedBatchIds) {
        await onDeleteMockBatch(id);
      }
      const n = selectedBatchIds.length;
      setSelectedBatchIds([]);
      feedback.toast({
        variant: 'success',
        message: `Deleted ${n} import file(s).`,
      });
    } catch (err: any) {
      await feedback.alert({
        variant: 'error',
        title: 'Delete failed',
        message: err?.message || 'Could not delete one or more batches',
      });
    } finally {
      setBatchUndoBusy(false);
    }
  };

  const handleUndoMostRecentBatch = async () => {
    const recent = sortedBatches[0];
    if (!recent || !canDeleteFiles) return;
    const ok = await feedback.confirm({
      title: 'Delete most recent import?',
      message: `Delete “${recent.label}” and its Fixed mock(s)? Orphan bank questions from that paper are removed too.`,
      confirmLabel: 'Delete recent',
      destructive: true,
    });
    if (!ok) return;
    setBatchUndoBusy(true);
    try {
      await onDeleteMockBatch(recent.id);
      setSelectedBatchIds((prev) => prev.filter((id) => id !== recent.id));
      feedback.toast({ variant: 'success', message: `Deleted “${recent.label}”.` });
    } catch (err: any) {
      await feedback.alert({
        variant: 'error',
        title: 'Delete failed',
        message: err?.message || 'Could not delete batch',
      });
    } finally {
      setBatchUndoBusy(false);
    }
  };

  const handleRenameMock = async (m: MockTest) => {
    if (!canEdit) return;
    const next = await feedback.prompt({
      title: 'Rename Set / mock',
      message: `Current title: ${m.title}`,
      label: 'New title',
      defaultValue: m.title,
      confirmLabel: 'Save name',
      validate: (v) => (v.trim() ? null : 'Title is required'),
    });
    if (next == null) return;
    const title = next.trim();
    if (title === m.title) return;
    setRenameBusyId(m.id);
    try {
      await onUpdateMock(m.id, { title });
      feedback.toast({ variant: 'success', message: `Renamed to “${title}”.` });
    } catch (err: any) {
      await feedback.alert({
        variant: 'error',
        title: 'Rename failed',
        message: err?.message || 'Could not rename mock',
      });
    } finally {
      setRenameBusyId(null);
    }
  };

  const toDatetimeLocalValue = (iso?: string | null) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const handleConfigureWeekly = async (m: MockTest) => {
    if (!canEdit) return;
    if ((m.mode || 'fixed') !== 'fixed' || (m.scope || 'full') !== 'full') {
      await feedback.alert({
        variant: 'error',
        title: 'Not eligible',
        message: 'Weekly open mock must be a fixed full-syllabus paper.',
      });
      return;
    }
    const opensRaw = await feedback.prompt({
      title: 'Weekly open mock — opens at',
      message: `Paper: ${m.title}\nUse local datetime (YYYY-MM-DDTHH:mm).`,
      label: 'Opens at',
      defaultValue: toDatetimeLocalValue(m.opensAt) || toDatetimeLocalValue(new Date().toISOString()),
      confirmLabel: 'Next',
      validate: (v) => (Date.parse(v.trim()) ? null : 'Enter a valid datetime'),
    });
    if (opensRaw == null) return;
    const closesDefault = m.closesAt
      ? toDatetimeLocalValue(m.closesAt)
      : toDatetimeLocalValue(new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString());
    const closesRaw = await feedback.prompt({
      title: 'Weekly open mock — closes at',
      message: `Opens: ${opensRaw.trim()}`,
      label: 'Closes at',
      defaultValue: closesDefault,
      confirmLabel: 'Save weekly',
      validate: (v) => {
        const closesMs = Date.parse(v.trim());
        const opensMs = Date.parse(opensRaw.trim());
        if (!closesMs || !opensMs) return 'Enter a valid datetime';
        if (opensMs >= closesMs) return 'closesAt must be after opensAt';
        return null;
      },
    });
    if (closesRaw == null) return;
    try {
      await onUpdateMock(m.id, {
        isWeeklyOpen: true,
        isPublished: true,
        opensAt: new Date(opensRaw.trim()).toISOString(),
        closesAt: new Date(closesRaw.trim()).toISOString(),
      });
      feedback.toast({
        variant: 'success',
        message: `“${m.title}” is this week’s open mock (one timed attempt).`,
      });
    } catch (err: any) {
      await feedback.alert({
        variant: 'error',
        title: 'Weekly setup failed',
        message: err?.message || 'Could not mark weekly mock',
      });
    }
  };

  const handleRenameBatchFile = async (b: MockImportBatch) => {
    if (!canEdit || !onUpdateMockBatch) return;
    const current = b.filename || `${b.label}.json`;
    const next = await feedback.prompt({
      title: 'Edit file name',
      message: `Import batch: ${b.label}`,
      label: 'File name',
      defaultValue: current,
      confirmLabel: 'Save',
      validate: (v) => (v.trim() ? null : 'File name is required'),
    });
    if (next == null) return;
    const filename = next.trim();
    if (filename === (b.filename || '')) return;
    setRenameBusyId(b.id);
    try {
      await onUpdateMockBatch(b.id, { filename });
      feedback.toast({
        variant: 'success',
        message: `File name updated to “${filename}”. Linked Set title and Question Bank batch are synced when they match.`,
      });
    } catch (err: any) {
      await feedback.alert({
        variant: 'error',
        title: 'Rename failed',
        message: err?.message || 'Could not update file name',
      });
    } finally {
      setRenameBusyId(null);
    }
  };

  const runImport = async (text: string, filename?: string | null) => {
    setImportBusy(true);
    setImportFileError(null);
    try {
      const result = await onImportFixedMocks(text, { filename: filename || null });
      setImportResult({
        successCount: result.successCount,
        errors: result.errors,
        batchId: result.batchId,
        fileCount: 1,
        fileResults: [
          {
            filename: filename || 'pasted.json',
            successCount: result.successCount,
            errors: result.errors,
            batchId: result.batchId,
          },
        ],
      });
    } finally {
      setImportBusy(false);
    }
  };

  const handleFiles = async (fileList: FileList | File[] | null) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList as ArrayLike<File>);
    const jsonFiles = files.filter(
      (f) => f.name.toLowerCase().endsWith('.json') || f.type === 'application/json'
    );
    if (jsonFiles.length === 0) {
      setImportFileError('Please choose one or more .json files.');
      return;
    }
    const tooBig = jsonFiles.find((f) => f.size > 10 * 1024 * 1024);
    if (tooBig) {
      setImportFileError(`“${tooBig.name}” is too large (max 10 MB per file).`);
      return;
    }

    setImportBusy(true);
    setImportFileError(null);
    setImportFileName(
      jsonFiles.length === 1
        ? jsonFiles[0].name
        : `${jsonFiles.length} files: ${jsonFiles.map((f) => f.name).join(', ')}`
    );

    let successCount = 0;
    const errors: string[] = [];
    const fileResults: {
      filename: string;
      successCount: number;
      errors: string[];
      batchId: string | null;
    }[] = [];
    let lastBatchId: string | null = null;

    try {
      // Read all files first (avoids stale File handles on multi-select / OneDrive).
      const prepared: { name: string; text: string }[] = [];
      for (const file of jsonFiles) {
        try {
          prepared.push({ name: file.name, text: await file.text() });
        } catch (err: any) {
          const msg =
            err?.message ||
            'Could not read file (re-select the files and try again, or import in smaller batches).';
          errors.push(`[${file.name}] ${msg}`);
          fileResults.push({
            filename: file.name,
            successCount: 0,
            errors: [msg],
            batchId: null,
          });
        }
      }

      for (const { name, text } of prepared) {
        try {
          JSON.parse(text);
          if (prepared.length === 1) setJsonText(text);
          const result = await onImportFixedMocks(text, {
            filename: name,
            label: name.replace(/\.json$/i, ''),
          });
          successCount += result.successCount;
          for (const err of result.errors) {
            errors.push(`[${name}] ${err}`);
          }
          fileResults.push({
            filename: name,
            successCount: result.successCount,
            errors: result.errors,
            batchId: result.batchId,
          });
          if (result.batchId) lastBatchId = result.batchId;
        } catch (err: any) {
          const msg = err?.message || 'invalid file';
          errors.push(`[${name}] ${msg}`);
          fileResults.push({
            filename: name,
            successCount: 0,
            errors: [msg],
            batchId: null,
          });
        }
      }
      setImportResult({
        successCount,
        errors,
        batchId: lastBatchId,
        fileCount: jsonFiles.length,
        fileResults,
      });
    } finally {
      setImportBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
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
        <h3 className="font-bold text-slate-900 text-base pb-2 border-b border-slate-100 flex items-center justify-between gap-2 flex-wrap">
          <span>Published & draft mocks ({mockTests.length})</span>
          <div className="flex items-center gap-2">
            {mocksLoading && <span className="text-[10px] text-slate-400 font-mono">Loading…</span>}
            {canDeleteFiles && onExportMockSets && fixedMocks.length > 0 ? (
              <button
                type="button"
                disabled={exportBusy || (selectedMockIds.length === 0 && selectedBatchIds.length === 0)}
                onClick={() => void handleExportSelected()}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-[11px] font-bold text-blue-800 hover:bg-blue-100 disabled:opacity-50 cursor-pointer"
              >
                <AppIcon icon={Download} size="btn" />
                {exportBusy
                  ? 'Exporting…'
                  : `Export JSON (${selectedMockIds.length + selectedBatchIds.length})`}
              </button>
            ) : null}
          </div>
        </h3>
        {mockTests.length === 0 ? (
          <p className="text-xs text-slate-500">No mocks yet. Import a Fixed batch or create a Dynamic blueprint below.</p>
        ) : (
          <div className="space-y-3">
            {canDeleteFiles && fixedMocks.length > 0 ? (
              <label className="inline-flex items-center gap-2 text-[11px] font-semibold text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allFixedMocksSelected}
                  onChange={toggleSelectAllFixedMocks}
                  className="rounded border-slate-300"
                />
                Select all Fixed Sets ({fixedMocks.length})
              </label>
            ) : null}
          <div className="overflow-x-auto scroll-x-safe">
            <table className="w-full text-left text-xs border-collapse min-w-[640px]">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-mono uppercase text-[10px] border-b border-slate-200">
                  {canDeleteFiles ? <th className="p-3 w-8"></th> : null}
                  <th className="p-3">Title</th>
                  <th className="p-3">Mode</th>
                  <th className="p-3">Scope</th>
                  <th className="p-3">Qs</th>
                  <th className="p-3">Published</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mockTests.map((m) => {
                  const isFixed = (m.mode || 'fixed') === 'fixed';
                  const selected = selectedMockIds.includes(m.id);
                  return (
                  <tr key={m.id} className={`hover:bg-slate-50 ${selected ? 'bg-blue-50/60' : ''}`}>
                    {canDeleteFiles ? (
                      <td className="p-3">
                        {isFixed ? (
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleMockSelected(m.id)}
                            className="rounded border-slate-300"
                            aria-label={`Select ${m.title}`}
                          />
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    ) : null}
                    <td className="p-3 font-semibold text-slate-800">
                      {m.title}
                      {m.isWeeklyOpen ? (
                        <span className="ml-2 inline-flex items-center rounded bg-amber-100 text-amber-800 text-[9px] font-black uppercase tracking-wide px-1.5 py-0.5">
                          Weekly
                        </span>
                      ) : null}
                    </td>
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
                            disabled={renameBusyId === m.id}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-900 cursor-pointer disabled:opacity-50"
                            onClick={() => void handleRenameMock(m)}
                          >
                            <AppIcon icon={Pencil} size="btn" />
                            {renameBusyId === m.id ? 'Saving…' : 'Rename'}
                          </button>
                          {(m.mode || 'fixed') === 'fixed' && (m.scope || 'full') === 'full' ? (
                            <button
                              type="button"
                              className={`text-[11px] font-bold cursor-pointer ${
                                m.isWeeklyOpen
                                  ? 'text-amber-700 hover:text-amber-900'
                                  : 'text-violet-700 hover:text-violet-900'
                              }`}
                              onClick={() => void handleConfigureWeekly(m)}
                            >
                              {m.isWeeklyOpen ? 'Edit weekly' : 'Set weekly'}
                            </button>
                          ) : null}
                          {m.isWeeklyOpen ? (
                            <button
                              type="button"
                              className="text-[11px] font-bold text-rose-700 hover:text-rose-900 cursor-pointer"
                              onClick={() =>
                                void onUpdateMock(m.id, {
                                  isWeeklyOpen: false,
                                  opensAt: null,
                                  closesAt: null,
                                })
                              }
                            >
                              Clear weekly
                            </button>
                          ) : null}
                          <button
                            type="button"
                            className="text-[11px] font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                            onClick={() =>
                              void onUpdateMock(m.id, { isPublished: !m.isPublished })
                            }
                          >
                            {m.isPublished ? 'Unpublish' : 'Publish'}
                          </button>
                          {canDeleteFiles && isFixed && onExportMockSets ? (
                            <button
                              type="button"
                              disabled={exportBusy}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-cyan-700 hover:text-cyan-900 cursor-pointer disabled:opacity-50"
                              onClick={() => {
                                void (async () => {
                                  setExportBusy(true);
                                  try {
                                    const result = await onExportMockSets({ mockIds: [m.id] });
                                    feedback.toast({
                                      variant: 'success',
                                      message: `Downloaded ${result.fileCount} Set JSON file(s).`,
                                    });
                                  } catch (err: any) {
                                    await feedback.alert({
                                      variant: 'error',
                                      title: 'Export failed',
                                      message: err?.message || 'Could not export Set JSON',
                                    });
                                  } finally {
                                    setExportBusy(false);
                                  }
                                })();
                              }}
                            >
                              <AppIcon icon={Download} size="btn" />
                              Export
                            </button>
                          ) : null}
                          {canDeleteFiles ? (
                            <button
                              type="button"
                              className="text-[11px] font-bold text-rose-600 hover:text-rose-800 cursor-pointer"
                              onClick={async () => {
                                const ok = await feedback.confirm({
                                  title: 'Delete mock?',
                                  message: `Delete “${m.title}”? Orphan Question Bank rows from this paper are removed too.`,
                                  confirmLabel: 'Delete',
                                  destructive: true,
                                });
                                if (ok) void onDeleteMock(m.id);
                              }}
                            >
                              Delete
                            </button>
                          ) : null}
                        </>
                      )}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          </div>
        )}

        {sortedBatches.length > 0 && (
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Fixed import batches
              </h4>
              {canDeleteFiles ? (
                <div className="flex flex-wrap items-center gap-2">
                  {onExportMockSets ? (
                    <button
                      type="button"
                      disabled={
                        exportBusy ||
                        (selectedBatchIds.length === 0 && selectedMockIds.length === 0)
                      }
                      onClick={() => void handleExportSelected()}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-[11px] font-bold text-blue-800 hover:bg-blue-100 disabled:opacity-50 cursor-pointer"
                    >
                      <AppIcon icon={Download} size="btn" />
                      Export selected JSON ({selectedBatchIds.length})
                    </button>
                  ) : null}
                  <button
                    type="button"
                    disabled={batchUndoBusy || sortedBatches.length === 0}
                    onClick={() => void handleUndoMostRecentBatch()}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-[11px] font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                  >
                    <AppIcon icon={RotateCcw} size="btn" />
                    Delete most recent
                  </button>
                  <button
                    type="button"
                    disabled={batchUndoBusy || selectedBatchIds.length === 0}
                    onClick={() => void handleUndoSelectedBatches()}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-[11px] font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-50 cursor-pointer"
                  >
                    <AppIcon icon={Trash2} size="btn" />
                    Delete selected ({selectedBatchIds.length})
                  </button>
                </div>
              ) : canEdit ? (
                <p className="text-[11px] text-slate-500">
                  Set file deletion is Admin-only.
                </p>
              ) : null}
            </div>

            {canDeleteFiles ? (
              <label className="inline-flex items-center gap-2 text-[11px] font-semibold text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allBatchesSelected}
                  onChange={toggleSelectAllBatches}
                  className="rounded border-slate-300"
                />
                Select all batches ({sortedBatches.length})
              </label>
            ) : null}

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {sortedBatches.map((b, idx) => {
                const selected = selectedBatchIds.includes(b.id);
                const isRecent = idx === 0;
                return (
                  <div
                    key={b.id}
                    className={`flex items-center justify-between gap-3 text-xs border rounded-xl px-3 py-2 ${
                      selected
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-slate-50 border-slate-100'
                    }`}
                  >
                    <div className="flex items-start gap-2 min-w-0">
                      {canDeleteFiles ? (
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleBatchSelected(b.id)}
                          className="mt-0.5 rounded border-slate-300"
                          aria-label={`Select batch ${b.label}`}
                        />
                      ) : null}
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-800 flex flex-wrap items-center gap-2">
                          <span className="truncate">{b.label}</span>
                          {isRecent ? (
                            <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                              Recent
                            </span>
                          ) : null}
                        </div>
                        <div className="text-slate-500 font-mono text-[10px]">
                          {b.mockCount} mocks · {b.importedByName} ·{' '}
                          {new Date(b.createdAt).toLocaleString()}
                          {b.filename ? ` · ${b.filename}` : ''}
                        </div>
                      </div>
                    </div>
                    {(canEdit || canDeleteFiles) && (
                      <div className="flex items-center gap-2 shrink-0">
                        {canEdit && onUpdateMockBatch ? (
                          <button
                            type="button"
                            disabled={batchUndoBusy || renameBusyId === b.id}
                            className="inline-flex items-center gap-1 text-slate-700 font-bold cursor-pointer disabled:opacity-50"
                            onClick={() => void handleRenameBatchFile(b)}
                          >
                            <AppIcon icon={Pencil} size="btn" />
                            {renameBusyId === b.id ? 'Saving…' : 'Edit file name'}
                          </button>
                        ) : null}
                        {canDeleteFiles ? (
                          <button
                            type="button"
                            disabled={batchUndoBusy}
                            className="inline-flex items-center gap-1 text-rose-600 font-bold cursor-pointer disabled:opacity-50"
                            onClick={async () => {
                              const ok = await feedback.confirm({
                                title: 'Delete import file?',
                                message: `Delete “${b.label}” and its mocks? Orphan bank questions from that paper are removed too.`,
                                confirmLabel: 'Delete',
                                destructive: true,
                              });
                              if (!ok) return;
                              setBatchUndoBusy(true);
                              try {
                                await onDeleteMockBatch(b.id);
                                setSelectedBatchIds((prev) => prev.filter((id) => id !== b.id));
                              } finally {
                                setBatchUndoBusy(false);
                              }
                            }}
                          >
                            <AppIcon icon={Trash2} size="btn" />
                            Delete
                          </button>
                        ) : null}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
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
            Each file becomes one Fixed Mock. Set files (plain question arrays like{' '}
            <code className="font-mono">SetA.json</code>) require <strong>exactly 200 valid questions</strong>
            — no less, no more. Valid questions are upserted into the Question Bank and the paper is frozen
            as mock “SetA” (<code className="font-mono">mock-set-seta</code>). Explicit mock wrappers with a
            nested <code className="font-mono">questions</code> array are also supported.
          </p>
          <div
            className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center text-xs text-slate-500 cursor-pointer hover:border-blue-300"
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              void handleFiles(e.dataTransfer.files);
            }}
          >
            Drag & drop or browse — select multiple files. Max 10 MB each.
            {importFileName && (
              <div className="mt-2 font-mono text-slate-700 break-all">{importFileName}</div>
            )}
            {importFileError && <div className="mt-2 text-rose-600 font-semibold">{importFileError}</div>}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            multiple
            className="hidden"
            onChange={(e) => void handleFiles(e.target.files)}
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
            <div className="text-xs space-y-2 bg-slate-50 border border-slate-100 rounded-xl p-3">
              <div className="font-bold text-emerald-700">
                Imported {importResult.successCount} mock(s)
                {importResult.fileCount && importResult.fileCount > 1
                  ? ` across ${importResult.fileCount} files`
                  : ''}
              </div>
              {importResult.fileResults && importResult.fileResults.length > 1 ? (
                <ul className="space-y-1 font-mono text-[11px]">
                  {importResult.fileResults.map((fr) => (
                    <li key={fr.filename} className="flex flex-wrap justify-between gap-2">
                      <span className="break-all text-slate-800">{fr.filename}</span>
                      <span className={fr.successCount > 0 ? 'text-emerald-700' : 'text-rose-600'}>
                        +{fr.successCount}
                        {fr.errors.length > 0 ? ` · ${fr.errors.length} err` : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
              {importResult.errors.map((err, i) => (
                <div key={i} className="text-rose-600">
                  {err}
                </div>
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
              <Select
                value={dynScope}
                onChange={(e) => setDynScope(e.target.value as MockScope)}
              >
                <option value="full">Full</option>
                <option value="subject">Subject-wise</option>
                <option value="chapter">Chapter-wise</option>
              </Select>
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
                <Select
                  value={dynSubject}
                  onChange={(e) => setDynSubject(e.target.value as SubjectName)}
                >
                  {SUBJECTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
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
                <Select
                  value={chapterRuleSubject}
                  onChange={(e) => setChapterRuleSubject(e.target.value as SubjectName)}
                  className="w-auto min-w-[8rem]"
                >
                  {SUBJECTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
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
