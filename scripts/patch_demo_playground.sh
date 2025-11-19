#!/usr/bin/env bash
set -euo pipefail

PLAYGROUND_FILE="abando-frontend/src/app/demo/playground/page.tsx"

echo "🛠  Patching demo playground page at: $PLAYGROUND_FILE"

cat > "$PLAYGROUND_FILE" << 'TSX'
import Link from "next/link";

export default function DemoPlaygroundPage() {
  return (
    <main className="min-h-[calc(100vh-72px)] bg-black text-slate-100">
      <div className="max-w-5xl mx-auto px-6 py-16 space-y-10">
        <header className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight">Demo playground</h1>
          <p className="text-slate-300 max-w-2xl text-sm sm:text-base">
            This is a temporary, safe version of the demo page so your builds and deployments stay green.
            You can replace this later with the full interactive AI copy demo once everything else is stable.
          </p>
        </header>

        <section className="max-w-xl rounded-xl border border-slate-800 bg-slate-950/80 p-6 sm:p-8 shadow-lg">
          <h2 className="text-xl font-semibold mb-2">See it work in 30 seconds</h2>
          <p className="text-slate-300 text-sm mb-4">
            We&apos;ll generate persuasive copy from your inputs. No API key required for this placeholder demo.
          </p>

          <ul className="list-disc list-inside space-y-1 text-sm text-slate-300 mb-6">
            <li>Describe your shopper (persona + concerns).</li>
            <li>Pick a voice or write your own tone.</li>
            <li>Compare variants — ship the winner.</li>
          </ul>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="rounded-md px-4 py-2 text-sm font-medium bg-indigo-500 hover:bg-indigo-400 text-white"
            >
              Start the 30-second demo
            </button>
            <Link
              href="/"
              className="rounded-md px-4 py-2 text-sm font-medium border border-slate-600 text-slate-200 hover:bg-slate-900"
            >
              Skip for now
            </Link>
          </div>

          <p className="mt-4 text-[11px] text-slate-500 leading-relaxed">
            This page is intentionally simple. It never calls your AI backend, so you can ship and iterate
            on pricing, onboarding, and app listing copy without worrying about API keys or rate limits.
          </p>
        </section>
      </div>
    </main>
  );
}
TSX

echo "✅ Demo playground page overwritten with safe placeholder."
