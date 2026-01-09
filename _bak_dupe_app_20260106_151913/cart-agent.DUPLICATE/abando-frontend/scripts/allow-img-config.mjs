import fs from 'node:fs';
import path from 'node:path';

const repo = process.cwd();
const cfg = path.join(repo, '.eslint.flat.cjs');

if (!fs.existsSync(cfg)) {
  console.error('❌ .eslint.flat.cjs not found. Aborting.');
  process.exit(1);
}

let t = fs.readFileSync(cfg, 'utf8');

// Ensure array export so we can append an override
const hasArray = /(module\.exports\s*=\s*\[|export\s+default\s*\[)/.test(t);
const hasObject = /(module\.exports\s*=\s*\{|export\s+default\s*\{)/.test(t);
if (!hasArray && hasObject) {
  t = t.replace(/export\s+default\s*\{/, 'export default [\n{');
  t = t.replace(/module\.exports\s*=\s*\{/, 'module.exports = [\n{');
  t = t.replace(/\}\s*;?\s*$/, '}\n];');
} else if (!hasArray && !hasObject) {
  t = 'module.exports = [];\n' + t;
}

// Remove previous block
const START = '/* img-allowlist */';
const END   = '/* /img-allowlist */';
t = t.replace(new RegExp(`${START}[\\s\\S]*?${END}\\n?`, 'g'), '');

// Append fresh block
const block = `
{
  ${START}
  files: [
    "src/components/ImageCard.tsx",
    "src/components/NavbarV2.tsx",
    "src/app/dashboard/Client.tsx"
  ],
  rules: {
    "@next/next/no-img-element": "off"
  }
  ${END}
},
`.trim() + '\n';

t = t.replace(/\]\s*;?\s*$/, (m) => block + m);
fs.writeFileSync(cfg, t, 'utf8');
console.log('✓ updated .eslint.flat.cjs (allowlist for @next/next/no-img-element)');
