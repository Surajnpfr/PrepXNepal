import fs from 'node:fs';
import path from 'node:path';
import { resolveAppRoot } from './appRoot.ts';
import {
  PLAN_ENTITLEMENTS_SEED,
  parsePlanEntitlements,
  type PlanEntitlements,
} from './planEntitlementsDomain.ts';

const root = resolveAppRoot(import.meta.url);

function entitlementsPath(): string {
  const dataDir = path.dirname(
    process.env.SQLITE_PATH || path.join(root, 'data', 'prepx-questions.sqlite')
  );
  return path.join(dataDir, 'plan-entitlements.json');
}

let cache: PlanEntitlements | null = null;

function ensureDir(filePath: string) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function writeSeed(filePath: string): PlanEntitlements {
  ensureDir(filePath);
  fs.writeFileSync(filePath, JSON.stringify(PLAN_ENTITLEMENTS_SEED, null, 2), 'utf8');
  return { ...PLAN_ENTITLEMENTS_SEED };
}

/** Load entitlements from disk (seed file on first read). Cached in memory. */
export function getPlanEntitlements(): PlanEntitlements {
  if (cache) return cache;
  const filePath = entitlementsPath();
  try {
    if (!fs.existsSync(filePath)) {
      cache = writeSeed(filePath);
      return cache;
    }
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf8')) as unknown;
    const parsed = parsePlanEntitlements(raw);
    if (parsed.ok === false) {
      console.warn('[plan-entitlements] invalid file, reseeding:', parsed.error);
      cache = writeSeed(filePath);
      return cache;
    }
    cache = parsed.value;
    return cache;
  } catch (err) {
    console.warn('[plan-entitlements] read failed, reseeding:', err);
    cache = writeSeed(filePath);
    return cache;
  }
}

/** Persist entitlements and refresh cache. */
export function setPlanEntitlements(next: PlanEntitlements): PlanEntitlements {
  const parsed = parsePlanEntitlements(next);
  if (parsed.ok === false) {
    throw new Error(parsed.error);
  }
  const filePath = entitlementsPath();
  ensureDir(filePath);
  fs.writeFileSync(filePath, JSON.stringify(parsed.value, null, 2), 'utf8');
  cache = parsed.value;
  return cache;
}

/** Test helper — clear memory cache so next read hits disk. */
export function clearPlanEntitlementsCache() {
  cache = null;
}
