/**
 * Checkout API client (typed, safe, SSR/CSR compatible)
 *
 * - Uses env override NEXT_PUBLIC_API_BASE or falls back to relative /api/checkout
 * - Sends JSON with allowed headers only (NO manual Origin/Cookie/etc)
 * - Throws on non-2xx with a rich error
 */

export type LineItem = {
  id: string;
  quantity: number;
  // allow extra fields without failing TS
  [k: string]: unknown;
};

export type CreateCheckoutParams = {
  email?: string;
  items: LineItem[];
  devToken?: string; // optional developer token for local/prototyping
  // allow extra metadata
  [k: string]: unknown;
};

export type CheckoutResponse =
  | {
      ok: true;
      sessionUrl?: string;
      sessionId?: string;
      // allow backend-specific payloads
      [k: string]: unknown;
    }
  | {
      ok: false;
      error: string;
      status?: number;
      // allow backend-specific payloads
      [k: string]: unknown;
    };

function baseUrl(): string {
  // Prefer explicit public base URL (works on client & server)
  const fromEnv = process.env.NEXT_PUBLIC_API_BASE?.trim();
  if (fromEnv) return fromEnv.replace(/\/+$/, ""); // strip trailing slash
  // Fallback: same-origin API route
  return "";
}

function buildUrl(path: string): string {
  const root = baseUrl();
  return root ? `${root}${path}` : path;
}

export async function createCheckoutSession(
  params: CreateCheckoutParams,
): Promise<CheckoutResponse> {
  const url = buildUrl("/api/checkout");

  // Never include forbidden headers like Origin/Cookie/Host, browsers set those
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  const res = await fetch(url, {
    method: "POST",
    headers,
    // Ensure body is JSON string — not a stream, not FormData
    body: JSON.stringify(params),
    // Allow Next to make this work server-side too; leave credentials default
    // cache: "no-store", // uncomment if this must never be cached
  });

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  if (!res.ok) {
    const payload = isJson
      ? await res.json().catch(() => ({}))
      : await res.text().catch(() => "");
    const message =
      isJson && payload && typeof payload.error === "string"
        ? payload.error
        : (typeof payload === "string" && payload) || `HTTP ${res.status}`;
    return {
      ok: false,
      error: message,
      status: res.status,
      ...(isJson && typeof payload === "object" ? payload : {}),
    };
  }

  const json = isJson ? await res.json() : {};
  return { ok: true, ...(typeof json === "object" && json ? json : {}) };
}
