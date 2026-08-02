/**
 * Hosting entrypoint (Hostinger Node / `npm start`).
 * Runs the TypeScript Express API via tsx — no separate tsc emit required.
 *
 * Do not replace this with `import('./server/index.ts')` under plain Node;
 * that fails without a TypeScript loader.
 */
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const entry = path.join(root, 'server', 'index.ts');

const child = spawn(process.execPath, ['--import', 'tsx', entry], {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
});

child.on('error', (err) => {
  console.error('Failed to start PrepX server:', err);
  process.exit(1);
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    try {
      child.kill(sig);
    } catch {
      /* ignore */
    }
  });
}
