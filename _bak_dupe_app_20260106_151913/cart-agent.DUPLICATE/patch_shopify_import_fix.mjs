import fs from 'node:fs'; import path from 'node:path';
const fp = path.join(process.cwd(), 'web', 'src', 'index.js');
if (!fs.existsSync(fp)) { console.error('missing', fp); process.exit(1); }
const s = fs.readFileSync(fp, 'utf8');

const start = '// === Shopify OAuth + Billing (dev scaffold)';
const end   = '// === End Shopify OAuth + Billing';
const i0 = s.indexOf(start), i1 = s.indexOf(end);
if (i0 === -1 || i1 === -1) { console.log('• Shopify block not found; nothing to change'); process.exit(0); }

let block = s.slice(i0, i1);
const before = block;

// strip only the duplicate imports that we added inside the block
block = block
  .replace(/^\s*import\s+express\s+from\s+["']express["'];?\s*$/m, '/* uses existing express import */')
  .replace(/^\s*import\s+fetch\s+from\s+["']node-fetch["'];?\s*$/m, '/* uses global fetch on Node 18+ */')
  .replace(/^\s*import\s+crypto\s+from\s+["']node:crypto["'];?\s*$/m, '/* uses existing crypto import */')
  .replace(/^\s*import\s+fs\s+from\s+["']node:fs["'];?\s*$/m, '/* uses existing fs import */')
  .replace(/^\s*import\s+path\s+from\s+["']node:path["'];?\s*$/m, '/* uses existing path import */');

if (block === before) {
  console.log('• No duplicate imports found inside Shopify block');
  process.exit(0);
}

const out = s.slice(0, i0) + block + s.slice(i1);
fs.writeFileSync(fp, out);
console.log('✅ Removed duplicate imports inside Shopify OAuth block');
