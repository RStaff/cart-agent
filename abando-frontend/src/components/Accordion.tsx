"use client";
import { useState } from "react";
type Item = { q: string; a: React.ReactNode };
export default function Accordion({ items }: { items: Item[] }) {
  return (
    <div className="space-y-3">
      {items.map((it, i) => (
        <Row key={i} q={it.q}>
          {it.a}
        </Row>
      ))}
    </div>
  );
}
function Row({ q, children }: { q: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card">
      <button
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="font-medium">{q}</span>
        <span className={`transition-transform ${open ? "rotate-180" : ""}`}>
          ▾
        </span>
      </button>
      {open && (
        <div className="px-5 pb-5 -mt-1 text-white/75 text-sm leading-relaxed">
          {children}
        </div>
      )}
    </div>
  );
}
