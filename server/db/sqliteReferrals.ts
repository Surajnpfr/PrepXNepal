import fs from 'fs';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';
import type {
  ReferralAttributionRecord,
  ReferralCommissionRecord,
  ReferralCommissionStatus,
  ReferralLinkRecord,
} from '../referralsDomain.ts';
import type {
  CreateCommissionInput,
  EnsureReferralLinkInput,
  ReferralsRepository,
} from './types.ts';

type LinkRow = {
  owner_clerk_id: string;
  code: string;
  owner_email: string;
  owner_name: string;
  owner_role: string;
  active: number;
  created_at: string;
  updated_at: string;
};

type AttrRow = {
  referred_clerk_id: string;
  referrer_clerk_id: string;
  code: string;
  attributed_at: string;
};

type CommRow = {
  id: string;
  claim_id: string;
  referred_clerk_id: string;
  referrer_clerk_id: string;
  conversion_amount_npr: number;
  commission_rate: number;
  commission_amount_npr: number;
  status: string;
  created_at: string;
  settled_at: string | null;
  settled_by_clerk_id: string | null;
};

function mapLink(row: LinkRow): ReferralLinkRecord {
  return {
    ownerClerkId: row.owner_clerk_id,
    code: row.code,
    ownerEmail: row.owner_email,
    ownerName: row.owner_name,
    ownerRole: row.owner_role,
    active: Boolean(row.active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapAttr(row: AttrRow): ReferralAttributionRecord {
  return {
    referredClerkId: row.referred_clerk_id,
    referrerClerkId: row.referrer_clerk_id,
    code: row.code,
    attributedAt: row.attributed_at,
  };
}

function mapComm(row: CommRow): ReferralCommissionRecord {
  return {
    id: row.id,
    claimId: row.claim_id,
    referredClerkId: row.referred_clerk_id,
    referrerClerkId: row.referrer_clerk_id,
    conversionAmountNpr: Number(row.conversion_amount_npr),
    commissionRate: Number(row.commission_rate),
    commissionAmountNpr: Number(row.commission_amount_npr),
    status: row.status as ReferralCommissionStatus,
    createdAt: row.created_at,
    settledAt: row.settled_at,
    settledByClerkId: row.settled_by_clerk_id,
  };
}

export function createSqliteReferralsRepo(dbFilePath: string): ReferralsRepository {
  const dir = path.dirname(dbFilePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const db = new DatabaseSync(dbFilePath);

  return {
    driver: 'sqlite',

    async ensureSchema() {
      db.exec(`
        CREATE TABLE IF NOT EXISTS referral_links (
          owner_clerk_id TEXT PRIMARY KEY,
          code TEXT NOT NULL UNIQUE,
          owner_email TEXT NOT NULL,
          owner_name TEXT NOT NULL,
          owner_role TEXT NOT NULL,
          active INTEGER NOT NULL DEFAULT 1,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS referral_attributions (
          referred_clerk_id TEXT PRIMARY KEY,
          referrer_clerk_id TEXT NOT NULL,
          code TEXT NOT NULL,
          attributed_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_referral_attr_referrer
          ON referral_attributions (referrer_clerk_id);
        CREATE TABLE IF NOT EXISTS referral_commissions (
          id TEXT PRIMARY KEY,
          claim_id TEXT NOT NULL UNIQUE,
          referred_clerk_id TEXT NOT NULL,
          referrer_clerk_id TEXT NOT NULL,
          conversion_amount_npr INTEGER NOT NULL,
          commission_rate REAL NOT NULL,
          commission_amount_npr INTEGER NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending',
          created_at TEXT NOT NULL,
          settled_at TEXT,
          settled_by_clerk_id TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_referral_comm_referrer
          ON referral_commissions (referrer_clerk_id);
      `);
    },

    async getLinkByOwner(ownerClerkId) {
      const row = db
        .prepare('SELECT * FROM referral_links WHERE owner_clerk_id = ?')
        .get(ownerClerkId) as LinkRow | undefined;
      return row ? mapLink(row) : null;
    },

    async getLinkByCode(code) {
      const row = db
        .prepare('SELECT * FROM referral_links WHERE lower(code) = lower(?) AND active = 1')
        .get(code) as LinkRow | undefined;
      return row ? mapLink(row) : null;
    },

    async ensureLink(input: EnsureReferralLinkInput) {
      const existing = await this.getLinkByOwner(input.ownerClerkId);
      if (existing) {
        const now = new Date().toISOString();
        db.prepare(
          `UPDATE referral_links
           SET owner_email = ?, owner_name = ?, owner_role = ?, updated_at = ?
           WHERE owner_clerk_id = ?`
        ).run(input.ownerEmail, input.ownerName, input.ownerRole, now, input.ownerClerkId);
        const updated = await this.getLinkByOwner(input.ownerClerkId);
        return updated!;
      }
      const now = new Date().toISOString();
      let code = input.code;
      for (let i = 0; i < 5; i++) {
        try {
          db.prepare(
            `INSERT INTO referral_links
              (owner_clerk_id, code, owner_email, owner_name, owner_role, active, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, 1, ?, ?)`
          ).run(
            input.ownerClerkId,
            code,
            input.ownerEmail,
            input.ownerName,
            input.ownerRole,
            now,
            now
          );
          break;
        } catch {
          code = `${input.code}${i + 1}`.slice(0, 16);
          if (i === 4) throw new Error('Failed to allocate unique referral code');
        }
      }
      const created = await this.getLinkByOwner(input.ownerClerkId);
      return created!;
    },

    async listLinks() {
      const rows = db
        .prepare('SELECT * FROM referral_links ORDER BY created_at ASC')
        .all() as LinkRow[];
      return rows.map(mapLink);
    },

    async getAttribution(referredClerkId) {
      const row = db
        .prepare('SELECT * FROM referral_attributions WHERE referred_clerk_id = ?')
        .get(referredClerkId) as AttrRow | undefined;
      return row ? mapAttr(row) : null;
    },

    async attributeFirstTouch(input) {
      const existing = await this.getAttribution(input.referredClerkId);
      if (existing) return { attribution: existing, created: false };
      const now = new Date().toISOString();
      try {
        db.prepare(
          `INSERT INTO referral_attributions
            (referred_clerk_id, referrer_clerk_id, code, attributed_at)
           VALUES (?, ?, ?, ?)`
        ).run(input.referredClerkId, input.referrerClerkId, input.code, now);
      } catch {
        const raced = await this.getAttribution(input.referredClerkId);
        if (raced) return { attribution: raced, created: false };
        throw new Error('Failed to attribute referral');
      }
      const attribution = await this.getAttribution(input.referredClerkId);
      return { attribution: attribution!, created: true };
    },

    async getCommissionByClaimId(claimId) {
      const row = db
        .prepare('SELECT * FROM referral_commissions WHERE claim_id = ?')
        .get(claimId) as CommRow | undefined;
      return row ? mapComm(row) : null;
    },

    async insertCommission(input: CreateCommissionInput) {
      const existing = await this.getCommissionByClaimId(input.claimId);
      if (existing) return { ok: false as const, reason: 'duplicate_claim' as const, existing };
      const now = new Date().toISOString();
      try {
        db.prepare(
          `INSERT INTO referral_commissions
            (id, claim_id, referred_clerk_id, referrer_clerk_id, conversion_amount_npr,
             commission_rate, commission_amount_npr, status, created_at, settled_at, settled_by_clerk_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, NULL, NULL)`
        ).run(
          input.id,
          input.claimId,
          input.referredClerkId,
          input.referrerClerkId,
          input.conversionAmountNpr,
          input.commissionRate,
          input.commissionAmountNpr,
          now
        );
      } catch {
        const raced = await this.getCommissionByClaimId(input.claimId);
        if (raced) return { ok: false as const, reason: 'duplicate_claim' as const, existing: raced };
        throw new Error('Failed to insert commission');
      }
      const commission = await this.getCommissionByClaimId(input.claimId);
      return { ok: true as const, commission: commission! };
    },

    async listCommissionsByReferrer(referrerClerkId) {
      const rows = db
        .prepare(
          `SELECT * FROM referral_commissions
           WHERE referrer_clerk_id = ?
           ORDER BY created_at DESC`
        )
        .all(referrerClerkId) as CommRow[];
      return rows.map(mapComm);
    },

    async listAllCommissions() {
      const rows = db
        .prepare('SELECT * FROM referral_commissions ORDER BY created_at DESC')
        .all() as CommRow[];
      return rows.map(mapComm);
    },

    async settleCommission(id, settledByClerkId) {
      const now = new Date().toISOString();
      const result = db
        .prepare(
          `UPDATE referral_commissions
           SET status = 'settled', settled_at = ?, settled_by_clerk_id = ?
           WHERE id = ? AND status = 'pending'`
        )
        .run(now, settledByClerkId, id);
      if (!result.changes) {
        const row = db
          .prepare('SELECT * FROM referral_commissions WHERE id = ?')
          .get(id) as CommRow | undefined;
        return row ? mapComm(row) : null;
      }
      const row = db
        .prepare('SELECT * FROM referral_commissions WHERE id = ?')
        .get(id) as CommRow | undefined;
      return row ? mapComm(row) : null;
    },

    async close() {
      db.close();
    },
  };
}
