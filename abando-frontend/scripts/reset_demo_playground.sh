#!/usr/bin/env bash
set -euo pipefail

TARGET="app/demo/playground/page.tsx"
BACKUP="$TARGET.bak-$(date +%Y%m%d-%H%M%S)"

echo "[reset] Backing up existing playground -> $BACKUP"
cp "$TARGET" "$BACKUP"

cat << 'TSX' > "$TARGET"
"use client";

import React from "react";
import { DemoLayout } from "@/components/demo/DemoLayout";
import { PatternCards } from "@/components/demo/PatternCards";
import { WeeklySnapshot } from "@/components/demo/WeeklySnapshot";
import { RawSignal } from "@/components/demo/RawSignal";
import { Interpretation } from "@/components/demo/Interpretation";

export default function DemoPlayground() {
  return (
    <DemoLayout>
      {/* 1. Intro / what this demo is */}
      <section className="space-y-6">
        <p className="text-sm tracking-wide text-[#4FEAC6]">
          ABANDO DEMO · WOMEN'S BOUTIQUE APPAREL
        </p>

        <h1 className="text-3xl md:text-4xl font-semibold">
          See how Abando reads shopper behavior
          <br />
          and turns it into recovered orders.
        </h1>

        <p className="max-w-2xl text-muted-foreground">
          This demo uses a women's boutique apparel store as an example scenario.
          In production, Abando watches what shoppers view, search, and leave in
          their cart, then groups those sessions into a few clear behavior
          patterns instead of treating everyone who abandoned the same way.
        </p>

        <div className="space-y-1 text-sm">
          <p className="font-semibold">You'll see three things:</p>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
            <li>How Abando segments shoppers instead of blasting discounts.</li>
            <li>Three high-impact hesitation patterns for boutique shoppers.</li>
            <li>A 7-day snapshot of extra orders recovered from those plays.</li>
          </ol>
        </div>

        <div className="space-y-3 border border-[#1C3C39] rounded-3xl p-6 md:p-7 bg-[#020617]">
          <p className="text-xs tracking-[0.18em] uppercase text-[#4FEAC6]">
            What this demo is (and isn't)
          </p>
          <p className="text-sm text-muted-foreground">
            This isn't a fake “AI magic” animation. It's a realistic sketch of
            how Abando observes boutique shopper sessions, groups them into
            patterns, and shows the impact in plain numbers.
          </p>
          <p className="text-sm text-muted-foreground">
            The goal is for your team to say,
            <span className="italic">
              {" "}
              “Okay, we can see what's happening with our shoppers—and we know
              which three plays to run next.”
            </span>
          </p>
        </div>
      </section>

      {/* 2. Why segments instead of "everyone who abandoned"? */}
      <section className="space-y-4 pt-16">
        <p className="text-xs tracking-[0.18em] uppercase text-[#4FEAC6]">
          1 · WHY SEGMENTS INSTEAD OF “EVERYONE WHO ABANDONED”?
        </p>
        <h2 className="text-2xl md:text-3xl font-semibold">
          Some shoppers are almost ready. Others are still browsing.
        </h2>
        <p className="max-w-3xl text-muted-foreground">
          Not every abandoned cart is the same. Some shoppers are checking
          outfits on their phone at work. Others park items while they wait
          for payday. Treating them all the same leads to noisy discounts and
          trained bargain hunters. Abando focuses on a small set of{" "}
          <span className="font-semibold">clear shopper patterns</span>. That
          keeps your strategy simple, measurable, and easy to iterate on with
          your team.
        </p>
      </section>

      {/* 3. Three high-impact patterns */}
      <section className="pt-16">
        <PatternCards />
      </section>

      {/* 4. 7-day recovered orders snapshot */}
      <section className="pt-16">
        <WeeklySnapshot />
      </section>

      {/* 5. Raw signal → guided plays */}
      <section className="pt-16 space-y-10">
        <RawSignal />
        <Interpretation />
      </section>
    </DemoLayout>
  );
}
TSX

echo "[reset] Wrote clean boutique demo to $TARGET"
