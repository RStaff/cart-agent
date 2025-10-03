"use client";
import React from "react";

function Spinner() {
  return <svg viewBox="0 0 24 24" width="16" height="16" className="animate-spin inline-block align-[-2px]">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" opacity="0.25" />
    <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" fill="none"/>
  </svg>;
}

const PRESETS: Array<{label:string; product:string; tone:"friendly"|"urgent"|"helpful"}> = [
  { label: "Coffee set · friendly", product: "Ceramic pour-over coffee set", tone: "friendly" },
  { label: "Yoga mat · helpful",    product: "Eco-rubber yoga mat (4mm)",     tone: "helpful"  },
  { label: "Headphones · urgent",   product: "Wireless ANC headphones",       tone: "urgent"   },
];

export default function PlaygroundClient() {
  const [product, setProduct] = React.useState("Wireless ANC headphones");
  const [tone, setTone] = React.useState<"friendly"|"urgent"|"helpful">("urgent");
  const [out, setOut] = React.useState("");
  const [err, setErr] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const abortRef = React.useRef<AbortController|null>(null);

  async function generate() {
    setErr("");
    setOut("");
    setLoading(true);

    // cancel any in-flight request (prevents race -> "No message returned")
    if (abortRef.current) abortRef.current.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const r = await fetch("/api/demo/generate", {
        method: "POST",
        headers: {"content-type":"application/json"},
        body: JSON.stringify({ product, tone }),
        signal: ac.signal
      });
      const j = await r.json().catch(() => ({}));
      const msg = (j?.message ?? "").toString();
      if (msg.trim()) setOut(msg);
      else setErr("No message returned");
    } catch (e:any) {
      if (e?.name !== "AbortError") setErr(e?.message || "Request failed");
    } finally {
      setLoading(false);
    }
  }

  function copy() {
    if (!out) return;
    navigator.clipboard?.writeText(out).catch(() => {});
  }

  // Cmd/Ctrl + Enter to generate
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && !loading) {
        e.preventDefault();
        generate();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [product, tone, loading]);

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-slate-800 bg-slate-950 p-5">
        <h3 className="text-white font-semibold mb-1">Demo playground</h3>
        <p className="text-slate-300">Type a product and preview an AI-generated recovery message. No data is stored in demo mode.</p>
      </div>

      <div className="rounded-lg border border-slate-800 bg-slate-950 p-4">
        <div className="text-slate-400 text-sm mb-2">Try a preset</div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map(p => (
            <button key={p.label}
              onClick={() => { setProduct(p.product); setTone(p.tone); setOut(""); setErr(""); }}
              className="rounded-md border border-slate-700 px-3 py-1 text-sm text-slate-100 hover:bg-slate-800"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <div className="text-slate-300 mb-1">Product</div>
          <input
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
            value={product} onChange={e=>setProduct(e.target.value)}
            placeholder="e.g., Ceramic pour-over coffee set"
          />
        </label>
        <label className="block">
          <div className="text-slate-300 mb-1">Tone</div>
          <select
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
            value={tone} onChange={e=>setTone(e.target.value as any)}
          >
            <option value="friendly">friendly</option>
            <option value="urgent">urgent</option>
            <option value="helpful">helpful</option>
          </select>
        </label>
      </div>

      <div className="flex gap-2">
        <button
          onClick={generate}
          disabled={loading || !product.trim()}
          className="inline-flex items-center rounded-md border border-slate-700 px-4 py-2 text-white hover:bg-slate-800 disabled:opacity-50"
          title="⌘/Ctrl + Enter"
        >
          {loading ? <>Generating&nbsp;<Spinner/></> : "Generate message"}
        </button>
        <button
          onClick={copy}
          disabled={!out}
          className="inline-flex items-center rounded-md border border-slate-700 px-3 py-2 text-white hover:bg-slate-800 disabled:opacity-50"
        >
          Copy
        </button>
        <button
          onClick={() => { setOut(""); setErr(""); }}
          disabled={!out && !err}
          className="inline-flex items-center rounded-md border border-slate-700 px-3 py-2 text-white hover:bg-slate-800 disabled:opacity-50"
        >
          Clear
        </button>
      </div>

      <div className="rounded-lg border border-slate-800 bg-slate-950 p-4">
        <div className="text-slate-400 text-sm mb-2">Preview</div>
        {err ? (
          <div className="text-rose-300">Error: {err}</div>
        ) : (
          <pre className="whitespace-pre-wrap text-slate-100">{out || (loading ? "Generating…" : "—")}</pre>
        )}
      </div>

      <p className="text-slate-500 text-xs">
        Tip: Press <kbd>⌘/Ctrl</kbd> + <kbd>Enter</kbd> to generate.
      </p>
    </div>
  );
}
