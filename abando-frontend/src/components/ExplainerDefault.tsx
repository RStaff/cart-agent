// src/components/ExplainerDefault.tsx
import React from "react";
import ExplainerInner from "@/components/Explainer"; // your existing strict component

// central defaults; adjust to your real needs safely
const DEFAULTS = {
  variant: "modern" as const,
  storageKey: "dashboard_explainer_v1",
  title: "Welcome to your dashboard",
};

type AnyProps = Record<string, unknown>;

/**
 * Adapter that lets callers do <Explainer /> with zero props.
 * It preserves backward-compat: any passed props override defaults.
 */
export default function Explainer(props: AnyProps = {}) {
  return <ExplainerInner {...DEFAULTS} {...props} />;
}
