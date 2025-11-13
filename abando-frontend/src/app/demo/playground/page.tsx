"use client";
import { useState } from "react";

type DemoResp = { ok: boolean; copy: string; image?: string; voice?: string; stats?: { ctr?: number; recovery?: number } };
const VOICES = ["Direct Closer","Helpful Expert","Elite Authority","Wolf Closer"]; // safe labels

export default function DemoPlayground() {
  const [product, setProduct] = useState("");
  const [concerns, setConcerns] = useState("shipping, returns");
  const [voice, setVoice] = useState(VOICES[0]);
  const [loading, setLoading] = useState(false);
  const [variants, setVariants] = useState<DemoResp[]>([]);

  async function runOne(v: string) {
    const res = await fetch("/api/demo/generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ product, concerns, voice: v }),
    });
    const data: DemoResp = await res.json();
    return { ...data, voice: v };
  }

  async function onGenerate() {
    if (!product.trim()) return;
    setLoading(true); const out = await runOne(voice); setVariants([out]); setLoading(false);
    localStorage.setItem("abando:lastDemo", JSON.stringify(out));
  }
  async function onTryAll() {
    if (!product.trim()) return;
    setLoading(true); const out: DemoResp[] = [];
    for (const v of VOICES) out.push(await runOne(v));
    setVariants(out); setLoading(false);
    localStorage.setItem("abando:lastDemo", JSON.stringify(out[0]));
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10 text-slate-100">
      <h1 className="text-2xl font-semibold">Demo playground</h1>
      <p className="mt-2 text-sm opacity-80">Describe a product and preview AI-generated recovery copy.</p>

      <div className="mt-6 grid gap-3">
        <input className="rounded-md bg-slate-800 px-3 py-2" placeholder="Product (e.g., Creatine Monohydrate 60-servings)"
               value={product} onChange={e=>setProduct(e.target.value)} />
        <input className="rounded-md bg-slate-800 px-3 py-2" placeholder="Top customer concerns"
               value={concerns} onChange={e=>setConcerns(e.target.value)} />
        <div className="flex gap-3 items-center">
          <label className="text-sm opacity-80">Voice</label>
          <select className="rounded-md bg-slate-800 px-3 py-2" value={voice} onChange={e=>setVoice(e.target.value)}>
            {VOICES.map(v=> <option key={v} value={v}>{v}</option>)}
          </select>
          <button data-cta="demo_generate_one" onClick={onGenerate} disabled={loading}
            className="ml-auto rounded-md bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-50">
            {loading ? "Generating…" : "Generate"}
          </button>
          <button data-cta="demo_try_all" onClick={onTryAll} disabled={loading}
            className="rounded-md bg-slate-700 px-4 py-2 text-sm text-white hover:bg-slate-600 disabled:opacity-50">
            Try all voices
          </button>
        </div>
      </div>

      {!!variants.length && (
        <div className="mt-7 grid gap-4">
          {variants.map((v,i)=>(
            <div key={i} className="rounded-md border border-slate-700 p-4">
              <div className="text-xs uppercase tracking-wide text-slate-400">{v.voice}</div>
              <pre className="mt-2 whitespace-pre-wrap text-slate-100">{v.copy}</pre>
              {v.image && <img src={v.image} alt="Preview" className="mt-3 rounded-md border border-slate-700" />}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
</div>);
