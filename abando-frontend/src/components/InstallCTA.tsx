"use client";
import React from "react";

type Layout = "inline" | "block";
export type InstallCTAProps = {
  className?: string;
  layout?: Layout;
  sticky?: boolean;
  compact?: boolean;
  onlyOn?: string[]; // optional: render only on these routes
};

export default function InstallCTA({
  className = "",
  layout = "inline",
  sticky = false,
  compact = false,
  onlyOn = [],
}: InstallCTAProps) {
  // route gating (safe on server/client)
  if (Array.isArray(onlyOn) && onlyOn.length) {
    try {
      const href =
        typeof window !== "undefined" ? window.location.pathname : "/";
      const ok = onlyOn.some((p) => href === p || href.startsWith(p));
      if (!ok) return null;
    } catch {}
  }

  const root = "install-cta";
  const wrap =
    layout === "block"
      ? "flex flex-col items-start gap-2"
      : "flex items-center gap-3";
  const stickyCls = sticky
    ? "sticky bottom-4 bg-white/70 dark:bg-black/40 backdrop-blur"
    : "";
  const cls = [root + " " + wrap + " " + stickyCls, className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cls}>
      <button
        type="button"
        className="px-3 py-2 rounded bg-black text-white hover:opacity-90"
        onClick={() => {
          try {
            window.location.assign("/install");
          } catch {}
        }}
      >
        Install
      </button>
      {!compact && (
        <span className="text-sm text-neutral-600 dark:text-neutral-300">
          Add the Abando widget to your store in one click.
        </span>
      )}
    </div>
  );
}
