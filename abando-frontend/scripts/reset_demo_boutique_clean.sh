#!/usr/bin/env bash
set -euo pipefail

TARGET="app/demo/playground/page.tsx"
BACKUP="${TARGET}.bak-$(date +%Y%m%d-%H%M%S)"

echo "[abando] Backing up existing demo page -> ${BACKUP}"
cp "$TARGET" "$BACKUP"

echo "[abando] Writing clean boutique demo..."

cat > "$TARGET" << 'TSX'
import React from "react";
import { DemoLayout } from "@/components/demo/DemoLayout";
import { PatternCards } from "@/components/demo/PatternCards";
import { WeeklySnapshot } from "@/components/demo/WeeklySnapshot";
import { RawSignal } from "@/components/demo/RawSignal";
import { Interpretation } from "@/components/demo/Interpretation";

export default function DemoPage() {
  return (
    <DemoLayout
      title="Boutique Shopper Behavior Demo"
      subtitle="A realistic walkthrough of how Abando detects shopper hesitation, groups behaviors into patterns, and helps recover orders."
    >
      {/* INTRO */}
      <section>
        <p className="text-sm text-slate-300 leading-relaxed">
          This example uses a boutique apparel store to illustrate how Abando watches
          shopper sessions, detects hesitation signals, and turns those signals into
          actionable patterns your team can actually use.
        </p>
      </section>

      {/* PATTERN CARDS */}
      <section id="patterns" className="mt-12">
        <PatternCards />
      </section>

      {/* WEEKLY SNAPSHOT */}
      <section id="snapshot" className="mt-16">
        <WeeklySnapshot />
      </section>

      {/* RAW SIGNAL */}
      <section id="raw" className="mt-16">
        <RawSignal />
      </section>

      {/* INTERPRETATION */}
      <section id="interpretation" className="mt-16 mb-24">
        <Interpretation />
      </section>
    </DemoLayout>
  );
}
TSX

echo "[abando] Clean boutique demo written to ${TARGET}"
echo "✔ Run: npm run dev"
