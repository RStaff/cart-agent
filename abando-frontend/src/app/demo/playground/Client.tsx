"use client";
import * as React from "react";

type Tone = "friendly" | "urgent" | "helpful";

function Spinner() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 animate-spin">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.2" />
      <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="4" fill="none" />
    </svg>
  );
}

export default function PlaygroundClient() {
  const [product, setProduct] = React.useState<string>("");
  const [tone, setTone] = React.useState<Tone>("friendly");
  const [out, setOut] = React.useState<string>("");
  const [err, setErr] = React.useState<string>("");
  const [loading, setLoading] = React.useState<boolean>(false);
  const [copied, setCopied] = React.useState<boolean>(false);

  // Load last values
  React.useEffect(() => {
    try {
      const p = localStorage.getItem("demo:product") || "";
      const t = (localStorage.getItem("demo:tone") as Tone) || "friendly";
      setProduct(p);
      setTone(t);
    } catch {}
  }, []);

  // Persist values
  React.useEffect(() => { try { localStorage.setItem("demo:product", product); } catch {} }, [product]);
  React.useEffect(() => { try { localStorage.setItem("demo:tone", tone); } catch {} }, [tone]);

  const generate = React.useCallback(async () => {
    if (!product.trim()) return;
    setLoading(true);
    setErr("");
    setOut("");
    try {
      const r = await fetch("/api/demo/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ product, tone }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j: { ok?: boolean; message?: string } = await r.json();
      if (j?.ok && j?.message) setOut(j.message);
      else setErr("No message returned");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }, [product, tone]);

  async function copy() {
    if (!out) return;
    try {
      await navigator.clipboard.writeText(out);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  }

  // Cmd/Ctrl + Enter shortcut
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        generate();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [generate]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <div className="text-slate-300 mb-1">Product</div>
          <input
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
            value={product}
            onChange={e=>setProduct(e.target.value)}
            placeholder="e.g., Ceramic pour-over coffee set"
          />
        </label>
        <label className="block">
          <div className="text-slate-300 mb-1">Tone</div>
          <select
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
            value={tone}
            onChange={e=>setTone(e.target.value as Tone)}
          >
            <option value="friendly">friendly</option>
            <option value="urgent">urgent</option>
            <option value="helpful">helpful</option>
          </select>
        </label>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={generate}
          disabled={loading || !product.trim()}
          className="inline-flex items-center gap-2 rounded-md border border-slate-700 px-4 py-2 text-white hover:bg-slate-800 disabled:opacity-50"
          title="⌘/Ctrl + Enter"
        >
          {loading ? <>Generating <Spinner/></> : "Generate message"}
        </button>

        <button
          onClick={copy}
          disabled={!out}
          className="inline-flex items-center rounded-md border border-slate-700 px-3 py-2 text-white hover:bg-slate-800 disabled:opacity-50"
        >
          Copy
        </button>
        {copied && <span className="text-slate-300 text-sm">✓ Copied</span>}

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
          <pre className="whitespace-pre-wrap text-slate-100">
            {out || (loading ? "Generating…" : "—")}
          </pre>
        )}
      </div>

      <p className="text-slate-500 text-xs">
        Tip: Press <kbd>⌘/Ctrl</kbd> + <kbd>Enter</kbd> to generate.
      </p>
    </div>
  );
}
