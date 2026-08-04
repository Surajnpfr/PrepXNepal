import assert from 'node:assert/strict';
import {
  compareMocksNew,
  compareMocksSerial,
  filterMocksByAttempt,
  givenMockIdSet,
  sortCatalogMocks,
} from '../src/lib/catalogMocks.ts';

const mocks = [
  { id: 'mock-set-sett', title: 'SetT', createdAt: '2026-08-01T10:00:00.000Z' },
  { id: 'mock-set-seta', title: 'SetA', createdAt: '2026-07-01T10:00:00.000Z' },
  { id: 'mock-set-sets', title: 'SetS', createdAt: '2026-08-03T10:00:00.000Z' },
  { id: 'mock-set-setr', title: 'SetR', createdAt: '2026-08-02T10:00:00.000Z' },
];

assert.deepEqual(
  sortCatalogMocks(mocks, 'serial').map((m) => m.title),
  ['SetA', 'SetR', 'SetS', 'SetT']
);
assert.deepEqual(
  sortCatalogMocks(mocks, 'new').map((m) => m.title),
  ['SetS', 'SetR', 'SetT', 'SetA']
);

const given = givenMockIdSet([{ mockId: 'mock-set-seta' }, { mockId: 'mock-set-sett' }]);
assert.equal(given.has('mock-set-seta'), true);
assert.deepEqual(
  filterMocksByAttempt(mocks, 'given', given).map((m) => m.title).sort(),
  ['SetA', 'SetT']
);
assert.deepEqual(
  filterMocksByAttempt(mocks, 'not_given', given).map((m) => m.title).sort(),
  ['SetR', 'SetS']
);

assert.ok(compareMocksSerial({ title: 'SetA', id: 'a' }, { title: 'SetB', id: 'b' }) < 0);
assert.ok(
  compareMocksNew(
    { id: 'a', createdAt: '2026-08-04T00:00:00.000Z' },
    { id: 'b', createdAt: '2026-08-01T00:00:00.000Z' }
  ) < 0
);

console.log('catalogMocks tests passed');
