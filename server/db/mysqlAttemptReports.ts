import type { Pool, RowDataPacket } from 'mysql2/promise';
import type {
  AttemptReportRecord,
  AttemptReportsRepository,
  CreateAttemptReportInput,
} from './types.ts';

type ReportRow = RowDataPacket & {
  id: string;
  clerk_user_id: string;
  user_id: string;
  attempt_id: string;
  mock_id: string;
  mock_title: string;
  completed_at: Date | string;
  overall_score: number;
  max_score: number;
  report_json: string;
  created_at: Date | string;
};

function asIso(value: Date | string | null | undefined): string {
  if (value == null) return new Date().toISOString();
  if (value instanceof Date) return value.toISOString();
  return new Date(value).toISOString();
}

function mapRow(row: ReportRow): AttemptReportRecord {
  let report: AttemptReportRecord['report'] = {
    id: row.id,
    userId: row.user_id,
    attemptId: row.attempt_id,
    mockId: row.mock_id,
    mockTitle: row.mock_title,
    examType: 'Nepal CEE',
    completedAt: asIso(row.completed_at),
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
    completedAt: asIso(row.completed_at),
    overallScore: Number(row.overall_score),
    maxScore: Number(row.max_score),
    report,
    createdAt: asIso(row.created_at),
  };
}

export function createMysqlAttemptReportsRepo(pool: Pool): AttemptReportsRepository {
  return {
    driver: 'mysql',

    async ensureSchema() {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS attempt_reports (
          id VARCHAR(64) PRIMARY KEY,
          clerk_user_id VARCHAR(64) NOT NULL,
          user_id VARCHAR(128) NOT NULL,
          attempt_id VARCHAR(64) NOT NULL,
          mock_id VARCHAR(128) NOT NULL,
          mock_title VARCHAR(512) NOT NULL,
          completed_at DATETIME(3) NOT NULL,
          overall_score DOUBLE NOT NULL,
          max_score DOUBLE NOT NULL,
          report_json LONGTEXT NOT NULL,
          created_at DATETIME(3) NOT NULL,
          INDEX idx_attempt_reports_clerk_completed (clerk_user_id, completed_at),
          INDEX idx_attempt_reports_mock (mock_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
    },

    async insert(input: CreateAttemptReportInput) {
      const now = new Date();
      const completedAt = input.completedAt ? new Date(input.completedAt) : now;
      await pool.query(
        `INSERT INTO attempt_reports
          (id, clerk_user_id, user_id, attempt_id, mock_id, mock_title,
           completed_at, overall_score, max_score, report_json, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
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
          now,
        ]
      );
      return (await this.getById(input.id))!;
    },

    async listByClerkUserId(clerkUserId) {
      const [rows] = await pool.query<ReportRow[]>(
        `SELECT * FROM attempt_reports
         WHERE clerk_user_id = ?
         ORDER BY completed_at DESC`,
        [clerkUserId]
      );
      return rows.map(mapRow);
    },

    async listByMockId(mockId) {
      const [rows] = await pool.query<ReportRow[]>(
        `SELECT * FROM attempt_reports
         WHERE mock_id = ?
         ORDER BY overall_score DESC, completed_at ASC`,
        [mockId]
      );
      return rows.map(mapRow);
    },

    async existsByClerkUserIdAndMockId(clerkUserId, mockId) {
      const [rows] = await pool.query<ReportRow[]>(
        `SELECT id FROM attempt_reports
         WHERE clerk_user_id = ? AND mock_id = ?
         LIMIT 1`,
        [clerkUserId, mockId]
      );
      return rows.length > 0;
    },

    async listAll() {
      const [rows] = await pool.query<ReportRow[]>(
        `SELECT * FROM attempt_reports ORDER BY completed_at DESC`
      );
      return rows.map(mapRow);
    },

    async getById(id) {
      const [rows] = await pool.query<ReportRow[]>(
        'SELECT * FROM attempt_reports WHERE id = ? LIMIT 1',
        [id]
      );
      return rows[0] ? mapRow(rows[0]) : null;
    },

    async close() {
      await pool.end();
    },
  };
}
