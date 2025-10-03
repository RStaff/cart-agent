export type Tokens = {
  bg: string;
  card: string;
  ink: string;
  subtle: string;
  border: string;
  borderHeavy: string;
  primary: string;
  primaryHover: string;
  ghost: string;
  ghostHover: string;
  danger: string;
  dangerHover: string;
  successBg: string;
  successFg: string;
  errorBg: string;
  errorFg: string;
  warnBg: string;
  warnFg: string;
};

/** Single source of truth for design tokens */
export const token: Tokens = {
  bg: "#0b1220",
  card: "#0f172a",
  ink: "#e6eaf2",
  subtle: "#94a3b8",
  border: "rgba(255,255,255,.10)",
  borderHeavy: "rgba(255,255,255,.18)",
  primary: "#635bff",
  primaryHover: "#5149ff",
  ghost: "rgba(255,255,255,.08)",
  ghostHover: "rgba(255,255,255,.14)",
  danger: "#ef4444",
  dangerHover: "#dc2626",
  successBg: "rgba(16,185,129,.12)",
  successFg: "#34d399",
  errorBg: "rgba(239,68,68,.12)",
  errorFg: "#f87171",
  warnBg: "rgba(250,204,21,.12)",   // amber-400 @ 12%
  warnFg: "#facc15",                // amber-400
};
