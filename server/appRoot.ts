/**
 * Resolve PrepX repo root for both:
 * - `tsx server/index.ts` / `server/db/*.ts` (nested source paths)
 * - bundled Hostinger entry `server.js` at repo root
 *
 * Bug this prevents: `path.resolve(__dirname, '../..')` from `server/db`
 * becomes two directories ABOVE the app once esbuild inlines into server.js,
 * so SQLite opens an empty DB and mocks/questions look "lost".
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function resolveAppRoot(importMetaUrl: string): string {
  let dir = path.dirname(fileURLToPath(importMetaUrl));
  for (let i = 0; i < 4; i += 1) {
    if (fs.existsSync(path.join(dir, 'package.json'))) return dir;
    const parent = path.resolve(dir, '..');
    if (parent === dir) break;
    dir = parent;
  }
  return path.dirname(fileURLToPath(importMetaUrl));
}
