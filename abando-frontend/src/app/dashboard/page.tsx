"use client";
import { useEffect, useState } from "react";
type Demo = { copy?: string; image?: string; voice?: string; stats?: { ctr?: number; recovery?: number } };

function Tile({ label, value }: { label: string; value: string }) {
  return (<div className="rounded-md border border-slate-700 p-4 text-center">
    <div className="text-2xl font-bold">{value}</div>
    <div className="mt-1 text-xs uppercase tracking-wide text-slate-400">{label}</div>
  </div>);
}

export default function Dashboard() {
  const [demo, setDemo] = useState<Demo | null>(null);
  useEffect(()=>{ try{ const raw=localStorage.getItem("abando:lastDemo"); if(raw) setDemo(JSON.parse(raw)); }catch{} },[]);
  const ctr = demo?.stats?.ctr ?? 0.12, rec = demo?.stats?.recovery ?? 0.17;

  return (
    <main className="mx-auto max-w-5xl px-6 py-10 text-slate-100">
      <div className="rounded-md bg-slate-800/40 border border-slate-700 px-4 py-3 text-sm">
        <strong className="mr-2">Instant demo mode.</strong> Add keys in Settings to go live. <a className="underline" href="/pricing">See plans →</a>
      </div>

      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <Tile label="Projected recovered / mo" value="$420" />
        <Tile label="Avg. CTR (est.)" value={`${Math.round(ctr*100)}%`} />
        <Tile label="Avg. Recovery" value={`${Math.round(rec*100)}%`} />
        <Tile label="Sends / day (est.)" value="36" />
      </div>

      <div className="mt-8 grid md:grid-cols-2 gap-6">
        <div className="rounded-md border border-slate-700 p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Latest copy</h3>
            <a className="text-indigo-400 hover:text-indigo-300 text-sm" href="/marketing/demo/playground">Open demo →</a>
          </div>
          <pre className="mt-3 whitespace-pre-wrap text-slate-200 min-h-[120px]">{demo?.copy || "Run the demo to generate copy."}</pre>
        </div>
        <div className="rounded-md border border-slate-700 p-4">
          <h3 className="font-semibold">Product preview</h3>
          {demo?.image ? <img src={demo.image} alt="Preview" className="mt-3 rounded-md border border-slate-700" />
                       : <p className="mt-3 text-slate-400">Generate from the demo to see the image here</p>}
        </div>
      </div>

      <div className="mt-6">
        <a className="underline text-sm" href="/onboarding?trial=1&plan=basic">Onboard now — under 5 minutes</a>
        {" · "}
        <a className="underline text-sm" href="/marketing/demo/playground">Back to demo</a>
      </div>
    </main>
  );
}
