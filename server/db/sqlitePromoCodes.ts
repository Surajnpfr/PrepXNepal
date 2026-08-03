import fs from 'fs';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';
import type { PromoCodeRecord, PromoDiscountType } from '../promoCodesDomain.ts';
import type {
  CreatePromoCodeRepoInput,
  PromoCodesRepository,
  UpdatePromoCodeRepoInput,
} from './types.ts';

type PromoRow = {
  id: string;
  code: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  applicable_plan_codes: string | null;
  max_redemptions: number | null;
  redemption_count: number;
  starts_at: string | null;
  expires_at: string | null;
  active: number;
  created_at: string;
  updated_at: string;
  created_by_clerk_id: string | null;
  created_by_name: string | null;
};

function parsePlans(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function mapRow(row: PromoRow): PromoCodeRecord {
  return {
    id: row.id,
    code: row.code,
    description: row.description,
    discountType: row.discount_type as PromoDiscountType,
    discountValue: Number(row.discount_value),
    applicablePlanCodes: parsePlans(row.applicable_plan_codes),
    maxRedemptions: row.max_redemptions == null ? null : Number(row.max_redemptions),
    redemptionCount: Number(row.redemption_count || 0),
    startsAt: row.starts_at,
    expiresAt: row.expires_at,
    active: Boolean(row.active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdByClerkId: row.created_by_clerk_id,
    createdByName: row.created_by_name,
  };
}

export function createSqlitePromoCodesRepo(dbFilePath: string): PromoCodesRepository {
  const dir = path.dirname(dbFilePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const db = new DatabaseSync(dbFilePath);

  return {
    driver: 'sqlite',

    async ensureSchema() {
      db.exec(`
        CREATE TABLE IF NOT EXISTS promo_codes (
          id TEXT PRIMARY KEY,
          code TEXT NOT NULL UNIQUE,
          description TEXT,
          discount_type TEXT NOT NULL,
          discount_value REAL NOT NULL,
          applicable_plan_codes TEXT,
          max_redemptions INTEGER,
          redemption_count INTEGER NOT NULL DEFAULT 0,
          starts_at TEXT,
          expires_at TEXT,
          active INTEGER NOT NULL DEFAULT 1,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          created_by_clerk_id TEXT,
          created_by_name TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON promo_codes (active);
      `);
    },

    async listAll() {
      const rows = db
        .prepare('SELECT * FROM promo_codes ORDER BY created_at DESC')
        .all() as PromoRow[];
      return rows.map(mapRow);
    },

    async getById(id) {
      const row = db.prepare('SELECT * FROM promo_codes WHERE id = ?').get(id) as
        | PromoRow
        | undefined;
      return row ? mapRow(row) : null;
    },

    async getByCode(code) {
      const row = db.prepare('SELECT * FROM promo_codes WHERE code = ?').get(code) as
        | PromoRow
        | undefined;
      return row ? mapRow(row) : null;
    },

    async insert(input: CreatePromoCodeRepoInput) {
      const now = new Date().toISOString();
      db.prepare(
        `INSERT INTO promo_codes
          (id, code, description, discount_type, discount_value, applicable_plan_codes,
           max_redemptions, redemption_count, starts_at, expires_at, active,
           created_at, updated_at, created_by_clerk_id, created_by_name)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        input.id,
        input.code,
        input.description ?? null,
        input.discountType,
        input.discountValue,
        JSON.stringify(input.applicablePlanCodes ?? []),
        input.maxRedemptions ?? null,
        input.startsAt ?? null,
        input.expiresAt ?? null,
        input.active === false ? 0 : 1,
        now,
        now,
        input.createdByClerkId ?? null,
        input.createdByName ?? null
      );
      return (await this.getById(input.id))!;
    },

    async update(id, patch: UpdatePromoCodeRepoInput) {
      const existing = await this.getById(id);
      if (!existing) return null;
      const next = {
        description:
          patch.description !== undefined ? patch.description : existing.description,
        discountType: patch.discountType ?? existing.discountType,
        discountValue: patch.discountValue ?? existing.discountValue,
        applicablePlanCodes:
          patch.applicablePlanCodes !== undefined
            ? patch.applicablePlanCodes
            : existing.applicablePlanCodes,
        maxRedemptions:
          patch.maxRedemptions !== undefined ? patch.maxRedemptions : existing.maxRedemptions,
        startsAt: patch.startsAt !== undefined ? patch.startsAt : existing.startsAt,
        expiresAt: patch.expiresAt !== undefined ? patch.expiresAt : existing.expiresAt,
        active: patch.active !== undefined ? patch.active : existing.active,
      };
      const now = new Date().toISOString();
      db.prepare(
        `UPDATE promo_codes
         SET description = ?, discount_type = ?, discount_value = ?, applicable_plan_codes = ?,
             max_redemptions = ?, starts_at = ?, expires_at = ?, active = ?, updated_at = ?
         WHERE id = ?`
      ).run(
        next.description,
        next.discountType,
        next.discountValue,
        JSON.stringify(next.applicablePlanCodes),
        next.maxRedemptions,
        next.startsAt,
        next.expiresAt,
        next.active ? 1 : 0,
        now,
        id
      );
      return this.getById(id);
    },

    async tryIncrementRedemption(code) {
      const result = db
        .prepare(
          `UPDATE promo_codes
           SET redemption_count = redemption_count + 1,
               updated_at = ?
           WHERE code = ?
             AND active = 1
             AND (max_redemptions IS NULL OR redemption_count < max_redemptions)`
        )
        .run(new Date().toISOString(), code);
      if (!result.changes) return null;
      return this.getByCode(code);
    },

    async deleteById(id) {
      const result = db.prepare('DELETE FROM promo_codes WHERE id = ?').run(id);
      return Number(result.changes || 0) > 0;
    },

    async close() {
      db.close();
    },
  };
}
