import { Suspense } from "react";
import type { ReactNode } from "react";

export default function Template({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={<div style={{ padding: 12, color: "#94a3b8" }}>Loading…</div>}
    >
      {children}
    </Suspense>
  );
}
