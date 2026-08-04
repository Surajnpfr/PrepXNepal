import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolveAppRoot } from '../server/appRoot.ts';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');
assert.ok(fs.existsSync(path.join(repoRoot, 'package.json')));

// Simulate nested source module under server/db/
const nestedUrl = pathToFileURL(path.join(repoRoot, 'server', 'db', 'index.ts')).href;
assert.equal(resolveAppRoot(nestedUrl), repoRoot);

// Simulate bundled server.js at repo root
const bundledUrl = pathToFileURL(path.join(repoRoot, 'server.js')).href;
assert.equal(resolveAppRoot(bundledUrl), repoRoot);

// Simulate server/index.ts
const serverUrl = pathToFileURL(path.join(repoRoot, 'server', 'index.ts')).href;
assert.equal(resolveAppRoot(serverUrl), repoRoot);

console.log('appRoot resolution OK');
