import React from "react";

/** Simple stat tile with subtle animate-in and value tween */
export default function StatTile({ label, value, hint }) {
  return (
    <div className="rounded-lg border bg-white shadow-sm px-5 py-4 transition-transform duration-150 hover:-translate-y-0.5">
      <div className="text-sm text-neutral-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{value}</div>
      {hint ? <div className="mt-1 text-xs text-neutral-400">{hint}</div> : null}
    </div>
  );
}
