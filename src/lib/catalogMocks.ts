/**
 * Catalog list filters/sort for fixed mock sets.
 */

export type CatalogAttemptFilter = 'all' | 'given' | 'not_given';
export type CatalogSortMode = 'serial' | 'new';

export function givenMockIdSet(
  reports: Array<{ mockId: string }>
): Set<string> {
  return new Set(reports.map((r) => r.mockId).filter(Boolean));
}

export function compareMocksSerial(
  a: { title: string; id: string },
  b: { title: string; id: string }
): number {
  const byTitle = a.title.localeCompare(b.title, undefined, {
    sensitivity: 'base',
    numeric: true,
  });
  if (byTitle !== 0) return byTitle;
  return a.id.localeCompare(b.id);
}

export function compareMocksNew(
  a: { id: string; createdAt?: string },
  b: { id: string; createdAt?: string }
): number {
  const ta = a.createdAt ? Date.parse(a.createdAt) : NaN;
  const tb = b.createdAt ? Date.parse(b.createdAt) : NaN;
  const aOk = Number.isFinite(ta);
  const bOk = Number.isFinite(tb);
  if (aOk && bOk && ta !== tb) return tb - ta; // newest first
  if (aOk && !bOk) return -1;
  if (!aOk && bOk) return 1;
  return a.id.localeCompare(b.id);
}

export function filterMocksByAttempt<T extends { id: string }>(
  mocks: T[],
  attemptFilter: CatalogAttemptFilter,
  givenIds: Set<string>
): T[] {
  if (attemptFilter === 'given') return mocks.filter((m) => givenIds.has(m.id));
  if (attemptFilter === 'not_given') return mocks.filter((m) => !givenIds.has(m.id));
  return mocks;
}

export function sortCatalogMocks<T extends { id: string; title: string; createdAt?: string }>(
  mocks: T[],
  sortMode: CatalogSortMode
): T[] {
  const copy = [...mocks];
  if (sortMode === 'new') {
    copy.sort((a, b) => compareMocksNew(a, b));
  } else {
    copy.sort((a, b) => compareMocksSerial(a, b));
  }
  return copy;
}
