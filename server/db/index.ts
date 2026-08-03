import path from 'path';
import { fileURLToPath } from 'url';
import { createMysqlPoolFromEnv, createMysqlQuestionsRepo } from './mysqlQuestions.ts';
import { createMysqlMocksRepo } from './mysqlMocks.ts';
import { createMysqlReferralsRepo } from './mysqlReferrals.ts';
import { createMysqlPaymentClaimsRepo } from './mysqlPaymentClaims.ts';
import { createMysqlSupportIssuesRepo } from './mysqlSupportIssues.ts';
import { createMysqlFormulasRepo } from './mysqlFormulas.ts';
import { createSqliteQuestionsRepo } from './sqliteQuestions.ts';
import { createSqliteMocksRepo } from './sqliteMocks.ts';
import { createSqliteReferralsRepo } from './sqliteReferrals.ts';
import { createSqlitePaymentClaimsRepo } from './sqlitePaymentClaims.ts';
import { createSqliteSupportIssuesRepo } from './sqliteSupportIssues.ts';
import { createSqliteFormulasRepo } from './sqliteFormulas.ts';
import type {
  FormulasRepository,
  MocksRepository,
  PaymentClaimsRepository,
  QuestionsRepository,
  ReferralsRepository,
  SupportIssuesRepository,
} from './types.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');

export type DbMode = 'mysql' | 'sqlite';

export function resolveDbMode(): DbMode {
  const explicit = (process.env.DB_DRIVER || '').toLowerCase();
  if (explicit === 'mysql') return 'mysql';
  if (explicit === 'sqlite') return 'sqlite';
  const host = process.env.DB_HOST || process.env.MYSQL_HOST;
  return host ? 'mysql' : 'sqlite';
}

function sqlitePath() {
  return (
    process.env.SQLITE_PATH || path.join(root, 'data', 'prepx-questions.sqlite')
  );
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

/** Shared boot helper: questions + mocks + referrals + payment claims + support + formulas. */
export async function createAppRepositories(): Promise<{
  questions: QuestionsRepository;
  mocks: MocksRepository;
  referrals: ReferralsRepository;
  paymentClaims: PaymentClaimsRepository;
  supportIssues: SupportIssuesRepository;
  formulas: FormulasRepository;
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
    await questions.ensureSchema();
    await mocks.ensureSchema();
    await referrals.ensureSchema();
    await paymentClaims.ensureSchema();
    await supportIssues.ensureSchema();
    await formulas.ensureSchema();
    return { questions, mocks, referrals, paymentClaims, supportIssues, formulas };
  }

  const file = sqlitePath();
  const questions = createSqliteQuestionsRepo(file);
  const mocks = createSqliteMocksRepo(file);
  const referrals = createSqliteReferralsRepo(file);
  const paymentClaims = createSqlitePaymentClaimsRepo(file);
  const supportIssues = createSqliteSupportIssuesRepo(file);
  const formulas = createSqliteFormulasRepo(file);
  await questions.ensureSchema();
  await mocks.ensureSchema();
  await referrals.ensureSchema();
  await paymentClaims.ensureSchema();
  await supportIssues.ensureSchema();
  await formulas.ensureSchema();
  return { questions, mocks, referrals, paymentClaims, supportIssues, formulas };
}
