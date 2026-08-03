import fs from 'fs';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';
import type {
  FormulaEntry,
  FormulaImportBatchRecord,
  FormulaSheetRecord,
  SubjectName,
} from '../formulasDomain.ts';
import type { CreateFormulaBatchInput, FormulasRepository } from './types.ts';

type BatchRow = {
  id: string;
  label: string;
  filename: string | null;
  imported_by_email: string;
  imported_by_name: string;
  sheet_count: number;
  error_count: number;
  created_at: string;
};

type SheetRow = {
  id: string;
  subject: string;
  title: string;
  chapter: string;
  formulas_json: string;
  batch_id: string | null;
  created_at: string;
  updated_at: string;
};

function mapBatch(row: BatchRow): FormulaImportBatchRecord {
  return {
    id: row.id,
    label: row.label,
    filename: row.filename,
    importedByEmail: row.imported_by_email,
    importedByName: row.imported_by_name,
    sheetCount: row.sheet_count,
    errorCount: row.error_count,
    createdAt: row.created_at,
  };
}

function parseFormulasJson(raw: string): FormulaEntry[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as FormulaEntry[]) : [];
  } catch {
    return [];
  }
}

function mapSheet(row: SheetRow): FormulaSheetRecord {
  return {
    id: row.id,
    subject: row.subject as SubjectName,
    title: row.title,
    chapter: row.chapter,
    formulas: parseFormulasJson(row.formulas_json),
    batchId: row.batch_id || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createSqliteFormulasRepo(dbFilePath: string): FormulasRepository {
  const dir = path.dirname(dbFilePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const db = new DatabaseSync(dbFilePath);

  return {
    driver: 'sqlite',

    async ensureSchema() {
      db.exec(`
        CREATE TABLE IF NOT EXISTS formula_import_batches (
          id TEXT PRIMARY KEY,
          label TEXT NOT NULL,
          filename TEXT NULL,
          imported_by_email TEXT NOT NULL,
          imported_by_name TEXT NOT NULL,
          sheet_count INTEGER NOT NULL DEFAULT 0,
          error_count INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS formula_sheets (
          id TEXT PRIMARY KEY,
          subject TEXT NOT NULL,
          title TEXT NOT NULL,
          chapter TEXT NOT NULL,
          formulas_json TEXT NOT NULL,
          batch_id TEXT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_formula_sheets_subject ON formula_sheets (subject);
        CREATE INDEX IF NOT EXISTS idx_formula_sheets_batch ON formula_sheets (batch_id);
      `);
    },

    async list(opts) {
      const rows = opts?.batchId
        ? (db
            .prepare(
              'SELECT * FROM formula_sheets WHERE batch_id = ? ORDER BY subject, title'
            )
            .all(opts.batchId) as SheetRow[])
        : (db
            .prepare('SELECT * FROM formula_sheets ORDER BY subject, title')
            .all() as SheetRow[]);
      return rows.map(mapSheet);
    },

    async insertMany(sheets) {
      const now = new Date().toISOString();
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO formula_sheets
          (id, subject, title, chapter, formulas_json, batch_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      let count = 0;
      for (const sheet of sheets) {
        stmt.run(
          sheet.id,
          sheet.subject,
          sheet.title,
          sheet.chapter,
          JSON.stringify(sheet.formulas),
          sheet.batchId ?? null,
          now,
          now
        );
        count += 1;
      }
      return count;
    },

    async createBatch(input: CreateFormulaBatchInput) {
      const now = new Date().toISOString();
      db.prepare(
        `INSERT INTO formula_import_batches (
          id, label, filename, imported_by_email, imported_by_name, sheet_count, error_count, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        input.id,
        input.label,
        input.filename ?? null,
        input.importedByEmail,
        input.importedByName,
        input.sheetCount,
        input.errorCount,
        now
      );
      return {
        id: input.id,
        label: input.label,
        filename: input.filename ?? null,
        importedByEmail: input.importedByEmail,
        importedByName: input.importedByName,
        sheetCount: input.sheetCount,
        errorCount: input.errorCount,
        createdAt: now,
      };
    },

    async listBatches() {
      const rows = db
        .prepare('SELECT * FROM formula_import_batches ORDER BY created_at DESC')
        .all() as BatchRow[];
      return rows.map(mapBatch);
    },

    async getBatch(id) {
      const row = db
        .prepare('SELECT * FROM formula_import_batches WHERE id = ?')
        .get(id) as BatchRow | undefined;
      return row ? mapBatch(row) : null;
    },

    async deleteBatch(id) {
      const before = db
        .prepare('SELECT COUNT(*) AS c FROM formula_sheets WHERE batch_id = ?')
        .get(id) as { c: number };
      const tx = db.prepare('BEGIN');
      const commit = db.prepare('COMMIT');
      const rollback = db.prepare('ROLLBACK');
      tx.run();
      try {
        db.prepare('DELETE FROM formula_sheets WHERE batch_id = ?').run(id);
        db.prepare('DELETE FROM formula_import_batches WHERE id = ?').run(id);
        commit.run();
        return { deletedSheets: Number(before?.c) || 0 };
      } catch (err) {
        rollback.run();
        throw err;
      }
    },

    async countAll() {
      const row = db.prepare('SELECT COUNT(*) AS c FROM formula_sheets').get() as {
        c: number;
      };
      return Number(row?.c) || 0;
    },

    async close() {
      db.close();
    },
  };
}
