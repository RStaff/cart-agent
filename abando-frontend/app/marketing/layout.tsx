import type { ReactNode } from "react";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-400/40">
              <span className="text-xs font-semibold text-emerald-300">A</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-tight">
                Abando.ai
              </span>
              <span className="text-xs text-slate-400">
                Cart recovery that feels human.
              </span>
            </div>
          </div>
          <nav className="flex items-center gap-4 text-xs sm:text-sm">
            <a
              href="/marketing/womens-boutique"
              className="text-slate-300 hover:text-emerald-300 transition"
            >
              Boutiques
            </a>
            <a
              href="/marketing/supplements"
              className="text-slate-300 hover:text-emerald-300 transition"
            >
              Supplements
            </a>
            <a
              href="/demo/playground"
              className="inline-flex items-center rounded-full border border-emerald-400/60 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-200 hover:bg-emerald-500/20 transition"
            >
              View Demo
            </a>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-10 sm:py-16">
        {children}
      </main>
      <footer className="border-t border-slate-800/80 bg-slate-950/90">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-4 text-xs text-slate-500 sm:flex-row">
          <span>© {new Date().getFullYear()} Abando.ai</span>
          <span className="text-slate-500">
            Built for small teams that refuse to lose carts quietly.
          </span>
        </div>
      </footer>
    </div>
  );
}
