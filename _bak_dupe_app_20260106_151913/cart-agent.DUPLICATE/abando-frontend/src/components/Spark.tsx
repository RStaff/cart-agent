"use client";
import * as React from "react";
import { token } from "@/components/ui";

/** Minimal sparkline: pass numbers 0..100 */
export function Spark({
  data,
  height = 38,
}: {
  data: number[];
  height?: number;
}) {
  if (!data.length) return null;
  const w = 160;
  const max = 100,
    min = 0;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = height - ((v - min) / (max - min)) * height;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg width={w} height={height} viewBox={`0 0 ${w} ${height}`} aria-hidden>
      <polyline fill="none" stroke="#93c5fd" strokeWidth="2" points={points} />
      <rect
        x="0"
        y="0"
        width={w}
        height={height}
        fill="none"
        stroke={token.border}
        rx="10"
      />
    </svg>
  );
}
