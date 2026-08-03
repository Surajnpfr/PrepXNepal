import type { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import type {
  FormulaEntry,
  FormulaImportBatchRecord,
  FormulaSheetRecord,
  SubjectName,
} from '../formulasDomain.ts';
import type { CreateFormulaBatchInput, FormulasRepository } from './types.ts';

type BatchRow = RowDataPacket & {
  id: string;
  label: string;
  filename: string | null;
  imported_by_email: string;
  imported_by_name: string;
  sheet_count: number;
  error_count: number;
  created_at: Date | string;
};

type SheetRow = RowDataPacket & {
  id: string;
  subject: string;
  title: string;
  chapter: string;
  formulas_json: string | FormulaEntry[] | object;
  batch_id: string | null;
  created_at: Date | string;
  updated_at: Date | string;
};

function asIso(value: Date | string): string {
  if (value instanceof Date) return value.toISOString();
  return new Date(value).toISOString();
}

function mapBatch(row: BatchRow): FormulaImportBatchRecord {
  return {
    id: row.id,
    label: row.label,
    filename: row.filename,
    importedByEmail: row.imported_by_email,
    importedByName: row.imported_by_name,
    sheetCount: row.sheet_count,
    errorCount: row.error_count,
    createdAt: asIso(row.created_at),
  };
}

function parseFormulasJson(raw: SheetRow['formulas_json']): FormulaEntry[] {
  if (Array.isArray(raw)) return raw as FormulaEntry[];
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as FormulaEntry[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function mapSheet(row: SheetRow): FormulaSheetRecord {
  return {
    id: row.id,
    subject: row.subject as SubjectName,
    title: row.title,
    chapter: row.chapter,
    formulas: parseFormulasJson(row.formulas_json),
    batchId: row.batch_id || undefined,
    createdAt: asIso(row.created_at),
    updatedAt: asIso(row.updated_at),
  };
}

export function createMysqlFormulasRepo(pool: Pool): FormulasRepository {
  return {
    driver: 'mysql',

    async ensureSchema() {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS formula_import_batches (
          id VARCHAR(64) PRIMARY KEY,
          label VARCHAR(255) NOT NULL,
          filename VARCHAR(255) NULL,
          imported_by_email VARCHAR(255) NOT NULL,
          imported_by_name VARCHAR(255) NOT NULL,
          sheet_count INT NOT NULL DEFAULT 0,
          error_count INT NOT NULL DEFAULT 0,
          created_at DATETIME(3) NOT NULL
        )
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS formula_sheets (
          id VARCHAR(64) PRIMARY KEY,
          subject VARCHAR(32) NOT NULL,
          title VARCHAR(512) NOT NULL,
          chapter VARCHAR(255) NOT NULL,
          formulas_json JSON NOT NULL,
          batch_id VARCHAR(64) NULL,
          created_at DATETIME(3) NOT NULL,
          updated_at DATETIME(3) NOT NULL,
          INDEX idx_formula_sheets_subject (subject),
          INDEX idx_formula_sheets_batch (batch_id)
        )
      `);
    },

    async list(opts) {
      const [rows] = opts?.batchId
        ? await pool.query<SheetRow[]>(
            'SELECT * FROM formula_sheets WHERE batch_id = ? ORDER BY subject, title',
            [opts.batchId]
          )
        : await pool.query<SheetRow[]>(
            'SELECT * FROM formula_sheets ORDER BY subject, title'
          );
      return rows.map(mapSheet);
    },

    async insertMany(sheets) {
      if (sheets.length === 0) return 0;
      const now = new Date();
      const values = sheets.map((s) => [
        s.id,
        s.subject,
        s.title,
        s.chapter,
        JSON.stringify(s.formulas),
        s.batchId ?? null,
        now,
        now,
      ]);
      const [result] = await pool.query<ResultSetHeader>(
        `INSERT INTO formula_sheets
          (id, subject, title, chapter, formulas_json, batch_id, created_at, updated_at)
         VALUES ?
         ON DUPLICATE KEY UPDATE
           subject = VALUES(subject),
           title = VALUES(title),
           chapter = VALUES(chapter),
           formulas_json = VALUES(formulas_json),
           batch_id = VALUES(batch_id),
           updated_at = VALUES(updated_at)`,
        [values]
      );
      return Number(result.affectedRows) > 0 ? sheets.length : 0;
    },

    async createBatch(input: CreateFormulaBatchInput) {
      const now = new Date();
      await pool.query(
        `INSERT INTO formula_import_batches (
          id, label, filename, imported_by_email, imported_by_name, sheet_count, error_count, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          input.id,
          input.label,
          input.filename ?? null,
          input.importedByEmail,
          input.importedByName,
          input.sheetCount,
          input.errorCount,
          now,
        ]
      );
      return {
        id: input.id,
        label: input.label,
        filename: input.filename ?? null,
        importedByEmail: input.importedByEmail,
        importedByName: input.importedByName,
        sheetCount: input.sheetCount,
        errorCount: input.errorCount,
        createdAt: now.toISOString(),
      };
    },

    async listBatches() {
      const [rows] = await pool.query<BatchRow[]>(
        'SELECT * FROM formula_import_batches ORDER BY created_at DESC'
      );
      return rows.map(mapBatch);
    },

    async getBatch(id) {
      const [rows] = await pool.query<BatchRow[]>(
        'SELECT * FROM formula_import_batches WHERE id = ? LIMIT 1',
        [id]
      );
      return rows[0] ? mapBatch(rows[0]) : null;
    },

    async deleteBatch(id) {
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();
        const [delSheets] = await conn.query<ResultSetHeader>(
          'DELETE FROM formula_sheets WHERE batch_id = ?',
          [id]
        );
        await conn.query('DELETE FROM formula_import_batches WHERE id = ?', [id]);
        await conn.commit();
        return { deletedSheets: Number(delSheets.affectedRows) || 0 };
      } catch (err) {
        await conn.rollback();
        throw err;
      } finally {
        conn.release();
      }
    },

    async countAll() {
      const [rows] = await pool.query<RowDataPacket[]>(
        'SELECT COUNT(*) AS c FROM formula_sheets'
      );
      return Number(rows[0]?.c) || 0;
    },

    async close() {
      await pool.end();
    },
  };
}
