import * as crypto from "node:crypto";

export const STAFFORDOS_OPERATOR_SESSION_COOKIE = "staffordos_operator_session";
export const STAFFORDOS_OPERATOR_SESSION_TTL_SECONDS = 300;
export const STAFFORDOS_OPERATOR_SESSION_MAX_TTL_SECONDS = 900;
export const CAREEROS_BETA_OPERATIONS_READ_PERMISSION = "careeros.beta.operations.read";
export const CAREEROS_BETA_OPERATIONS_ROLE = "careeros_beta_operations_viewer";

const MAX_CLOCK_SKEW_SECONDS = 60;

export type StaffordOsOperatorAuthConfig = {
  issuer: string;
  audience: string;
  allowedSubjects: string[];
  issuerBaseUrl: string;
  publicKeyUrl: string;
  publicKeyPem?: string;
  sessionSecret: string;
  sessionTtlSeconds: number;
  cookieSecure: boolean;
};

export type VerifiedStaffordOsOperator = {
  subject: string;
  issuer: string;
  audience: string;
  roles: string[];
  permissions: string[];
  jwtId: string;
  issuedAt?: number;
  expiresAt: number;
};

export type StaffordOsOperatorSession = {
  id: string;
  subject: string;
  issuer: string;
  audience: string;
  roles: string[];
  permissions: string[];
  jwtId: string;
  issuedAt: number;
  expiresAt: number;
};

type StoredSession = StaffordOsOperatorSession;

export type OperatorAuthorizationResult =
  | {
      ok: true;
      status: 200;
      session: StaffordOsOperatorSession;
    }
  | {
      ok: false;
      status: 401 | 403;
      error:
        | "OPERATOR_SESSION_MISSING"
        | "OPERATOR_SESSION_INVALID"
        | "OPERATOR_SESSION_EXPIRED"
        | "OPERATOR_PERMISSION_MISSING";
    };

type JwtParts = {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signingInput: Buffer;
  signature: Buffer;
};

const operatorSessionStore = new Map<string, StoredSession>();

function text(value: unknown) {
  return String(value ?? "").trim();
}

function csv(value: unknown) {
  return text(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function boolValue(value: unknown) {
  return ["1", "true", "yes", "on"].includes(text(value).toLowerCase());
}

function numberValue(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function boundedSessionTtl(value: unknown) {
  return Math.max(
    60,
    Math.min(STAFFORDOS_OPERATOR_SESSION_MAX_TTL_SECONDS, numberValue(value, STAFFORDOS_OPERATOR_SESSION_TTL_SECONDS)),
  );
}

function base64UrlDecode(value: string) {
  const padded = `${value}${"=".repeat((4 - (value.length % 4)) % 4)}`;
  return Buffer.from(padded.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

function base64Url(input: Buffer) {
  return input.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function hmacSha256(value: string, secret: string) {
  return base64Url(crypto.createHmac("sha256", secret).update(value).digest());
}

function timingSafeEqualText(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function stringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map(text).filter(Boolean);
}

function jwtAudience(value: unknown) {
  if (Array.isArray(value)) return value.map(text).filter(Boolean);
  const single = text(value);
  return single ? [single] : [];
}

function parseJwt(assertion: string): JwtParts {
  const parts = text(assertion).split(".");
  if (parts.length !== 3) throw new Error("STAFFORDOS_ASSERTION_MALFORMED");
  return {
    header: JSON.parse(base64UrlDecode(parts[0]).toString("utf8")),
    payload: JSON.parse(base64UrlDecode(parts[1]).toString("utf8")),
    signingInput: Buffer.from(`${parts[0]}.${parts[1]}`, "utf8"),
    signature: base64UrlDecode(parts[2]),
  };
}

function publicKeyUrlFromEnv(env: Record<string, string | undefined>) {
  const explicitUrl = text(env.STAFFORDOS_OPERATOR_JWT_PUBLIC_KEY_URL);
  if (explicitUrl) return explicitUrl;
  const issuerBaseUrl = text(env.STAFFORDOS_OPERATOR_ISSUER_BASE_URL);
  return issuerBaseUrl ? new URL("/public-key", issuerBaseUrl).toString() : "";
}

export function operatorAuthConfigFromEnv(env: Record<string, string | undefined> = process.env): StaffordOsOperatorAuthConfig {
  const issuerBaseUrl = text(env.STAFFORDOS_OPERATOR_ISSUER_BASE_URL);
  return {
    issuer: text(env.STAFFORDOS_OPERATOR_JWT_ISSUER),
    audience: text(env.STAFFORDOS_OPERATOR_JWT_AUDIENCE),
    allowedSubjects: csv(env.STAFFORDOS_OPERATOR_ALLOWED_SUBJECTS),
    issuerBaseUrl,
    publicKeyUrl: publicKeyUrlFromEnv(env),
    publicKeyPem: text(env.STAFFORDOS_OPERATOR_JWT_PUBLIC_KEY_PEM) || undefined,
    sessionSecret: text(env.STAFFORDOS_OPERATOR_FRONTEND_SESSION_SECRET),
    sessionTtlSeconds: boundedSessionTtl(env.STAFFORDOS_OPERATOR_FRONTEND_SESSION_TTL_SECONDS),
    cookieSecure: boolValue(env.STAFFORDOS_OPERATOR_COOKIE_SECURE) || text(env.NODE_ENV) === "production",
  };
}

export function validateOperatorAuthConfig(config: StaffordOsOperatorAuthConfig) {
  validateOperatorSessionConfig(config);
  const missing = [
    ["issuerBaseUrl", config.issuerBaseUrl],
  ]
    .filter(([, value]) => !text(value))
    .map(([key]) => key);

  if (!config.publicKeyPem && !config.publicKeyUrl) missing.push("publicKeyUrl");
  if (missing.length) throw new Error(`STAFFORDOS_OPERATOR_AUTH_CONFIG_MISSING:${missing.join(",")}`);
  return config;
}

export function validateOperatorSessionConfig(config: StaffordOsOperatorAuthConfig) {
  const missing = [
    ["issuer", config.issuer],
    ["audience", config.audience],
    ["sessionSecret", config.sessionSecret],
  ]
    .filter(([, value]) => !text(value))
    .map(([key]) => key);

  if (!config.allowedSubjects.length) missing.push("allowedSubjects");
  if (missing.length) throw new Error(`STAFFORDOS_OPERATOR_AUTH_CONFIG_MISSING:${missing.join(",")}`);
  return config;
}

export async function fetchStaffordOsOperatorPublicKey(
  config: StaffordOsOperatorAuthConfig,
  fetchImpl: typeof fetch = fetch,
) {
  validateOperatorAuthConfig(config);
  if (config.publicKeyPem) return config.publicKeyPem;

  const response = await fetchImpl(config.publicKeyUrl, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  const body = await response.json().catch(() => ({}));
  const pem = text((body as Record<string, unknown>).public_key_pem);
  if (!response.ok || !pem) throw new Error("STAFFORDOS_OPERATOR_PUBLIC_KEY_UNAVAILABLE");
  return pem;
}

export function verifyStaffordOsOperatorAssertion(
  assertion: string,
  publicKeyPem: string,
  config: StaffordOsOperatorAuthConfig,
  now = new Date(),
): VerifiedStaffordOsOperator {
  validateOperatorAuthConfig(config);
  const jwt = parseJwt(assertion);
  if (jwt.header.alg !== "EdDSA") throw new Error("STAFFORDOS_ASSERTION_ALGORITHM_REJECTED");

  const verified = crypto.verify(null, jwt.signingInput, crypto.createPublicKey(publicKeyPem), jwt.signature);
  if (!verified) throw new Error("STAFFORDOS_ASSERTION_SIGNATURE_INVALID");

  const nowSeconds = Math.floor(now.getTime() / 1000);
  const issuer = text(jwt.payload.iss);
  const audiences = jwtAudience(jwt.payload.aud);
  const subject = text(jwt.payload.sub);
  const jwtId = text(jwt.payload.jti);
  const issuedAt = Number(jwt.payload.iat);
  const expiresAt = Number(jwt.payload.exp);

  if (issuer !== config.issuer) throw new Error("STAFFORDOS_ASSERTION_ISSUER_INVALID");
  if (!audiences.includes(config.audience)) throw new Error("STAFFORDOS_ASSERTION_AUDIENCE_INVALID");
  if (!subject) throw new Error("STAFFORDOS_ASSERTION_SUBJECT_MISSING");
  if (!config.allowedSubjects.includes(subject)) throw new Error("STAFFORDOS_ASSERTION_SUBJECT_UNAUTHORIZED");
  if (!jwtId) throw new Error("STAFFORDOS_ASSERTION_JTI_MISSING");
  if (!Number.isFinite(expiresAt) || expiresAt <= nowSeconds) throw new Error("STAFFORDOS_ASSERTION_EXPIRED");
  if (Number.isFinite(issuedAt) && issuedAt > nowSeconds + MAX_CLOCK_SKEW_SECONDS) {
    throw new Error("STAFFORDOS_ASSERTION_IAT_INVALID");
  }

  return {
    subject,
    issuer,
    audience: config.audience,
    roles: stringArray(jwt.payload.roles),
    permissions: stringArray(jwt.payload.permissions),
    jwtId,
    issuedAt: Number.isFinite(issuedAt) ? issuedAt : undefined,
    expiresAt,
  };
}

export function sessionCookieOptions(config: StaffordOsOperatorAuthConfig, maxAge: number) {
  return {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export function clearSessionCookieOptions(config: StaffordOsOperatorAuthConfig) {
  return sessionCookieOptions(config, 0);
}

export function createStaffordOsOperatorSession(
  verified: VerifiedStaffordOsOperator,
  config: StaffordOsOperatorAuthConfig,
  now = new Date(),
) {
  validateOperatorSessionConfig(config);
  const nowSeconds = Math.floor(now.getTime() / 1000);
  const expiresAt = Math.min(verified.expiresAt, nowSeconds + config.sessionTtlSeconds);
  const id = `staffordos_operator_session_${base64Url(crypto.randomBytes(18))}`;
  const session: StaffordOsOperatorSession = {
    id,
    subject: verified.subject,
    issuer: verified.issuer,
    audience: verified.audience,
    roles: [...verified.roles],
    permissions: [...verified.permissions],
    jwtId: verified.jwtId,
    issuedAt: nowSeconds,
    expiresAt,
  };

  operatorSessionStore.set(id, session);
  return {
    session,
    cookieValue: `${id}.${hmacSha256(id, config.sessionSecret)}`,
    cookieOptions: sessionCookieOptions(config, Math.max(0, expiresAt - nowSeconds)),
  };
}

function sessionIdFromCookie(cookieValue: string, config: StaffordOsOperatorAuthConfig) {
  const [id, signature] = text(cookieValue).split(".");
  if (!id || !signature) return "";
  const expected = hmacSha256(id, config.sessionSecret);
  return timingSafeEqualText(signature, expected) ? id : "";
}

export function resolveStaffordOsOperatorSession(
  cookieValue: string,
  config: StaffordOsOperatorAuthConfig,
  now = new Date(),
): OperatorAuthorizationResult {
  validateOperatorSessionConfig(config);
  if (!text(cookieValue)) return { ok: false, status: 401, error: "OPERATOR_SESSION_MISSING" };

  const sessionId = sessionIdFromCookie(cookieValue, config);
  if (!sessionId) return { ok: false, status: 401, error: "OPERATOR_SESSION_INVALID" };

  const session = operatorSessionStore.get(sessionId);
  if (!session) return { ok: false, status: 401, error: "OPERATOR_SESSION_INVALID" };
  if (session.issuer !== config.issuer || session.audience !== config.audience || !config.allowedSubjects.includes(session.subject)) {
    operatorSessionStore.delete(sessionId);
    return { ok: false, status: 401, error: "OPERATOR_SESSION_INVALID" };
  }

  const nowSeconds = Math.floor(now.getTime() / 1000);
  if (session.expiresAt <= nowSeconds) {
    operatorSessionStore.delete(sessionId);
    return { ok: false, status: 401, error: "OPERATOR_SESSION_EXPIRED" };
  }

  return { ok: true, status: 200, session };
}

export function destroyStaffordOsOperatorSession(cookieValue: string, config: StaffordOsOperatorAuthConfig) {
  validateOperatorSessionConfig(config);
  const sessionId = sessionIdFromCookie(cookieValue, config);
  if (sessionId) operatorSessionStore.delete(sessionId);
  return { ok: true, cookieOptions: clearSessionCookieOptions(config) };
}

export function authorizeStaffordOsOperatorRead(
  cookieValue: string,
  requiredPermission: string,
  config: StaffordOsOperatorAuthConfig,
  now = new Date(),
): OperatorAuthorizationResult {
  const sessionResult = resolveStaffordOsOperatorSession(cookieValue, config, now);
  if (!sessionResult.ok) return sessionResult;
  if (!sessionResult.session.permissions.includes(requiredPermission)) {
    return { ok: false, status: 403, error: "OPERATOR_PERMISSION_MISSING" };
  }
  return sessionResult;
}

export function operatorAuthorizationFailureBody(result: OperatorAuthorizationResult) {
  if (result.ok) return { ok: true };
  return {
    ok: false,
    error: result.error,
  };
}

export async function redeemStaffordOsIssuerHandoffCode(
  code: string,
  config: StaffordOsOperatorAuthConfig,
  fetchImpl: typeof fetch = fetch,
) {
  validateOperatorAuthConfig(config);
  const url = new URL("/auth/staffordos/handoff", config.issuerBaseUrl);
  url.searchParams.set("code", code);
  const response = await fetchImpl(url.toString(), {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  const body = await response.json().catch(() => ({}));
  const assertion = text((body as Record<string, unknown>).assertion);
  if (!response.ok || !assertion) throw new Error("STAFFORDOS_OPERATOR_HANDOFF_REDEEM_FAILED");
  return assertion;
}

export function careerOsBetaOperationsProtectedProof(session: StaffordOsOperatorSession) {
  return {
    ok: true,
    authority: CAREEROS_BETA_OPERATIONS_READ_PERMISSION,
    role: CAREEROS_BETA_OPERATIONS_ROLE,
    dataClass: "synthetic_authorization_proof_only",
    customerDataRead: false,
    customerDataMutated: false,
    privateCareerDataReturned: false,
    session: {
      authenticated: true,
      issuer: session.issuer,
      audience: session.audience,
      permission: CAREEROS_BETA_OPERATIONS_READ_PERMISSION,
    },
    excludedPrivateEvidence: [
      "career_story_testimony",
      "transcripts",
      "career_fact_text",
      "source_excerpts",
      "resumes",
      "private_notes",
      "full_job_descriptions",
      "invite_codes",
      "tokens",
      "cookies",
    ],
  };
}
