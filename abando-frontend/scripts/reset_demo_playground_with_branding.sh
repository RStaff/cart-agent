#!/usr/bin/env bash
set -euo pipefail

# Always run from repo root
cd "$(dirname "$0")/.."

TARGET="app/demo/playground/page.tsx"
BACKUP="${TARGET}.bak-$(date +%Y%m%d-%H%M%S)"

echo "[reset] Backing up existing playground -> $BACKUP"
cp "$TARGET" "$BACKUP"

cat > "$TARGET" << 'TSX'
"use client";

import Image from "next/image";
import { DemoLayout } from "@/components/demo/DemoLayout";
import { PatternCards } from "@/components/demo/PatternCards";
import { WeeklySnapshot } from "@/components/demo/WeeklySnapshot";
import { RawSignal } from "@/components/demo/RawSignal";
import { Interpretation } from "@/components/demo/Interpretation";

export default function DemoPlayground() {
  return (
    <DemoLayout>
      {/* Brand bar: Abando + Shopify */}
      <header className="mb-12 space-y-4">
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Image
              src="/abando-logo-transparent.png"
              alt="Abando"
              width={132}
              height={32}
            />
            <span className="text-xs tracking-[0.2em] uppercase text-slate-400">
              Women&apos;s boutique apparel demo
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 uppercase tracking-[0.18em]">
              Built for
            </span>
            <Image
              src="/shopify-monotone-white.svg"
              alt="Shopify"
              width={90}
              height={24}
            />
          </div>
        </div>

        <h1 className="text-4xl font-semibold md:text-5xl">
          See how Abando reads shopper behavior{" "}
          <br className="hidden md:block" />
          and turns it into recovered orders.
        </h1>

        <p className="max-w-2xl text-base leading-relaxed text-slate-300">
          This demo uses a women&apos;s boutique apparel store as an example scenario.
          In production, Abando watches what shoppers view, search, and leave in
          their cart, then groups those sessions into a few clear behavior
          patterns instead of treating everyone who abandoned the same way.
        </p>

        <div className="text-sm text-slate-300 space-y-1">
          <p className="font-semibold text-slate-100">You&apos;ll see three things:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>How Abando segments shoppers instead of blasting discounts.</li>
            <li>Three high-impact hesitation patterns for boutique shoppers.</li>
            <li>A 7-day snapshot of extra orders recovered from those plays.</li>
          </ol>
        </div>
      </header>

      <main className="space-y-16">
        {/* 1. Why segments */}
        <section className="space-y-6">
          <h2 className="text-sm font-semibold tracking-[0.25em] text-slate-400 uppercase">
            1 · WHY SEGMENTS INSTEAD OF &quot;EVERYONE WHO ABANDONED&quot;?
          </h2>
          <p className="text-2xl font-semibold">
            Some shoppers are almost ready. Others are still browsing.
          </p>
          <p className="max-w-3xl text-slate-300">
            Not every abandoned cart is the same. Some shoppers are checking outfits
            on their phone at work. Others park items while they wait for payday.
            Treating them all the same leads to noisy discounts and trained bargain
            hunters. Abando focuses on a small set of clear shopper patterns so your
            strategy stays simple, measurable, and easy to iterate on.
          </p>
        </section>

        {/* 2. Patterns */}
        <section className="space-y-6">
          <h2 className="text-sm font-semibold tracking-[0.25em] text-slate-400 uppercase">
            2 · THREE HIGH-IMPACT PATTERNS IN THIS BOUTIQUE DEMO
          </h2>
          <p className="text-2xl font-semibold">
            Today&apos;s key patterns in this boutique demo
          </p>
          <p className="max-w-3xl text-slate-300">
            Names are for clarity, not jargon. Each pattern is just a different kind
            of hesitation Abando knows how to respond to.
          </p>
          <PatternCards />
        </section>

        {/* 3. Week snapshot */}
        <section className="space-y-6">
          <h2 className="text-sm font-semibold tracking-[0.25em] text-slate-400 uppercase">
            3 · WHAT THIS MEANS OVER A WEEK
          </h2>
          <WeeklySnapshot />
        </section>

        {/* 4. Raw signal -> plays */}
        <section className="space-y-6">
          <h2 className="text-sm font-semibold tracking-[0.25em] text-slate-400 uppercase">
            4 · HOW ABANDO TURNS RAW SIGNAL INTO GUIDED PLAYS
          </h2>
          <RawSignal />
          <Interpretation />
        </section>
      </main>
    </DemoLayout>
  );
}
TSX

echo "[reset] /demo/playground updated with boutique demo + branding (no CinBos)."
