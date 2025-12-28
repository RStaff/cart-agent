#!/usr/bin/env bash
# --- auto-load .env.local if present (robust: supports quotes, spaces) ---
if [ -f .env.local ]; then
  set -a
  . ./.env.local
  set +a
fi
# --- end auto-load ---
set -euo pipefail

APP="$HOME/projects/cart-agent/abando-frontend/abando-frontend"
cd "$APP" || { echo "❌ Not found: $APP"; exit 1; }

TS=$(date +%Y%m%d-%H%M%S)
echo "→ Refining v2 brand + nav (backup tag $TS)"
mkdir -p scripts public src/app/v2

# 0) globals.css: dark background (avoid :global in CSS modules)
if [ -f src/app/globals.css ] && ! grep -q -- "--bg:" src/app/globals.css; then
  cp src/app/globals.css "src/app/globals.css.bak.$TS"
  cat >> src/app/globals.css <<'CSS'

/* === abando base:start === */
:root{ --bg:#0B1220; --ink:#E5E7EB; --muted:#9FB0C6; }
html,body{ background:var(--bg); color:var(--ink); }
/* === abando base:end === */
CSS
  echo "✅ appended base tokens to globals.css"
else
  echo "ℹ️ globals.css already has base tokens (or file missing — skipping)"
fi

# 1) Logo: create placeholder only if missing (don’t overwrite your upload)
if [ ! -f public/abando-logo.svg ]; then
  cat > public/abando-logo.svg <<'SVG'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" role="img" aria-label="abando.ai">
  <defs><style>.b{fill:#1E78FF}.t{fill:#1BAE92}</style></defs>
  <g transform="translate(18,18)">
    <path class="b" d="M20 20h84a10 10 0 0 1 0 20H44l12 46h86a12 12 0 1 1 0 24H46a12 12 0 0 1-12-9L20 20z"/>
    <circle class="b" cx="64" cy="120" r="14"/><circle class="b" cx="106" cy="120" r="14"/>
    <circle class="t" cx="144" cy="56" r="28"/><circle class="t" cx="144" cy="56" r="13"/>
    <circle class="t" cx="166" cy="34" r="15"/>
  </g>
</svg>
SVG
  echo "✅ wrote placeholder public/abando-logo.svg"
else
  echo "ℹ️ found public/abando-logo.svg — leaving as-is"
fi

# 2) Brand.tsx — icon + 'Abando' + ™; alt="" so no 'Abando logo' text
cat > src/app/v2/Brand.tsx <<'TSX'
'use client';
import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.css';

export default function Brand() {
  return (
    <Link href="/" className={styles.brand} aria-label="Abando home">
      <Image
        src="/abando-logo.svg"
        alt=""                 // decorative icon—no redundant text
        width={28}
        height={28}
        className={styles.brandMark}
        priority
      />
      <span className={styles.brandWord}>Abando</span>
      <sup className={styles.tm}>™</sup>
    </Link>
  );
}
TSX
echo "✅ wrote src/app/v2/Brand.tsx"

# 3) NavBar.tsx — production-like sticky nav
cat > src/app/v2/NavBar.tsx <<'TSX'
'use client';
import styles from './page.module.css';
import Brand from './Brand';

export default function NavBar(){
  return (
    <div className={styles.navWrap}>
      <nav className={styles.nav}>
        <Brand />
        <div className={styles.navLinks}>
          <a className={styles.link} href="/marketing/demo/playground">Demo</a>
          <a className={styles.link} href="/pricing">Pricing</a>
          <a className={styles.link} href="/onboarding">Onboarding</a>
          <a className={styles.link} href="/support">Support</a>
        </div>
        <div className={styles.navCtas}>
          <a className={`${styles.btn} ${styles.btnGhost}`} href="/marketing/demo/playground">Open demo</a>
          <a className={`${styles.btn} ${styles.btnPrimary}`} href="/onboarding?trial=1">Start free trial</a>
        </div>
      </nav>
    </div>
  );
}
TSX
echo "✅ wrote src/app/v2/NavBar.tsx"

# 4) Patch v2 page to mount <NavBar/>
if [ -f src/app/v2/page.tsx ]; then
  cp src/app/v2/page.tsx "src/app/v2/page.tsx.bak.$TS"
  grep -q "from './NavBar'" src/app/v2/page.tsx || \
    perl -0777 -i -pe "s|(import .*?;\\s*)|\\1import NavBar from './NavBar';\n|s" src/app/v2/page.tsx
  grep -q "from './Brand'" src/app/v2/page.tsx || \
    perl -0777 -i -pe "s|(import .*?;\\s*)|\\1import Brand from './Brand';\n|s" src/app/v2/page.tsx
  if perl -0777 -ne 'exit((/<div className=\{styles\.navWrap\}[\s\S]*?<\/div>/) ? 0 : 1)' src/app/v2/page.tsx; then
    perl -0777 -i -pe "s|<div className=\\{styles\\.navWrap\\}[\\s\\S]*?</div>|<NavBar/>|s" src/app/v2/page.tsx
    echo "✅ replaced existing nav wrapper with <NavBar/>"
  else
    perl -0777 -i -pe "s|(<div className=\\{styles\\.page\\}[^>]*>|\\1\n  <NavBar/>\n)|s" src/app/v2/page.tsx || true
    echo "ℹ️ inserted <NavBar/> near top of page"
  fi
  echo "✅ patched src/app/v2/page.tsx (backup kept)"
else
  echo "❌ Missing src/app/v2/page.tsx — cannot wire <NavBar/>"
fi

# 5) CSS: brand + nav styles; strip :global(body)
if [ -f src/app/v2/page.module.css ]; then
  cp src/app/v2/page.module.css "src/app/v2/page.module.css.bak.$TS"
  awk '!/^[[:space:]]*:global\(body\)/' src/app/v2/page.module.css > /tmp/page.module.css.$$ && mv /tmp/page.module.css.$$ src/app/v2/page.module.css

  if ! grep -q "/* === brand refinement:start === */" src/app/v2/page.module.css; then
    cat >> src/app/v2/page.module.css <<'CSS'

/* === brand refinement:start === */
.brand{display:flex;align-items:center;gap:8px;text-decoration:none}
.brandMark{height:28px;width:28px;display:block}
.brandWord{color:#E6EAF2;font:700 16px/1 system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif}
.tm{color:#A9B4C5;margin-left:2px;font-size:11px;font-weight:600}
/* === brand refinement:end === */
CSS
    echo "✅ appended brand refinement styles"
  else
    echo "ℹ️ brand refinement styles already present"
  fi

  if ! grep -q "/* === nav lock:start === */" src/app/v2/page.module.css; then
    cat >> src/app/v2/page.module.css <<'CSS'

/* === nav lock:start === */
.page{background:#0B1220;color:#E5E7EB}
.container{max-width:1120px;margin:0 auto;padding:0 16px}

.navWrap{position:sticky;top:0;z-index:50;background:rgba(11,18,32,.95);border-bottom:1px solid rgba(255,255,255,.08);backdrop-filter:blur(8px)}
.nav{height:64px;display:flex;align-items:center;justify-content:space-between;max-width:1120px;margin:0 auto;padding:0 16px}

.navLinks{display:none;gap:24px}
@media (min-width:640px){.navLinks{display:flex}}

.link{color:#A9B4C5;font:600 14px/1.2 system-ui,-apple-system,sans-serif;text-decoration:none}
.link:hover{color:#E6EAF2}

.navCtas{display:none;gap:10px}
@media (min-width:900px){.navCtas{display:flex}}

.btn{border-radius:10px;padding:10px 14px;font:700 14px/1 system-ui,-apple-system,sans-serif;text-decoration:none}
.btnPrimary{background:#635BFF;color:#fff}
.btnPrimary:hover{background:#5149ff}
.btnGhost{background:rgba(255,255,255,.08);color:#E6EAF2}
.btnGhost:hover{background:rgba(255,255,255,.12)}

.hero{padding:96px 0 40px} /* clear sticky bar */
/* === nav lock:end === */
CSS
    echo "✅ appended nav lock styles"
  else
    echo "ℹ️ nav lock styles already present"
  fi
else
  echo "❌ Missing src/app/v2/page.module.css — cannot write styles"
fi

# 6) Ensure layout imports globals.css
if [ -f src/app/layout.tsx ] && ! grep -q "globals.css" src/app/layout.tsx; then
  cp src/app/layout.tsx "src/app/layout.tsx.bak.$TS"
  perl -0777 -i -pe "s|(import .*?;\\s*)|\\1import './globals.css';\n|s" src/app/layout.tsx
  echo "✅ added globals.css import to layout.tsx"
fi

# 7) Restart dev server
kill -9 "$(lsof -ti :3000)" 2>/dev/null || true
rm -rf .next
echo "→ Open http://localhost:3000/v2"
npx next dev -p 3000
