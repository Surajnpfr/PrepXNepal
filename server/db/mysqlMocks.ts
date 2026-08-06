import type { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import type {
  MockAllocation,
  MockImportBatchRecord,
  MockMode,
  MockRecord,
  MockScope,
} from '../mocksDomain.ts';
import { isSubject } from '../questionsDomain.ts';
import type { CreateMockBatchInput, MocksRepository } from './types.ts';

type MockRow = RowDataPacket & {
  id: string;
  title: string;
  exam_type: string;
  mode: string;
  scope: string;
  subject: string | null;
  chapter_name: string | null;
  duration_sec: number;
  total_questions: number;
  questions_per_page: number;
  correct_marks: number;
  wrong_marks: number;
  unanswered_marks: number;
  is_published: number | boolean;
  coin_price: number | null;
  year: string | null;
  allocation_json: string | MockAllocation | null;
  import_batch_id: string | null;
  opens_at: Date | string | null;
  closes_at: Date | string | null;
  is_weekly_open: number | boolean;
  created_at: Date | string;
  updated_at: Date | string;
};

type BatchRow = RowDataPacket & {
  id: string;
  label: string;
  filename: string | null;
  imported_by_email: string;
  imported_by_name: string;
  mock_count: number;
  error_count: number;
  created_at: Date | string;
};

function asIso(value: Date | string): string {
  if (value instanceof Date) return value.toISOString();
  return new Date(value).toISOString();
}

function parseJson<T>(value: unknown, fallback: T): T {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  if (value && typeof value === 'object') return value as T;
  return fallback;
}

function mapSubject(value: string | null): MockRecord['subject'] {
  if (!value) return undefined;
  if (value === 'Combined') return 'Combined';
  if (isSubject(value)) return value;
  return undefined;
}

function mapRow(row: MockRow, questionIds?: string[]): MockRecord {
  const allocation =
    row.allocation_json == null
      ? undefined
      : parseJson<MockAllocation | null>(row.allocation_json, null) || undefined;
  return {
    id: row.id,
    title: row.title,
    examType: 'Nepal CEE',
    mode: row.mode as MockMode,
    scope: row.scope as MockScope,
    subject: mapSubject(row.subject),
    chapterName: row.chapter_name || undefined,
    durationSec: Number(row.duration_sec),
    totalQuestions: Number(row.total_questions),
    questionsPerPage: Number(row.questions_per_page),
    correctMarks: Number(row.correct_marks),
    wrongMarks: Number(row.wrong_marks),
    unansweredMarks: Number(row.unanswered_marks),
    isPublished: Boolean(row.is_published),
    coinPrice: row.coin_price == null ? undefined : Number(row.coin_price),
    year: row.year || undefined,
    allocation,
    importBatchId: row.import_batch_id || undefined,
    opensAt: row.opens_at == null ? null : asIso(row.opens_at),
    closesAt: row.closes_at == null ? null : asIso(row.closes_at),
    isWeeklyOpen: Boolean(row.is_weekly_open),
    questionIds,
    createdAt: asIso(row.created_at),
    updatedAt: asIso(row.updated_at),
  };
}

function mapBatch(row: BatchRow): MockImportBatchRecord {
  return {
    id: row.id,
    label: row.label,
    filename: row.filename,
    importedByEmail: row.imported_by_email,
    importedByName: row.imported_by_name,
    mockCount: Number(row.mock_count) || 0,
    errorCount: Number(row.error_count) || 0,
    createdAt: asIso(row.created_at),
  };
}

export function createMysqlMocksRepo(pool: Pool): MocksRepository {
  async function loadQuestionIds(mockId: string): Promise<string[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT question_id FROM mock_questions WHERE mock_id = ? ORDER BY position ASC',
      [mockId]
    );
    return rows.map((r) => String(r.question_id));
  }

  async function hydrate(row: MockRow): Promise<MockRecord> {
    const questionIds = row.mode === 'fixed' ? await loadQuestionIds(row.id) : undefined;
    return mapRow(row, questionIds);
  }

  return {
    driver: 'mysql',

    async ensureSchema() {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS mock_import_batches (
          id VARCHAR(64) PRIMARY KEY,
          label VARCHAR(255) NOT NULL,
          filename VARCHAR(255) NULL,
          imported_by_email VARCHAR(255) NOT NULL,
          imported_by_name VARCHAR(255) NOT NULL,
          mock_count INT NOT NULL DEFAULT 0,
          error_count INT NOT NULL DEFAULT 0,
          created_at DATETIME(3) NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS mock_tests (
          id VARCHAR(64) PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          exam_type VARCHAR(64) NOT NULL DEFAULT 'Nepal CEE',
          mode ENUM('fixed','dynamic') NOT NULL,
          scope ENUM('full','subject','chapter') NOT NULL,
          subject VARCHAR(32) NULL,
          chapter_name VARCHAR(191) NULL,
          duration_sec INT NOT NULL,
          total_questions INT NOT NULL,
          questions_per_page INT NOT NULL DEFAULT 20,
          correct_marks DOUBLE NOT NULL DEFAULT 1,
          wrong_marks DOUBLE NOT NULL DEFAULT -0.25,
          unanswered_marks DOUBLE NOT NULL DEFAULT 0,
          is_published TINYINT(1) NOT NULL DEFAULT 1,
          coin_price INT NULL,
          year VARCHAR(32) NULL,
          allocation_json JSON NULL,
          import_batch_id VARCHAR(64) NULL,
          created_at DATETIME(3) NOT NULL,
          updated_at DATETIME(3) NOT NULL,
          INDEX idx_mocks_published (is_published),
          INDEX idx_mocks_mode_scope (mode, scope),
          INDEX idx_mocks_batch (import_batch_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
      // Migrate weekly columns on existing deployments.
      for (const ddl of [
        'ALTER TABLE mock_tests ADD COLUMN opens_at DATETIME(3) NULL',
        'ALTER TABLE mock_tests ADD COLUMN closes_at DATETIME(3) NULL',
        'ALTER TABLE mock_tests ADD COLUMN is_weekly_open TINYINT(1) NOT NULL DEFAULT 0',
      ]) {
        try {
          await pool.query(ddl);
        } catch (err: any) {
          // Duplicate column = already migrated
          if (err?.code !== 'ER_DUP_FIELDNAME' && err?.errno !== 1060) throw err;
        }
      }
      try {
        await pool.query('CREATE INDEX idx_mocks_weekly ON mock_tests (is_weekly_open)');
      } catch (err: any) {
        if (err?.code !== 'ER_DUP_KEYNAME' && err?.errno !== 1061) throw err;
      }
      await pool.query(`
        CREATE TABLE IF NOT EXISTS mock_questions (
          mock_id VARCHAR(64) NOT NULL,
          question_id VARCHAR(64) NOT NULL,
          position INT NOT NULL,
          PRIMARY KEY (mock_id, question_id),
          UNIQUE KEY uq_mock_position (mock_id, position),
          INDEX idx_mock_questions_mock (mock_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
    },

    async list(opts) {
      const clauses: string[] = [];
      const params: unknown[] = [];
      if (opts?.publishedOnly) {
        clauses.push('is_published = 1');
      }
      if (opts?.mode) {
        clauses.push('mode = ?');
        params.push(opts.mode);
      }
      if (opts?.scope) {
        clauses.push('scope = ?');
        params.push(opts.scope);
      }
      const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
      const [rows] = await pool.query<MockRow[]>(
        `SELECT * FROM mock_tests ${where} ORDER BY title ASC, id ASC`,
        params
      );
      return Promise.all(rows.map((r) => hydrate(r)));
    },

    async getById(id) {
      const [rows] = await pool.query<MockRow[]>('SELECT * FROM mock_tests WHERE id = ?', [id]);
      return rows[0] ? hydrate(rows[0]) : null;
    },

    async insertFixed(mock) {
      const now = new Date();
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();
        await conn.query(
          `INSERT INTO mock_tests (
            id, title, exam_type, mode, scope, subject, chapter_name, duration_sec,
            total_questions, questions_per_page, correct_marks, wrong_marks, unanswered_marks,
            is_published, coin_price, year, allocation_json, import_batch_id,
            opens_at, closes_at, is_weekly_open, created_at, updated_at
          ) VALUES (?, ?, ?, 'fixed', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?)`,
          [
            mock.id,
            mock.title,
            mock.examType,
            mock.scope,
            mock.subject ?? null,
            mock.chapterName ?? null,
            mock.durationSec,
            mock.totalQuestions,
            mock.questionsPerPage,
            mock.correctMarks,
            mock.wrongMarks,
            mock.unansweredMarks,
            mock.isPublished ? 1 : 0,
            mock.coinPrice ?? null,
            mock.year ?? null,
            mock.importBatchId ?? null,
            mock.opensAt ? new Date(mock.opensAt) : null,
            mock.closesAt ? new Date(mock.closesAt) : null,
            mock.isWeeklyOpen ? 1 : 0,
            now,
            now,
          ]
        );
        for (let i = 0; i < mock.questionIds.length; i++) {
          await conn.query(
            'INSERT INTO mock_questions (mock_id, question_id, position) VALUES (?, ?, ?)',
            [mock.id, mock.questionIds[i], i]
          );
        }
        await conn.commit();
      } catch (err) {
        await conn.rollback();
        throw err;
      } finally {
        conn.release();
      }
      return (await this.getById(mock.id))!;
    },

    async insertDynamic(mock) {
      const now = new Date();
      await pool.query(
        `INSERT INTO mock_tests (
          id, title, exam_type, mode, scope, subject, chapter_name, duration_sec,
          total_questions, questions_per_page, correct_marks, wrong_marks, unanswered_marks,
          is_published, coin_price, year, allocation_json, import_batch_id,
          opens_at, closes_at, is_weekly_open, created_at, updated_at
        ) VALUES (?, ?, ?, 'dynamic', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, ?)`,
        [
          mock.id,
          mock.title,
          mock.examType,
          mock.scope,
          mock.subject ?? null,
          mock.chapterName ?? null,
          mock.durationSec,
          mock.totalQuestions,
          mock.questionsPerPage,
          mock.correctMarks,
          mock.wrongMarks,
          mock.unansweredMarks,
          mock.isPublished ? 1 : 0,
          mock.coinPrice ?? null,
          mock.year ?? null,
          JSON.stringify(mock.allocation || { subjects: {}, chapters: [] }),
          mock.opensAt ? new Date(mock.opensAt) : null,
          mock.closesAt ? new Date(mock.closesAt) : null,
          mock.isWeeklyOpen ? 1 : 0,
          now,
          now,
        ]
      );
      return (await this.getById(mock.id))!;
    },

    async updateMeta(id, patch) {
      const existing = await this.getById(id);
      if (!existing) return null;
      const next = {
        title: patch.title ?? existing.title,
        isPublished: patch.isPublished ?? existing.isPublished,
        durationSec: patch.durationSec ?? existing.durationSec,
        questionsPerPage: patch.questionsPerPage ?? existing.questionsPerPage,
        correctMarks: patch.correctMarks ?? existing.correctMarks,
        wrongMarks: patch.wrongMarks ?? existing.wrongMarks,
        unansweredMarks: patch.unansweredMarks ?? existing.unansweredMarks,
        coinPrice: patch.coinPrice !== undefined ? patch.coinPrice : existing.coinPrice,
        allocation: patch.allocation ?? existing.allocation,
        totalQuestions: patch.totalQuestions ?? existing.totalQuestions,
        opensAt: patch.opensAt !== undefined ? patch.opensAt : existing.opensAt,
        closesAt: patch.closesAt !== undefined ? patch.closesAt : existing.closesAt,
        isWeeklyOpen:
          patch.isWeeklyOpen !== undefined ? patch.isWeeklyOpen : Boolean(existing.isWeeklyOpen),
      };
      const now = new Date();
      await pool.query(
        `UPDATE mock_tests SET
          title = ?, is_published = ?, duration_sec = ?, questions_per_page = ?,
          correct_marks = ?, wrong_marks = ?, unanswered_marks = ?, coin_price = ?,
          allocation_json = ?, total_questions = ?,
          opens_at = ?, closes_at = ?, is_weekly_open = ?, updated_at = ?
         WHERE id = ?`,
        [
          next.title,
          next.isPublished ? 1 : 0,
          next.durationSec,
          next.questionsPerPage,
          next.correctMarks,
          next.wrongMarks,
          next.unansweredMarks,
          next.coinPrice ?? null,
          next.allocation ? JSON.stringify(next.allocation) : null,
          next.totalQuestions,
          next.opensAt ? new Date(next.opensAt) : null,
          next.closesAt ? new Date(next.closesAt) : null,
          next.isWeeklyOpen ? 1 : 0,
          now,
          id,
        ]
      );
      return this.getById(id);
    },

    async clearWeeklyOpenFlags(keepId) {
      if (keepId) {
        await pool.query('UPDATE mock_tests SET is_weekly_open = 0 WHERE id <> ?', [keepId]);
      } else {
        await pool.query('UPDATE mock_tests SET is_weekly_open = 0');
      }
    },

    async deleteOne(id) {
      const questionIds = await loadQuestionIds(id);
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();
        await conn.query('DELETE FROM mock_questions WHERE mock_id = ?', [id]);
        const [result] = await conn.query<ResultSetHeader>('DELETE FROM mock_tests WHERE id = ?', [
          id,
        ]);
        await conn.commit();
        return { deleted: result.affectedRows > 0, questionIds };
      } catch (err) {
        await conn.rollback();
        throw err;
      } finally {
        conn.release();
      }
    },

    async createImportBatch(input: CreateMockBatchInput) {
      const now = new Date();
      await pool.query(
        `INSERT INTO mock_import_batches (
          id, label, filename, imported_by_email, imported_by_name, mock_count, error_count, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          input.id,
          input.label,
          input.filename ?? null,
          input.importedByEmail,
          input.importedByName,
          input.mockCount,
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
        mockCount: input.mockCount,
        errorCount: input.errorCount,
        createdAt: now.toISOString(),
      };
    },

    async listImportBatches() {
      const [rows] = await pool.query<BatchRow[]>(
        'SELECT * FROM mock_import_batches ORDER BY created_at DESC'
      );
      return rows.map(mapBatch);
    },

    async updateImportBatchMeta(id, patch) {
      const [rows] = await pool.query<BatchRow[]>(
        'SELECT * FROM mock_import_batches WHERE id = ?',
        [id]
      );
      if (!rows[0]) return null;
      const current = mapBatch(rows[0]);
      const label =
        typeof patch.label === 'string' && patch.label.trim()
          ? patch.label.trim()
          : current.label;
      const filename =
        patch.filename === undefined
          ? current.filename
          : typeof patch.filename === 'string' && patch.filename.trim()
            ? patch.filename.trim()
            : null;
      await pool.query('UPDATE mock_import_batches SET label = ?, filename = ? WHERE id = ?', [
        label,
        filename,
        id,
      ]);
      const [next] = await pool.query<BatchRow[]>(
        'SELECT * FROM mock_import_batches WHERE id = ?',
        [id]
      );
      return next[0] ? mapBatch(next[0]) : null;
    },

    async deleteImportBatch(id) {
      const [mocks] = await pool.query<RowDataPacket[]>(
        'SELECT id FROM mock_tests WHERE import_batch_id = ?',
        [id]
      );
      const questionIds = [
        ...new Set(
          (
            await Promise.all(mocks.map((m) => loadQuestionIds(String(m.id))))
          ).flat()
        ),
      ];
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();
        for (const m of mocks) {
          await conn.query('DELETE FROM mock_questions WHERE mock_id = ?', [m.id]);
          await conn.query('DELETE FROM mock_tests WHERE id = ?', [m.id]);
        }
        await conn.query('DELETE FROM mock_import_batches WHERE id = ?', [id]);
        await conn.commit();
        return { deletedMocks: mocks.length, questionIds };
      } catch (err) {
        await conn.rollback();
        throw err;
      } finally {
        conn.release();
      }
    },

    async filterQuestionIdsLinkedToMocks(questionIds) {
      if (questionIds.length === 0) return [];
      const placeholders = questionIds.map(() => '?').join(',');
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT DISTINCT question_id FROM mock_questions WHERE question_id IN (${placeholders})`,
        questionIds
      );
      return rows.map((r) => String(r.question_id));
    },

    async close() {
      await pool.end();
    },
  };
}
