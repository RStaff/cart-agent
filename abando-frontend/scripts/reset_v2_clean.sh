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
cd "$APP"

TS=$(date +%Y%m%d-%H%M%S)
echo "→ Clean reset for /v2 (backup tag $TS)"

mkdir -p public src/app/v2

# 0) Globals: dark background tokens (no :global(...) in CSS modules)
if [ -f src/app/globals.css ]; then
  cp src/app/globals.css "src/app/globals.css.bak.$TS"
  if ! grep -q -- "--bg:" src/app/globals.css; then
    cat >> src/app/globals.css <<'CSS'

/* === abando base:start === */
:root{
  --bg:#0B1220;
  --ink:#E5E7EB;
  --muted:#9FB0C6;
}
html,body{ background:var(--bg); color:var(--ink) }
/* === abando base:end === */
CSS
    echo "✅ appended base tokens to globals.css (backup kept)"
  else
    echo "ℹ️ globals.css already contains base tokens"
  fi
else
  echo "⚠️ src/app/globals.css not found (skipping base tokens)"
fi

# 1) Brand.tsx — icon + wordmark + ™ (alt="" so no redundant text)
cat > src/app/v2/Brand.tsx <<'TSX'
'use client';
import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.css';

export default function Brand() {
  return (
    <Link href="/" className={styles.brand} aria-label="Abando home">
      {/* Decorative icon: empty alt prevents fallback text; ?v=1 busts stale caches */}
      <Image
        src="/abando-logo.svg?v=1"
        alt=""
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

# 2) NavBar.tsx — production-like, locked/sticky
cat > src/app/v2/NavBar.tsx <<'TSX'
'use client';
import styles from './page.module.css';
import Brand from './Brand';

export default function NavBar() {
  return (
    <div className={styles.navWrap}>
      <nav className={styles.nav}>
        <Brand />
        <div className={styles.navLinks}>
          <a className={styles.link} href="/demo/playground">Demo</a>
          <a className={styles.link} href="/pricing">Pricing</a>
          <a className={styles.link} href="/onboarding">Onboarding</a>
          <a className={styles.link} href="/support">Support</a>
        </div>
        <div className={styles.navCtas}>
          <a className={`${styles.btn} ${styles.btnGhost}`} href="/demo/playground">Open demo</a>
          <a className={`${styles.btn} ${styles.btnPrimary}`} href="/onboarding?trial=1">Start free trial</a>
        </div>
      </nav>
    </div>
  );
}
TSX
echo "✅ wrote src/app/v2/NavBar.tsx"

# 3) page.module.css — full, consistent token set (no :global selectors)
cat > src/app/v2/page.module.css <<'CSS'
/* Page shell */
.page{ background:var(--bg); color:var(--ink) }
.container{ max-width:1120px; margin:0 auto; padding:0 16px }

/* Hero */
.hero{ background:var(--bg); color:var(--ink); padding:96px 0 40px }
.badge{
  display:inline-flex; align-items:center; gap:8px;
  background:rgba(255,255,255,.06); color:#cbd5e1;
  border:1px solid rgba(255,255,255,.08); border-radius:999px;
  padding:6px 10px; font:700 12px/1 system-ui,-apple-system,sans-serif
}
.h1{ font:800 clamp(36px,6.2vw,56px)/1.12 system-ui,-apple-system,sans-serif; letter-spacing:-.02em; margin:16px 0 0 }
.sub{ max-width:780px; color:#B8C4D4; font:500 18px/1.6 system-ui,-apple-system,sans-serif; margin-top:12px }
.heroCtas{ display:flex; gap:12px; margin-top:24px; flex-wrap:wrap }

/* Buttons */
.btn{ border-radius:10px; padding:10px 14px; font:700 14px/1 system-ui,-apple-system,sans-serif; text-decoration:none }
.btnPrimary{ background:#635BFF; color:#fff }
.btnPrimary:hover{ background:#5149ff }
.btnGhost{ background:rgba(255,255,255,.08); color:#E6EAF2 }
.btnGhost:hover{ background:rgba(255,255,255,.12) }

/* Band */
.band{ background:var(--bg); color:#A9B4C5; padding:12px 0 20px }
.bandRule{ margin-top:16px; height:1px; background:rgba(255,255,255,.08) }

/* Grid + Cards */
.grid{ display:grid; gap:24px; grid-template-columns:1fr }
@media (min-width:900px){ .grid{ grid-template-columns:1fr 1fr } }
.card{ background:#12192A; border:1px solid rgba(255,255,255,.08); border-radius:14px; padding:18px }
.card h3{ margin:0 0 8px; color:#CDD6E6; font:700 16px/1.2 system-ui,-apple-system,sans-serif }
.card ul{ margin:6px 0 0 18px; color:#9FB0C6 }

/* Chat */
.chat{ display:grid; gap:10px }
.msg{ border-radius:12px; padding:10px 12px; font:600 14px/1.4 system-ui,-apple-system,sans-serif }
.bot{ background:#0f1524; color:#D5DEF0 }
.user{ background:#16A34A; color:#fff; justify-self:start }

/* Footer */
.footer{ background:var(--bg); color:#9fb0c6; padding:28px 0; font:500 13px/1.4 system-ui,-apple-system,sans-serif }
.footer a{ color:#9fb0c6; text-decoration:underline }
.spacer{ height:12px }

/* Brand + Nav (locked sticky) */
.brand{ display:flex; align-items:center; gap:8px; text-decoration:none }
.brandMark{ height:28px; width:28px; display:block }
.brandWord{ color:#E6EAF2; font:700 16px/1 system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif }
.tm{ color:#A9B4C5; margin-left:2px; font-size:11px; font-weight:600 }

.navWrap{
  position:sticky; top:0; z-index:50;
  background:rgba(11,18,32,.95);
  border-bottom:1px solid rgba(255,255,255,.08);
  backdrop-filter:blur(8px)
}
.nav{ height:64px; display:flex; align-items:center; justify-content:space-between; max-width:1120px; margin:0 auto; padding:0 16px }
.navLinks{ display:none; gap:24px }
@media (min-width:640px){ .navLinks{ display:flex } }
.link{ color:#A9B4C5; font:600 14px/1.2 system-ui,-apple-system,sans-serif; text-decoration:none }
.link:hover{ color:#E6EAF2 }
.navCtas{ display:none; gap:10px }
@media (min-width:900px){ .navCtas{ display:flex } }
CSS
echo "✅ wrote src/app/v2/page.module.css"

# 4) page.tsx — clean server component using <NavBar />
cat > src/app/v2/page.tsx <<'TSX'
import styles from './page.module.css';
import NavBar from './NavBar';

export const metadata = {
  title: 'Abando – Recover abandoned carts with AI',
  description: 'Cart Agent follows up across email and chat to recover revenue.',
};

export default function Page() {
  return (
    <div className={styles.page}>
      <NavBar />

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.container}>
          <span className={styles.badge}>New • 14-day free trial</span>
          <h1 className={styles.h1}>Recover more checkouts with your AI Shopping Copilot</h1>
          <p className={styles.sub}>
            Abando<sup>™</sup> answers questions, handles objections, and guides buyers through
            checkout—so abandonment turns into orders.
          </p>
          <div className={styles.heroCtas}>
            <a className={`${styles.btn} ${styles.btnPrimary}`} href="/onboarding">Start Free Trial</a>
            <a className={`${styles.btn} ${styles.btnGhost}`} href="/demo/playground">Try the Demo</a>
          </div>
        </div>
      </section>

      {/* Divider band */}
      <section className={styles.band}>
        <div className={styles.container}>
          <div>Trusted by founders</div>
          <div className={styles.bandRule} />
        </div>
      </section>

      {/* Two-column cards */}
      <section style={{background:'#0B1220', padding:'24px 0 64px'}}>
        <div className={`${styles.container} ${styles.grid}`}>
          <div className={styles.card}>
            <h3>Why it converts</h3>
            <ul>
              <li>Answers that convert (shipping, sizing, returns)</li>
              <li>Guided checkout with minimal friction</li>
              <li>Proven playbooks (discount, urgency, FAQ)</li>
              <li>Analytics that show recovered revenue</li>
            </ul>
          </div>
          <div className={styles.card}>
            <div className={styles.chat}>
              <div className={`${styles.msg} ${styles.bot}`}>👋 Hey there! I can answer questions and guide you to checkout.</div>
              <div className={`${styles.msg} ${styles.user}`}>Do you have free returns?</div>
              <div className={`${styles.msg} ${styles.bot}`}>Yes—30 days, no questions asked. Ready to checkout?</div>
            </div>
          </div>
        </div>
      </section>

      <div className={styles.spacer} />
      <footer className={styles.footer}>
        <div className={styles.container}>
          <small>© 2025 Abando<sup>™</sup> · <a href="/legal/terms">Terms</a> · <a href="/legal/privacy">Privacy</a> · <a href="/legal/dpa">DPA</a></small>
        </div>
      </footer>
    </div>
  );
}
TSX
echo "✅ wrote src/app/v2/page.tsx"

# 5) Start dev server cleanly
kill -9 "$(lsof -ti :3000)" 2>/dev/null || true
rm -rf .next
echo "→ Open http://localhost:3000/v2"
npx next dev -p 3000
