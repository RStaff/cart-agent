# --- auto-load .env.local if present (robust: supports quotes, spaces) ---
if [ -f .env.local ]; then
  set -a
  . ./.env.local
  set +a
fi
# --- end auto-load ---
set -Eeuo pipefail

APP="$(pwd)"
test -d "$APP/src/app/v2" || { echo "❌ Expect src/app/v2 here: $APP"; exit 1; }

TS=$(date +%Y%m%d-%H%M%S)
WORK="$(mktemp -d)"
echo "→ Working in $WORK"

mkdir -p public src/app/v2 scripts

# 1) Vector logo (SVG) — idempotent
if [ ! -f public/abando-logo.svg ]; then
  cat > "$WORK/abando-logo.svg" <<'SVG'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 620 180" role="img" aria-label="Abando">
  <defs><style>.blue{fill:#1E78FF}.teal{fill:#1BAE92}</style></defs>
  <g transform="translate(10,18)">
    <path class="blue" d="M90 18a10 10 0 0 1 10-10h68a10 10 0 0 1 0 20h-60l14 58h148a12 12 0 1 1 0 24H113a12 12 0 0 1-12-9.1L82 28H50a10 10 0 0 1 0-20h40z"/>
    <circle class="blue" cx="150" cy="120" r="18"/>
    <circle class="blue" cx="214" cy="120" r="18"/>
    <path class="teal" d="M250 44c38 0 68 30 68 68s-30 68-68 68-68-30-68-68 30-68 68-68zm0 28a40 40 0 1 0 0 80 40 40 0 0 0 0-80z"/>
    <circle class="teal" cx="250" cy="92" r="20"/>
    <circle class="teal" cx="300" cy="44" r="22"/>
  </g>
  <text x="360" y="118" font-family="system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif"
        font-weight="800" font-size="72" fill="#0B1726">abando.ai</text>
</svg>
SVG
  mv "$WORK/abando-logo.svg" public/abando-logo.svg
  echo "✅ wrote public/abando-logo.svg"
else
  echo "ℹ️ public/abando-logo.svg exists"
fi

# 2) Brand component
if [ ! -f src/app/v2/Brand.tsx ]; then
  cat > "$WORK/Brand.tsx" <<'TSX'
'use client';
import Link from 'next/link';
import styles from './page.module.css';

export default function Brand(){
  return (
    <Link href="/" className={styles.brand} aria-label="Abando home">
      <img src="/abando-logo.svg" alt="Abando" className={styles.brandMark} />
      <span className={styles.brandText}>Abando</span><sup className={styles.tm}>™</sup>
    </Link>
  );
}
TSX
  mv "$WORK/Brand.tsx" src/app/v2/Brand.tsx
  echo "✅ wrote src/app/v2/Brand.tsx"
else
  echo "ℹ️ Brand.tsx exists"
fi

# 3) Patch page.tsx to use <Brand/>
cp src/app/v2/page.tsx "$WORK/page.before.tsx"
grep -q "from './Brand'" src/app/v2/page.tsx || \
  perl -0777 -i -pe "s|(import .*?;\\s*)|\\1import Brand from './Brand';\n|s" src/app/v2/page.tsx
perl -0777 -i -pe '
  if (!defined $ENV{REPLACED}) {
    $replaced = s|<Link[^>]*className=\{styles\.brand\}[\s\S]*?</Link>|<Brand/>|s;
    $ENV{REPLACED}=1 if $replaced;
  } $_;
' src/app/v2/page.tsx

# 4) CSS module tokens (no :root selectors)
cp src/app/v2/page.module.css "$WORK/page.module.before.css"
perl -0777 -i -pe 's/^\s*:root\s*\{[^}]*\}\s*//s' src/app/v2/page.module.css
if ! grep -q "/* === brand-tokens:start === */" src/app/v2/page.module.css; then
cat >> src/app/v2/page.module.css <<'CSS'

/* === brand-tokens:start === */
.page{ --bg:#0B1220; --ink:#E5E7EB; --ink-dim:#C4CFDD; --accent:#6366F1; --panel:#12192A;
       --panel-border:rgba(255,255,255,.08); --muted:#9FB0C6; background:var(--bg); color:var(--ink); }

.container{ max-width:1120px; margin:0 auto; padding:0 16px; }
.hero{ background:var(--bg); color:var(--ink); padding:64px 0 40px; }
.badge{ display:inline-flex; align-items:center; gap:8px; background:rgba(255,255,255,.06); color:#cbd5e1;
        border:1px solid rgba(255,255,255,.08); border-radius:999px; padding:6px 10px; font:700 12px/1 system-ui,-apple-system,sans-serif; }
.h1{ font:800 clamp(36px,6.2vw,56px)/1.12 system-ui,-apple-system,sans-serif; letter-spacing:-.02em; margin:16px 0 0; }
.sub{ max-width:780px; color:#B8C4D4; font:500 18px/1.6 system-ui,-apple-system,sans-serif; margin-top:12px; }
.heroCtas{ display:flex; gap:12px; margin-top:24px; flex-wrap:wrap; }

.btn{ border-radius:10px; padding:12px 16px; font:700 14px/1 system-ui,-apple-system,sans-serif; text-decoration:none; }
.btnPrimary{ background:#635BFF; color:#fff; }
.btnPrimary:hover{ background:#5149ff; }
.btnGhost{ background:rgba(255,255,255,.08); color:#E6EAF2; }
.btnGhost:hover{ background:rgba(255,255,255,.12); }

.band{ background:var(--bg); color:#A9B4C5; padding:12px 0 20px; }
.bandRule{ margin-top:16px; height:1px; background:rgba(255,255,255,.08); }

.grid{ display:grid; gap:24px; grid-template-columns:1fr; }
@media (min-width:900px){ .grid{ grid-template-columns:1fr 1fr; } }

.card{ background:var(--panel); border:1px solid var(--panel-border); border-radius:14px; padding:18px; }
.card h3{ margin:0 0 8px; color:#CDD6E6; font:700 16px/1.2 system-ui,-apple-system,sans-serif; }
.card ul{ margin:6px 0 0 18px; color:var(--muted); }

.chat{ display:grid; gap:10px; }
.msg{ border-radius:12px; padding:10px 12px; font:600 14px/1.4 system-ui,-apple-system,sans-serif; }
.bot{ background:#0f1524; color:#D5DEF0; }
.user{ background:#16A34A; color:#fff; justify-self:start; }

.footer{ background:var(--bg); color:#9fb0c6; padding:28px 0; font:500 13px/1.4 system-ui,-apple-system,sans-serif;}
.footer a{ color:#9fb0c6; text-decoration:underline; }
.spacer{ height:12px; }

.navWrap{ position:sticky; top:0; z-index:40; backdrop-filter:blur(8px); }
.nav{ height:56px; display:flex; align-items:center; justify-content:space-between; max-width:1120px; margin:0 auto; padding:0 16px; }
.links{ display:none; gap:24px; }
@media (min-width:640px){ .links{ display:flex; } }
.link{ color:#A9B4C5; font:600 14px/1.2 system-ui,-apple-system,sans-serif; text-decoration:none; }
.link:hover{ color:#E6EAF2; }

.brand{ display:flex; align-items:center; gap:10px; text-decoration:none; }
.brandMark{ height:28px; width:auto; display:block; }
.brandText{ color:#E6EAF2; font:700 16px/1 system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif; }
.tm{ color:#A9B4C5; margin-left:2px; font-size:11px; font-weight:600; }
/* === brand-tokens:end === */
CSS
  echo "✅ appended brand tokens"
else
  echo "ℹ️ tokens already present"
fi

# Show diffs
echo; echo "— DIFF: page.tsx —";  git --no-pager diff --no-index --color=always "$WORK/page.before.tsx" src/app/v2/page.tsx || true
echo; echo "— DIFF: page.module.css —";  git --no-pager diff --no-index --color=always "$WORK/page.module.before.css" src/app/v2/page.module.css || true

# Backups and restart
cp src/app/v2/page.tsx "src/app/v2/page.tsx.bak.$TS"
cp src/app/v2/page.module.css "src/app/v2/page.module.css.bak.$TS"
echo "🗂  Backups: page.tsx.bak.$TS, page.module.css.bak.$TS"

kill -9 "$(lsof -ti :3000)" 2>/dev/null || true
rm -rf .next
echo "→ Open http://localhost:3000/v2"
npx next dev -p 3000
