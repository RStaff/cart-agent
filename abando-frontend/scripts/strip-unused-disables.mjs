import fs from 'node:fs';
import path from 'node:path';

const repo = process.cwd();
const targets = [
  'src/app/dashboard/Client.tsx',
  'src/components/ImageCard.tsx',
  'src/components/NavbarV2.tsx',
];

let changed = [];
for (const rel of targets) {
  const p = path.join(repo, rel);
  if (!fs.existsSync(p)) continue;
  const s = fs.readFileSync(p, 'utf8');

  // Only strip disables for @next/next/no-img-element (since config now turns it off)
  const ns = s
    // line comments
    .replace(/^\s*\/\/\s*eslint-disable(-next-line|-line)?[^\n]*@next\/next\/no-img-element[^\n]*\n/gm, '')
    // block comments
    .replace(/\/\*\s*eslint-disable[^*]*@next\/next\/no-img-element[\s\S]*?\*\/\n?/gm, '');

  if (ns !== s) {
    fs.writeFileSync(p, ns, 'utf8');
    changed.push(rel);
  }
}

console.log(changed.length ? `✓ stripped unused disables for @next/next/no-img-element in:\n - ${changed.join('\n - ')}` : 'No matching disables found to strip.');
