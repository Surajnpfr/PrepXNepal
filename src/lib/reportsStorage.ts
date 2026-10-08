import type { AttemptReport, Question } from '../types';
import {
  clearFailedWriteGuard,
  estimateJsonBytes,
  safeStorageGet,
  safeStorageGetRaw,
  safeStorageRemove,
  safeStorageSet,
  type SafeStorageWriteResult,
} from './safeStorage';

export const REPORTS_STORAGE_KEY = 'prepx_reports';
export const REPORTS_SCHEMA_VERSION_KEY = 'prepx_reports_schema_version';
/** Compact reports cache schema (no embedded paperQuestions). */
export const REPORTS_SCHEMA_VERSION = 2;

/**
 * Soft ceiling for the entire `prepx_reports` payload after compaction.
 * Not a browser quota — catches accidental reintroduction of paper blobs.
 * Does not delete existing user data when exceeded; the write is skipped.
 */
export const REPORTS_CACHE_MAX_BYTES = 1.5 * 1024 * 1024;

export function paperStorageKey(mockId: string): string {
  return `prepx_paper_${mockId}`;
}

/** Strip fields that belong in `prepx_paper_*`, not the reports cache. */
export function compactAttemptReport(report: AttemptReport): AttemptReport {
  const { paperQuestions: _paperQuestions, ...rest } = report;
  return rest;
}

export function cacheReportPaper(report: AttemptReport): SafeStorageWriteResult | null {
  const questions = report.paperQuestions;
  if (!questions?.length || !report.mockId) return null;
  return cachePaperQuestions(report.mockId, questions);
}

export function cachePaperQuestions(
  mockId: string,
  questions: Question[]
): SafeStorageWriteResult {
  return safeStorageSet(paperStorageKey(mockId), questions);
}

export function loadCachedPaperQuestions(mockId: string): Question[] | null {
  const parsed = safeStorageGet<Question[] | null>(paperStorageKey(mockId), null);
  if (!Array.isArray(parsed) || parsed.length === 0) return null;
  return parsed;
}

/**
 * Prepare a report for in-memory + local cache use:
 * cache any embedded paper, return compact report.
 */
export function normalizeReportForCache(report: AttemptReport): AttemptReport {
  cacheReportPaper(report);
  return compactAttemptReport(report);
}

export function normalizeReportsForCache(reports: AttemptReport[]): AttemptReport[] {
  return reports.map(normalizeReportForCache);
}

function reportNeedsMigration(report: AttemptReport): boolean {
  return Array.isArray(report.paperQuestions) && report.paperQuestions.length > 0;
}

function summarizeReportShape(reports: AttemptReport[]): Record<string, unknown> {
  const withPaper = reports.filter((r) => (r.paperQuestions?.length || 0) > 0).length;
  const sample = reports[0];
  return {
    count: reports.length,
    withEmbeddedPaper: withPaper,
    sampleKeys: sample ? Object.keys(sample) : [],
    samplePaperQuestionCount: sample?.paperQuestions?.length || 0,
    samplePaperAnswerCount: sample?.paperAnswers
      ? Object.keys(sample.paperAnswers).length
      : 0,
  };
}

function readSchemaVersion(): number {
  const raw = safeStorageGetRaw(REPORTS_SCHEMA_VERSION_KEY);
  if (raw == null) return 0;
  const asNumber = Number(raw);
  if (Number.isFinite(asNumber)) return asNumber;
  try {
    const parsed = JSON.parse(raw);
    const n = Number(parsed);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

/**
 * One-time migration: extract embedded papers, rewrite compact reports, bump schema version.
 */
export function migrateReportsCacheIfNeeded(): AttemptReport[] {
  const currentVersion = readSchemaVersion();

  const raw = safeStorageGetRaw(REPORTS_STORAGE_KEY);
  if (!raw) {
    safeStorageSet(REPORTS_SCHEMA_VERSION_KEY, REPORTS_SCHEMA_VERSION);
    return [];
  }

  let parsed: AttemptReport[] = [];
  try {
    const value = JSON.parse(raw) as AttemptReport[];
    parsed = Array.isArray(value) ? value : [];
  } catch {
    console.warn('[PrepX Storage] Corrupt prepx_reports — starting empty cache');
    safeStorageSet(REPORTS_SCHEMA_VERSION_KEY, REPORTS_SCHEMA_VERSION);
    return [];
  }

  const needsFieldMigration = parsed.some(reportNeedsMigration);
  if (currentVersion >= REPORTS_SCHEMA_VERSION && !needsFieldMigration) {
    return parsed.map(compactAttemptReport);
  }

  const compacted = normalizeReportsForCache(parsed);
  const write = persistReportsCache(compacted, { force: true });
  if (write.ok === false) {
    console.warn('[PrepX Storage] Report migration compact write deferred', {
      reason: write.reason,
      bytes: write.bytes,
      shape: summarizeReportShape(parsed),
    });
    // Still advance schema when fields are already compact so we do not remigrate forever.
    if (!needsFieldMigration) {
      safeStorageSet(REPORTS_SCHEMA_VERSION_KEY, REPORTS_SCHEMA_VERSION);
    }
  } else {
    safeStorageSet(REPORTS_SCHEMA_VERSION_KEY, REPORTS_SCHEMA_VERSION);
  }
  return compacted;
}

export function loadPastReportsFromStorage(
  fallback: AttemptReport[] = []
): AttemptReport[] {
  const migrated = migrateReportsCacheIfNeeded();
  if (migrated.length > 0) return migrated;
  if (fallback.length === 0) return [];
  return normalizeReportsForCache(fallback);
}

export type PersistReportsOptions = {
  /** Bypass identical-failure short-circuit (used during migration). */
  force?: boolean;
};

/**
 * Persist compact reports only. Skips oversized writes without deleting the previous value.
 */
export function persistReportsCache(
  reports: AttemptReport[],
  options: PersistReportsOptions = {}
): SafeStorageWriteResult {
  const compacted = reports.map(compactAttemptReport);
  const bytes = estimateJsonBytes(compacted);

  if (bytes > REPORTS_CACHE_MAX_BYTES) {
    console.warn('[PrepX Storage] Reports payload exceeds app size guard — write skipped', {
      key: REPORTS_STORAGE_KEY,
      attemptedSize: `${(bytes / (1024 * 1024)).toFixed(3)} MB`,
      attemptedBytes: bytes,
      maxBytes: REPORTS_CACHE_MAX_BYTES,
      shape: summarizeReportShape(reports),
    });
    return { ok: false, reason: 'oversized', bytes };
  }

  if (options.force) {
    clearFailedWriteGuard(REPORTS_STORAGE_KEY);
  }

  const result = safeStorageSet(REPORTS_STORAGE_KEY, compacted);
  if (result.ok) {
    safeStorageSet(REPORTS_SCHEMA_VERSION_KEY, REPORTS_SCHEMA_VERSION);
  }
  return result;
}

/** Test/helper: remove reports cache keys (does not touch paper keys). */
export function clearReportsCacheKeys(): void {
  safeStorageRemove(REPORTS_STORAGE_KEY);
  safeStorageRemove(REPORTS_SCHEMA_VERSION_KEY);
  clearFailedWriteGuard(REPORTS_STORAGE_KEY);
}
