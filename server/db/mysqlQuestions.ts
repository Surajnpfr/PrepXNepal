import mysql, { type Pool, type RowDataPacket, type ResultSetHeader } from 'mysql2/promise';
import type { ImportBatchRecord, QuestionRecord, SubjectCount, SubjectName } from '../questionsDomain.ts';
import { SUBJECTS } from '../questionsDomain.ts';
import type { ChapterCount, CreateBatchInput, QuestionsRepository } from './types.ts';
import { emptySubjectCounts } from './types.ts';

type DbRow = RowDataPacket & {
  id: string;
  subject: string;
  chapter: string;
  stem: string;
  image_url: string | null;
  options_json: string | QuestionRecord['options'];
  option_images_json: string | QuestionRecord['optionImages'] | null;
  correct_option_key: string;
  explanation: string;
  tags_json: string | string[];
  language: string;
  status: string;
  source: string | null;
  flag_count: number;
  batch_id: string | null;
  created_at: Date | string;
  updated_at: Date | string;
};

type BatchRow = RowDataPacket & {
  id: string;
  label: string;
  filename: string | null;
  imported_by_email: string;
  imported_by_name: string;
  question_count: number;
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

function mapRow(row: DbRow): QuestionRecord {
  const optionImages = parseJson<QuestionRecord['optionImages'] | null>(
    row.option_images_json,
    null
  );
  return {
    id: row.id,
    subject: row.subject as SubjectName,
    chapter: row.chapter,
    stem: row.stem,
    imageUrl: row.image_url || undefined,
    options: parseJson(row.options_json, { A: '', B: '', C: '', D: '' }),
    optionImages: optionImages || undefined,
    correctOptionKey: row.correct_option_key as QuestionRecord['correctOptionKey'],
    explanation: row.explanation,
    tags: parseJson(row.tags_json, [] as string[]),
    language: row.language === 'ne' ? 'ne' : 'en',
    status: row.status as QuestionRecord['status'],
    source: row.source || undefined,
    flagCount: Number(row.flag_count) || 0,
    batchId: row.batch_id || undefined,
    createdAt: asIso(row.created_at),
    updatedAt: asIso(row.updated_at),
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
    createdAt: asIso(row.created_at),
  };
}

export function createMysqlQuestionsRepo(pool: Pool): QuestionsRepository {
  return {
    driver: 'mysql',

    async ensureSchema() {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS import_batches (
          id VARCHAR(64) PRIMARY KEY,
          label VARCHAR(255) NOT NULL,
          filename VARCHAR(255) NULL,
          imported_by_email VARCHAR(255) NOT NULL,
          imported_by_name VARCHAR(255) NOT NULL,
          question_count INT NOT NULL DEFAULT 0,
          error_count INT NOT NULL DEFAULT 0,
          created_at DATETIME(3) NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS questions (
          id VARCHAR(64) PRIMARY KEY,
          subject VARCHAR(32) NOT NULL,
          chapter VARCHAR(191) NOT NULL,
          stem TEXT NOT NULL,
          options_json JSON NOT NULL,
          correct_option_key ENUM('A','B','C','D') NOT NULL,
          explanation TEXT NOT NULL,
          tags_json JSON NOT NULL,
          language ENUM('en','ne') NOT NULL DEFAULT 'en',
          status ENUM('pending_review','published','flagged') NOT NULL DEFAULT 'published',
          source VARCHAR(255) NULL,
          flag_count INT NOT NULL DEFAULT 0,
          batch_id VARCHAR(64) NULL,
          created_at DATETIME(3) NOT NULL,
          updated_at DATETIME(3) NOT NULL,
          INDEX idx_questions_subject (subject),
          INDEX idx_questions_status_subject (status, subject),
          INDEX idx_questions_batch (batch_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
      try {
        await pool.query('ALTER TABLE questions ADD COLUMN batch_id VARCHAR(64) NULL');
      } catch {
        // column already exists
      }
      try {
        await pool.query('ALTER TABLE questions ADD COLUMN image_url TEXT NULL');
      } catch {
        // column already exists
      }
      try {
        await pool.query('ALTER TABLE questions ADD COLUMN option_images_json JSON NULL');
      } catch {
        // column already exists
      }
      try {
        await pool.query('CREATE INDEX idx_questions_batch ON questions(batch_id)');
      } catch {
        // index already exists
      }
    },

    async list(opts) {
      if (opts?.batchId && opts?.status) {
        const [rows] = await pool.query<DbRow[]>(
          'SELECT * FROM questions WHERE batch_id = ? AND status = ? ORDER BY created_at DESC',
          [opts.batchId, opts.status]
        );
        return rows.map(mapRow);
      }
      if (opts?.batchId) {
        const [rows] = await pool.query<DbRow[]>(
          'SELECT * FROM questions WHERE batch_id = ? ORDER BY created_at DESC',
          [opts.batchId]
        );
        return rows.map(mapRow);
      }
      if (opts?.status) {
        const [rows] = await pool.query<DbRow[]>(
          'SELECT * FROM questions WHERE status = ? ORDER BY created_at DESC',
          [opts.status]
        );
        return rows.map(mapRow);
      }
      const [rows] = await pool.query<DbRow[]>('SELECT * FROM questions ORDER BY created_at DESC');
      return rows.map(mapRow);
    },

    async getByIds(ids) {
      if (ids.length === 0) return [];
      const placeholders = ids.map(() => '?').join(',');
      const [rows] = await pool.query<DbRow[]>(
        `SELECT * FROM questions WHERE id IN (${placeholders})`,
        ids
      );
      const byId = new Map(rows.map((r) => [r.id, mapRow(r)]));
      return ids.map((id) => byId.get(id)).filter((q): q is QuestionRecord => Boolean(q));
    },

    async listPool(opts) {
      const status = opts.status || 'published';
      let rows: DbRow[];
      if (opts.chapter) {
        const [r] = await pool.query<DbRow[]>(
          'SELECT * FROM questions WHERE status = ? AND subject = ? AND chapter = ?',
          [status, opts.subject, opts.chapter]
        );
        rows = r;
      } else {
        const [r] = await pool.query<DbRow[]>(
          'SELECT * FROM questions WHERE status = ? AND subject = ?',
          [status, opts.subject]
        );
        rows = r;
      }
      const exclude = new Set(opts.excludeIds || []);
      return rows.map(mapRow).filter((q) => !exclude.has(q.id));
    },

    async insertOne(question) {
      const now = new Date();
      await pool.query<ResultSetHeader>(
        `INSERT INTO questions (
          id, subject, chapter, stem, image_url, options_json, option_images_json, correct_option_key, explanation,
          tags_json, language, status, source, flag_count, batch_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, CAST(? AS JSON), CAST(? AS JSON), ?, ?, CAST(? AS JSON), ?, ?, ?, ?, ?, ?, ?)`,
        [
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
          now,
        ]
      );
      return { ...question, createdAt: now.toISOString(), updatedAt: now.toISOString() };
    },

    async insertMany(questions) {
      if (questions.length === 0) return 0;
      const now = new Date();
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();
        for (const q of questions) {
          await conn.query(
            `INSERT INTO questions (
              id, subject, chapter, stem, image_url, options_json, option_images_json, correct_option_key, explanation,
              tags_json, language, status, source, flag_count, batch_id, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, CAST(? AS JSON), CAST(? AS JSON), ?, ?, CAST(? AS JSON), ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              subject=VALUES(subject),
              chapter=VALUES(chapter),
              stem=VALUES(stem),
              image_url=VALUES(image_url),
              options_json=VALUES(options_json),
              option_images_json=VALUES(option_images_json),
              correct_option_key=VALUES(correct_option_key),
              explanation=VALUES(explanation),
              tags_json=VALUES(tags_json),
              language=VALUES(language),
              status=VALUES(status),
              source=VALUES(source),
              flag_count=VALUES(flag_count),
              batch_id=VALUES(batch_id),
              updated_at=VALUES(updated_at)`,
            [
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
              now,
            ]
          );
        }
        await conn.commit();
      } catch (err) {
        await conn.rollback();
        throw err;
      } finally {
        conn.release();
      }
      return questions.length;
    },

    async updateOne(question) {
      const [existingRows] = await pool.query<DbRow[]>('SELECT * FROM questions WHERE id = ?', [
        question.id,
      ]);
      const existing = existingRows[0];
      if (!existing) return null;
      const now = new Date();
      const batchId =
        question.batchId !== undefined ? question.batchId ?? null : existing.batch_id;
      await pool.query(
        `UPDATE questions SET
          subject = ?, chapter = ?, stem = ?, image_url = ?, options_json = CAST(? AS JSON),
          option_images_json = CAST(? AS JSON), correct_option_key = ?,
          explanation = ?, tags_json = CAST(? AS JSON), language = ?, status = ?, source = ?,
          flag_count = ?, batch_id = ?, updated_at = ?
         WHERE id = ?`,
        [
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
          question.id,
        ]
      );
      return {
        ...question,
        batchId: batchId || undefined,
        createdAt: asIso(existing.created_at),
        updatedAt: now.toISOString(),
      };
    },

    async deleteOne(id) {
      const [result] = await pool.query<ResultSetHeader>('DELETE FROM questions WHERE id = ?', [id]);
      return result.affectedRows > 0;
    },

    async createBatch(input: CreateBatchInput) {
      const now = new Date();
      await pool.query(
        `INSERT INTO import_batches (
          id, label, filename, imported_by_email, imported_by_name, question_count, error_count, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          input.id,
          input.label,
          input.filename ?? null,
          input.importedByEmail,
          input.importedByName,
          input.questionCount,
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
        questionCount: input.questionCount,
        errorCount: input.errorCount,
        createdAt: now.toISOString(),
      };
    },

    async listBatches() {
      const [rows] = await pool.query<BatchRow[]>(
        'SELECT * FROM import_batches ORDER BY created_at DESC'
      );
      return rows.map(mapBatch);
    },

    async getBatch(id) {
      const [rows] = await pool.query<BatchRow[]>('SELECT * FROM import_batches WHERE id = ?', [id]);
      return rows[0] ? mapBatch(rows[0]) : null;
    },

    async updateBatchMeta(id, patch) {
      const existing = await this.getBatch(id);
      if (!existing) return null;
      const label =
        typeof patch.label === 'string' && patch.label.trim()
          ? patch.label.trim()
          : existing.label;
      const filename =
        patch.filename === undefined
          ? existing.filename
          : typeof patch.filename === 'string' && patch.filename.trim()
            ? patch.filename.trim()
            : null;
      await pool.query('UPDATE import_batches SET label = ?, filename = ? WHERE id = ?', [
        label,
        filename,
        id,
      ]);
      return this.getBatch(id);
    },

    async deleteBatch(id) {
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();
        const [delQ] = await conn.query<ResultSetHeader>('DELETE FROM questions WHERE batch_id = ?', [
          id,
        ]);
        await conn.query('DELETE FROM import_batches WHERE id = ?', [id]);
        await conn.commit();
        return { deletedQuestions: delQ.affectedRows || 0 };
      } catch (err) {
        await conn.rollback();
        throw err;
      } finally {
        conn.release();
      }
    },

    async countsBySubject(opts) {
      const base = emptySubjectCounts();
      const [rows] = opts?.status
        ? await pool.query<RowDataPacket[]>(
            'SELECT subject, COUNT(*) AS count FROM questions WHERE status = ? GROUP BY subject',
            [opts.status]
          )
        : await pool.query<RowDataPacket[]>('SELECT subject, COUNT(*) AS count FROM questions GROUP BY subject');

      const map = new Map(base.map((b) => [b.subject, b.count]));
      for (const row of rows) {
        if ((SUBJECTS as readonly string[]).includes(String(row.subject))) {
          map.set(row.subject as SubjectName, Number(row.count));
        }
      }
      return SUBJECTS.map((subject) => ({ subject, count: map.get(subject) || 0 }));
    },

    async countsByChapter(opts) {
      let rows: RowDataPacket[];
      if (opts?.status && opts?.subject) {
        [rows] = await pool.query<RowDataPacket[]>(
          'SELECT subject, chapter, COUNT(*) AS count FROM questions WHERE status = ? AND subject = ? GROUP BY subject, chapter ORDER BY chapter',
          [opts.status, opts.subject]
        );
      } else if (opts?.status) {
        [rows] = await pool.query<RowDataPacket[]>(
          'SELECT subject, chapter, COUNT(*) AS count FROM questions WHERE status = ? GROUP BY subject, chapter ORDER BY subject, chapter',
          [opts.status]
        );
      } else if (opts?.subject) {
        [rows] = await pool.query<RowDataPacket[]>(
          'SELECT subject, chapter, COUNT(*) AS count FROM questions WHERE subject = ? GROUP BY subject, chapter ORDER BY chapter',
          [opts.subject]
        );
      } else {
        [rows] = await pool.query<RowDataPacket[]>(
          'SELECT subject, chapter, COUNT(*) AS count FROM questions GROUP BY subject, chapter ORDER BY subject, chapter'
        );
      }
      return rows
        .filter((r) => (SUBJECTS as readonly string[]).includes(String(r.subject)))
        .map(
          (r): ChapterCount => ({
            subject: r.subject as SubjectName,
            chapter: String(r.chapter),
            count: Number(r.count) || 0,
          })
        );
    },

    async countAll() {
      const [rows] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) AS count FROM questions');
      return Number(rows[0]?.count) || 0;
    },

    async close() {
      await pool.end();
    },
  };
}

export function createMysqlPoolFromEnv() {
  const host = process.env.DB_HOST || process.env.MYSQL_HOST;
  const user = process.env.DB_USER || process.env.MYSQL_USER;
  const password = process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || '';
  const database = process.env.DB_NAME || process.env.MYSQL_DATABASE;
  const port = Number(process.env.DB_PORT || process.env.MYSQL_PORT || 3306);

  if (!host || !user || !database) {
    throw new Error('MySQL selected but DB_HOST / DB_USER / DB_NAME are incomplete');
  }

  return mysql.createPool({
    host,
    user,
    password,
    database,
    port,
    waitForConnections: true,
    connectionLimit: 5,
    namedPlaceholders: false,
  });
}
