const fs = require('fs');

const ENTRY = fs.existsSync('src/index.ts') ? 'src/index.ts'
            : fs.existsSync('src/index.js') ? 'src/index.js'
            : null;
if (!ENTRY) { console.error('✗ No src/index.(js|ts)'); process.exit(1); }

const pkg = JSON.parse(fs.readFileSync('package.json','utf8'));
let code = fs.readFileSync(ENTRY, 'utf8');
const isESM = pkg.type === 'module' || /^\s*import\s/m.test(code);

// 0) Remove any broken stray “(_req,_res)=>res.json(...));” tail lines from earlier patches
const cleanStrays = (s) => s.split(/\r?\n/).filter(l => {
  const t = l.trim();
  if (t.startsWith('(req,res)=>res.json({ok:true') && t.endsWith('}));')) return false;
  if (/ALLOW_PUBLIC_CHECKOUT/.test(t) && t.endsWith('}));') && !/app\.(get|use)\(/.test(t)) return false;
  return true;
}).join('\n');
code = cleanStrays(code);

// 1) Remove ALL previous imports/requires of checkoutPublic
code = code
  .replace(/^\s*import\s+checkoutPublic\s+from\s+["']\.\/dev\/checkoutPublic\.esm\.js["']\s*;?\s*$/mg, '')
  .replace(/^\s*const\s+checkoutPublic\s*=\s*require\(\s*["']\.\/dev\/checkoutPublic\.cjs["']\s*\)\s*;?\s*$/mg, '');

// 2) Insert a single correct import at the top (after shebang)
const topLines = code.split('\n');
let insertAt = (topLines[0] && topLines[0].startsWith('#!')) ? 1 : 0;
topLines.splice(insertAt, 0, isESM
  ? `import checkoutPublic from "./dev/checkoutPublic.esm.js";`
  : `const checkoutPublic = require("./dev/checkoutPublic.cjs");`
);
code = topLines.join('\n');

// 3) Ensure express.json() exists once, right after app init
if (!/app\.use\(\s*express\.json\(\s*\)\s*\)/.test(code)) {
  code = code.replace(
    /(const\s+app\s*=\s*express\s*\(\s*\)\s*;?)/,
    `$1\napp.use(express.json());`
  );
}

// 4) Remove ALL existing mounts of our paths
const mountLine = (p) => new RegExp(`^\\s*app\\.use\$begin:math:text$\\\\s*["']${p}["']\\\\s*,\\\\s*checkoutPublic\\\\s*\\$end:math:text$\\s*;?\\s*$`, 'm');
const removeAllMounts = (s) => s
  .split(/\r?\n/)
  .filter(l =>
    !mountLine('/api/billing/checkout').test(l) &&
    !mountLine('/__public-checkout').test(l) &&
    !mountLine('/api/billing/public-checkout').test(l)
  ).join('\n');
code = removeAllMounts(code);

// 5) Insert mounts right after app init (so they win)
const lines = code.split('\n');
const appIdx = lines.findIndex(l => /const\s+app\s*=\s*express\s*\(\s*\)\s*;?/.test(l));
if (appIdx < 0) { console.error("✗ Could not find 'const app = express()'"); process.exit(1); }

// add AFTER express.json() if we just inserted it
const afterJsonIdx = lines.findIndex((l, i) => i > appIdx && /app\.use\(\s*express\.json\(\s*\)\s*\)\s*;?/.test(l));
const insertIdx = afterJsonIdx > -1 ? afterJsonIdx + 1 : appIdx + 1;

// Our canonical mounts (primary + alias)
const mounts = [
  `app.use("/api/billing/checkout", checkoutPublic);`,
  `app.use("/__public-checkout", checkoutPublic);`
];
lines.splice(insertIdx, 0, ...mounts);
code = lines.join('\n');

// 6) Comment out exact legacy OK handler (if present)
code = code.replace(
  /(app\.(?:post|get)\(\s*["']\/api\/billing\/checkout["']\s*,\s*function\s*\([^)]*\)\s*\{\s*res\.send\(["']OK["']\);\s*\}\s*\);?)/g,
  '/* legacy handler disabled: $1 */'
);

// 7) Tidy extra blank lines
code = code.replace(/\n{3,}/g, '\n\n');

// 8) Syntax-check the candidate before writing
const tmp = `${ENTRY}.__tmp__`;
fs.writeFileSync(tmp, code, 'utf8');
try {
  require('child_process').execSync(`node --check ${tmp}`, { stdio: 'inherit' });
} catch (e) {
  console.error('✗ Syntax error in candidate patch; NOT writing changes.');
  process.exit(1);
}
fs.renameSync(tmp, ENTRY);
console.log(`✓ wired public checkout in ${ENTRY}`);
