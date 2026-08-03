import fs from 'fs';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';
import type { SupportIssueCategory, SupportIssueRecord, SupportIssueStatus } from '../supportDomain.ts';
import type { CreateSupportIssueInput, SupportIssuesRepository } from './types.ts';

type IssueRow = {
  id: string;
  clerk_user_id: string;
  user_name: string;
  user_email: string;
  category: string;
  body: string;
  status: string;
  staff_notes: string | null;
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
  resolved_by_clerk_id: string | null;
};

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
    createdAt: row.created_at,
    resolvedAt: row.resolved_at,
    resolvedBy: row.resolved_by,
    resolvedByClerkId: row.resolved_by_clerk_id,
  };
}

export function createSqliteSupportIssuesRepo(dbFilePath: string): SupportIssuesRepository {
  const dir = path.dirname(dbFilePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const db = new DatabaseSync(dbFilePath);

  return {
    driver: 'sqlite',

    async ensureSchema() {
      db.exec(`
        CREATE TABLE IF NOT EXISTS support_issues (
          id TEXT PRIMARY KEY,
          clerk_user_id TEXT NOT NULL,
          user_name TEXT NOT NULL,
          user_email TEXT NOT NULL,
          category TEXT NOT NULL,
          body TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'open',
          staff_notes TEXT,
          created_at TEXT NOT NULL,
          resolved_at TEXT,
          resolved_by TEXT,
          resolved_by_clerk_id TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_support_issues_status_created
          ON support_issues (status, created_at);
        CREATE INDEX IF NOT EXISTS idx_support_issues_clerk
          ON support_issues (clerk_user_id);
      `);
    },

    async insert(input: CreateSupportIssueInput) {
      const now = new Date().toISOString();
      db.prepare(
        `INSERT INTO support_issues
          (id, clerk_user_id, user_name, user_email, category, body, status,
           staff_notes, created_at, resolved_at, resolved_by, resolved_by_clerk_id)
         VALUES (?, ?, ?, ?, ?, ?, 'open', NULL, ?, NULL, NULL, NULL)`
      ).run(
        input.id,
        input.clerkUserId,
        input.userName,
        input.userEmail,
        input.category,
        input.body,
        now
      );
      return (await this.getById(input.id))!;
    },

    async listAll() {
      const rows = db
        .prepare('SELECT * FROM support_issues ORDER BY created_at ASC')
        .all() as IssueRow[];
      return rows.map(mapRow);
    },

    async listByClerkUserId(clerkUserId) {
      const rows = db
        .prepare(
          `SELECT * FROM support_issues
           WHERE clerk_user_id = ?
           ORDER BY created_at DESC`
        )
        .all(clerkUserId) as IssueRow[];
      return rows.map(mapRow);
    },

    async getById(id) {
      const row = db
        .prepare('SELECT * FROM support_issues WHERE id = ?')
        .get(id) as IssueRow | undefined;
      return row ? mapRow(row) : null;
    },

    async resolve(id, input) {
      const now = new Date().toISOString();
      const result = db
        .prepare(
          `UPDATE support_issues
           SET status = 'resolved', staff_notes = ?, resolved_at = ?,
               resolved_by = ?, resolved_by_clerk_id = ?
           WHERE id = ? AND status = 'open'`
        )
        .run(
          input.staffNotes ?? null,
          now,
          input.resolvedBy,
          input.resolvedByClerkId,
          id
        );
      if (!result.changes) return null;
      return this.getById(id);
    },

    async close() {
      db.close();
    },
  };
}
