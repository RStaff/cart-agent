import fs from 'node:fs'; import path from 'node:path';

const fp = 'web/src/index.js';
let s = fs.readFileSync(fp,'utf8');
let changed = false;

// Ensure: import path from 'node:path'
if (!/^\s*import\s+path\s+from\s+["']node:path["']/.test(s)) {
  s = s.replace(/(^\s*import[^\n]*\n)/, `$1import path from "node:path";\n`);
  changed = true;
}

// Ensure: __dirname shim for ESM
if (!/fileURLToPath\(import\.meta\.url\)/.test(s) && !/__dirname\s*=/.test(s)) {
  s = s.replace(/(^\s*const\s+app\s*=\s*express\(\)\s*;)/m,
`import { fileURLToPath } from "node:url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
$1`);
  changed = true;
}

// Ensure: cookie-parser import + use()
if (!/cookie-parser/.test(s)) {
  s = s.replace(/(^\s*import\s+express[^\n]*\n)/m,
`$1import cookieParser from "cookie-parser";\n`);
  // add app.use(cookieParser())
  s = s.replace(/(const\s+app\s*=\s*express\(\)\s*;)/, `$1\napp.use(cookieParser());`);
  changed = true;
}

if (changed) fs.writeFileSync(fp, s);
console.log(changed ? "✅ patched web/src/index.js" : "• no changes needed");
