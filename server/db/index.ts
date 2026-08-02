import path from 'path';
import { fileURLToPath } from 'url';
import { createMysqlPoolFromEnv, createMysqlQuestionsRepo } from './mysqlQuestions.ts';
import { createMysqlMocksRepo } from './mysqlMocks.ts';
import { createSqliteQuestionsRepo } from './sqliteQuestions.ts';
import { createSqliteMocksRepo } from './sqliteMocks.ts';
import type { MocksRepository, QuestionsRepository } from './types.ts';

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

/** Shared boot helper: same SQLite file / MySQL DB for questions + mocks. */
export async function createAppRepositories(): Promise<{
  questions: QuestionsRepository;
  mocks: MocksRepository;
}> {
  const mode = resolveDbMode();
  if (mode === 'mysql') {
    const pool = createMysqlPoolFromEnv();
    const questions = createMysqlQuestionsRepo(pool);
    const mocks = createMysqlMocksRepo(pool);
    await questions.ensureSchema();
    await mocks.ensureSchema();
    return { questions, mocks };
  }

  const file = sqlitePath();
  const questions = createSqliteQuestionsRepo(file);
  const mocks = createSqliteMocksRepo(file);
  await questions.ensureSchema();
  await mocks.ensureSchema();
  return { questions, mocks };
}
