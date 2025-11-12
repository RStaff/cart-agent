"use client";

import Link from "next/link";

export default function CTA() {
  return (
    <section className="container mx-auto px-4 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-100">Ready to recover more checkouts?</h2>
          <p className="text-sm text-slate-400">Try the demo dashboard or jump straight into pricing.</p>
        </div>
        <div className="flex gap-3 sm:justify-end">
          <Link href="/trial" className="btn btn-primary">Open demo dashboard</Link>
          <Link href="#pricing" className="btn btn-ghost">See pricing</Link>
        </div>
      </div>
    </section>
  );
}
