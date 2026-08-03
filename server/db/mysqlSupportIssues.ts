import type { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import type { SupportIssueCategory, SupportIssueRecord, SupportIssueStatus } from '../supportDomain.ts';
import type { CreateSupportIssueInput, SupportIssuesRepository } from './types.ts';

type IssueRow = RowDataPacket & {
  id: string;
  clerk_user_id: string;
  user_name: string;
  user_email: string;
  category: string;
  body: string;
  status: string;
  staff_notes: string | null;
  created_at: Date | string;
  resolved_at: Date | string | null;
  resolved_by: string | null;
  resolved_by_clerk_id: string | null;
};

function asIso(value: Date | string | null | undefined): string | null {
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString();
  return new Date(value).toISOString();
}

function mapRow(row: IssueRow): SupportIssueRecord {
  return {
    id: row.id,
    clerkUserId: row.clerk_user_id,
    userName: row.user_name,
    userEmail: row.user_email,
    category: row.category as SupportIssueCategory,
    body: row.body,
    status: row.status as SupportIssueStatus,
    staffNotes: row.staff_notes,
    createdAt: asIso(row.created_at)!,
    resolvedAt: asIso(row.resolved_at),
    resolvedBy: row.resolved_by,
    resolvedByClerkId: row.resolved_by_clerk_id,
  };
}

export function createMysqlSupportIssuesRepo(pool: Pool): SupportIssuesRepository {
  return {
    driver: 'mysql',

    async ensureSchema() {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS support_issues (
          id VARCHAR(64) PRIMARY KEY,
          clerk_user_id VARCHAR(64) NOT NULL,
          user_name VARCHAR(255) NOT NULL,
          user_email VARCHAR(255) NOT NULL,
          category VARCHAR(32) NOT NULL,
          body TEXT NOT NULL,
          status ENUM('open', 'resolved') NOT NULL DEFAULT 'open',
          staff_notes TEXT NULL,
          created_at DATETIME(3) NOT NULL,
          resolved_at DATETIME(3) NULL,
          resolved_by VARCHAR(255) NULL,
          resolved_by_clerk_id VARCHAR(64) NULL,
          INDEX idx_support_issues_status_created (status, created_at),
          INDEX idx_support_issues_clerk (clerk_user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
    },

    async insert(input: CreateSupportIssueInput) {
      const now = new Date();
      await pool.execute(
        `INSERT INTO support_issues
          (id, clerk_user_id, user_name, user_email, category, body, status,
           staff_notes, created_at, resolved_at, resolved_by, resolved_by_clerk_id)
         VALUES (?, ?, ?, ?, ?, ?, 'open', NULL, ?, NULL, NULL, NULL)`,
        [
          input.id,
          input.clerkUserId,
          input.userName,
          input.userEmail,
          input.category,
          input.body,
          now,
        ]
      );
      return (await this.getById(input.id))!;
    },

    async listAll() {
      const [rows] = await pool.query<IssueRow[]>(
        'SELECT * FROM support_issues ORDER BY created_at ASC'
      );
      return rows.map(mapRow);
    },

    async listByClerkUserId(clerkUserId) {
      const [rows] = await pool.query<IssueRow[]>(
        `SELECT * FROM support_issues
         WHERE clerk_user_id = ?
         ORDER BY created_at DESC`,
        [clerkUserId]
      );
      return rows.map(mapRow);
    },

    async getById(id) {
      const [rows] = await pool.query<IssueRow[]>(
        'SELECT * FROM support_issues WHERE id = ? LIMIT 1',
        [id]
      );
      return rows[0] ? mapRow(rows[0]) : null;
    },

    async resolve(id, input) {
      const now = new Date();
      const [result] = await pool.execute<ResultSetHeader>(
        `UPDATE support_issues
         SET status = 'resolved', staff_notes = ?, resolved_at = ?,
             resolved_by = ?, resolved_by_clerk_id = ?
         WHERE id = ? AND status = 'open'`,
        [
          input.staffNotes ?? null,
          now,
          input.resolvedBy,
          input.resolvedByClerkId,
          id,
        ]
      );
      if (!result.affectedRows) return null;
      return this.getById(id);
    },

    async close() {
      /* pool owned by caller */
    },
  };
}
