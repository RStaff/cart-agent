"use client";

type ToneColors = { bg: string; fg: string; border: string };
function ____resolveTone(t?: string): ToneColors {
  const tnorm = (t || "neutral").toLowerCase();
  // Safe fallbacks (guard if future tokens omit fields)
  const WARN_BG = (token as any).warnBg ?? "rgba(250,204,21,.12)";
  const WARN_FG = (token as any).warnFg ?? "#facc15";

  if (tnorm === "brand" || tnorm === "primary") {
    return { bg: token.primary, fg: "#fff", border: token.primaryHover };
  }
  if (tnorm === "ghost" || tnorm === "secondary" || tnorm === "neutral") {
    return { bg: token.ghost, fg: token.ink, border: token.border };
  }
  if (tnorm === "ok" || tnorm === "success") {
    return { bg: token.successBg, fg: token.successFg, border: token.border };
  }
  if (tnorm === "warn" || tnorm === "warning") {
    return { bg: WARN_BG, fg: WARN_FG, border: token.border };
  }
  if (tnorm === "error" || tnorm === "danger") {
    return { bg: token.errorBg, fg: token.errorFg, border: token.border };
  }
  // default
  return { bg: token.ghost, fg: token.ink, border: token.border };
}

import * as React from "react";
import Link from "next/link";
import { token } from "./tokens";

/** =================== Toasts (with back-compat) =================== */

type ToastKind = "info" | "success" | "error";
type Toast = { id: string; kind: ToastKind; text: string };

const ToastCtx = React.createContext<{
  push: (k: ToastKind, t: string) => void;
} | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const push = React.useCallback((kind: ToastKind, text: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, kind, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  }, []);
  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div
        style={{
          position: "fixed",
          right: 12,
          bottom: 12,
          display: "grid",
          gap: 8,
          zIndex: 50,
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: `1px solid ${token.borderHeavy}`,
              background:
                t.kind === "error"
                  ? token.errorBg
                  : t.kind === "success"
                    ? token.successBg
                    : token.card,
              color:
                t.kind === "error"
                  ? token.errorFg
                  : t.kind === "success"
                    ? token.successFg
                    : "#d5def0",
              minWidth: 240,
              boxShadow: "0 6px 16px rgba(0,0,0,.25)",
            }}
          >
            {t.text}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/** Legacy shim (some pages import { Toast } from useToast) */
function ToastShim(): React.ReactElement | null {
  return null;
}

/** Back-compat + new shape */
export function useToast(): {
  info: (t: string) => void;
  success: (t: string) => void;
  error: (t: string) => void;
  toast: (t: string) => void; // alias for info
  Toast: typeof ToastShim; // noop shim
} {
  const ctx = React.useContext(ToastCtx);
  if (!ctx) {
    const noop = (_: string) => {};
    return {
      info: noop,
      success: noop,
      error: noop,
      toast: noop,
      Toast: ToastShim,
    };
  }
  return {
    info: (t) => ctx.push("info", t),
    success: (t) => ctx.push("success", t),
    error: (t) => ctx.push("error", t),
    toast: (t) => ctx.push("info", t),
    Toast: ToastShim,
  };
}

/** =================== Primitives =================== */

type Merge<A, B> = Omit<A, keyof B> & B;
type Variant = "primary" | "ghost" | "danger";

/** Normalize arbitrary caller tone into supported variants. */
function normalizeTone(v?: string): Variant {
  const s = (v || "").toLowerCase().trim();
  if (s === "primary" || s === "solid" || s === "filled" || s === "brand")
    return "primary";
  if (s === "ghost" || s === "neutral" || s === "secondary" || s === "subtle")
    return "ghost";
  if (s === "danger" || s === "destructive" || s === "warn" || s === "warning")
    return "danger";
  return "primary";
}

/** Button size map (accepts any string; unknown → md) */
type Size = "sm" | "md" | "lg" | (string & {});
function sizeStyles(size?: Size): {
  padding: string;
  radius: number;
  fontSize: number;
} {
  const s = (size || "md").toLowerCase();
  if (s === "sm") return { padding: "8px 10px", radius: 10, fontSize: 12 };
  if (s === "lg") return { padding: "12px 16px", radius: 12, fontSize: 15 };
  return { padding: "10px 14px", radius: 10, fontSize: 14 };
}

function variantStyles(variant: Variant): {
  bg: string;
  hover: string;
  color: string;
} {
  if (variant === "danger")
    return { bg: token.danger, hover: token.dangerHover, color: "#fff" };
  if (variant === "ghost")
    return { bg: token.ghost, hover: token.ghostHover, color: "#E6EAF2" };
  return { bg: token.primary, hover: token.primaryHover, color: "#fff" }; // primary
}

export type ButtonProps = Merge<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  {
    /** Flexible: "brand", "secondary", etc. are mapped to internal variants */
    variant?: string;
    tone?: string; // alias
    size?: Size; // sm | md | lg | any string → md
    href?: string; // when set, renders Link/anchor styled as a button
    target?: React.AnchorHTMLAttributes<HTMLAnchorElement>["target"];
    rel?: React.AnchorHTMLAttributes<HTMLAnchorElement>["rel"];
  }
>;

export function Button({
  variant,
  tone,
  size,
  href,
  target,
  rel,
  disabled,
  style,
  onClick,
  onMouseEnter,
  onMouseLeave,
  children,
  ...rest
}: ButtonProps) {
  const v = normalizeTone(tone ?? variant);
  const { padding, radius, fontSize } = sizeStyles(size);
  const { bg, hover, color } = variantStyles(v);

  const baseStyle: React.CSSProperties = {
    padding,
    borderRadius: radius,
    fontWeight: 700,
    fontSize,
    border: "1px solid transparent",
    background: bg,
    color,
    cursor: "pointer",
    transition: "transform .04s ease, background .12s ease",
    opacity: disabled ? 0.7 : 1,
    ...(style || {}),
  };

  const handleEnter = (e: React.MouseEvent<HTMLElement>) => {
    Object.assign((e.currentTarget as HTMLElement).style, {
      background: hover,
    });
    onMouseEnter?.(e as any);
  };
  const handleLeave = (e: React.MouseEvent<HTMLElement>) => {
    Object.assign((e.currentTarget as HTMLElement).style, { background: bg });
    onMouseLeave?.(e as any);
  };

  if (href) {
    const internal = href.startsWith("/");
    const content = <span style={{ pointerEvents: "none" }}>{children}</span>;
    const common = {
      style: baseStyle,
      onMouseEnter: handleEnter,
      onMouseLeave: handleLeave,
      "aria-disabled": disabled || undefined,
      onClick: disabled
        ? (e: React.MouseEvent) => e.preventDefault()
        : undefined,
    };

    return internal ? (
      <Link href={href} {...(common as any)}>
        {content}
      </Link>
    ) : (
      <a href={href} target={target} rel={rel} {...common}>
        {content}
      </a>
    );
  }

  return (
    <button
      {...rest}
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      style={baseStyle}
      onMouseEnter={handleEnter as any}
      onMouseLeave={handleLeave as any}
    >
      {children}
    </button>
  );
}

/** Card with optional header (title + subtitle + right actions) */
export type CardProps = Merge<
  Omit<React.HTMLAttributes<HTMLDivElement>, "title" | "right">,
  {
    title?: React.ReactNode;
    subtitle?: React.ReactNode;
    right?: React.ReactNode;
  }
>;
export function Card({
  title,
  subtitle,
  right,
  children,
  style,
  ...rest
}: CardProps) {
  return (
    <div
      {...rest}
      style={{
        background: token.card,
        border: `1px solid ${token.border}`,
        borderRadius: 14,
        padding: 18,
        ...(style || {}),
      }}
    >
      {title || right || subtitle ? (
        <div style={{ marginBottom: subtitle ? 8 : 12 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ fontWeight: 700 }}>{title}</div>
            {right ? <div>{right}</div> : null}
          </div>
          {subtitle ? (
            <div style={{ color: token.subtle, marginTop: 6, fontSize: 13 }}>
              {subtitle}
            </div>
          ) : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}

/** ===== Badge now supports tone prop (root-cause fix) ===== */
type BadgeTone = "neutral" | "ok" | "warn" | "error" | (string & {});
function badgeStyles(tone?: BadgeTone): {
  bg: string;
  fg: string;
  border: string;
} {
  const t = (tone || "neutral").toLowerCase();
  if (t === "ok" || t === "success" || t === "positive") {
    return { bg: token.successBg, fg: token.successFg, border: token.border };
  }
  if (t === "warn" || t === "warning") {
    return {
      bg: token.warnBg ?? "rgba(255,196,0,.08)",
      fg: token.warnFg ?? "#facc15",
      border: token.border,
    };
  }
  if (t === "error" || t === "danger") {
    return { bg: token.errorBg, fg: token.errorFg, border: token.border };
  }
  // neutral
  return { bg: token.ghost, fg: "#cbd5e1", border: token.border };
}

export type BadgeProps = Merge<
  React.HTMLAttributes<HTMLSpanElement>,
  { tone?: BadgeTone }
>;
export function Badge({ tone, children, style, ...rest }: BadgeProps) {
  const s = badgeStyles(tone);
  return (
    <span
      {...rest}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        background: s.bg,
        color: s.fg,
        border: `1px solid ${s.border}`,
        borderRadius: 999,
        padding: "6px 10px",
        font: "700 12px/1 system-ui, -apple-system, sans-serif",
        ...(style || {}),
      }}
    >
      {children}
    </span>
  );
}

export function Stat({
  label,
  value,
  hint,
  style,
  ...rest
}: {
  label: string;
  value: string;
  hint?: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...rest}
      style={{
        textAlign: "center",
        background: token.card,
        padding: 20,
        borderRadius: 10,
        ...(style || {}),
      }}
    >
      <div style={{ fontSize: 20, fontWeight: 700 }}>{value}</div>
      <div style={{ color: "#94a3b8", marginTop: 6 }}>{label}</div>
      {hint ? (
        <div style={{ color: token.subtle, marginTop: 4, fontSize: 12 }}>
          {hint}
        </div>
      ) : null}
    </div>
  );
}

/** Re-export tokens so existing imports keep working */
export { token };
