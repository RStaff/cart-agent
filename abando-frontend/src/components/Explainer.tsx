"use client";
import * as React from "react";

type Page = "demo" | "dash";
type CloseAction = "primary" | "skip";

type PropsModern = { page: Page; open: boolean; onClose: (a: CloseAction) => void };
type PropsLegacy = { storageKey: string }; // e.g. "abando:firstVisit:dash"

function fire(event: string, payload: Record<string, unknown> = {}) {
  try {
    const dl = (window as any).dataLayer;
    if (Array.isArray(dl)) dl.push({ event, ...payload });
    else console.log("[analytics]", event, payload);
  } catch {}
}

function inferPageFromKey(k: string): Page {
  return k.includes("dash") ? "dash" : "demo";
}

function shouldShowFromKey(k: string): boolean {
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.get("tour") === "1") return true;
    return localStorage.getItem(k) !== "false";
  } catch { return false; }
}

function dismissByKey(k: string) {
  try { localStorage.setItem(k, "false"); } catch {}
}

export default function Explainer(props: PropsModern | PropsLegacy) {
  // ---- Legacy self-managed mode --------------------------------------------
  if ("storageKey" in props) {
    const storageKey = props.storageKey;
    const page: Page = inferPageFromKey(storageKey);
    const [open, setOpen] = React.useState(false);

    React.useEffect(() => {
      if (typeof window !== "undefined" && shouldShowFromKey(storageKey)) setOpen(true);
    }, [storageKey]);

    const handleClose = (action: CloseAction) => {
      dismissByKey(storageKey);
      setOpen(false);
      if (action === "primary") {
        // legacy default: dashboard sends to demo; demo just focuses first field
        try {
          if (page === "dash") window.location.href = "/demo/playground";
          else setTimeout(() => {
            const el = document.querySelector("main input, main select, main textarea") as HTMLInputElement | null;
            if (el) el.focus();
          }, 0);
        } catch {}
      }
    };

    return <ExplainerInner page={page} open={open} onClose={handleClose} />;
  }

  // ---- Modern controlled mode ----------------------------------------------
  return <ExplainerInner {...props} />;
}

function ExplainerInner({
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
            padding:"10px 14px", borderRadius:10, border:"none", background:"#635bff", color:"#D4AF37f", fontWeight:700, cursor:"pointer"
          }}>{primary}</button>
          <button onClick={() => handle("skip")} style={{
            padding:"10px 14px", borderRadius:10, border:"1px solid rgba(255,255,255,.18)",
            background:"transparent", color:"#cbd5e1", cursor:"pointer"
          }}>Skip for now</button>
        </div>
      </div>
    </div>
  );
}
