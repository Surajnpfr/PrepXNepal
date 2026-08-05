import type { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import type { NoticeRecord } from '../noticesDomain.ts';
import type {
  CreateNoticeRepoInput,
  NoticesRepository,
  UpdateNoticeRepoInput,
} from './types.ts';

type NoticeRow = RowDataPacket & {
  id: string;
  title: string;
  body: string | null;
  cta_label: string | null;
  cta_href_tab: string | null;
  active: number | boolean;
  priority: number;
  starts_at: Date | string | null;
  expires_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
  created_by_clerk_id: string | null;
  created_by_name: string | null;
};

function asIso(value: Date | string | null | undefined): string | null {
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString();
  return new Date(value).toISOString();
}

function mapRow(row: NoticeRow): NoticeRecord {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    ctaLabel: row.cta_label,
    ctaHrefTab: row.cta_href_tab,
    active: Boolean(row.active),
    priority: Number(row.priority || 0),
    startsAt: asIso(row.starts_at),
    expiresAt: asIso(row.expires_at),
    createdAt: asIso(row.created_at)!,
    updatedAt: asIso(row.updated_at)!,
    createdByClerkId: row.created_by_clerk_id,
    createdByName: row.created_by_name,
  };
}

export function createMysqlNoticesRepo(pool: Pool): NoticesRepository {
  return {
    driver: 'mysql',

    async ensureSchema() {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS notices (
          id VARCHAR(64) PRIMARY KEY,
          title VARCHAR(200) NOT NULL,
          body VARCHAR(1000) NULL,
          cta_label VARCHAR(64) NULL,
          cta_href_tab VARCHAR(64) NULL,
          active TINYINT(1) NOT NULL DEFAULT 1,
          priority INT NOT NULL DEFAULT 0,
          starts_at DATETIME(3) NULL,
          expires_at DATETIME(3) NULL,
          created_at DATETIME(3) NOT NULL,
          updated_at DATETIME(3) NOT NULL,
          created_by_clerk_id VARCHAR(64) NULL,
          created_by_name VARCHAR(255) NULL,
          INDEX idx_notices_active (active),
          INDEX idx_notices_priority (priority)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
    },

    async listAll() {
      const [rows] = await pool.query<NoticeRow[]>(
        'SELECT * FROM notices ORDER BY priority DESC, updated_at DESC'
      );
      return rows.map(mapRow);
    },

    async getById(id) {
      const [rows] = await pool.query<NoticeRow[]>('SELECT * FROM notices WHERE id = ?', [id]);
      return rows[0] ? mapRow(rows[0]) : null;
    },

    async insert(input: CreateNoticeRepoInput) {
      const now = new Date();
      await pool.query(
        `INSERT INTO notices
          (id, title, body, cta_label, cta_href_tab, active, priority,
           starts_at, expires_at, created_at, updated_at, created_by_clerk_id, created_by_name)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          input.id,
          input.title,
          input.body ?? null,
          input.ctaLabel ?? null,
          input.ctaHrefTab ?? null,
          input.active === false ? 0 : 1,
          input.priority ?? 0,
          input.startsAt ? new Date(input.startsAt) : null,
          input.expiresAt ? new Date(input.expiresAt) : null,
          now,
          now,
          input.createdByClerkId ?? null,
          input.createdByName ?? null,
        ]
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
      await pool.query(
        `UPDATE notices
         SET title = ?, body = ?, cta_label = ?, cta_href_tab = ?, active = ?, priority = ?,
             starts_at = ?, expires_at = ?, updated_at = ?
         WHERE id = ?`,
        [
          next.title,
          next.body,
          next.ctaLabel,
          next.ctaHrefTab,
          next.active ? 1 : 0,
          next.priority,
          next.startsAt ? new Date(next.startsAt) : null,
          next.expiresAt ? new Date(next.expiresAt) : null,
          new Date(),
          id,
        ]
      );
      return this.getById(id);
    },

    async deleteById(id) {
      const [result] = await pool.query<ResultSetHeader>('DELETE FROM notices WHERE id = ?', [id]);
      return result.affectedRows > 0;
    },

    async close() {
      await pool.end();
    },
  };
}
