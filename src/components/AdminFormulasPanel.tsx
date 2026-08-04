import React, { useRef, useState } from 'react';
import { Clock, FileCode, RotateCcw, Trash2, Upload } from 'lucide-react';
import type { FormulaSheet } from '../types';
import type { FormulaImportBatch } from '../lib/formulasApi';
import { useFeedback } from './FeedbackProvider';
import { AppIcon } from './ui';

const FORMULA_IMPORT_SAMPLE = `[
  {
    "subject": "Physics",
    "title": "Mechanics & SHM High-Yield Formula Sheet",
    "chapter": "Mechanics",
    "formulas": [
      {
        "name": "Centripetal Acceleration",
        "formula": "a_c = v² / r = ω² r",
        "note": "Directed towards center of circle"
      },
      {
        "name": "Escape Velocity",
        "formula": "v_e = √(2 g R) ≈ 11.2 km/s",
        "note": "Earth surface value"
      }
    ]
  },
  {
    "subject": "Chemistry",
    "title": "Physical Chemistry Key Formulas",
    "chapter": "Physical Chemistry",
    "formulas": [
      {
        "name": "Ideal Gas Equation",
        "formula": "P V = n R T",
        "note": "R = 8.314 J/(mol·K)"
      }
    ]
  }
]`;

interface AdminFormulasPanelProps {
  sheets: FormulaSheet[];
  batches: FormulaImportBatch[];
  loading?: boolean;
  error?: string | null;
  canEdit: boolean;
  onImport: (
    jsonStr: string,
    meta?: { filename?: string | null; label?: string | null }
  ) => Promise<{
    successCount: number;
    errors: string[];
    batchId: string | null;
    batch?: FormulaImportBatch | null;
  }>;
  onDeleteBatch: (batchId: string) => Promise<void>;
}

export const AdminFormulasPanel: React.FC<AdminFormulasPanelProps> = ({
  sheets,
  batches,
  loading,
  error,
  canEdit,
  onImport,
  onDeleteBatch,
}) => {
  const feedback = useFeedback();
  const fileRef = useRef<HTMLInputElement>(null);
  const [jsonText, setJsonText] = useState(FORMULA_IMPORT_SAMPLE);
  const [importBusy, setImportBusy] = useState(false);
  const [importFileName, setImportFileName] = useState<string | null>(null);
  const [importFileError, setImportFileError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{
    successCount: number;
    errors: string[];
    batchId: string | null;
    batch?: FormulaImportBatch | null;
  } | null>(null);
  const [expandedBatchId, setExpandedBatchId] = useState<string | null>(null);

  const handleRunImport = async (
    rawJson?: string,
    meta?: { filename?: string | null; label?: string | null }
  ) => {
    if (!canEdit) return;
    const payload = rawJson ?? jsonText;
    setImportBusy(true);
    setImportFileError(null);
    try {
      const res = await onImport(payload, meta);
      setImportResult(res);
      if (res.batchId) setExpandedBatchId(res.batchId);
    } catch (err: any) {
      setImportResult({
        successCount: 0,
        errors: [err?.message || 'Import failed'],
        batchId: null,
      });
    } finally {
      setImportBusy(false);
    }
  };

  const handleJsonFileSelected = async (file: File | null) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.json')) {
      setImportFileError('Only .json files are supported.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setImportFileError('File too large (max 10 MB).');
      return;
    }
    try {
      const text = await file.text();
      JSON.parse(text);
      setJsonText(text);
      setImportFileName(file.name);
      setImportFileError(null);
      await handleRunImport(text, {
        filename: file.name,
        label: file.name.replace(/\.json$/i, ''),
      });
    } catch {
      setImportFileError('Invalid JSON file.');
    }
  };

  const handleDeleteBatch = async (batch: FormulaImportBatch, asUndo = false) => {
    const ok = await feedback.confirm({
      destructive: true,
      title: asUndo ? 'Undo last import?' : 'Delete formula batch?',
      message: asUndo
        ? `This removes batch “${batch.label}” and its ${batch.sheetCount} sheet(s).`
        : `Delete “${batch.label}” and all ${batch.sheetCount} formula sheet(s) in this batch?`,
      confirmLabel: asUndo ? 'Undo import' : 'Delete batch',
    });
    if (!ok) return;
    await onDeleteBatch(batch.id);
    if (importResult?.batchId === batch.id) setImportResult(null);
    feedback.toast({
      message: asUndo ? 'Import undone' : 'Formula batch deleted',
      variant: 'success',
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-base">
            Formula Library ({sheets.length} sheets)
          </h3>
          {loading && (
            <span className="text-[11px] font-semibold text-slate-500">Loading…</span>
          )}
        </div>

        {error && (
          <div className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Sheets by import batch
          </h4>
          {batches.length === 0 ? (
            <p className="text-xs text-slate-500">
              No formula batches yet. Import a JSON array of formula sheets below.
            </p>
          ) : (
            <div className="space-y-2">
              {batches.map((batch) => {
                const batchSheets = sheets.filter((s) => s.batchId === batch.id);
                const open = expandedBatchId === batch.id;
                return (
                  <div
                    key={batch.id}
                    className="rounded-xl border border-slate-200 overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedBatchId((prev) => (prev === batch.id ? null : batch.id))
                      }
                      className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-slate-50 text-left cursor-pointer"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-slate-900 truncate">
                          {batch.label}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {batch.sheetCount} sheets · {batch.importedByName} ·{' '}
                          {new Date(batch.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-slate-500 shrink-0">
                        {open ? 'Hide' : 'Show'}
                      </span>
                    </button>
                    {open && (
                      <div className="p-4 space-y-3 border-t border-slate-100">
                        <ul className="space-y-1.5 text-xs text-slate-700 list-none pl-0 m-0">
                          {batchSheets.map((s) => (
                            <li key={s.id} className="flex items-start justify-between gap-2">
                              <span className="min-w-0">
                                <span className="font-semibold">{s.title}</span>
                                <span className="text-slate-500">
                                  {' '}
                                  · {s.subject} / {s.chapter} · {s.formulas.length} formulas
                                </span>
                              </span>
                            </li>
                          ))}
                          {batchSheets.length === 0 && (
                            <li className="text-slate-500">No sheets linked to this batch.</li>
                          )}
                        </ul>
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => void handleDeleteBatch(batch)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 cursor-pointer"
                          >
                            <AppIcon icon={Trash2} size="btn" />
                            Delete batch
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {canEdit && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-base pb-2 border-b border-slate-100">
            Bulk JSON Formula Import
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Upload a <span className="font-mono font-semibold">.json</span> file (array of
            formula sheet objects), or paste JSON below. Invalid rows are reported; valid rows
            still import.
          </p>

          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(e) => void handleJsonFileSelected(e.target.files?.[0] ?? null)}
          />

          <div
            className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 flex flex-col sm:flex-row items-center justify-between gap-4"
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void handleJsonFileSelected(e.dataTransfer.files?.[0] ?? null);
            }}
          >
            <div className="flex items-start gap-3 text-left">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                <AppIcon icon={Upload} size="card" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">Import from JSON file</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Schema: subject, title, chapter, formulas[name, formula, note?]. Max 10 MB.
                  Upload your Formula.json — sheets are stored in the database (not hardcoded).
                </div>
                {importFileName && (
                  <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-mono font-semibold text-emerald-700">
                    <AppIcon icon={FileCode} size="btn" />
                    {importFileName}
                  </div>
                )}
                {importFileError && (
                  <div className="mt-2 text-[11px] font-semibold text-rose-600">
                    {importFileError}
                  </div>
                )}
              </div>
            </div>
            <button
              type="button"
              disabled={importBusy}
              onClick={() => fileRef.current?.click()}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-bold text-xs rounded-xl cursor-pointer shrink-0"
            >
              {importBusy ? 'Importing…' : 'Choose JSON file'}
            </button>
          </div>

          <details className="rounded-xl border border-slate-200 bg-white">
            <summary className="cursor-pointer px-4 py-3 text-xs font-bold text-slate-700 select-none">
              Or paste JSON manually
            </summary>
            <div className="px-4 pb-4 space-y-3">
              <textarea
                rows={10}
                value={jsonText}
                onChange={(e) => {
                  setJsonText(e.target.value);
                  setImportFileName(null);
                }}
                className="w-full p-4 bg-slate-950 text-cyan-400 font-mono text-xs rounded-xl border border-slate-800 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => void handleRunImport()}
                disabled={importBusy}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                {importBusy ? 'Importing into database…' : 'Validate & Import pasted JSON'}
              </button>
            </div>
          </details>

          {importResult && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
              <div className="font-bold text-emerald-600 font-mono">
                Successfully imported: {importResult.successCount} formula sheets
              </div>
              {(importResult.batch || importResult.batchId) && (
                <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-slate-500 font-bold uppercase text-[10px]">
                    <AppIcon icon={Clock} size="btn" />
                    Import details
                  </div>
                  <div className="text-slate-800">
                    Batch:{' '}
                    <span className="font-bold">
                      {importResult.batch?.label || importResult.batchId}
                    </span>
                  </div>
                  {importResult.batch && (
                    <button
                      type="button"
                      onClick={() => void handleDeleteBatch(importResult.batch!, true)}
                      className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 cursor-pointer"
                    >
                      <AppIcon icon={RotateCcw} size="btn" />
                      Undo this import
                    </button>
                  )}
                </div>
              )}
              {importResult.errors.length > 0 && (
                <div className="space-y-1">
                  <div className="font-bold text-rose-600">
                    Row errors ({importResult.errors.length})
                  </div>
                  <ul className="list-disc pl-4 space-y-0.5 text-rose-700">
                    {importResult.errors.map((err) => (
                      <li key={err}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
