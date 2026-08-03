import type { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
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

type LinkRow = RowDataPacket & {
  owner_clerk_id: string;
  code: string;
  owner_email: string;
  owner_name: string;
  owner_role: string;
  active: number | boolean;
  created_at: Date | string;
  updated_at: Date | string;
};

type AttrRow = RowDataPacket & {
  referred_clerk_id: string;
  referrer_clerk_id: string;
  code: string;
  attributed_at: Date | string;
};

type CommRow = RowDataPacket & {
  id: string;
  claim_id: string;
  referred_clerk_id: string;
  referrer_clerk_id: string;
  conversion_amount_npr: number;
  commission_rate: number;
  commission_amount_npr: number;
  status: string;
  created_at: Date | string;
  settled_at: Date | string | null;
  settled_by_clerk_id: string | null;
};

function asIso(value: Date | string | null | undefined): string | null {
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString();
  return new Date(value).toISOString();
}

function mapLink(row: LinkRow): ReferralLinkRecord {
  return {
    ownerClerkId: row.owner_clerk_id,
    code: row.code,
    ownerEmail: row.owner_email,
    ownerName: row.owner_name,
    ownerRole: row.owner_role,
    active: Boolean(row.active),
    createdAt: asIso(row.created_at)!,
    updatedAt: asIso(row.updated_at)!,
  };
}

function mapAttr(row: AttrRow): ReferralAttributionRecord {
  return {
    referredClerkId: row.referred_clerk_id,
    referrerClerkId: row.referrer_clerk_id,
    code: row.code,
    attributedAt: asIso(row.attributed_at)!,
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
    createdAt: asIso(row.created_at)!,
    settledAt: asIso(row.settled_at),
    settledByClerkId: row.settled_by_clerk_id,
  };
}

export function createMysqlReferralsRepo(pool: Pool): ReferralsRepository {
  return {
    driver: 'mysql',

    async ensureSchema() {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS referral_links (
          owner_clerk_id VARCHAR(64) PRIMARY KEY,
          code VARCHAR(32) NOT NULL,
          owner_email VARCHAR(255) NOT NULL,
          owner_name VARCHAR(255) NOT NULL,
          owner_role VARCHAR(64) NOT NULL,
          active TINYINT(1) NOT NULL DEFAULT 1,
          created_at DATETIME(3) NOT NULL,
          updated_at DATETIME(3) NOT NULL,
          UNIQUE KEY uq_referral_links_code (code),
          INDEX idx_referral_links_active (active)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS referral_attributions (
          referred_clerk_id VARCHAR(64) PRIMARY KEY,
          referrer_clerk_id VARCHAR(64) NOT NULL,
          code VARCHAR(32) NOT NULL,
          attributed_at DATETIME(3) NOT NULL,
          INDEX idx_referral_attr_referrer (referrer_clerk_id),
          INDEX idx_referral_attr_code (code)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS referral_commissions (
          id VARCHAR(64) PRIMARY KEY,
          claim_id VARCHAR(128) NOT NULL,
          referred_clerk_id VARCHAR(64) NOT NULL,
          referrer_clerk_id VARCHAR(64) NOT NULL,
          conversion_amount_npr INT NOT NULL,
          commission_rate DOUBLE NOT NULL,
          commission_amount_npr INT NOT NULL,
          status ENUM('pending', 'settled') NOT NULL DEFAULT 'pending',
          created_at DATETIME(3) NOT NULL,
          settled_at DATETIME(3) NULL,
          settled_by_clerk_id VARCHAR(64) NULL,
          UNIQUE KEY uq_referral_commissions_claim (claim_id),
          INDEX idx_referral_comm_referrer (referrer_clerk_id),
          INDEX idx_referral_comm_status (status),
          INDEX idx_referral_comm_referred (referred_clerk_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
    },

    async getLinkByOwner(ownerClerkId) {
      const [rows] = await pool.query<LinkRow[]>(
        'SELECT * FROM referral_links WHERE owner_clerk_id = ? LIMIT 1',
        [ownerClerkId]
      );
      return rows[0] ? mapLink(rows[0]) : null;
    },

    async getLinkByCode(code) {
      const [rows] = await pool.query<LinkRow[]>(
        'SELECT * FROM referral_links WHERE LOWER(code) = LOWER(?) AND active = 1 LIMIT 1',
        [code]
      );
      return rows[0] ? mapLink(rows[0]) : null;
    },

    async ensureLink(input: EnsureReferralLinkInput) {
      const existing = await this.getLinkByOwner(input.ownerClerkId);
      const now = new Date();
      if (existing) {
        await pool.query(
          `UPDATE referral_links
           SET owner_email = ?, owner_name = ?, owner_role = ?, updated_at = ?
           WHERE owner_clerk_id = ?`,
          [input.ownerEmail, input.ownerName, input.ownerRole, now, input.ownerClerkId]
        );
        return (await this.getLinkByOwner(input.ownerClerkId))!;
      }
      let code = input.code;
      for (let i = 0; i < 5; i++) {
        try {
          await pool.query(
            `INSERT INTO referral_links
              (owner_clerk_id, code, owner_email, owner_name, owner_role, active, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
            [
              input.ownerClerkId,
              code,
              input.ownerEmail,
              input.ownerName,
              input.ownerRole,
              now,
              now,
            ]
          );
          break;
        } catch (err: any) {
          if (err?.code === 'ER_DUP_ENTRY') {
            code = `${input.code}${i + 1}`.slice(0, 16);
            if (i === 4) throw err;
            continue;
          }
          throw err;
        }
      }
      return (await this.getLinkByOwner(input.ownerClerkId))!;
    },

    async listLinks() {
      const [rows] = await pool.query<LinkRow[]>(
        'SELECT * FROM referral_links ORDER BY created_at ASC'
      );
      return rows.map(mapLink);
    },

    async getAttribution(referredClerkId) {
      const [rows] = await pool.query<AttrRow[]>(
        'SELECT * FROM referral_attributions WHERE referred_clerk_id = ? LIMIT 1',
        [referredClerkId]
      );
      return rows[0] ? mapAttr(rows[0]) : null;
    },

    async attributeFirstTouch(input) {
      const existing = await this.getAttribution(input.referredClerkId);
      if (existing) return { attribution: existing, created: false };
      const now = new Date();
      try {
        await pool.query(
          `INSERT INTO referral_attributions
            (referred_clerk_id, referrer_clerk_id, code, attributed_at)
           VALUES (?, ?, ?, ?)`,
          [input.referredClerkId, input.referrerClerkId, input.code, now]
        );
      } catch (err: any) {
        if (err?.code === 'ER_DUP_ENTRY') {
          const raced = await this.getAttribution(input.referredClerkId);
          if (raced) return { attribution: raced, created: false };
        }
        throw err;
      }
      return { attribution: (await this.getAttribution(input.referredClerkId))!, created: true };
    },

    async getCommissionByClaimId(claimId) {
      const [rows] = await pool.query<CommRow[]>(
        'SELECT * FROM referral_commissions WHERE claim_id = ? LIMIT 1',
        [claimId]
      );
      return rows[0] ? mapComm(rows[0]) : null;
    },

    async insertCommission(input: CreateCommissionInput) {
      const existing = await this.getCommissionByClaimId(input.claimId);
      if (existing) return { ok: false as const, reason: 'duplicate_claim' as const, existing };
      const now = new Date();
      try {
        await pool.query(
          `INSERT INTO referral_commissions
            (id, claim_id, referred_clerk_id, referrer_clerk_id, conversion_amount_npr,
             commission_rate, commission_amount_npr, status, created_at, settled_at, settled_by_clerk_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, NULL, NULL)`,
          [
            input.id,
            input.claimId,
            input.referredClerkId,
            input.referrerClerkId,
            input.conversionAmountNpr,
            input.commissionRate,
            input.commissionAmountNpr,
            now,
          ]
        );
      } catch (err: any) {
        if (err?.code === 'ER_DUP_ENTRY') {
          const raced = await this.getCommissionByClaimId(input.claimId);
          if (raced) return { ok: false as const, reason: 'duplicate_claim' as const, existing: raced };
        }
        throw err;
      }
      return { ok: true as const, commission: (await this.getCommissionByClaimId(input.claimId))! };
    },

    async listCommissionsByReferrer(referrerClerkId) {
      const [rows] = await pool.query<CommRow[]>(
        `SELECT * FROM referral_commissions
         WHERE referrer_clerk_id = ?
         ORDER BY created_at DESC`,
        [referrerClerkId]
      );
      return rows.map(mapComm);
    },

    async listAllCommissions() {
      const [rows] = await pool.query<CommRow[]>(
        'SELECT * FROM referral_commissions ORDER BY created_at DESC'
      );
      return rows.map(mapComm);
    },

    async settleCommission(id, settledByClerkId) {
      const now = new Date();
      const [result] = await pool.query<ResultSetHeader>(
        `UPDATE referral_commissions
         SET status = 'settled', settled_at = ?, settled_by_clerk_id = ?
         WHERE id = ? AND status = 'pending'`,
        [now, settledByClerkId, id]
      );
      const [rows] = await pool.query<CommRow[]>(
        'SELECT * FROM referral_commissions WHERE id = ? LIMIT 1',
        [id]
      );
      if (!rows[0]) return null;
      void result;
      return mapComm(rows[0]);
    },

    async close() {
      await pool.end();
    },
  };
}
