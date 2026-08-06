import fs from 'fs';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';
import type {
  MockAllocation,
  MockImportBatchRecord,
  MockMode,
  MockRecord,
  MockScope,
} from '../mocksDomain.ts';
import { isSubject } from '../questionsDomain.ts';
import type { CreateMockBatchInput, MocksRepository } from './types.ts';

type MockRow = {
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
  is_published: number;
  coin_price: number | null;
  year: string | null;
  allocation_json: string | null;
  import_batch_id: string | null;
  opens_at: string | null;
  closes_at: string | null;
  is_weekly_open: number;
  created_at: string;
  updated_at: string;
};

type BatchRow = {
  id: string;
  label: string;
  filename: string | null;
  imported_by_email: string;
  imported_by_name: string;
  mock_count: number;
  error_count: number;
  created_at: string;
};

function mapSubject(value: string | null): MockRecord['subject'] {
  if (!value) return undefined;
  if (value === 'Combined') return 'Combined';
  if (isSubject(value)) return value;
  return undefined;
}

function mapRow(row: MockRow, questionIds?: string[]): MockRecord {
  let allocation: MockAllocation | undefined;
  if (row.allocation_json) {
    try {
      allocation = JSON.parse(row.allocation_json) as MockAllocation;
    } catch {
      allocation = undefined;
    }
  }
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
    opensAt: row.opens_at || null,
    closesAt: row.closes_at || null,
    isWeeklyOpen: Boolean(row.is_weekly_open),
    questionIds,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
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
    createdAt: row.created_at,
  };
}

export function createSqliteMocksRepo(dbFilePath: string): MocksRepository {
  const dir = path.dirname(dbFilePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const db = new DatabaseSync(dbFilePath);

  function loadQuestionIds(mockId: string): string[] {
    const rows = db
      .prepare('SELECT question_id FROM mock_questions WHERE mock_id = ? ORDER BY position ASC')
      .all(mockId) as { question_id: string }[];
    return rows.map((r) => r.question_id);
  }

  function hydrate(row: MockRow): MockRecord {
    const questionIds = row.mode === 'fixed' ? loadQuestionIds(row.id) : undefined;
    return mapRow(row, questionIds);
  }

  return {
    driver: 'sqlite',

    async ensureSchema() {
      db.exec(`
        CREATE TABLE IF NOT EXISTS mock_import_batches (
          id TEXT PRIMARY KEY,
          label TEXT NOT NULL,
          filename TEXT NULL,
          imported_by_email TEXT NOT NULL,
          imported_by_name TEXT NOT NULL,
          mock_count INTEGER NOT NULL DEFAULT 0,
          error_count INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS mock_tests (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          exam_type TEXT NOT NULL DEFAULT 'Nepal CEE',
          mode TEXT NOT NULL CHECK (mode IN ('fixed','dynamic')),
          scope TEXT NOT NULL CHECK (scope IN ('full','subject','chapter')),
          subject TEXT NULL,
          chapter_name TEXT NULL,
          duration_sec INTEGER NOT NULL,
          total_questions INTEGER NOT NULL,
          questions_per_page INTEGER NOT NULL DEFAULT 20,
          correct_marks REAL NOT NULL DEFAULT 1,
          wrong_marks REAL NOT NULL DEFAULT -0.25,
          unanswered_marks REAL NOT NULL DEFAULT 0,
          is_published INTEGER NOT NULL DEFAULT 1,
          coin_price INTEGER NULL,
          year TEXT NULL,
          allocation_json TEXT NULL,
          import_batch_id TEXT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS mock_questions (
          mock_id TEXT NOT NULL,
          question_id TEXT NOT NULL,
          position INTEGER NOT NULL,
          PRIMARY KEY (mock_id, question_id)
        );
        CREATE INDEX IF NOT EXISTS idx_mocks_published ON mock_tests(is_published);
        CREATE INDEX IF NOT EXISTS idx_mocks_mode_scope ON mock_tests(mode, scope);
        CREATE INDEX IF NOT EXISTS idx_mock_questions_mock ON mock_questions(mock_id);
      `);
      const cols = db.prepare('PRAGMA table_info(mock_tests)').all() as { name: string }[];
      const names = new Set(cols.map((c) => c.name));
      if (!names.has('opens_at')) {
        db.exec('ALTER TABLE mock_tests ADD COLUMN opens_at TEXT NULL');
      }
      if (!names.has('closes_at')) {
        db.exec('ALTER TABLE mock_tests ADD COLUMN closes_at TEXT NULL');
      }
      if (!names.has('is_weekly_open')) {
        db.exec('ALTER TABLE mock_tests ADD COLUMN is_weekly_open INTEGER NOT NULL DEFAULT 0');
      }
      db.exec('CREATE INDEX IF NOT EXISTS idx_mocks_weekly ON mock_tests(is_weekly_open)');
    },

    async list(opts) {
      const clauses: string[] = [];
      const params: (string | number)[] = [];
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
      const rows = db
        .prepare(`SELECT * FROM mock_tests ${where} ORDER BY title COLLATE NOCASE ASC, id ASC`)
        .all(...params) as MockRow[];
      return rows.map(hydrate);
    },

    async getById(id) {
      const row = db.prepare('SELECT * FROM mock_tests WHERE id = ?').get(id) as MockRow | undefined;
      return row ? hydrate(row) : null;
    },

    async insertFixed(mock) {
      const now = new Date().toISOString();
      const tx = db.prepare('BEGIN');
      const commit = db.prepare('COMMIT');
      const rollback = db.prepare('ROLLBACK');
      tx.run();
      try {
        db.prepare(
          `INSERT INTO mock_tests (
            id, title, exam_type, mode, scope, subject, chapter_name, duration_sec,
            total_questions, questions_per_page, correct_marks, wrong_marks, unanswered_marks,
            is_published, coin_price, year, allocation_json, import_batch_id,
            opens_at, closes_at, is_weekly_open, created_at, updated_at
          ) VALUES (?, ?, ?, 'fixed', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?)`
        ).run(
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
          mock.opensAt ?? null,
          mock.closesAt ?? null,
          mock.isWeeklyOpen ? 1 : 0,
          now,
          now
        );
        const link = db.prepare(
          'INSERT INTO mock_questions (mock_id, question_id, position) VALUES (?, ?, ?)'
        );
        mock.questionIds.forEach((qid, i) => link.run(mock.id, qid, i));
        commit.run();
      } catch (err) {
        rollback.run();
        throw err;
      }
      return (await this.getById(mock.id))!;
    },

    async insertDynamic(mock) {
      const now = new Date().toISOString();
      db.prepare(
        `INSERT INTO mock_tests (
          id, title, exam_type, mode, scope, subject, chapter_name, duration_sec,
          total_questions, questions_per_page, correct_marks, wrong_marks, unanswered_marks,
          is_published, coin_price, year, allocation_json, import_batch_id,
          opens_at, closes_at, is_weekly_open, created_at, updated_at
        ) VALUES (?, ?, ?, 'dynamic', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, ?)`
      ).run(
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
        mock.opensAt ?? null,
        mock.closesAt ?? null,
        mock.isWeeklyOpen ? 1 : 0,
        now,
        now
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
      const now = new Date().toISOString();
      db.prepare(
        `UPDATE mock_tests SET
          title = ?, is_published = ?, duration_sec = ?, questions_per_page = ?,
          correct_marks = ?, wrong_marks = ?, unanswered_marks = ?, coin_price = ?,
          allocation_json = ?, total_questions = ?,
          opens_at = ?, closes_at = ?, is_weekly_open = ?, updated_at = ?
         WHERE id = ?`
      ).run(
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
        next.opensAt ?? null,
        next.closesAt ?? null,
        next.isWeeklyOpen ? 1 : 0,
        now,
        id
      );
      return this.getById(id);
    },

    async clearWeeklyOpenFlags(keepId) {
      if (keepId) {
        db.prepare('UPDATE mock_tests SET is_weekly_open = 0 WHERE id <> ?').run(keepId);
      } else {
        db.prepare('UPDATE mock_tests SET is_weekly_open = 0').run();
      }
    },

    async deleteOne(id) {
      const questionIds = loadQuestionIds(id);
      const tx = db.prepare('BEGIN');
      const commit = db.prepare('COMMIT');
      const rollback = db.prepare('ROLLBACK');
      tx.run();
      try {
        db.prepare('DELETE FROM mock_questions WHERE mock_id = ?').run(id);
        const result = db.prepare('DELETE FROM mock_tests WHERE id = ?').run(id);
        commit.run();
        return { deleted: Number(result.changes) > 0, questionIds };
      } catch (err) {
        rollback.run();
        throw err;
      }
    },

    async createImportBatch(input: CreateMockBatchInput) {
      const now = new Date().toISOString();
      db.prepare(
        `INSERT INTO mock_import_batches (
          id, label, filename, imported_by_email, imported_by_name, mock_count, error_count, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        input.id,
        input.label,
        input.filename ?? null,
        input.importedByEmail,
        input.importedByName,
        input.mockCount,
        input.errorCount,
        now
      );
      return {
        id: input.id,
        label: input.label,
        filename: input.filename ?? null,
        importedByEmail: input.importedByEmail,
        importedByName: input.importedByName,
        mockCount: input.mockCount,
        errorCount: input.errorCount,
        createdAt: now,
      };
    },

    async listImportBatches() {
      const rows = db
        .prepare('SELECT * FROM mock_import_batches ORDER BY created_at DESC')
        .all() as BatchRow[];
      return rows.map(mapBatch);
    },

    async updateImportBatchMeta(id, patch) {
      const row = db
        .prepare('SELECT * FROM mock_import_batches WHERE id = ?')
        .get(id) as BatchRow | undefined;
      if (!row) return null;
      const current = mapBatch(row);
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
      db.prepare('UPDATE mock_import_batches SET label = ?, filename = ? WHERE id = ?').run(
        label,
        filename,
        id
      );
      const next = db
        .prepare('SELECT * FROM mock_import_batches WHERE id = ?')
        .get(id) as BatchRow | undefined;
      return next ? mapBatch(next) : null;
    },

    async deleteImportBatch(id) {
      const mocks = db
        .prepare('SELECT id FROM mock_tests WHERE import_batch_id = ?')
        .all(id) as { id: string }[];
      const questionIds = [
        ...new Set(mocks.flatMap((m) => loadQuestionIds(m.id))),
      ];
      const tx = db.prepare('BEGIN');
      const commit = db.prepare('COMMIT');
      const rollback = db.prepare('ROLLBACK');
      tx.run();
      try {
        for (const m of mocks) {
          db.prepare('DELETE FROM mock_questions WHERE mock_id = ?').run(m.id);
          db.prepare('DELETE FROM mock_tests WHERE id = ?').run(m.id);
        }
        db.prepare('DELETE FROM mock_import_batches WHERE id = ?').run(id);
        commit.run();
        return { deletedMocks: mocks.length, questionIds };
      } catch (err) {
        rollback.run();
        throw err;
      }
    },

    async filterQuestionIdsLinkedToMocks(questionIds) {
      if (questionIds.length === 0) return [];
      const linked = new Set<string>();
      const stmt = db.prepare(
        'SELECT 1 AS ok FROM mock_questions WHERE question_id = ? LIMIT 1'
      );
      for (const qid of questionIds) {
        const row = stmt.get(qid) as { ok: number } | undefined;
        if (row) linked.add(qid);
      }
      return [...linked];
    },

    async close() {
      db.close();
    },
  };
}
