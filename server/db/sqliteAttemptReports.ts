import fs from 'fs';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';
import type {
  AttemptReportRecord,
  AttemptReportsRepository,
  CreateAttemptReportInput,
} from './types.ts';

type ReportRow = {
  id: string;
  clerk_user_id: string;
  user_id: string;
  attempt_id: string;
  mock_id: string;
  mock_title: string;
  completed_at: string;
  overall_score: number;
  max_score: number;
  report_json: string;
  created_at: string;
};

function mapRow(row: ReportRow): AttemptReportRecord {
  let report: AttemptReportRecord['report'] = {
    id: row.id,
    userId: row.user_id,
    attemptId: row.attempt_id,
    mockId: row.mock_id,
    mockTitle: row.mock_title,
    examType: 'Nepal CEE',
    completedAt: row.completed_at,
    overallScore: Number(row.overall_score),
    maxScore: Number(row.max_score),
    accuracyPercentage: 0,
    totalAttempted: 0,
    correctCount: 0,
    wrongCount: 0,
    skippedCount: 0,
    timeSpentSec: 0,
    predictedRank: 0,
    rankBand: [0, 0],
    percentile: 0,
    subjectScores: [],
    chapterScores: [],
    mistakeAnalysis: {
      wrongVsSkippedRatio: '0:0',
      slowCorrectCount: 0,
      speedSecPerQuestion: 0,
    },
    targetScore: 0,
    targetGap: 0,
    recommendations: [],
    shareToken: '',
  };
  try {
    report = JSON.parse(row.report_json) as AttemptReportRecord['report'];
  } catch {
    /* keep fallback */
  }
  return {
    id: row.id,
    clerkUserId: row.clerk_user_id,
    userId: row.user_id,
    attemptId: row.attempt_id,
    mockId: row.mock_id,
    mockTitle: row.mock_title,
    completedAt: row.completed_at,
    overallScore: Number(row.overall_score),
    maxScore: Number(row.max_score),
    report,
    createdAt: row.created_at,
  };
}

export function createSqliteAttemptReportsRepo(
  dbFilePath: string
): AttemptReportsRepository {
  const dir = path.dirname(dbFilePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const db = new DatabaseSync(dbFilePath);

  return {
    driver: 'sqlite',

    async ensureSchema() {
      db.exec(`
        CREATE TABLE IF NOT EXISTS attempt_reports (
          id TEXT PRIMARY KEY,
          clerk_user_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          attempt_id TEXT NOT NULL,
          mock_id TEXT NOT NULL,
          mock_title TEXT NOT NULL,
          completed_at TEXT NOT NULL,
          overall_score REAL NOT NULL,
          max_score REAL NOT NULL,
          report_json TEXT NOT NULL,
          created_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_attempt_reports_clerk_completed
          ON attempt_reports (clerk_user_id, completed_at DESC);
        CREATE INDEX IF NOT EXISTS idx_attempt_reports_mock
          ON attempt_reports (mock_id);
      `);
    },

    async insert(input: CreateAttemptReportInput) {
      const now = new Date().toISOString();
      const completedAt = input.completedAt || now;
      db.prepare(
        `INSERT INTO attempt_reports
          (id, clerk_user_id, user_id, attempt_id, mock_id, mock_title,
           completed_at, overall_score, max_score, report_json, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        input.id,
        input.clerkUserId,
        input.userId,
        input.attemptId,
        input.mockId,
        input.mockTitle,
        completedAt,
        input.overallScore,
        input.maxScore,
        JSON.stringify(input.report),
        now
      );
      return (await this.getById(input.id))!;
    },

    async listByClerkUserId(clerkUserId) {
      const rows = db
        .prepare(
          `SELECT * FROM attempt_reports
           WHERE clerk_user_id = ?
           ORDER BY completed_at DESC`
        )
        .all(clerkUserId) as ReportRow[];
      return rows.map(mapRow);
    },

    async listByMockId(mockId) {
      const rows = db
        .prepare(
          `SELECT * FROM attempt_reports
           WHERE mock_id = ?
           ORDER BY overall_score DESC, completed_at ASC`
        )
        .all(mockId) as ReportRow[];
      return rows.map(mapRow);
    },

    async existsByClerkUserIdAndMockId(clerkUserId, mockId) {
      const row = db
        .prepare(
          `SELECT id FROM attempt_reports
           WHERE clerk_user_id = ? AND mock_id = ?
           LIMIT 1`
        )
        .get(clerkUserId, mockId) as { id: string } | undefined;
      return Boolean(row);
    },

    async listAll() {
      const rows = db
        .prepare(`SELECT * FROM attempt_reports ORDER BY completed_at DESC`)
        .all() as ReportRow[];
      return rows.map(mapRow);
    },

    async getById(id) {
      const row = db
        .prepare('SELECT * FROM attempt_reports WHERE id = ?')
        .get(id) as ReportRow | undefined;
      return row ? mapRow(row) : null;
    },

    async close() {
      db.close();
    },
  };
}
