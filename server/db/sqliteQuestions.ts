import fs from 'fs';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';
import type { ImportBatchRecord, QuestionRecord, SubjectCount, SubjectName } from '../questionsDomain.ts';
import { SUBJECTS } from '../questionsDomain.ts';
import type { ChapterCount, CreateBatchInput, QuestionsRepository } from './types.ts';
import { emptySubjectCounts } from './types.ts';

type Row = {
  id: string;
  subject: string;
  chapter: string;
  stem: string;
  image_url: string | null;
  options_json: string;
  option_images_json: string | null;
  correct_option_key: string;
  explanation: string;
  tags_json: string;
  language: string;
  status: string;
  source: string | null;
  flag_count: number;
  batch_id: string | null;
  created_at: string;
  updated_at: string;
};

type BatchRow = {
  id: string;
  label: string;
  filename: string | null;
  imported_by_email: string;
  imported_by_name: string;
  question_count: number;
  error_count: number;
  created_at: string;
};

function mapRow(row: Row): QuestionRecord {
  let optionImages: QuestionRecord['optionImages'];
  if (row.option_images_json) {
    try {
      optionImages = JSON.parse(row.option_images_json);
    } catch {
      optionImages = undefined;
    }
  }
  return {
    id: row.id,
    subject: row.subject as SubjectName,
    chapter: row.chapter,
    stem: row.stem,
    imageUrl: row.image_url || undefined,
    options: JSON.parse(row.options_json),
    optionImages,
    correctOptionKey: row.correct_option_key as QuestionRecord['correctOptionKey'],
    explanation: row.explanation,
    tags: JSON.parse(row.tags_json || '[]'),
    language: row.language === 'ne' ? 'ne' : 'en',
    status: row.status as QuestionRecord['status'],
    source: row.source || undefined,
    flagCount: Number(row.flag_count) || 0,
    batchId: row.batch_id || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapBatch(row: BatchRow): ImportBatchRecord {
  return {
    id: row.id,
    label: row.label,
    filename: row.filename,
    importedByEmail: row.imported_by_email,
    importedByName: row.imported_by_name,
    questionCount: Number(row.question_count) || 0,
    errorCount: Number(row.error_count) || 0,
    createdAt: row.created_at,
  };
}

function columnExists(db: DatabaseSync, table: string, column: string): boolean {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  return cols.some((c) => c.name === column);
}

export function createSqliteQuestionsRepo(dbFilePath: string): QuestionsRepository {
  const dir = path.dirname(dbFilePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const db = new DatabaseSync(dbFilePath);

  return {
    driver: 'sqlite',

    async ensureSchema() {
      db.exec(`
        CREATE TABLE IF NOT EXISTS import_batches (
          id TEXT PRIMARY KEY,
          label TEXT NOT NULL,
          filename TEXT NULL,
          imported_by_email TEXT NOT NULL,
          imported_by_name TEXT NOT NULL,
          question_count INTEGER NOT NULL DEFAULT 0,
          error_count INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS questions (
          id TEXT PRIMARY KEY,
          subject TEXT NOT NULL,
          chapter TEXT NOT NULL,
          stem TEXT NOT NULL,
          options_json TEXT NOT NULL,
          correct_option_key TEXT NOT NULL CHECK (correct_option_key IN ('A','B','C','D')),
          explanation TEXT NOT NULL,
          tags_json TEXT NOT NULL DEFAULT '[]',
          language TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en','ne')),
          status TEXT NOT NULL DEFAULT 'published'
            CHECK (status IN ('pending_review','published','flagged')),
          source TEXT NULL,
          flag_count INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
      `);
      if (!columnExists(db, 'questions', 'batch_id')) {
        db.exec('ALTER TABLE questions ADD COLUMN batch_id TEXT NULL');
      }
      if (!columnExists(db, 'questions', 'image_url')) {
        db.exec('ALTER TABLE questions ADD COLUMN image_url TEXT NULL');
      }
      if (!columnExists(db, 'questions', 'option_images_json')) {
        db.exec('ALTER TABLE questions ADD COLUMN option_images_json TEXT NULL');
      }
      db.exec(`
        CREATE INDEX IF NOT EXISTS idx_questions_subject ON questions(subject);
        CREATE INDEX IF NOT EXISTS idx_questions_status_subject ON questions(status, subject);
        CREATE INDEX IF NOT EXISTS idx_questions_batch ON questions(batch_id);
      `);
    },

    async list(opts) {
      if (opts?.batchId && opts?.status) {
        const rows = db
          .prepare(
            'SELECT * FROM questions WHERE batch_id = ? AND status = ? ORDER BY created_at DESC'
          )
          .all(opts.batchId, opts.status) as Row[];
        return rows.map(mapRow);
      }
      if (opts?.batchId) {
        const rows = db
          .prepare('SELECT * FROM questions WHERE batch_id = ? ORDER BY created_at DESC')
          .all(opts.batchId) as Row[];
        return rows.map(mapRow);
      }
      if (opts?.status) {
        const rows = db
          .prepare('SELECT * FROM questions WHERE status = ? ORDER BY created_at DESC')
          .all(opts.status) as Row[];
        return rows.map(mapRow);
      }
      const rows = db.prepare('SELECT * FROM questions ORDER BY created_at DESC').all() as Row[];
      return rows.map(mapRow);
    },

    async getByIds(ids) {
      if (ids.length === 0) return [];
      const byId = new Map<string, QuestionRecord>();
      for (const id of ids) {
        const row = db.prepare('SELECT * FROM questions WHERE id = ?').get(id) as Row | undefined;
        if (row) byId.set(id, mapRow(row));
      }
      return ids.map((id) => byId.get(id)).filter((q): q is QuestionRecord => Boolean(q));
    },

    async listPool(opts) {
      const status = opts.status || 'published';
      let rows: Row[];
      if (opts.chapter) {
        rows = db
          .prepare(
            'SELECT * FROM questions WHERE status = ? AND subject = ? AND chapter = ? COLLATE NOCASE'
          )
          .all(status, opts.subject, opts.chapter) as Row[];
      } else {
        rows = db
          .prepare('SELECT * FROM questions WHERE status = ? AND subject = ?')
          .all(status, opts.subject) as Row[];
      }
      const exclude = new Set(opts.excludeIds || []);
      return rows.map(mapRow).filter((q) => !exclude.has(q.id));
    },

    async insertOne(question) {
      const now = new Date().toISOString();
      db.prepare(
        `INSERT INTO questions (
          id, subject, chapter, stem, image_url, options_json, option_images_json, correct_option_key, explanation,
          tags_json, language, status, source, flag_count, batch_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        question.id,
        question.subject,
        question.chapter,
        question.stem,
        question.imageUrl ?? null,
        JSON.stringify(question.options),
        question.optionImages ? JSON.stringify(question.optionImages) : null,
        question.correctOptionKey,
        question.explanation,
        JSON.stringify(question.tags),
        question.language,
        question.status,
        question.source ?? null,
        question.flagCount,
        question.batchId ?? null,
        now,
        now
      );
      return { ...question, createdAt: now, updatedAt: now };
    },

    async insertMany(questions) {
      if (questions.length === 0) return 0;
      const now = new Date().toISOString();
      const stmt = db.prepare(
        `INSERT OR REPLACE INTO questions (
          id, subject, chapter, stem, image_url, options_json, option_images_json, correct_option_key, explanation,
          tags_json, language, status, source, flag_count, batch_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );
      const tx = db.prepare('BEGIN');
      const commit = db.prepare('COMMIT');
      const rollback = db.prepare('ROLLBACK');
      tx.run();
      try {
        for (const q of questions) {
          stmt.run(
            q.id,
            q.subject,
            q.chapter,
            q.stem,
            q.imageUrl ?? null,
            JSON.stringify(q.options),
            q.optionImages ? JSON.stringify(q.optionImages) : null,
            q.correctOptionKey,
            q.explanation,
            JSON.stringify(q.tags),
            q.language,
            q.status,
            q.source ?? null,
            q.flagCount,
            q.batchId ?? null,
            now,
            now
          );
        }
        commit.run();
      } catch (err) {
        rollback.run();
        throw err;
      }
      return questions.length;
    },

    async updateOne(question) {
      const existing = db.prepare('SELECT * FROM questions WHERE id = ?').get(question.id) as Row | undefined;
      if (!existing) return null;
      const now = new Date().toISOString();
      const batchId = question.batchId !== undefined ? question.batchId ?? null : existing.batch_id;
      db.prepare(
        `UPDATE questions SET
          subject = ?, chapter = ?, stem = ?, image_url = ?, options_json = ?, option_images_json = ?, correct_option_key = ?,
          explanation = ?, tags_json = ?, language = ?, status = ?, source = ?,
          flag_count = ?, batch_id = ?, updated_at = ?
         WHERE id = ?`
      ).run(
        question.subject,
        question.chapter,
        question.stem,
        question.imageUrl ?? null,
        JSON.stringify(question.options),
        question.optionImages ? JSON.stringify(question.optionImages) : null,
        question.correctOptionKey,
        question.explanation,
        JSON.stringify(question.tags),
        question.language,
        question.status,
        question.source ?? null,
        question.flagCount,
        batchId,
        now,
        question.id
      );
      return {
        ...question,
        batchId: batchId || undefined,
        createdAt: existing.created_at,
        updatedAt: now,
      };
    },

    async deleteOne(id) {
      const result = db.prepare('DELETE FROM questions WHERE id = ?').run(id);
      return Number(result.changes) > 0;
    },

    async createBatch(input: CreateBatchInput) {
      const now = new Date().toISOString();
      db.prepare(
        `INSERT INTO import_batches (
          id, label, filename, imported_by_email, imported_by_name, question_count, error_count, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        input.id,
        input.label,
        input.filename ?? null,
        input.importedByEmail,
        input.importedByName,
        input.questionCount,
        input.errorCount,
        now
      );
      return {
        id: input.id,
        label: input.label,
        filename: input.filename ?? null,
        importedByEmail: input.importedByEmail,
        importedByName: input.importedByName,
        questionCount: input.questionCount,
        errorCount: input.errorCount,
        createdAt: now,
      };
    },

    async listBatches() {
      const rows = db
        .prepare('SELECT * FROM import_batches ORDER BY created_at DESC')
        .all() as BatchRow[];
      return rows.map(mapBatch);
    },

    async getBatch(id) {
      const row = db.prepare('SELECT * FROM import_batches WHERE id = ?').get(id) as BatchRow | undefined;
      return row ? mapBatch(row) : null;
    },

    async deleteBatch(id) {
      const tx = db.prepare('BEGIN');
      const commit = db.prepare('COMMIT');
      const rollback = db.prepare('ROLLBACK');
      tx.run();
      try {
        const delQ = db.prepare('DELETE FROM questions WHERE batch_id = ?').run(id);
        db.prepare('DELETE FROM import_batches WHERE id = ?').run(id);
        commit.run();
        return { deletedQuestions: Number(delQ.changes) || 0 };
      } catch (err) {
        rollback.run();
        throw err;
      }
    },

    async countsBySubject(opts) {
      const base = emptySubjectCounts();
      const rows = opts?.status
        ? (db
            .prepare('SELECT subject, COUNT(*) AS count FROM questions WHERE status = ? GROUP BY subject')
            .all(opts.status) as { subject: string; count: number }[])
        : (db
            .prepare('SELECT subject, COUNT(*) AS count FROM questions GROUP BY subject')
            .all() as { subject: string; count: number }[]);

      const map = new Map(base.map((b) => [b.subject, b.count]));
      for (const row of rows) {
        if ((SUBJECTS as readonly string[]).includes(row.subject)) {
          map.set(row.subject as SubjectName, Number(row.count));
        }
      }
      return SUBJECTS.map((subject) => ({ subject, count: map.get(subject) || 0 }));
    },

    async countsByChapter(opts) {
      let rows: { subject: string; chapter: string; count: number }[];
      if (opts?.status && opts?.subject) {
        rows = db
          .prepare(
            'SELECT subject, chapter, COUNT(*) AS count FROM questions WHERE status = ? AND subject = ? GROUP BY subject, chapter ORDER BY chapter'
          )
          .all(opts.status, opts.subject) as { subject: string; chapter: string; count: number }[];
      } else if (opts?.status) {
        rows = db
          .prepare(
            'SELECT subject, chapter, COUNT(*) AS count FROM questions WHERE status = ? GROUP BY subject, chapter ORDER BY subject, chapter'
          )
          .all(opts.status) as { subject: string; chapter: string; count: number }[];
      } else if (opts?.subject) {
        rows = db
          .prepare(
            'SELECT subject, chapter, COUNT(*) AS count FROM questions WHERE subject = ? GROUP BY subject, chapter ORDER BY chapter'
          )
          .all(opts.subject) as { subject: string; chapter: string; count: number }[];
      } else {
        rows = db
          .prepare(
            'SELECT subject, chapter, COUNT(*) AS count FROM questions GROUP BY subject, chapter ORDER BY subject, chapter'
          )
          .all() as { subject: string; chapter: string; count: number }[];
      }
      return rows
        .filter((r) => (SUBJECTS as readonly string[]).includes(r.subject))
        .map(
          (r): ChapterCount => ({
            subject: r.subject as SubjectName,
            chapter: r.chapter,
            count: Number(r.count) || 0,
          })
        );
    },

    async countAll() {
      const row = db.prepare('SELECT COUNT(*) AS count FROM questions').get() as { count: number };
      return Number(row.count) || 0;
    },

    async close() {
      db.close();
    },
  };
}
