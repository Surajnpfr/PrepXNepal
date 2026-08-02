/**
 * Hostinger / `npm start` entrypoint.
 * Loads the pre-built API bundle (no tsx → no runtime esbuild binary).
 * Run `npm run build` first so dist-server/index.js exists.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const bundle = path.join(root, 'dist-server', 'index.js');

if (!fs.existsSync(bundle)) {
  console.error(
    'Missing dist-server/index.js. Run `npm run build` (includes server bundle) before start.'
  );
  process.exit(1);
}

await import(pathToFileURL(bundle).href);
