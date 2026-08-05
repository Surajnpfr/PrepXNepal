import path from 'path';
import { fileURLToPath } from 'url';
import { resolveAppRoot } from '../appRoot.ts';
import { createMysqlPoolFromEnv, createMysqlQuestionsRepo } from './mysqlQuestions.ts';
import { createMysqlMocksRepo } from './mysqlMocks.ts';
import { createMysqlReferralsRepo } from './mysqlReferrals.ts';
import { createMysqlPaymentClaimsRepo } from './mysqlPaymentClaims.ts';
import { createMysqlSupportIssuesRepo } from './mysqlSupportIssues.ts';
import { createMysqlFormulasRepo } from './mysqlFormulas.ts';
import { createMysqlPromoCodesRepo } from './mysqlPromoCodes.ts';
import { createMysqlAttemptReportsRepo } from './mysqlAttemptReports.ts';
import { createMysqlNoticesRepo } from './mysqlNotices.ts';
import { createSqliteQuestionsRepo } from './sqliteQuestions.ts';
import { createSqliteMocksRepo } from './sqliteMocks.ts';
import { createSqliteReferralsRepo } from './sqliteReferrals.ts';
import { createSqlitePaymentClaimsRepo } from './sqlitePaymentClaims.ts';
import { createSqliteSupportIssuesRepo } from './sqliteSupportIssues.ts';
import { createSqliteFormulasRepo } from './sqliteFormulas.ts';
import { createSqlitePromoCodesRepo } from './sqlitePromoCodes.ts';
import { createSqliteAttemptReportsRepo } from './sqliteAttemptReports.ts';
import { createSqliteNoticesRepo } from './sqliteNotices.ts';
import type {
  AttemptReportsRepository,
  FormulasRepository,
  MocksRepository,
  NoticesRepository,
  PaymentClaimsRepository,
  PromoCodesRepository,
  QuestionsRepository,
  ReferralsRepository,
  SupportIssuesRepository,
} from './types.ts';

const root = resolveAppRoot(import.meta.url);

export type DbMode = 'mysql' | 'sqlite';

export function resolveDbMode(): DbMode {
  const explicit = (process.env.DB_DRIVER || '').toLowerCase();
  if (explicit === 'mysql') return 'mysql';
  if (explicit === 'sqlite') return 'sqlite';
  const host = process.env.DB_HOST || process.env.MYSQL_HOST;
  return host ? 'mysql' : 'sqlite';
}

/** Absolute SQLite file path (override with SQLITE_PATH). */
export function resolveSqlitePath(): string {
  return (
    process.env.SQLITE_PATH || path.join(root, 'data', 'prepx-questions.sqlite')
  );
}

function sqlitePath() {
  return resolveSqlitePath();
}

export async function createQuestionsRepository(): Promise<QuestionsRepository> {
  const mode = resolveDbMode();
  if (mode === 'mysql') {
    const pool = createMysqlPoolFromEnv();
    const repo = createMysqlQuestionsRepo(pool);
    await repo.ensureSchema();
    return repo;
  }

  const repo = createSqliteQuestionsRepo(sqlitePath());
  await repo.ensureSchema();
  return repo;
}

export async function createMocksRepository(): Promise<MocksRepository> {
  const mode = resolveDbMode();
  if (mode === 'mysql') {
    const pool = createMysqlPoolFromEnv();
    const repo = createMysqlMocksRepo(pool);
    await repo.ensureSchema();
    return repo;
  }

  const repo = createSqliteMocksRepo(sqlitePath());
  await repo.ensureSchema();
  return repo;
}

/** Shared boot helper: questions + mocks + referrals + payment claims + support + formulas + promos + attempt reports + notices. */
export async function createAppRepositories(): Promise<{
  questions: QuestionsRepository;
  mocks: MocksRepository;
  referrals: ReferralsRepository;
  paymentClaims: PaymentClaimsRepository;
  supportIssues: SupportIssuesRepository;
  formulas: FormulasRepository;
  promoCodes: PromoCodesRepository;
  attemptReports: AttemptReportsRepository;
  notices: NoticesRepository;
}> {
  const mode = resolveDbMode();
  if (mode === 'mysql') {
    const pool = createMysqlPoolFromEnv();
    const questions = createMysqlQuestionsRepo(pool);
    const mocks = createMysqlMocksRepo(pool);
    const referrals = createMysqlReferralsRepo(pool);
    const paymentClaims = createMysqlPaymentClaimsRepo(pool);
    const supportIssues = createMysqlSupportIssuesRepo(pool);
    const formulas = createMysqlFormulasRepo(pool);
    const promoCodes = createMysqlPromoCodesRepo(pool);
    const attemptReports = createMysqlAttemptReportsRepo(pool);
    const notices = createMysqlNoticesRepo(pool);
    await questions.ensureSchema();
    await mocks.ensureSchema();
    await referrals.ensureSchema();
    await paymentClaims.ensureSchema();
    await supportIssues.ensureSchema();
    await formulas.ensureSchema();
    await promoCodes.ensureSchema();
    await attemptReports.ensureSchema();
    await notices.ensureSchema();
    return {
      questions,
      mocks,
      referrals,
      paymentClaims,
      supportIssues,
      formulas,
      promoCodes,
      attemptReports,
      notices,
    };
  }

  const file = sqlitePath();
  const questions = createSqliteQuestionsRepo(file);
  const mocks = createSqliteMocksRepo(file);
  const referrals = createSqliteReferralsRepo(file);
  const paymentClaims = createSqlitePaymentClaimsRepo(file);
  const supportIssues = createSqliteSupportIssuesRepo(file);
  const formulas = createSqliteFormulasRepo(file);
  const promoCodes = createSqlitePromoCodesRepo(file);
  const attemptReports = createSqliteAttemptReportsRepo(file);
  const notices = createSqliteNoticesRepo(file);
  await questions.ensureSchema();
  await mocks.ensureSchema();
  await referrals.ensureSchema();
  await paymentClaims.ensureSchema();
  await supportIssues.ensureSchema();
  await formulas.ensureSchema();
  await promoCodes.ensureSchema();
  await attemptReports.ensureSchema();
  await notices.ensureSchema();
  return {
    questions,
    mocks,
    referrals,
    paymentClaims,
    supportIssues,
    formulas,
    promoCodes,
    attemptReports,
    notices,
  };
}
