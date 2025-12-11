#!/usr/bin/env bash
set -euo pipefail

TARGET="app/demo/playground/page.tsx"

ts="$(date +%Y%m%d-%H%M%S)"

# Ensure folders exist
mkdir -p "app/demo/playground"

# Backup existing page if present
if [ -f "$TARGET" ]; then
  cp "$TARGET" "${TARGET}.bak-${ts}"
  echo "[demo] Backup written to ${TARGET}.bak-${ts}"
fi

# Write new boutique-focused playground page
cat <<'TSX' > "$TARGET"
import React from "react";
import { DemoLayout } from "@/components/demo/DemoLayout";
import { WeeklySnapshot } from "@/components/demo/WeeklySnapshot";
import { PatternCards } from "@/components/demo/PatternCards";
import { RawSignal } from "@/components/demo/RawSignal";
import { Interpretation } from "@/components/demo/Interpretation";

export default function BoutiqueDemoPlaygroundPage() {
  return (
    <DemoLayout>
      {/* HERO / OVERVIEW */}
      <section id="intro" className="demo-section">
        <header className="demo-header">
          <p className="eyebrow">
            ABANDO DEMO · WOMEN&apos;S BOUTIQUE APPAREL
          </p>
          <h1>
            See how Abando reads shopper behavior
            <br />
            and turns it into recovered orders.
          </h1>
        </header>

        <div className="demo-intro-grid">
          <div className="demo-intro-main">
            <p>
              This demo uses a women&apos;s boutique apparel store as an example
              scenario. In production, Abando watches what shoppers view,
              search, and leave in their cart, then groups those sessions into a
              few clear behavior patterns instead of treating everyone who
              abandoned the same way.
            </p>

            <p>You&apos;ll see three things:</p>
            <ol>
              <li>How Abando segments shoppers instead of blasting discounts.</li>
              <li>Three high-impact hesitation patterns for boutique shoppers.</li>
              <li>
                A 7-day snapshot of extra orders recovered from those plays.
              </li>
            </ol>
          </div>

          <aside className="demo-intro-aside">
            <div className="demo-card">
              <h2>What this demo is (and isn&apos;t)</h2>
              <p>
                This isn&apos;t a fake &quot;AI magic&quot; animation. It&apos;s a
                realistic sketch of how Abando observes boutique shopper
                sessions, groups them into patterns, and shows the impact in
                plain numbers.
              </p>
              <p>
                The goal is for your team to say,{" "}
                <em>
                  &quot;Okay, we can see what&apos;s happening with our
                  shoppers—and we know which three plays to run next.&quot;
                </em>
              </p>
            </div>

            <div className="demo-card">
              <h3>What you&apos;d do next with Abando</h3>
              <ol>
                <li>Connect your Shopify store (about 1–2 minutes).</li>
                <li>
                  Let Abando quietly observe a week of traffic and learn your
                  shopper patterns.
                </li>
                <li>
                  Turn on 2–3 plays for your strongest patterns first, then
                  expand from there.
                </li>
              </ol>
            </div>
          </aside>
        </div>
      </section>

      {/* 1 · WHY SEGMENTS */}
      <section id="why" className="demo-section">
        <header>
          <p className="eyebrow">
            1 · WHY SEGMENTS INSTEAD OF &quot;EVERYONE WHO ABANDONED&quot;?
          </p>
          <h2>Some shoppers are almost ready. Others are still browsing.</h2>
        </header>
        <p>
          Not every abandoned cart is the same. Some shoppers are checking
          outfits on their phone at work. Others park items while they wait for
          payday. Treating them all the same leads to noisy discounts and
          trained bargain hunters.
        </p>
        <p>
          Abando focuses on a small set of{" "}
          <strong>clear shopper patterns.</strong> That keeps your strategy
          simple, measurable, and easy to iterate on with your team.
        </p>
      </section>

      {/* 2 · PATTERNS */}
      <section id="patterns" className="demo-section">
        <header>
          <p className="eyebrow">
            2 · THREE HIGH-IMPACT PATTERNS IN THIS BOUTIQUE DEMO
          </p>
          <h2>Today&apos;s key patterns in this boutique demo</h2>
          <p>
            Names are for clarity, not jargon. Each pattern is just a different
            kind of hesitation Abando knows how to respond to.
          </p>
        </header>

        <PatternCards />
      </section>

      {/* 3 · WEEKLY SNAPSHOT */}
      <section id="week" className="demo-section">
        <WeeklySnapshot />
      </section>

      {/* 4 · RAW SIGNAL → GUIDED PLAYS */}
      <section id="raw-and-interpret" className="demo-section">
        <header>
          <p className="eyebrow">
            4 · HOW ABANDO TURNS RAW SIGNAL INTO GUIDED PLAYS
          </p>
        </header>

        <div className="raw-and-interpret-grid">
          <RawSignal />
          <Interpretation />
        </div>
      </section>
    </DemoLayout>
  );
}
TSX

echo "[demo] Boutique demo playground written to ${TARGET}"
echo "[demo] Now run: npm run dev"
