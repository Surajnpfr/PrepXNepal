/**
 * Ensure esbuild native binaries are executable (Hostinger often strips +x → EACCES).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const nm = path.join(root, 'node_modules');

const candidates = [
  path.join(nm, '@esbuild'),
  path.join(nm, 'esbuild'),
  path.join(nm, 'tsx', 'node_modules', '@esbuild'),
  path.join(nm, 'tsx', 'node_modules', 'esbuild'),
];

const bins = [];
for (const c of candidates) {
  if (!fs.existsSync(c)) continue;
  const stack = [c];
  while (stack.length) {
    const dir = stack.pop();
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const ent of entries) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) stack.push(full);
      else if (ent.name === 'esbuild' || ent.name === 'esbuild.exe') bins.push(full);
    }
  }
}

for (const bin of bins) {
  try {
    fs.chmodSync(bin, 0o755);
    console.log('chmod +x', path.relative(root, bin));
  } catch (err) {
    console.warn('chmod skipped', path.relative(root, bin), err?.message || err);
  }
}
