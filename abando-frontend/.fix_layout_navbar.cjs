const fs = require('fs');
const p = 'src/app/layout.tsx';
let s = fs.readFileSync(p, 'utf8');

// remove all Navbar imports (any path variant)
const importRe = /^[ \t]*import[ \t]+Navbar[ \t]+from[ \t]+["'][^"']*components\/Navbar[^"']*["'];?\s*$/gm;
s = s.replace(importRe, '').replace(/\n{3,}/g, '\n\n');

// ensure exactly one canonical import at top (after "use client" if present)
if (/^\s*["']use client["']\s*;?\s*/m.test(s)) {
  s = s.replace(/^(\s*["']use client["']\s*;?\s*\r?\n)/m, `$1import Navbar from "@/components/Navbar";\n`);
} else if (!/^\s*import[ \t]+Navbar[ \t]+from[ \t]+["']@\/components\/Navbar["']/.test(s)) {
  s = `import Navbar from "@/components/Navbar";\n` + s;
}

// keep only first <Navbar .../> (drop later self-closing duplicates)
let seen = false;
s = s.split('\n').map(line => {
  if (line.includes('<Navbar')) {
    if (seen && /<Navbar[\s\S]*\/>/.test(line.trim())) return '';
    seen = true;
  }
  return line;
}).join('\n').replace(/\n{3,}/g, '\n\n');

fs.writeFileSync(p, s, 'utf8');
console.log('✅ layout.tsx patched: single import + one <Navbar />');
