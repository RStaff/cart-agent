#!/usr/bin/env bash
set -euo pipefail
note(){ printf "\033[36m→ %s\033[0m\n" "$1"; }
ok(){ printf "✓ %s\n" "$1"; }
backup(){ [ -f "$1" ] && cp "$1" "$1.__bak_brand" || true; }

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
APP="$ROOT/abando-frontend"
[ -d "$APP/src/app" ] || { echo "✗ Missing $APP/src/app"; exit 1; }
cd "$APP"

note "Brand scaffold in $APP"

mkdir -p src/styles src/components src/lib

# 1) CSS TOKENS (black+gold) + base surface rules
GL="src/app/globals.css"
backup "$GL"
# Ensure globals exists
[ -f "$GL" ] || echo "/* global styles */" > "$GL"

# Ensure variables block once (append if missing)
if ! grep -q -- "--gold-primary" "$GL"; then
cat >> "$GL" <<'CSS'

/* === Brand Tokens: Black + Gold (Wolf) === */
:root {
  --black: #0B0B0B;
  --wolf-gray: #1A1A1A;
  --steel-gray: #2E2E2E;
  --mid-gray: #3D3D3D;
  --gold-primary: #D4AF37;
  --gold-light: #F2D675;
  --white: #FFFFFF;
  --off-white: #E8E8E8;

  --radius-6: 6px;
  --radius-8: 8px;
  --shadow-24: 0px 4px 24px rgba(0,0,0,0.45);
  --divider: rgba(255,255,255,0.08);
  --transition-fast: 160ms;
}

/* Default = dark mode surfaces */
html, body {
  background: var(--black);
  color: var(--off-white);
}

body.dark { background: var(--black); color: var(--off-white); }

.wolf-divider { border-bottom: 1px solid var(--divider); }
.wolf-card { background: var(--wolf-gray); border: 1px solid var(--divider); border-radius: var(--radius-6); box-shadow: var(--shadow-24); }
.wolf-surface { background: var(--wolf-gray); }
.wolf-steel { background: var(--steel-gray); }

/* Typography helpers */
.wolf-heading { letter-spacing: -0.02em; }
.wolf-label { text-transform: uppercase; letter-spacing: 0.06em; font-size: 0.75rem; opacity: 0.8; }

/* Button primitives */
.wolf-btn { display:inline-flex; align-items:center; justify-content:center; gap:.5rem;
  height: 48px; padding: 0 18px; border-radius: var(--radius-6);
  transition: all var(--transition-fast) ease;
}
.wolf-btn-primary { background: var(--gold-primary); color: var(--black); box-shadow: var(--shadow-24); }
.wolf-btn-primary:hover { filter: brightness(1.02); box-shadow: 0 0 0 2px rgba(212,175,55,0.15), var(--shadow-24); }

.wolf-btn-secondary { border:1px solid var(--gold-primary); color: var(--gold-primary); background: transparent; }
.wolf-btn-secondary:hover { background: var(--gold-primary); color: var(--black); }

/* Gold accent text */
.wolf-gold { color: var(--gold-primary); }
CSS
fi
ok "Tokens & base surfaces in globals.css"

# 2) Tailwind config: dark mode class
if [ -f tailwind.config.ts ] || [ -f tailwind.config.js ]; then
  TWC="$(ls tailwind.config.* | head -n1)"
  backup "$TWC"
  # force darkMode:'class' if not present
  if ! grep -q "darkMode" "$TWC"; then
    sed -i '' '1i\
/** brand-scaffold ensured darkMode */' "$TWC"
    perl -0777 -i -pe 's/(export default \{)/$1\ndarkMode: "class",/s' "$TWC" || true
  else
    perl -0777 -i -pe 's/darkMode:\s*"(media|class)"/darkMode: "class"/' "$TWC" || true
  fi
  ok "Tailwind darkMode=class"
else
  ok "Tailwind config not found (skipping)"
fi

# 3) Fonts via next/font (Montserrat + Inter) and apply to <body>
LAY="src/app/layout.tsx"
backup "$LAY"
if [ -f "$LAY" ]; then
  # add imports only once
  if ! grep -q "@next/font" "$LAY" && ! grep -q "next/font/google" "$LAY"; then
    sed -i '' '1i\
import { Montserrat, Inter } from "next/font/google";' "$LAY"
    perl -0777 -i -pe 's/(export const metadata[\s\S]*?\n)/$1/; ' "$LAY" >/dev/null 2>&1 || true
    perl -0777 -i -pe 's/(export default function RootLayout\([^)]*\)\s*\{)/const heading = Montserrat({ subsets:["latin"], weight:["700","800"], variable:"--font-heading" });\nconst body = Inter({ subsets:["latin"], weight:["400","500"], variable:"--font-body" });\n\n$1/' "$LAY"
    perl -0777 -i -pe 's/<body([^>]*)>/'"<body\1 className={\`dark \${heading.variable} \${body.variable}\`}>"'/' "$LAY"
  fi
  # Add font CSS vars to globals if not present
  if ! grep -q "--font-heading" "$GL"; then
    cat >> "$GL" <<'CSS'

/* Font variables set by next/font */
:root { --font-heading: "Montserrat", sans-serif; --font-body: "Inter", ui-sans-serif, system-ui; }
.h1,.h2,.h3,.wolf-heading { font-family: var(--font-heading); }
body { font-family: var(--font-body); }
CSS
  fi
  ok "Fonts wired (Montserrat headings, Inter body)"
else
  echo "✗ src/app/layout.tsx missing"; exit 1;
fi

# 4) Navbar: reserve logo space + 72px height
# Try common navbar files
NB=""
for f in src/components/NavbarV2.tsx src/components/Navbar.tsx src/app/v2/NavBar.tsx; do [ -f "$f" ] && NB="$f" && break; done
if [ -n "$NB" ]; then
  backup "$NB"
  # Insert brand navbar wrapper with reserved logo slot if not already present
  if ! grep -q "wolf-navbar" "$NB"; then
    perl -0777 -i -pe 's/<nav([^>]*)>.*?<\\/nav>/<nav className="wolf-navbar wolf-divider" style={{height:"72px"}}>\n  <div className="mx-auto max-w-6xl h-full flex items-center justify-between px-4" style={{paddingLeft: "16px"}}>\n    <div className="flex items-center">\n      {/* LOGO SLOT: replace placeholder when SVG delivered */}\n      <div className="wolf-logo" style={{width:"240px"}}>\n        <div className="h-6 w-full bg-[rgba(212,175,55,0.2)] border border-[rgba(212,175,55,0.4)] rounded-sm"></div>\n      </div>\n    </div>\n    <div className="flex items-center gap-3">{/* existing right CTAs remain */}</div>\n  </div>\n</nav>/s' "$NB" || true
  fi
  # Responsive logo widths via globals (desktop/tablet/mobile)
  if ! grep -q ".wolf-logo" "$GL"; then
    cat >> "$GL" <<'CSS'
/* Logo reserved widths */
.wolf-logo { width: 240px; }
@media (max-width: 1024px) { .wolf-logo { width:180px; } }
@media (max-width: 640px)  { .wolf-logo { width:140px; } }
CSS
  fi
  ok "Navbar reserved (72px; logo widths 240/180/140; left padding 16px)"
else
  ok "Navbar component not found (skipped)"
fi

# 5) Button component with variants (primary gold, secondary outline)
BTN="src/components/Button.tsx"
backup "$BTN"
cat > "$BTN" <<'TSX'
import clsx from "clsx";
type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary"|"secondary"; as?: "button"|"a"; href?: string; };
export default function Button({variant="primary", as="button", href, className, children, ...rest}: Props){
  const base = "wolf-btn text-sm";
  const kind = variant==="primary" ? "wolf-btn-primary" : "wolf-btn-secondary";
  const cls = clsx(base, kind, className);
  if(as==="a" && href){ return <a href={href} className={cls} {...(rest as any)}>{children}</a>; }
  return <button className={cls} {...rest}>{children}</button>;
}
TSX
ok "Button component written"

# 6) Swap Hero CTAs to Button component + gold accent
HERO="src/components/Hero.tsx"
if [ -f "$HERO" ]; then
  backup "$HERO"
  if ! grep -q 'from "./Button"' "$HERO"; then
    sed -i '' '1i\
import Button from "./Button";' "$HERO"
    perl -0777 -i -pe 's/<a href=\{BRAND\.ctas\.trial\.href\}[^>]*>(.*?)<\/a>/<Button as="a" href={BRAND.ctas.trial.href} data-cta={BRAND.ctas.trial.data} variant="primary">$1<\/Button>/s' "$HERO"
    perl -0777 -i -pe 's/<a href=\{BRAND\.ctas\.demo\.href\}[^>]*>(.*?)<\/a>/<Button as="a" href={BRAND.ctas.demo.href} data-cta={BRAND.ctas.demo.data} variant="secondary">$1<\/Button>/s' "$HERO"
    perl -0777 -i -pe 's/Relentlessly<\/span>/Relentlessly<\/span>/' "$HERO" >/dev/null 2>&1 || true
  fi
  ok "Hero CTAs now use Button component"
fi

# 7) Subtle motion (fast)
if ! grep -q ".wolf-fast" "$GL"; then
  cat >> "$GL" <<'CSS'
.wolf-fast { transition: all var(--transition-fast) ease; }
CSS
fi

# 8) Build & typecheck
npm ci --ignore-scripts >/dev/null
npx tsc -p tsconfig.json --noEmit
npx next build >/dev/null

ok "Brand scaffold compiled"
cd "$ROOT"
git add -A
git commit -m "brand: black+gold tokens, fonts, navbar logo slot, gold buttons, wolf utilities" || true
ok "Committed (no push)."
