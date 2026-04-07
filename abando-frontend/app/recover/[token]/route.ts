import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

const RECOVERY_TOKEN_SECRET = process.env.ABANDO_RECOVERY_TOKEN_SECRET || "abando-recovery-dev-secret";
const BACKEND_BASE = process.env.NEXT_PUBLIC_ABANDO_API_BASE || "https://pay.abando.ai";

function clean(value: unknown): string {
  return String(value || "").trim();
}

function normalizeShop(value: unknown): string {
  return clean(value).toLowerCase().replace(/^https?:\/\//i, "").replace(/\/+$/, "");
}

function normalizeExperienceId(value: unknown): string {
  return clean(value)
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, 80);
}

function isSyntheticCheckoutValue(value = ""): boolean {
  const normalized = clean(value).toLowerCase();
  if (!normalized) return false;
  return normalized.startsWith("auto-proof-")
    || normalized.startsWith("abando-test-")
    || normalized.startsWith("proof-cart-")
    || normalized.startsWith("validation-cart")
    || normalized.startsWith("test-cart-");
}

function fromBase64Url(value: string): string {
  const normalized = String(value || "").replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return Buffer.from(`${normalized}${padding}`, "base64").toString("utf8");
}

function signPayload(payload: string): string {
  return crypto.createHmac("sha256", RECOVERY_TOKEN_SECRET).update(payload).digest("base64url");
}

function parseRecoveryToken(token: string) {
  const [encodedPayload, signature] = String(token || "").split(".");
  if (!encodedPayload || !signature) {
    throw new Error("invalid_recovery_token");
  }

  const expected = signPayload(encodedPayload);
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    throw new Error("invalid_recovery_signature");
  }

  return JSON.parse(fromBase64Url(encodedPayload));
}

function isDebugOrSyntheticPayload(payload: Record<string, unknown>): boolean {
  const checkoutId = clean(payload.checkout_id);
  const checkoutSessionId = clean(payload.checkout_session_id);
  const checkoutPath = clean(payload.checkout_path);
  const storefrontHost = normalizeShop(payload.storefront_host);

  if (checkoutId.toLowerCase().startsWith("debug_")) return true;
  if (checkoutSessionId.toLowerCase().startsWith("debug_")) return true;
  if (isSyntheticCheckoutValue(checkoutId) || isSyntheticCheckoutValue(checkoutSessionId)) return true;
  if (!storefrontHost) return true;
  if (checkoutPath && !checkoutPath.includes("/checkouts/")) return true;
  return false;
}

export async function GET(_req: NextRequest, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  const tokenValue = clean(token);

  try {
    const parsed = parseRecoveryToken(tokenValue);
    const shop = normalizeShop(parsed.shop);
    const experienceId = normalizeExperienceId(parsed.experienceId);

    if (isDebugOrSyntheticPayload(parsed)) {
      const target = new URL("/recover", "https://app.abando.ai");
      if (shop) {
        target.searchParams.set("shop", shop);
      }
      if (experienceId) {
        target.searchParams.set("eid", experienceId);
      }
      return NextResponse.redirect(target, 302);
    }
  } catch {
    // Fall through to backend recovery route for invalid or non-standard tokens.
  }

  return NextResponse.redirect(`${BACKEND_BASE.replace(/\/+$/, "")}/recover/${encodeURIComponent(tokenValue)}`, 302);
}
