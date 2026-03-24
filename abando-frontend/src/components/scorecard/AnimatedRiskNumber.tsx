"use client";

import { useEffect, useState } from "react";

export default function AnimatedRiskNumber({ value }: { value: string }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(false);
    const frame = window.requestAnimationFrame(() => {
      setIsVisible(true);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [value]);

  return (
    <div className="relative mt-5">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-8 -inset-y-3 rounded-full bg-[radial-gradient(circle_at_center,_rgba(59,130,246,0.16),_rgba(99,102,241,0.12),_transparent_72%)] blur-2xl"
      />
      <div
        className="relative rounded-2xl border border-cyan-400/20 bg-slate-900/85 px-5 py-5 text-center shadow-[0_24px_80px_rgba(15,23,42,0.45)]"
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? "translateY(0px) scale(1)" : "translateY(8px) scale(0.985)",
          transition:
            "opacity 420ms cubic-bezier(0.22, 1, 0.36, 1), transform 420ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">Estimated revenue at risk</p>
        <div className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">{value}</div>
        <p className="mt-3 text-sm leading-7 text-slate-400">Pre-install estimate only. Real checkout tracking begins after install.</p>
      </div>
    </div>
  );
}
