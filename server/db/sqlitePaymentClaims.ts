import fs from 'fs';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';
import type { PaymentClaimRecord, PaymentClaimStatus, PaymentMethod } from '../paymentsDomain.ts';
import type { CreatePaymentClaimInput, PaymentClaimsRepository } from './types.ts';

type ClaimRow = {
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
  submitted_at: string;
  verified_at: string | null;
  verified_by: string | null;
  verified_by_clerk_id: string | null;
};

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
    submittedAt: row.submitted_at,
    verifiedAt: row.verified_at,
    verifiedBy: row.verified_by,
    verifiedByClerkId: row.verified_by_clerk_id,
  };
}

export function createSqlitePaymentClaimsRepo(dbFilePath: string): PaymentClaimsRepository {
  const dir = path.dirname(dbFilePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const db = new DatabaseSync(dbFilePath);

  return {
    driver: 'sqlite',

    async ensureSchema() {
      db.exec(`
        CREATE TABLE IF NOT EXISTS payment_claims (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          clerk_user_id TEXT NOT NULL,
          user_name TEXT NOT NULL,
          user_email TEXT NOT NULL,
          plan_code TEXT NOT NULL,
          amount_npr INTEGER NOT NULL,
          list_amount_npr INTEGER,
          promo_code TEXT,
          promo_discount_npr INTEGER DEFAULT 0,
          payment_method TEXT NOT NULL,
          transaction_ref TEXT NOT NULL,
          screenshot_url TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending',
          user_notes TEXT,
          moderator_notes TEXT,
          submitted_at TEXT NOT NULL,
          verified_at TEXT,
          verified_by TEXT,
          verified_by_clerk_id TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_payment_claims_status_submitted
          ON payment_claims (status, submitted_at);
        CREATE INDEX IF NOT EXISTS idx_payment_claims_clerk
          ON payment_claims (clerk_user_id);
      `);
      for (const col of [
        'user_notes TEXT',
        'moderator_notes TEXT',
        'list_amount_npr INTEGER',
        'promo_code TEXT',
        'promo_discount_npr INTEGER DEFAULT 0',
      ]) {
        try {
          db.exec(`ALTER TABLE payment_claims ADD COLUMN ${col}`);
        } catch {
          /* already exists */
        }
      }
    },

    async insert(input: CreatePaymentClaimInput) {
      const now = new Date().toISOString();
      const listAmountNpr = input.listAmountNpr ?? input.amountNpr;
      const promoDiscountNpr = input.promoDiscountNpr ?? 0;
      db.prepare(
        `INSERT INTO payment_claims
          (id, user_id, clerk_user_id, user_name, user_email, plan_code, amount_npr,
           list_amount_npr, promo_code, promo_discount_npr,
           payment_method, transaction_ref, screenshot_url, status, user_notes,
           moderator_notes, submitted_at, verified_at, verified_by, verified_by_clerk_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, NULL, ?, NULL, NULL, NULL)`
      ).run(
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
        now
      );
      return (await this.getById(input.id))!;
    },

    async listAll() {
      const rows = db
        .prepare('SELECT * FROM payment_claims ORDER BY submitted_at ASC')
        .all() as ClaimRow[];
      return rows.map(mapRow);
    },

    async listByClerkUserId(clerkUserId) {
      const rows = db
        .prepare(
          `SELECT * FROM payment_claims
           WHERE clerk_user_id = ?
           ORDER BY submitted_at DESC`
        )
        .all(clerkUserId) as ClaimRow[];
      return rows.map(mapRow);
    },

    async getById(id) {
      const row = db
        .prepare('SELECT * FROM payment_claims WHERE id = ?')
        .get(id) as ClaimRow | undefined;
      return row ? mapRow(row) : null;
    },

    async resolve(id, input) {
      const now = new Date().toISOString();
      const result = db
        .prepare(
          `UPDATE payment_claims
           SET status = ?, moderator_notes = ?, verified_at = ?, verified_by = ?, verified_by_clerk_id = ?
           WHERE id = ? AND status = 'pending'`
        )
        .run(
          input.status,
          input.moderatorNotes ?? null,
          now,
          input.verifiedBy,
          input.verifiedByClerkId,
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
