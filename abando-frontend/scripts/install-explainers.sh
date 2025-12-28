set -euo pipefail
TS="$(date +%Y%m%d-%H%M%S)"

# 1) Explainer component -------------------------------------------------------
mkdir -p src/components
cat > src/components/Explainer.tsx <<'TSX'
"use client";
import * as React from "react";

type Page = "demo" | "dash";
type CloseAction = "primary" | "skip";

function fire(event: string, payload: Record<string, unknown> = {}) {
  try {
    const dl = (window as any).dataLayer;
    if (Array.isArray(dl)) dl.push({ event, ...payload });
    else console.log("[analytics]", event, payload);
  } catch {}
}

export default function Explainer({
  page, open, onClose,
}: { page: Page; open: boolean; onClose: (a: CloseAction) => void }) {
  React.useEffect(() => { if (open) fire("explainer_shown", { page }); }, [open, page]);
  if (!open) return null;

  const title   = page === "demo" ? "See it work in 30 seconds" : "Turn demos into revenue";
  const primary = page === "demo" ? "Start the 30-second demo"  : "Open Demo";
  const points  = page === "demo"
    ? ["Describe your shopper (persona + concerns).","Pick a voice or write your own tone.","Compare variants — ship the winner."]
    : ["Your latest demo result appears here.","Variants are saved so teammates can review.","Connect your store to recover carts automatically."];

  function handle(action: CloseAction) {
    fire("explainer_dismissed", { page, action });
    onClose(action);
  }

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="explainer-title"
      style={{position:"fixed", inset:0, background:"rgba(0,0,0,.5)", display:"grid", placeItems:"center", zIndex:1000}}>
      <div style={{
        width:520, maxWidth:"92vw", background:"#0b1220", color:"#e6eaf2",
        border:"1px solid rgba(255,255,255,.12)", borderRadius:14, padding:20, boxShadow:"0 10px 40px rgba(0,0,0,.4)"
      }}>
        <h2 id="explainer-title" style={{margin:"0 0 8px 0"}}>{title}</h2>
        <p style={{margin:"0 0 12px 0", color:"#9fb0c6"}}>
          {page === "demo"
            ? "We’ll generate persuasive copy from your inputs. No API key required for the demo."
            : "This is where results land and how you’ll go live when you’re ready."}
        </p>
        <ul style={{margin:"0 0 16px 18px", padding:0}}>
          {points.map(t => <li key={t} style={{marginBottom:6}}>{t}</li>)}
        </ul>
        <div style={{display:"flex", gap:8}}>
          <button onClick={() => handle("primary")} style={{
            padding:"10px 14px", borderRadius:10, border:"none", background:"#635bff", color:"#fff", fontWeight:700, cursor:"pointer"
          }}>{primary}</button>
          <button onClick={() => handle("skip")} style={{
            padding:"10px 14px", borderRadius:10, border:"1px solid rgba(255,255,255,.18)", background:"transparent", color:"#cbd5e1", cursor:"pointer"
          }}>Skip for now</button>
        </div>
      </div>
    </div>
  );
}
TSX

# 2) First-visit + ?tour=1 helper ----------------------------------------------
mkdir -p src/lib
cat > src/lib/firstVisit.ts <<'TS'
export type Page = "demo" | "dash";
const KEY = { demo: "abando:firstVisit:demo", dash: "abando:firstVisit:dash" };

export function wantTour(page: Page): boolean {
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.get("tour") === "1") return true;
    const v = localStorage.getItem(KEY[page]);
    return v !== "false"; // default: show once
  } catch { return false; }
}

export function dismissTour(page: Page, _action: "primary" | "skip") {
  try { localStorage.setItem(KEY[page], "false"); } catch {}
}
TS

# 3) Patch Demo client (idempotent) --------------------------------------------
DEMO="src/app/demo/playground/Client.tsx"
[ -f "$DEMO" ] || { echo "❌ $DEMO not found"; exit 1; }
cp "$DEMO" "$DEMO.bak.$TS"

node <<'NODE'
const fs = require("fs"); const f="src/app/demo/playground/Client.tsx";
let s = fs.readFileSync(f, "utf8");
if (!s.includes('from "@/components/Explainer"')) {
  s = s.replace(/(\nexport default function DemoClient)/,
    '\nimport Explainer from "@/components/Explainer";\nimport { wantTour, dismissTour } from "@/lib/firstVisit";$1');
  s = s.replace(/return\s*\(/,
`// Explainer state
  const [showExplainer, setShowExplainer] = React.useState(false);
  React.useEffect(() => { if (typeof window!=="undefined" && wantTour("demo")) setShowExplainer(true); }, []);
  function closeExplainer(action: "primary" | "skip") {
    dismissTour("demo", action); setShowExplainer(false);
    if (action === "primary") {
      setTimeout(()=>{ const el = document.querySelector("main input, main select, main textarea"); if (el) (el as HTMLInputElement).focus(); },0);
    }
  }

  return (`);
  s = s.replace(/<\/main>\s*\)\s*;\s*}\s*$/s,
    '  <Explainer page="demo" open={showExplainer} onClose={closeExplainer} />\n    </main>\n  );\n}\n');
  fs.writeFileSync(f, s);
  console.log("✅ Demo wired with Explainer");
} else {
  console.log("ℹ️ Demo already wired");
}
NODE

# 4) Patch Dashboard client (idempotent) ---------------------------------------
DASH="src/app/dashboard/Client.tsx"
[ -f "$DASH" ] || { echo "❌ $DASH not found"; exit 1; }
cp "$DASH" "$DASH.bak.$TS"

node <<'NODE'
const fs = require("fs"); const f="src/app/dashboard/Client.tsx";
let s = fs.readFileSync(f, "utf8");
if (!s.includes('from "@/components/Explainer"')) {
  s = s.replace(/(\nexport default function DashboardClient|\nexport default function Client)/,
    '\nimport Explainer from "@/components/Explainer";\nimport { wantTour, dismissTour } from "@/lib/firstVisit";$1');
  s = s.replace(/return\s*\(/,
`// Explainer state
  const [showExplainer, setShowExplainer] = React.useState(false);
  React.useEffect(() => { if (typeof window!=="undefined" && wantTour("dash")) setShowExplainer(true); }, []);
  function closeExplainer(action: "primary" | "skip") {
    dismissTour("dash", action); setShowExplainer(false);
    if (action === "primary") { try { window.location.href="/marketing/demo/playground"; } catch {} }
  }

  return (`);
  s = s.replace(/<\/main>\s*\)\s*;\s*}\s*$/s,
    '  <Explainer page="dash" open={showExplainer} onClose={closeExplainer} />\n    </main>\n  );\n}\n');
  fs.writeFileSync(f, s);
  console.log("✅ Dashboard wired with Explainer");
} else {
  console.log("ℹ️ Dashboard already wired");
}
NODE

# 5) Build gate ----------------------------------------------------------------
echo "→ Clean build"; rm -rf .next
npx --yes next build >/dev/null && echo "✅ Build OK"

echo
echo "To re-show the popups:"
echo "  • Visit /demo/playground?tour=1  or  /dashboard?tour=1"
echo "  • Or in DevTools:"
echo "      localStorage.removeItem(\"abando:firstVisit:demo\");"
echo "      localStorage.removeItem(\"abando:firstVisit:dash\");"
