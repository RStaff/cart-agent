const fs = require('fs');
const p = 'src/app/layout.tsx';
let s = fs.readFileSync(p, 'utf8');

const importRe = /^[ \t]*import[ \t]+Navbar[ \t]+from[ \t]+["'][^"']*components\/Navbar[^"']*["'];?\s*$/gm;

// Remove ALL Navbar import lines
s = s.replace(importRe, '').replace(/\n{2,}/g, '\n');

// Ensure exactly one canonical import at the top (after "use client" if present)
if (/^\s*["']use client["']\s*;?\s*/m.test(s)) {
  s = s.replace(/^(\s*["']use client["']\s*;?\s*\r?\n)/m, `$1import Navbar from "@/components/Navbar";\n`);
} else if (!/^\s*import[ \t]+Navbar[ \t]+from[ \t]+["']@\/components\/Navbar["']/.test(s)) {
  s = `import Navbar from "@/components/Navbar";\n` + s;
}

// Keep only the first <Navbar .../> occurrence
let seen = false;
s = s.split('\n').map(line => {
  if (line.includes('<Navbar')) {
    if (seen) {
      // Drop subsequent self-closing uses
      if (/<Navbar[\s\S]*\/>/.test(line.trim())) return '';
    } else {
      seen = true;
    }
  }
  return line;
}).join('\n').replace(/\n{2,}/g, '\n');

fs.writeFileSync(p, s, 'utf8');
console.log('✅ layout.tsx: single canonical import + one <Navbar />');
