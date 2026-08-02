import type { ImportBatchRecord, QuestionRecord, SubjectCount, SubjectName } from '../questionsDomain.ts';
import type {
  MockImportBatchRecord,
  MockRecord,
  MockMode,
  MockScope,
} from '../mocksDomain.ts';

export interface CreateBatchInput {
  id: string;
  label: string;
  filename?: string | null;
  importedByEmail: string;
  importedByName: string;
  questionCount: number;
  errorCount: number;
}

export interface ChapterCount {
  subject: SubjectName;
  chapter: string;
  count: number;
}

export interface QuestionsRepository {
  readonly driver: 'mysql' | 'sqlite';
  ensureSchema(): Promise<void>;
  list(opts?: { status?: string; batchId?: string }): Promise<QuestionRecord[]>;
  getByIds(ids: string[]): Promise<QuestionRecord[]>;
  listPool(opts: {
    subject: SubjectName;
    chapter?: string;
    status?: string;
    excludeIds?: string[];
  }): Promise<QuestionRecord[]>;
  insertMany(questions: Omit<QuestionRecord, 'createdAt' | 'updatedAt'>[]): Promise<number>;
  insertOne(question: Omit<QuestionRecord, 'createdAt' | 'updatedAt'>): Promise<QuestionRecord>;
  updateOne(question: Omit<QuestionRecord, 'createdAt' | 'updatedAt'>): Promise<QuestionRecord | null>;
  deleteOne(id: string): Promise<boolean>;
  createBatch(input: CreateBatchInput): Promise<ImportBatchRecord>;
  listBatches(): Promise<ImportBatchRecord[]>;
  getBatch(id: string): Promise<ImportBatchRecord | null>;
  deleteBatch(id: string): Promise<{ deletedQuestions: number }>;
  countsBySubject(opts?: { status?: string }): Promise<SubjectCount[]>;
  countsByChapter(opts?: { status?: string; subject?: SubjectName }): Promise<ChapterCount[]>;
  countAll(): Promise<number>;
  close(): Promise<void>;
}

export interface CreateMockBatchInput {
  id: string;
  label: string;
  filename?: string | null;
  importedByEmail: string;
  importedByName: string;
  mockCount: number;
  errorCount: number;
}

export interface MocksRepository {
  readonly driver: 'mysql' | 'sqlite';
  ensureSchema(): Promise<void>;
  list(opts?: {
    publishedOnly?: boolean;
    mode?: MockMode;
    scope?: MockScope;
  }): Promise<MockRecord[]>;
  getById(id: string): Promise<MockRecord | null>;
  insertFixed(
    mock: Omit<MockRecord, 'createdAt' | 'updatedAt' | 'questionIds' | 'allocation'> & {
      mode: 'fixed';
      questionIds: string[];
    }
  ): Promise<MockRecord>;
  insertDynamic(
    mock: Omit<MockRecord, 'createdAt' | 'updatedAt' | 'questionIds'> & { mode: 'dynamic' }
  ): Promise<MockRecord>;
  updateMeta(
    id: string,
    patch: Partial<
      Pick<
        MockRecord,
        | 'title'
        | 'isPublished'
        | 'durationSec'
        | 'questionsPerPage'
        | 'correctMarks'
        | 'wrongMarks'
        | 'unansweredMarks'
        | 'coinPrice'
        | 'allocation'
        | 'totalQuestions'
      >
    >
  ): Promise<MockRecord | null>;
  deleteOne(id: string): Promise<boolean>;
  createImportBatch(input: CreateMockBatchInput): Promise<MockImportBatchRecord>;
  listImportBatches(): Promise<MockImportBatchRecord[]>;
  deleteImportBatch(id: string): Promise<{ deletedMocks: number }>;
  close(): Promise<void>;
}

export function emptySubjectCounts(): SubjectCount[] {
  const subjects: SubjectName[] = [
    'Physics',
    'Chemistry',
    'Zoology',
    'Botany',
    'MAT',
  ];
  return subjects.map((subject) => ({ subject, count: 0 }));
}
