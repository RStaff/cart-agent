import type { ReactNode } from "react";

export const metadata = {
  title: "Abando — Marketing",
};

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#060B14] text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#060B14]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <a href="/marketing" className="text-sm font-semibold tracking-wide hover:text-white/90">
            Abando™
          </a>

          <nav className="flex flex-wrap items-center gap-5 text-sm text-white/75">
            <a className="hover:text-white" href="/marketing">Marketing</a>
            <a className="hover:text-white" href="/pricing">Pricing</a>
            <a className="hover:text-white" href="/onboarding">Onboarding</a>
            <a className="hover:text-white" href="/support">Support</a>
            <a className="hover:text-white" href="/marketing/demo/playground">Demo</a>
            <a className="hover:text-white/90" href="/embedded">Open app</a>
          </nav>
        </div>
      </header>

      {children}
    </div>
  );
}
