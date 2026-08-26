import { cp, mkdir, readFile, rm, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, 'dist');
const assets = ['index.html', 'app.js', 'styles.css'];

const html = await readFile(resolve(root, 'index.html'), 'utf8');
for (const asset of assets.slice(1)) {
  if (!html.includes(`"${asset}"`)) {
    throw new Error(`index.html does not reference ${asset}.`);
  }
}

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await Promise.all(assets.map((asset) => cp(resolve(root, asset), resolve(output, asset))));
await Promise.all(assets.map((asset) => stat(resolve(output, asset))));

console.log(`Built ${assets.length} static assets to dist/`);
console.log('Open it locally with: npm run preview  →  http://localhost:4173');
