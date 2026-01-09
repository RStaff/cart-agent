// patch_local_hoodie.mjs
/* Idempotent patcher: sets a local hoodie fallback for the Playground preview
   - Creates /assets/hoodie.svg if missing
   - Sets <img id="product-img" data-fallback="/assets/hoodie.svg"> in Playground HTML
   - Normalizes JS to use /assets/hoodie.svg (removes dummyimage URLs, fixes fallbacks)
*/
import fs from 'node:fs';
import path from 'node:path';

const ROOT      = process.cwd();
const PUB       = path.join(ROOT, 'web', 'src', 'public');
const ASSETS    = path.join(PUB, 'assets');
const HOODIE_FP = path.join(ASSETS, 'hoodie.svg');
const MAIN_JS   = path.join(ASSETS, 'main.js');
const PLAY_HTML = path.join(PUB, 'demo', 'playground', 'index.html');

const log = (...a) => console.log('•', ...a);
const ok  = (...a) => console.log('✅', ...a);
const chg = (...a) => console.log('✏️ ', ...a);
const warn= (...a) => console.warn('⚠️ ', ...a);

function ensureDir(p){ fs.mkdirSync(p, { recursive:true }); }
function read(p){ return fs.existsSync(p) ? fs.readFileSync(p,'utf8') : null; }
function write(p,s){ ensureDir(path.dirname(p)); fs.writeFileSync(p,s); }

const HOODIE_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0b1020"/>
      <stop offset="1" stop-color="#111827"/>
    </linearGradient>
  </defs>
  <rect width="320" height="320" fill="url(#g)"/>
  <g fill="none" stroke="#364152" stroke-width="6" opacity="0.7">
    <path d="M40 110c40-40 200-40 240 0"/>
    <path d="M55 140c35-28 175-28 210 0"/>
    <path d="M70 170c30-18 150-18 180 0"/>
  </g>
  <g fill="#6b7280" opacity="0.9">
    <circle cx="160" cy="120" r="34"/>
    <rect x="95" y="140" rx="14" ry="14" width="130" height="110"/>
  </g>
  <text x="50%" y="90%" dominant-baseline="middle" text-anchor="middle"
        font-family="system-ui, -apple-system, Segoe UI, Roboto, Arial" font-size="14"
        fill="#9aa4b2">Hoodie</text>
</svg>
`;

function step1_ensureHoodie(){
  if (fs.existsSync(HOODIE_FP)) { log('hoodie.svg already present'); return; }
  write(HOODIE_FP, HOODIE_SVG);
  chg('added /assets/hoodie.svg');
}

function step2_patchPlaygroundHTML(){
  const html = read(PLAY_HTML);
  if (!html) { warn('Playground HTML not found:', PLAY_HTML); return; }

  let next = html;
  let changed = false;

  // Ensure <img id="product-img"> has data-fallback="/assets/hoodie.svg"
  const imgRe = /<img([^>]*?)id="product-img"([^>]*?)>/i;
  const m = next.match(imgRe);
  if (m) {
    let tag = m[0];

    if (/data-fallback="/i.test(tag)) {
      const newTag = tag.replace(/data-fallback="[^"]*"/i, 'data-fallback="/assets/hoodie.svg"');
      if (newTag !== tag) { tag = newTag; changed = true; chg('updated data-fallback on product-img to /assets/hoodie.svg'); }
    } else {
      const newTag = tag.replace(/<img/i, '<img data-fallback="/assets/hoodie.svg"');
      if (newTag !== tag) { tag = newTag; changed = true; chg('added data-fallback to product-img'); }
    }

    if (changed) next = next.replace(imgRe, tag);
  } else {
    warn('No <img id="product-img"> found in Playground HTML — skipping');
  }

  if (changed) write(PLAY_HTML, next);
  else log('Playground HTML already points to /assets/hoodie.svg');
}

function step3_patchMainJS(){
  const js = read(MAIN_JS);
  if (!js) { warn('assets/main.js not found:', MAIN_JS); return; }

  let next = js;
  let changed = false;

  // Replace any dummyimage URL with local asset
  const dummyRe = /https?:\/\/dummyimage\.com\/[^\s"'()]+/g;
  if (dummyRe.test(next)) {
    next = next.replace(dummyRe, '/assets/hoodie.svg');
    changed = true;
    chg('replaced dummyimage URLs → /assets/hoodie.svg');
  }

  // Normalize a HOODIE constant if present
  const hoodieConstRe = /const\s+HOODIE\s*=\s*["'][^"']+["'];/;
  if (hoodieConstRe.test(next)) {
    const replaced = next.replace(hoodieConstRe, 'const HOODIE = "/assets/hoodie.svg";');
    if (replaced !== next) { next = replaced; changed = true; chg('set HOODIE constant → "/assets/hoodie.svg"'); }
  }

  // Ensure local fallback if code uses getAttribute(...)
  const getAttrPatterns = [
    /imgEl\.src\s*=\s*url\s*\|\|\s*imgEl\.getAttribute\([^)]+\)/g,
    /img\.src\s*=\s*url\s*\|\|\s*img\.getAttribute\([^)]+\)/g,
  ];
  getAttrPatterns.forEach((re) => {
    if (re.test(next)) {
      const replaced = next.replace(re, (m) => /\/assets\/hoodie\.svg/.test(m) ? m : m.replace(/\)\s*$/, ') || "/assets/hoodie.svg"'));
      if (replaced !== next) { next = replaced; changed = true; chg('added local fallback to getAttribute(...) pattern'); }
    }
  });

  if (changed) write(MAIN_JS, next);
  else log('assets/main.js already uses local hoodie fallback');
}

(function run(){
  step1_ensureHoodie();
  step2_patchPlaygroundHTML();
  step3_patchMainJS();
  ok('Local hoodie fallback wired (safe to run again).');
})();
