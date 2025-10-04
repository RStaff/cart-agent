"use client";
import React from "react";

type InstallCTAProps = {
  className?: string;
  layout?: "inline" | "stacked";
  compact?: boolean;
  sticky?: boolean;
};

export function InstallCTA({
  className = "",
  layout = "inline",
  compact = false,
  sticky = false,
}: InstallCTAProps) {
  const root = "rounded-md border border-neutral-200 dark:border-neutral-800 p-3";
  const wrap = layout === "inline" ? "flex items-center gap-3" : "flex flex-col gap-3";
  const stickyCls = sticky ? "sticky bottom-4 bg-white/70 dark:bg-black/40 backdrop-blur" : "";
  const classes = [root, wrap, stickyCls, className].filter(Boolean).join(" ");

  return (
    <div className={classes}>
      <button
        type="button"
        className="px-3 py-2 rounded bg-black text-white hover:opacity-90"
        onClick={() => window.open("https://chromewebstore.google.com", "_blank")}
      >
        Install{!compact && <span className="hidden sm:inline">&nbsp;for Chrome</span>}
      </button>
      <button
        type="button"
        className="px-3 py-2 rounded border border-neutral-300 dark:border-neutral-700"
        onClick={() => window.open("https://apps.shopify.com", "_blank")}
      >
        Install{!compact && <span className="hidden sm:inline">&nbsp;for Shopify</span>}
      </button>
    </div>
  );
}
