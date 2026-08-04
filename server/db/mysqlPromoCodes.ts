import type { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import type { PromoCodeRecord, PromoDiscountType } from '../promoCodesDomain.ts';
import type {
  CreatePromoCodeRepoInput,
  PromoCodesRepository,
  UpdatePromoCodeRepoInput,
} from './types.ts';

type PromoRow = RowDataPacket & {
  id: string;
  code: string;
  description: string | null;
  discount_type: string;
  discount_value: number | string;
  applicable_plan_codes: string | string[] | null;
  max_redemptions: number | null;
  redemption_count: number;
  starts_at: Date | string | null;
  expires_at: Date | string | null;
  active: number | boolean;
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

function parsePlans(raw: string | string[] | null): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
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
    startsAt: asIso(row.starts_at),
    expiresAt: asIso(row.expires_at),
    active: Boolean(row.active),
    createdAt: asIso(row.created_at)!,
    updatedAt: asIso(row.updated_at)!,
    createdByClerkId: row.created_by_clerk_id,
    createdByName: row.created_by_name,
  };
}

export function createMysqlPromoCodesRepo(pool: Pool): PromoCodesRepository {
  return {
    driver: 'mysql',

    async ensureSchema() {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS promo_codes (
          id VARCHAR(64) PRIMARY KEY,
          code VARCHAR(32) NOT NULL,
          description VARCHAR(500) NULL,
          discount_type ENUM('percent', 'fixed') NOT NULL,
          discount_value DECIMAL(10, 2) NOT NULL,
          applicable_plan_codes JSON NULL,
          max_redemptions INT NULL,
          redemption_count INT NOT NULL DEFAULT 0,
          starts_at DATETIME(3) NULL,
          expires_at DATETIME(3) NULL,
          active TINYINT(1) NOT NULL DEFAULT 1,
          created_at DATETIME(3) NOT NULL,
          updated_at DATETIME(3) NOT NULL,
          created_by_clerk_id VARCHAR(64) NULL,
          created_by_name VARCHAR(255) NULL,
          UNIQUE KEY uq_promo_codes_code (code),
          INDEX idx_promo_codes_active (active)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
    },

    async listAll() {
      const [rows] = await pool.query<PromoRow[]>(
        'SELECT * FROM promo_codes ORDER BY created_at DESC'
      );
      return rows.map(mapRow);
    },

    async getById(id) {
      const [rows] = await pool.query<PromoRow[]>('SELECT * FROM promo_codes WHERE id = ?', [id]);
      return rows[0] ? mapRow(rows[0]) : null;
    },

    async getByCode(code) {
      const [rows] = await pool.query<PromoRow[]>('SELECT * FROM promo_codes WHERE code = ?', [
        code,
      ]);
      return rows[0] ? mapRow(rows[0]) : null;
    },

    async insert(input: CreatePromoCodeRepoInput) {
      const now = new Date();
      await pool.query(
        `INSERT INTO promo_codes
          (id, code, description, discount_type, discount_value, applicable_plan_codes,
           max_redemptions, redemption_count, starts_at, expires_at, active,
           created_at, updated_at, created_by_clerk_id, created_by_name)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?)`,
        [
          input.id,
          input.code,
          input.description ?? null,
          input.discountType,
          input.discountValue,
          JSON.stringify(input.applicablePlanCodes ?? []),
          input.maxRedemptions ?? null,
          input.startsAt ? new Date(input.startsAt) : null,
          input.expiresAt ? new Date(input.expiresAt) : null,
          input.active === false ? 0 : 1,
          now,
          now,
          input.createdByClerkId ?? null,
          input.createdByName ?? null,
        ]
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
      await pool.query(
        `UPDATE promo_codes
         SET description = ?, discount_type = ?, discount_value = ?,
             applicable_plan_codes = ?, max_redemptions = ?,
             starts_at = ?, expires_at = ?, active = ?, updated_at = ?
         WHERE id = ?`,
        [
          next.description,
          next.discountType,
          next.discountValue,
          JSON.stringify(next.applicablePlanCodes),
          next.maxRedemptions,
          next.startsAt ? new Date(next.startsAt) : null,
          next.expiresAt ? new Date(next.expiresAt) : null,
          next.active ? 1 : 0,
          new Date(),
          id,
        ]
      );
      return this.getById(id);
    },

    async tryIncrementRedemption(code) {
      const [result] = await pool.query<ResultSetHeader>(
        `UPDATE promo_codes
         SET redemption_count = redemption_count + 1, updated_at = ?
         WHERE code = ?
           AND active = 1
           AND (max_redemptions IS NULL OR redemption_count < max_redemptions)`,
        [new Date(), code]
      );
      if (!result.affectedRows) return null;
      return this.getByCode(code);
    },

    async deleteById(id) {
      const [result] = await pool.query<ResultSetHeader>('DELETE FROM promo_codes WHERE id = ?', [
        id,
      ]);
      return result.affectedRows > 0;
    },

    async close() {
      await pool.end();
    },
  };
}
