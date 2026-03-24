import { Suspense } from "react";
import type { ReactNode } from "react";
import Providers from "./Providers";

export default function Template({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div style={{display:"contents"}} />}>
      <Providers>{children}</Providers>
    </Suspense>
  );
}
