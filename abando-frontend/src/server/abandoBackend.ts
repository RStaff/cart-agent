import "server-only";

type BackendErrorKind =
  | "config"
  | "reachability"
  | "auth"
  | "backend_app_error"
  | "request_shape";

type BackendSuccess = {
  ok: true;
  status: number;
  data: unknown;
};

type BackendFailure = {
  ok: false;
  status: number;
  error: {
    kind: BackendErrorKind;
    message: string;
    backendMessage?: string;
  };
};

export type BackendJsonResult = BackendSuccess | BackendFailure;

const REQUEST_TIMEOUT_MS = 8000;

function resolveBackendBase(): string | null {
  const raw =
    process.env.CART_AGENT_API_BASE ||
    process.env.ABANDO_BACKEND_ORIGIN ||
    process.env.BACKEND_URL;

  if (!raw) return null;

  const url = new URL(raw);
  if (url.hostname === "localhost") {
    url.hostname = "127.0.0.1";
  }

  return url.toString().replace(/\/+$/, "");
}

function getBackendMessage(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object") return undefined;

  const record = payload as Record<string, unknown>;

  for (const key of ["error", "message", "detail"]) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value;
  }

  return undefined;
}

function mapStatusToKind(status: number): BackendErrorKind {
  if (status === 401 || status === 403) return "auth";
  if (status === 400 || status === 404 || status === 409 || status === 422) return "request_shape";
  return "backend_app_error";
}

export async function postBackendJson(
  path: string,
  body: Record<string, unknown>
): Promise<BackendJsonResult> {
  const base = resolveBackendBase();

  if (!base) {
    return {
      ok: false,
      status: 500,
      error: {
        kind: "config",
        message:
          "Missing backend base URL. Set CART_AGENT_API_BASE, ABANDO_BACKEND_ORIGIN, or BACKEND_URL.",
      },
    };
  }

  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const devToken = process.env.BACKEND_DEV_AUTH_TOKEN || "";

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        ...(devToken ? { Authorization: `Bearer ${devToken}` } : {}),
      },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: controller.signal,
    });

    const contentType = response.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const payload = isJson
      ? await response.json().catch(() => ({ error: "invalid_json" }))
      : { message: await response.text().catch(() => "") };

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: {
          kind: mapStatusToKind(response.status),
          message: getBackendMessage(payload) || `Backend request failed with status ${response.status}.`,
          backendMessage: getBackendMessage(payload),
        },
      };
    }

    return {
      ok: true,
      status: response.status,
      data: payload,
    };
  } catch (error) {
    const message =
      error instanceof Error && error.name === "AbortError"
        ? `Backend request timed out after ${REQUEST_TIMEOUT_MS}ms.`
        : error instanceof Error
        ? error.message
        : "Backend request failed.";

    return {
      ok: false,
      status: 502,
      error: {
        kind: "reachability",
        message,
      },
    };
  } finally {
    clearTimeout(timeout);
  }
}
