import { Suspense } from "react";

export default function DemoTemplate({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="p-6 text-slate-400">Loading…</div>}>
      {children}
    </Suspense>
  );
}
