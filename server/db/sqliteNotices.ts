import fs from 'fs';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';
import type { NoticeRecord } from '../noticesDomain.ts';
import type {
  CreateNoticeRepoInput,
  NoticesRepository,
  UpdateNoticeRepoInput,
} from './types.ts';

type NoticeRow = {
  id: string;
  title: string;
  body: string | null;
  cta_label: string | null;
  cta_href_tab: string | null;
  active: number;
  priority: number;
  starts_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  created_by_clerk_id: string | null;
  created_by_name: string | null;
};

function mapRow(row: NoticeRow): NoticeRecord {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    ctaLabel: row.cta_label,
    ctaHrefTab: row.cta_href_tab,
    active: Boolean(row.active),
    priority: Number(row.priority || 0),
    startsAt: row.starts_at,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdByClerkId: row.created_by_clerk_id,
    createdByName: row.created_by_name,
  };
}

export function createSqliteNoticesRepo(dbFilePath: string): NoticesRepository {
  const dir = path.dirname(dbFilePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const db = new DatabaseSync(dbFilePath);

  return {
    driver: 'sqlite',

    async ensureSchema() {
      db.exec(`
        CREATE TABLE IF NOT EXISTS notices (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          body TEXT,
          cta_label TEXT,
          cta_href_tab TEXT,
          active INTEGER NOT NULL DEFAULT 1,
          priority INTEGER NOT NULL DEFAULT 0,
          starts_at TEXT,
          expires_at TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          created_by_clerk_id TEXT,
          created_by_name TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_notices_active ON notices (active);
        CREATE INDEX IF NOT EXISTS idx_notices_priority ON notices (priority);
      `);
    },

    async listAll() {
      const rows = db
        .prepare('SELECT * FROM notices ORDER BY priority DESC, updated_at DESC')
        .all() as NoticeRow[];
      return rows.map(mapRow);
    },

    async getById(id) {
      const row = db.prepare('SELECT * FROM notices WHERE id = ?').get(id) as
        | NoticeRow
        | undefined;
      return row ? mapRow(row) : null;
    },

    async insert(input: CreateNoticeRepoInput) {
      const now = new Date().toISOString();
      db.prepare(
        `INSERT INTO notices
          (id, title, body, cta_label, cta_href_tab, active, priority,
           starts_at, expires_at, created_at, updated_at, created_by_clerk_id, created_by_name)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        input.id,
        input.title,
        input.body ?? null,
        input.ctaLabel ?? null,
        input.ctaHrefTab ?? null,
        input.active === false ? 0 : 1,
        input.priority ?? 0,
        input.startsAt ?? null,
        input.expiresAt ?? null,
        now,
        now,
        input.createdByClerkId ?? null,
        input.createdByName ?? null
      );
      return (await this.getById(input.id))!;
    },

    async update(id, patch: UpdateNoticeRepoInput) {
      const existing = await this.getById(id);
      if (!existing) return null;
      const next = {
        title: patch.title !== undefined ? patch.title : existing.title,
        body: patch.body !== undefined ? patch.body : existing.body,
        ctaLabel: patch.ctaLabel !== undefined ? patch.ctaLabel : existing.ctaLabel,
        ctaHrefTab: patch.ctaHrefTab !== undefined ? patch.ctaHrefTab : existing.ctaHrefTab,
        active: patch.active !== undefined ? patch.active : existing.active,
        priority: patch.priority !== undefined ? patch.priority : existing.priority,
        startsAt: patch.startsAt !== undefined ? patch.startsAt : existing.startsAt,
        expiresAt: patch.expiresAt !== undefined ? patch.expiresAt : existing.expiresAt,
      };
      const now = new Date().toISOString();
      db.prepare(
        `UPDATE notices
         SET title = ?, body = ?, cta_label = ?, cta_href_tab = ?, active = ?, priority = ?,
             starts_at = ?, expires_at = ?, updated_at = ?
         WHERE id = ?`
      ).run(
        next.title,
        next.body,
        next.ctaLabel,
        next.ctaHrefTab,
        next.active ? 1 : 0,
        next.priority,
        next.startsAt,
        next.expiresAt,
        now,
        id
      );
      return this.getById(id);
    },

    async deleteById(id) {
      const result = db.prepare('DELETE FROM notices WHERE id = ?').run(id);
      return Number(result.changes || 0) > 0;
    },

    async close() {
      db.close();
    },
  };
}
