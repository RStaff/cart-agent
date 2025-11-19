#!/usr/bin/env bash
set -euo pipefail

ONBOARDING_FILE="abando-frontend/src/app/onboarding/page.tsx"

echo "🛠  Patching onboarding page at: $ONBOARDING_FILE"

cat > "$ONBOARDING_FILE" << 'TSX'
import Link from "next/link";

export default function OnboardingPage() {
  return (
    <main className="min-h-[calc(100vh-72px)] bg-black text-slate-100">
      <div className="max-w-4xl mx-auto px-6 py-16 space-y-8">
        <header className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight">Onboarding</h1>
          <p className="text-slate-300 max-w-2xl text-sm sm:text-base">
            Kick off your trial and connect your store. No credit card required for the demo.
          </p>
        </header>

        <section className="space-y-4">
          <ol className="list-decimal list-inside space-y-2 text-slate-300 text-sm sm:text-base">
            <li>Start your trial from the homepage hero or app listing.</li>
            <li>Connect your platform or paste a product URL to see instant copy.</li>
            <li>Preview guided checkout responses and recovery playbooks.</li>
          </ol>

          <p className="text-xs text-slate-500">
            For now, this is a placeholder flow so you can safely iterate on copy and layout.
            When you&apos;re ready, we&apos;ll wire this page into the live trial and Shopify app install pipeline.
          </p>
        </section>

        <div className="pt-4 flex flex-wrap gap-3">
          <Link
            href="/demo/playground"
            className="rounded-md px-4 py-2 text-sm font-medium bg-indigo-500 hover:bg-indigo-400 text-white"
          >
            Jump into the demo
          </Link>
          <Link
            href="/"
            className="rounded-md px-4 py-2 text-sm font-medium border border-slate-600 text-slate-200 hover:bg-slate-900"
          >
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
TSX

echo "✅ Onboarding page overwritten with safe placeholder."
