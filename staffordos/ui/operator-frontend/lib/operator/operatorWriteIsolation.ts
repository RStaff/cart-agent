export const OPERATOR_WRITE_ENABLE_ENV = "STAFFORDOS_LOCAL_OPERATOR_WRITES_ENABLED";
export const OPERATOR_WRITE_DENIED_STATUS = 403;
export const OPERATOR_WRITE_DISABLED_ERROR = "OPERATOR_WRITE_DISABLED";

export type OperatorWriteIsolationCode =
  | "ALLOWED_LOCAL_EXPLICIT"
  | "DENIED_NOT_ENABLED"
  | "DENIED_NON_LOCAL"
  | "DENIED_UNKNOWN_HOST"
  | "DENIED_FORWARDED_REQUEST"
  | "DENIED_PRODUCTION_MODE"
  | "DENIED_PREVIEW_MODE"
  | "DENIED_INVALID_CONFIGURATION";

export type OperatorWriteBoundaryClassification =
  | "LOOPBACK"
  | "NON_LOCAL"
  | "UNKNOWN"
  | "FORWARDED"
  | "CLOUD_OR_PREVIEW"
  | "INVALID_CONFIGURATION";

export type OperatorWriteIsolationResult = {
  allowed: boolean;
  code: OperatorWriteIsolationCode;
  operatorMessage: string;
  technicalLimitation: string;
  observedBoundaryClassification: OperatorWriteBoundaryClassification;
};

type HeaderSource = {
  get(name: string): string | null;
};

type OperatorWriteIsolationInput = {
  request?: Request | null;
  headers?: HeaderSource | Record<string, unknown> | null;
  env?: Record<string, unknown>;
};

const DENIED_MESSAGE = "Operator changes are not available in this runtime.";
const ALLOWED_MESSAGE = "Local changes are enabled for this session.";

function text(value: unknown) {
  return String(value ?? "").trim();
}

function lower(value: unknown) {
  return text(value).toLowerCase();
}

function hasValue(value: unknown) {
  return text(value).length > 0;
}

function getHeader(headers: HeaderSource | Record<string, unknown> | null | undefined, name: string) {
  if (!headers) return "";
  if (typeof (headers as HeaderSource).get === "function") {
    return text((headers as HeaderSource).get(name));
  }

  const record = headers as Record<string, unknown>;
  return text(record[name] ?? record[name.toLowerCase()] ?? record[name.toUpperCase()]);
}

function requestHost(request?: Request | null) {
  if (!request?.url) return "";

  try {
    return new URL(request.url).host;
  } catch {
    return "";
  }
}

function normalizeHost(value: unknown) {
  const raw = text(value);
  if (!raw) return "";

  const firstValue = raw.split(",")[0].trim();
  if (!firstValue) return "";

  if (firstValue.startsWith("[")) {
    const closing = firstValue.indexOf("]");
    return closing > 0 ? firstValue.slice(1, closing).toLowerCase() : "";
  }

  return firstValue.split(":")[0].toLowerCase();
}

function isLoopbackHost(host: string) {
  return host === "localhost" || host === "127.0.0.1" || host === "::1";
}

function hasCloudMarker(env: Record<string, unknown>) {
  return [
    "VERCEL",
    "VERCEL_URL",
    "RENDER",
    "RENDER_SERVICE_ID",
    "RENDER_EXTERNAL_HOSTNAME",
    "RENDER_SERVICE_NAME",
    "FLY_APP_NAME",
    "K_SERVICE",
    "DYNO",
    "NETLIFY"
  ].some((key) => hasValue(env[key]));
}

function hasPreviewMarker(env: Record<string, unknown>) {
  const vercelEnv = lower(env.VERCEL_ENV);
  const deployEnv = lower(env.DEPLOY_ENV ?? env.DEPLOYMENT_ENV ?? env.NEXT_PUBLIC_VERCEL_ENV);
  return vercelEnv === "preview" || deployEnv === "preview";
}

function forwardedBoundaryDetected(headers: HeaderSource | Record<string, unknown> | null | undefined) {
  const forwardedFor = getHeader(headers, "x-forwarded-for");
  const forwarded = getHeader(headers, "forwarded");
  const realIp = getHeader(headers, "x-real-ip");
  const trueClientIp = getHeader(headers, "true-client-ip");
  const cfConnectingIp = getHeader(headers, "cf-connecting-ip");

  return [forwardedFor, forwarded, realIp, trueClientIp, cfConnectingIp].some(Boolean);
}

function result(
  allowed: boolean,
  code: OperatorWriteIsolationCode,
  observedBoundaryClassification: OperatorWriteBoundaryClassification,
  technicalLimitation: string
): OperatorWriteIsolationResult {
  return {
    allowed,
    code,
    operatorMessage: allowed ? ALLOWED_MESSAGE : DENIED_MESSAGE,
    technicalLimitation,
    observedBoundaryClassification
  };
}

export function evaluateOperatorWriteIsolation(input: OperatorWriteIsolationInput = {}): OperatorWriteIsolationResult {
  const env = input.env || process.env;
  const flag = text(env[OPERATOR_WRITE_ENABLE_ENV]);

  if (hasCloudMarker(env)) {
    return result(false, "DENIED_PRODUCTION_MODE", "CLOUD_OR_PREVIEW", "Cloud deployment marker is present.");
  }

  if (hasPreviewMarker(env)) {
    return result(false, "DENIED_PREVIEW_MODE", "CLOUD_OR_PREVIEW", "Preview deployment marker is present.");
  }

  if (text(env.NODE_ENV) !== "development") {
    return result(false, "DENIED_PRODUCTION_MODE", "INVALID_CONFIGURATION", "Runtime mode is not local development.");
  }

  if (!flag) {
    return result(false, "DENIED_NOT_ENABLED", "UNKNOWN", "Local operator writes are not explicitly enabled.");
  }

  if (flag !== "true") {
    return result(false, "DENIED_INVALID_CONFIGURATION", "INVALID_CONFIGURATION", "Local operator write enablement is malformed.");
  }

  const headers = input.headers || input.request?.headers || null;
  if (forwardedBoundaryDetected(headers)) {
    return result(false, "DENIED_FORWARDED_REQUEST", "FORWARDED", "Forwarded request boundary is not governed.");
  }

  const host = normalizeHost(getHeader(headers, "host") || requestHost(input.request));
  if (!host) {
    return result(false, "DENIED_UNKNOWN_HOST", "UNKNOWN", "Request host authority is unavailable.");
  }

  if (!isLoopbackHost(host)) {
    return result(false, "DENIED_NON_LOCAL", "NON_LOCAL", "Request host authority is not loopback.");
  }

  return result(true, "ALLOWED_LOCAL_EXPLICIT", "LOOPBACK", "Explicitly enabled local loopback request.");
}

export function operatorWriteDeniedResponseBody(result: OperatorWriteIsolationResult) {
  return {
    ok: false,
    error: OPERATOR_WRITE_DISABLED_ERROR,
    code: result.code,
    message: result.operatorMessage,
    boundary: result.observedBoundaryClassification,
    limitation: result.technicalLimitation
  };
}

export class OperatorWriteIsolationError extends Error {
  result: OperatorWriteIsolationResult;

  constructor(result: OperatorWriteIsolationResult) {
    super(result.operatorMessage);
    this.name = "OperatorWriteIsolationError";
    this.result = result;
  }
}

export function assertOperatorWriteAllowed(input: OperatorWriteIsolationInput = {}) {
  const gate = evaluateOperatorWriteIsolation(input);

  if (!gate.allowed) {
    throw new OperatorWriteIsolationError(gate);
  }

  return gate;
}
