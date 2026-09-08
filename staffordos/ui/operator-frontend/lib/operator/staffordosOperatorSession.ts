import * as crypto from "node:crypto";

export const STAFFORDOS_OPERATOR_SESSION_COOKIE = "staffordos_operator_session";
export const STAFFORDOS_OPERATOR_BROWSER_BINDING_COOKIE = "staffordos_operator_browser_binding";
export const STAFFORDOS_OPERATOR_DEFAULT_RETURN_PATH = "/operator/cockpit";
export const STAFFORDOS_OPERATOR_SESSION_TTL_SECONDS = 300;
export const STAFFORDOS_OPERATOR_BROWSER_BINDING_TTL_SECONDS = 600;
export const STAFFORDOS_OPERATOR_CANONICAL_ENTRY_TTL_SECONDS = 60;
export const STAFFORDOS_OPERATOR_CANONICAL_ENTRY_CLOCK_SKEW_SECONDS = 30;
export const STAFFORDOS_OPERATOR_SESSION_MAX_TTL_SECONDS = 900;
export const CAREEROS_BETA_OPERATIONS_READ_PERMISSION = "careeros.beta.operations.read";
export const CAREEROS_BETA_OPERATIONS_ROLE = "careeros_beta_operations_viewer";

const MAX_CLOCK_SKEW_SECONDS = 60;

export type StaffordOsOperatorAuthConfig = {
  issuer: string;
  audience: string;
  allowedSubjects: string[];
  issuerBaseUrl: string;
  frontendHandoffUrl: string;
  frontendOrigin: string;
  handoffSharedSecret: string;
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

const SESSION_COOKIE_VERSION = "v1";
const SESSION_COOKIE_AAD = Buffer.from("staffordos_operator_session.v1", "utf8");

function text(value: unknown) {
  return String(value ?? "").trim();
}

export function validateStaffordOsOperatorReturnPath(value: string | null | undefined) {
  if (typeof value !== "string") return null;
  const raw = value;
  if (!raw || raw.length > 2048 || raw !== raw.trim() || /\s/.test(raw) || raw.includes("#") || /[\u0000-\u001f\u007f]/.test(raw)) return null;
  const queryIndex = raw.indexOf("?");
  const pathname = queryIndex === -1 ? raw : raw.slice(0, queryIndex);
  const query = queryIndex === -1 ? "" : raw.slice(queryIndex + 1);
  if (!pathname.startsWith("/") || pathname.startsWith("//") || pathname.includes("\\") || pathname.includes("%")) return null;
  if (query && (/%(?![0-9a-fA-F]{2})/.test(query) || /[\\\u0000-\u001f\u007f]/.test(query))) return null;
  try {
    const parsed = new URL(raw, "http://staffordos.local");
    if (parsed.origin !== "http://staffordos.local") return null;
    if (!(parsed.pathname === "/operator" || parsed.pathname.startsWith("/operator/") || parsed.pathname === "/os" || parsed.pathname.startsWith("/os/"))) return null;
    if (parsed.pathname !== pathname || parsed.search.slice(1) !== query) return null;
    if (query && /[\\\u0000-\u001f\u007f]/.test(decodeURIComponent(query))) return null;
    return raw;
  } catch {
    return null;
  }
}

export function validateStaffordOsOperatorFrontendHandoffUrl(value: string | null | undefined) {
  const raw = text(value);
  if (!raw) return null;

  try {
    const url = new URL(raw);
    const loopback = ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname.toLowerCase());
    if (url.username || url.password || url.search || url.hash || url.pathname !== "/api/operator/auth/callback") return null;
    if (url.protocol === "https:") return { url: url.toString(), origin: url.origin };
    if (url.protocol === "http:" && loopback) return { url: url.toString(), origin: url.origin };
    return null;
  } catch {
    return null;
  }
}

export function isCanonicalStaffordOsOperatorHandoffSecret(value: unknown) {
  if (typeof value !== "string" || value.length !== 43 || value.trim() !== value || !/^[A-Za-z0-9_-]+$/.test(value)) return false;
  try {
    const decoded = Buffer.from(value, "base64url");
    return decoded.length === 32 && base64Url(decoded) === value;
  } catch {
    return false;
  }
}

export function isCanonicalStaffordOsOperatorBrowserBindingValue(value: unknown) {
  if (typeof value !== "string" || value.length !== 43 || value.trim() !== value || !/^[A-Za-z0-9_-]+$/.test(value)) return false;
  try {
    const decoded = Buffer.from(value, "base64url");
    return decoded.length === 32 && base64Url(decoded) === value;
  } catch {
    return false;
  }
}

export function createStaffordOsOperatorBrowserBinding() {
  const verifier = base64Url(crypto.randomBytes(32));
  const challenge = base64Url(crypto.createHash("sha256").update(verifier, "ascii").digest());
  return { verifier, challenge };
}

function canonicalEntryKey(secret: string) {
  return Buffer.from(crypto.hkdfSync("sha256", Buffer.from(secret, "ascii"), Buffer.alloc(0), Buffer.from("staffordos.operator.canonical-entry.v1", "ascii"), 32));
}

function canonicalEntryPayload(value: { returnTo: string; issuedAt: number; expiresAt: number; nonce: string }) {
  return JSON.stringify({ v: 1, returnTo: value.returnTo, issuedAt: value.issuedAt, expiresAt: value.expiresAt, nonce: value.nonce });
}

export function createStaffordOsOperatorCanonicalEntryToken(returnTo: string | null, secret: string, now = new Date()) {
  const validated = validateStaffordOsOperatorReturnPath(returnTo);
  const issuedAt = Math.floor(now.getTime() / 1000);
  const payload = canonicalEntryPayload({ returnTo: validated || "", issuedAt, expiresAt: issuedAt + STAFFORDOS_OPERATOR_CANONICAL_ENTRY_TTL_SECONDS, nonce: base64Url(crypto.randomBytes(16)) });
  const encoded = base64Url(Buffer.from(payload, "utf8"));
  const signature = base64Url(crypto.createHmac("sha256", canonicalEntryKey(secret)).update(encoded, "ascii").digest());
  return `${encoded}.${signature}`;
}

export function verifyStaffordOsOperatorCanonicalEntryToken(token: string | null | undefined, secret: string, now = new Date()) {
  if (typeof token !== "string") return null;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature || !/^[A-Za-z0-9_-]+$/.test(encoded) || !/^[A-Za-z0-9_-]+$/.test(signature)) return null;
  const expected = base64Url(crypto.createHmac("sha256", canonicalEntryKey(secret)).update(encoded, "ascii").digest());
  const actualBytes = Buffer.from(signature, "ascii");
  const expectedBytes = Buffer.from(expected, "ascii");
  if (actualBytes.length !== expectedBytes.length || !crypto.timingSafeEqual(actualBytes, expectedBytes)) return null;
  try {
    const payload = JSON.parse(base64UrlDecode(encoded).toString("utf8"));
    const nowSeconds = Math.floor(now.getTime() / 1000);
    if (payload.v !== 1 || !Number.isSafeInteger(payload.issuedAt) || !Number.isSafeInteger(payload.expiresAt) || payload.issuedAt < 0 || payload.expiresAt < 0 || payload.issuedAt > nowSeconds + STAFFORDOS_OPERATOR_CANONICAL_ENTRY_CLOCK_SKEW_SECONDS || payload.expiresAt < nowSeconds - STAFFORDOS_OPERATOR_CANONICAL_ENTRY_CLOCK_SKEW_SECONDS || payload.expiresAt <= payload.issuedAt || payload.expiresAt - payload.issuedAt > STAFFORDOS_OPERATOR_CANONICAL_ENTRY_TTL_SECONDS || typeof payload.nonce !== "string" || !/^[A-Za-z0-9_-]{22}$/.test(payload.nonce)) return null;
    const returnTo = validateStaffordOsOperatorReturnPath(payload.returnTo);
    return returnTo === null && payload.returnTo !== "" ? null : { returnTo, expiresAt: payload.expiresAt };
  } catch { return null; }
}

export function browserBindingCookieOptions(config: StaffordOsOperatorAuthConfig, maxAge = STAFFORDOS_OPERATOR_BROWSER_BINDING_TTL_SECONDS) {
  return sessionCookieOptions(config, maxAge);
}

function readCookie(header: string | null | undefined, name: string) {
  for (const part of String(header || "").split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key !== name) continue;
    try {
      return decodeURIComponent(value.join("="));
    } catch {
      return "";
    }
  }
  return "";
}

export function readStaffordOsOperatorBrowserBindingCookie(header: string | null | undefined) {
  return readCookie(header, STAFFORDOS_OPERATOR_BROWSER_BINDING_COOKIE);
}

function validateStaffordOsOperatorIssuerBaseUrl(value: string | null | undefined) {
  const raw = text(value);
  if (!raw) return false;
  try {
    const url = new URL(raw);
    const loopback = ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname.toLowerCase());
    return !url.username && !url.password && !url.search && !url.hash &&
      (url.protocol === "https:" || (url.protocol === "http:" && loopback));
  } catch {
    return false;
  }
}

export function resolveStaffordOsOperatorReturnPath(
  explicitReturnTo: string | null | undefined,
  referer: string | null | undefined,
  trustedOrigin: string,
) {
  if (explicitReturnTo !== null && explicitReturnTo !== undefined) {
    return validateStaffordOsOperatorReturnPath(explicitReturnTo);
  }

  const rawReferer = text(referer);
  if (!rawReferer) return null;

  try {
    const refererUrl = new URL(rawReferer);
    return validateStaffordOsOperatorReturnPath(`${refererUrl.pathname}${refererUrl.search}`);
  } catch {
    return null;
  }
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

function sessionKey(secret: string) {
  return crypto.createHash("sha256").update("staffordos.operator.session.v1\0").update(secret).digest();
}

function encryptSession(session: StaffordOsOperatorSession, secret: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", sessionKey(secret), iv);
  cipher.setAAD(SESSION_COOKIE_AAD);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(session), "utf8"), cipher.final()]);
  return [
    SESSION_COOKIE_VERSION,
    base64Url(iv),
    base64Url(cipher.getAuthTag()),
    base64Url(ciphertext),
  ].join(".");
}

function decryptSession(cookieValue: string, secret: string): StaffordOsOperatorSession | null {
  const parts = text(cookieValue).split(".");
  if (parts.length !== 4 || parts[0] !== SESSION_COOKIE_VERSION) return null;

  try {
    const iv = base64UrlDecode(parts[1]);
    const tag = base64UrlDecode(parts[2]);
    const ciphertext = base64UrlDecode(parts[3]);
    if (iv.length !== 12 || tag.length !== 16 || ciphertext.length === 0) return null;

    const decipher = crypto.createDecipheriv("aes-256-gcm", sessionKey(secret), iv);
    decipher.setAAD(SESSION_COOKIE_AAD);
    decipher.setAuthTag(tag);
    const parsed = JSON.parse(Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8"));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    if (
      typeof parsed.id !== "string" ||
      typeof parsed.subject !== "string" ||
      typeof parsed.issuer !== "string" ||
      typeof parsed.audience !== "string" ||
      !Array.isArray(parsed.roles) ||
      !Array.isArray(parsed.permissions) ||
      typeof parsed.jwtId !== "string" ||
      typeof parsed.issuedAt !== "number" ||
      typeof parsed.expiresAt !== "number" ||
      !Number.isFinite(parsed.issuedAt) ||
      !Number.isFinite(parsed.expiresAt) ||
      parsed.roles.some((role: unknown) => typeof role !== "string") ||
      parsed.permissions.some((permission: unknown) => typeof permission !== "string")
    ) return null;
    return parsed as StaffordOsOperatorSession;
  } catch {
    return null;
  }
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
  const frontendHandoffUrl = text(env.STAFFORDOS_OPERATOR_FRONTEND_HANDOFF_URL);
  const handoffSharedSecret = typeof env.STAFFORDOS_OPERATOR_HANDOFF_SHARED_SECRET === "string"
    ? env.STAFFORDOS_OPERATOR_HANDOFF_SHARED_SECRET
    : "";
  const frontend = validateStaffordOsOperatorFrontendHandoffUrl(frontendHandoffUrl);
  return {
    issuer: text(env.STAFFORDOS_OPERATOR_JWT_ISSUER),
    audience: text(env.STAFFORDOS_OPERATOR_JWT_AUDIENCE),
    allowedSubjects: csv(env.STAFFORDOS_OPERATOR_ALLOWED_SUBJECTS),
    issuerBaseUrl,
    frontendHandoffUrl,
    frontendOrigin: frontend?.origin || "",
    handoffSharedSecret,
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
    ["issuerBaseUrl", validateStaffordOsOperatorIssuerBaseUrl(config.issuerBaseUrl) ? config.issuerBaseUrl : ""],
    ["frontendHandoffUrl", config.frontendHandoffUrl],
    ["handoffSharedSecret", isCanonicalStaffordOsOperatorHandoffSecret(config.handoffSharedSecret) ? config.handoffSharedSecret : ""],
  ]
    .filter(([, value]) => !text(value))
    .map(([key]) => key);

  if (!config.publicKeyPem && !config.publicKeyUrl) missing.push("publicKeyUrl");
  if (!validateStaffordOsOperatorFrontendHandoffUrl(config.frontendHandoffUrl)) missing.push("frontendHandoffUrl");
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

  return {
    session,
    cookieValue: encryptSession(session, config.sessionSecret),
    cookieOptions: sessionCookieOptions(config, Math.max(0, expiresAt - nowSeconds)),
  };
}

export function resolveStaffordOsOperatorSession(
  cookieValue: string,
  config: StaffordOsOperatorAuthConfig,
  now = new Date(),
): OperatorAuthorizationResult {
  validateOperatorSessionConfig(config);
  if (!text(cookieValue)) return { ok: false, status: 401, error: "OPERATOR_SESSION_MISSING" };

  const session = decryptSession(cookieValue, config.sessionSecret);
  if (!session) return { ok: false, status: 401, error: "OPERATOR_SESSION_INVALID" };
  if (session.issuer !== config.issuer || session.audience !== config.audience || !config.allowedSubjects.includes(session.subject)) {
    return { ok: false, status: 401, error: "OPERATOR_SESSION_INVALID" };
  }

  const nowSeconds = Math.floor(now.getTime() / 1000);
  if (session.expiresAt <= nowSeconds) {
    return { ok: false, status: 401, error: "OPERATOR_SESSION_EXPIRED" };
  }

  return { ok: true, status: 200, session };
}

export function destroyStaffordOsOperatorSession(cookieValue: string, config: StaffordOsOperatorAuthConfig) {
  validateOperatorSessionConfig(config);
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
  browserVerifier: string,
  fetchImpl: typeof fetch = fetch,
) {
  validateOperatorAuthConfig(config);
  const url = new URL("/auth/staffordos/handoff", config.issuerBaseUrl);
  url.searchParams.set("code", code);
  const response = await fetchImpl(url.toString(), {
    method: "GET",
    headers: {
      Accept: "application/json",
      "X-StaffordOS-Handoff-Secret": config.handoffSharedSecret,
      "X-StaffordOS-Browser-Verifier": browserVerifier,
    },
    cache: "no-store",
    redirect: "error",
  });
  const body = await response.json().catch(() => ({}));
  const assertion = text((body as Record<string, unknown>).assertion);
  if (!response.ok || !assertion) throw new Error("STAFFORDOS_OPERATOR_HANDOFF_REDEEM_FAILED");
  return {
    assertion,
    returnTo: text((body as Record<string, unknown>).return_to),
  };
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
