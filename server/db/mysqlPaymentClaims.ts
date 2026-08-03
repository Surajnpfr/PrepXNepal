import type { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import type { PaymentClaimRecord, PaymentClaimStatus, PaymentMethod } from '../paymentsDomain.ts';
import type { CreatePaymentClaimInput, PaymentClaimsRepository } from './types.ts';

type ClaimRow = RowDataPacket & {
  id: string;
  user_id: string;
  clerk_user_id: string;
  user_name: string;
  user_email: string;
  plan_code: string;
  amount_npr: number;
  list_amount_npr: number | null;
  promo_code: string | null;
  promo_discount_npr: number | null;
  payment_method: string;
  transaction_ref: string;
  screenshot_url: string;
  status: string;
  user_notes: string | null;
  moderator_notes: string | null;
  submitted_at: Date | string;
  verified_at: Date | string | null;
  verified_by: string | null;
  verified_by_clerk_id: string | null;
};

function asIso(value: Date | string | null | undefined): string | null {
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString();
  return new Date(value).toISOString();
}

function mapRow(row: ClaimRow): PaymentClaimRecord {
  const amountNpr = Number(row.amount_npr);
  const listAmountNpr =
    row.list_amount_npr == null ? amountNpr : Number(row.list_amount_npr);
  return {
    id: row.id,
    userId: row.user_id,
    clerkUserId: row.clerk_user_id,
    userName: row.user_name,
    userEmail: row.user_email,
    planCode: row.plan_code,
    amountNpr,
    listAmountNpr,
    promoCode: row.promo_code,
    promoDiscountNpr: Number(row.promo_discount_npr || 0),
    paymentMethod: row.payment_method as PaymentMethod,
    transactionRef: row.transaction_ref,
    screenshotUrl: row.screenshot_url,
    status: row.status as PaymentClaimStatus,
    userNotes: row.user_notes,
    moderatorNotes: row.moderator_notes,
    submittedAt: asIso(row.submitted_at)!,
    verifiedAt: asIso(row.verified_at),
    verifiedBy: row.verified_by,
    verifiedByClerkId: row.verified_by_clerk_id,
  };
}

export function createMysqlPaymentClaimsRepo(pool: Pool): PaymentClaimsRepository {
  return {
    driver: 'mysql',

    async ensureSchema() {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS payment_claims (
          id VARCHAR(64) PRIMARY KEY,
          user_id VARCHAR(128) NOT NULL,
          clerk_user_id VARCHAR(64) NOT NULL,
          user_name VARCHAR(255) NOT NULL,
          user_email VARCHAR(255) NOT NULL,
          plan_code VARCHAR(64) NOT NULL,
          amount_npr INT NOT NULL,
          list_amount_npr INT NULL,
          promo_code VARCHAR(32) NULL,
          promo_discount_npr INT NOT NULL DEFAULT 0,
          payment_method VARCHAR(32) NOT NULL,
          transaction_ref VARCHAR(191) NOT NULL,
          screenshot_url TEXT NOT NULL,
          status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
          user_notes TEXT NULL,
          moderator_notes TEXT NULL,
          submitted_at DATETIME(3) NOT NULL,
          verified_at DATETIME(3) NULL,
          verified_by VARCHAR(255) NULL,
          verified_by_clerk_id VARCHAR(64) NULL,
          INDEX idx_payment_claims_status_submitted (status, submitted_at),
          INDEX idx_payment_claims_clerk (clerk_user_id),
          INDEX idx_payment_claims_user (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      for (const stmt of [
        'ALTER TABLE payment_claims ADD COLUMN user_notes TEXT NULL',
        'ALTER TABLE payment_claims ADD COLUMN moderator_notes TEXT NULL',
        'ALTER TABLE payment_claims ADD COLUMN list_amount_npr INT NULL',
        'ALTER TABLE payment_claims ADD COLUMN promo_code VARCHAR(32) NULL',
        'ALTER TABLE payment_claims ADD COLUMN promo_discount_npr INT NOT NULL DEFAULT 0',
      ]) {
        try {
          await pool.query(stmt);
        } catch {
          /* already exists */
        }
      }
    },

    async insert(input: CreatePaymentClaimInput) {
      const now = new Date();
      const listAmountNpr = input.listAmountNpr ?? input.amountNpr;
      const promoDiscountNpr = input.promoDiscountNpr ?? 0;
      await pool.query(
        `INSERT INTO payment_claims
          (id, user_id, clerk_user_id, user_name, user_email, plan_code, amount_npr,
           list_amount_npr, promo_code, promo_discount_npr,
           payment_method, transaction_ref, screenshot_url, status, user_notes,
           moderator_notes, submitted_at, verified_at, verified_by, verified_by_clerk_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, NULL, ?, NULL, NULL, NULL)`,
        [
          input.id,
          input.userId,
          input.clerkUserId,
          input.userName,
          input.userEmail,
          input.planCode,
          input.amountNpr,
          listAmountNpr,
          input.promoCode ?? null,
          promoDiscountNpr,
          input.paymentMethod,
          input.transactionRef,
          input.screenshotUrl,
          input.userNotes ?? null,
          now,
        ]
      );
      return (await this.getById(input.id))!;
    },

    async listAll() {
      const [rows] = await pool.query<ClaimRow[]>(
        'SELECT * FROM payment_claims ORDER BY submitted_at ASC'
      );
      return rows.map(mapRow);
    },

    async listByClerkUserId(clerkUserId) {
      const [rows] = await pool.query<ClaimRow[]>(
        `SELECT * FROM payment_claims
         WHERE clerk_user_id = ?
         ORDER BY submitted_at DESC`,
        [clerkUserId]
      );
      return rows.map(mapRow);
    },

    async getById(id) {
      const [rows] = await pool.query<ClaimRow[]>(
        'SELECT * FROM payment_claims WHERE id = ? LIMIT 1',
        [id]
      );
      return rows[0] ? mapRow(rows[0]) : null;
    },

    async updatePending(id, patch) {
      const existing = await this.getById(id);
      if (!existing || existing.status !== 'pending') return null;
      const next = {
        planCode: patch.planCode ?? existing.planCode,
        amountNpr: patch.amountNpr ?? existing.amountNpr,
        listAmountNpr:
          patch.listAmountNpr !== undefined
            ? patch.listAmountNpr
            : existing.listAmountNpr,
        promoCode:
          patch.promoCode !== undefined ? patch.promoCode : existing.promoCode,
        promoDiscountNpr:
          patch.promoDiscountNpr !== undefined
            ? patch.promoDiscountNpr
            : existing.promoDiscountNpr,
        paymentMethod: patch.paymentMethod ?? existing.paymentMethod,
        transactionRef: patch.transactionRef ?? existing.transactionRef,
        screenshotUrl: patch.screenshotUrl ?? existing.screenshotUrl,
        userNotes:
          patch.userNotes !== undefined ? patch.userNotes : existing.userNotes,
      };
      const [result] = await pool.query<ResultSetHeader>(
        `UPDATE payment_claims
         SET plan_code = ?, amount_npr = ?, list_amount_npr = ?, promo_code = ?,
             promo_discount_npr = ?, payment_method = ?, transaction_ref = ?,
             screenshot_url = ?, user_notes = ?
         WHERE id = ? AND status = 'pending'`,
        [
          next.planCode,
          next.amountNpr,
          next.listAmountNpr,
          next.promoCode,
          next.promoDiscountNpr,
          next.paymentMethod,
          next.transactionRef,
          next.screenshotUrl,
          next.userNotes,
          id,
        ]
      );
      if (!result.affectedRows) return null;
      return this.getById(id);
    },

    async deletePending(id) {
      const [result] = await pool.query<ResultSetHeader>(
        `DELETE FROM payment_claims WHERE id = ? AND status = 'pending'`,
        [id]
      );
      return result.affectedRows > 0;
    },

    async resolve(id, input) {
      const now = new Date();
      const [result] = await pool.query<ResultSetHeader>(
        `UPDATE payment_claims
         SET status = ?, moderator_notes = ?, verified_at = ?, verified_by = ?, verified_by_clerk_id = ?
         WHERE id = ? AND status = 'pending'`,
        [
          input.status,
          input.moderatorNotes ?? null,
          now,
          input.verifiedBy,
          input.verifiedByClerkId,
          id,
        ]
      );
      if (!result.affectedRows) return null;
      return this.getById(id);
    },

    async close() {
      await pool.end();
    },
  };
}
