import crypto from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export const STAFFORDOS_OPERATOR_PERMISSIONS = Object.freeze({
  AUDIT_READ: "shopifixer.audit.read",
  SCOPE_READ: "shopifixer.scope.read",
  APPROVAL_READ: "shopifixer.approval.read",
  PACKET_READ: "shopifixer.packet.read",
  EXECUTION_AUTHORIZATION_REQUEST: "shopifixer.execution.authorization.request",
  EXECUTION_AUTHORIZATION_REVOKE: "shopifixer.execution.authorization.revoke",
  CAREEROS_BETA_OPERATIONS_READ: "careeros.beta.operations.read",
  OPERATOR_MANAGE: "shopifixer.operator.manage",
});

export const STAFFORDOS_OPERATOR_ROLE_PERMISSIONS = Object.freeze({
  viewer: Object.freeze([
    STAFFORDOS_OPERATOR_PERMISSIONS.AUDIT_READ,
    STAFFORDOS_OPERATOR_PERMISSIONS.SCOPE_READ,
    STAFFORDOS_OPERATOR_PERMISSIONS.APPROVAL_READ,
    STAFFORDOS_OPERATOR_PERMISSIONS.PACKET_READ,
  ]),
  reviewer: Object.freeze([
    STAFFORDOS_OPERATOR_PERMISSIONS.AUDIT_READ,
    STAFFORDOS_OPERATOR_PERMISSIONS.SCOPE_READ,
    STAFFORDOS_OPERATOR_PERMISSIONS.APPROVAL_READ,
    STAFFORDOS_OPERATOR_PERMISSIONS.PACKET_READ,
  ]),
  execution_authorizer: Object.freeze([
    STAFFORDOS_OPERATOR_PERMISSIONS.AUDIT_READ,
    STAFFORDOS_OPERATOR_PERMISSIONS.SCOPE_READ,
    STAFFORDOS_OPERATOR_PERMISSIONS.APPROVAL_READ,
    STAFFORDOS_OPERATOR_PERMISSIONS.PACKET_READ,
    STAFFORDOS_OPERATOR_PERMISSIONS.EXECUTION_AUTHORIZATION_REQUEST,
    STAFFORDOS_OPERATOR_PERMISSIONS.EXECUTION_AUTHORIZATION_REVOKE,
  ]),
  careeros_beta_operations_viewer: Object.freeze([
    STAFFORDOS_OPERATOR_PERMISSIONS.CAREEROS_BETA_OPERATIONS_READ,
  ]),
  administrator: Object.freeze(Object.values(STAFFORDOS_OPERATOR_PERMISSIONS)),
});

export class IssuerError extends Error {
  constructor(code, status = 400, details = {}) {
    super(code);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function cleanString(value = "") {
  return String(value || "").trim();
}

export function cleanLower(value = "") {
  return cleanString(value).toLowerCase();
}

export function csv(value = "") {
  return cleanString(value)
    .split(",")
    .map((item) => cleanString(item))
    .filter(Boolean);
}

export function boolValue(value) {
  if (value === true) return true;
  return ["1", "true", "yes", "on"].includes(cleanLower(value));
}

export function base64Url(input) {
  const buffer = Buffer.isBuffer(input) ? input : Buffer.from(String(input), "utf8");
  return buffer.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

export function base64UrlDecode(value) {
  const text = cleanString(value);
  const padded = `${text}${"=".repeat((4 - (text.length % 4)) % 4)}`;
  return Buffer.from(padded.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

export function stableStringify(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  return `{${Object.keys(value)
    .sort()
    .filter((key) => value[key] !== undefined)
    .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
    .join(",")}}`;
}

export function sha256Hex(input) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function unique(values = []) {
  return Array.from(new Set(values.filter(Boolean))).sort();
}

function normalizeRoles(roles = []) {
  return unique(roles.map(cleanLower)).filter((role) =>
    Object.prototype.hasOwnProperty.call(STAFFORDOS_OPERATOR_ROLE_PERMISSIONS, role),
  );
}

function derivePermissions(roles = []) {
  return unique(roles.flatMap((role) => STAFFORDOS_OPERATOR_ROLE_PERMISSIONS[role] || []));
}

function requireConfigValue(config, key) {
  const value = cleanString(config[key]);
  if (!value) throw new IssuerError(`missing_config_${key}`, 500);
  return value;
}

export function configFromEnv(env = process.env) {
  const roles = normalizeRoles(csv(env.STAFFORDOS_OPERATOR_ROLES || "viewer"));
  return {
    googleClientId: cleanString(env.GOOGLE_CLIENT_ID),
    googleClientSecret: cleanString(env.GOOGLE_CLIENT_SECRET),
    googleRedirectUri: cleanString(env.GOOGLE_REDIRECT_URI),
    googleIssuer: cleanString(env.GOOGLE_ISSUER || "https://accounts.google.com"),
    googleAudience: cleanString(env.GOOGLE_AUDIENCE || env.GOOGLE_CLIENT_ID),
    googleTokenEndpoint: cleanString(env.GOOGLE_TOKEN_ENDPOINT || "https://oauth2.googleapis.com/token"),
    googleJwksUri: cleanString(env.GOOGLE_JWKS_URI || "https://www.googleapis.com/oauth2/v3/certs"),
    staffordosIssuer: cleanString(env.STAFFORDOS_OPERATOR_JWT_ISSUER),
    staffordosAudience: cleanString(env.STAFFORDOS_OPERATOR_JWT_AUDIENCE),
    sessionSecret: cleanString(env.ISSUER_SESSION_SECRET),
    assertionTtlSeconds: Math.max(60, Math.min(900, Number(env.STAFFORDOS_ASSERTION_TTL_SECONDS || 300))),
    stateTtlSeconds: Math.max(60, Math.min(900, Number(env.OAUTH_STATE_TTL_SECONDS || 600))),
    allowedSubjects: csv(env.STAFFORDOS_OPERATOR_ALLOWED_SUBJECTS),
    allowedEmails: csv(env.STAFFORDOS_OPERATOR_ALLOWED_EMAILS).map(cleanLower),
    operatorRoles: roles.length ? roles : ["viewer"],
    operatorPermissions: unique([...derivePermissions(roles.length ? roles : ["viewer"]), ...csv(env.STAFFORDOS_OPERATOR_PERMISSIONS)]),
    kmsProject: cleanString(env.KMS_PROJECT),
    kmsLocation: cleanString(env.KMS_LOCATION),
    kmsKeyRing: cleanString(env.KMS_KEY_RING),
    kmsKey: cleanString(env.KMS_KEY),
    kmsKeyVersion: cleanString(env.KMS_KEY_VERSION || "1"),
    kmsAccessToken: cleanString(env.KMS_ACCESS_TOKEN),
    kmsImpersonateServiceAccount: cleanString(env.KMS_IMPERSONATE_SERVICE_ACCOUNT),
    kmsUseGcloudAuth: boolValue(env.KMS_USE_GCLOUD_AUTH),
    frontendHandoffUrl: cleanString(env.STAFFORDOS_OPERATOR_FRONTEND_HANDOFF_URL),
    port: Number(env.PORT || 8787),
  };
}

export function validateFrontendHandoffUrl(config) {
  const rawUrl = cleanString(config.frontendHandoffUrl);
  if (!rawUrl) return "";

  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new IssuerError("frontend_handoff_url_invalid", 500);
  }

  if (url.protocol !== "http:") {
    throw new IssuerError("frontend_handoff_url_not_local", 500);
  }

  const hostname = cleanLower(url.hostname);
  if (hostname !== "127.0.0.1" && hostname !== "localhost" && hostname !== "::1") {
    throw new IssuerError("frontend_handoff_url_not_local", 500);
  }

  return url.toString();
}

export function validateRuntimeConfig(config) {
  for (const key of [
    "googleClientId",
    "googleClientSecret",
    "googleRedirectUri",
    "googleIssuer",
    "googleAudience",
    "staffordosIssuer",
    "staffordosAudience",
    "sessionSecret",
    "kmsProject",
    "kmsLocation",
    "kmsKeyRing",
    "kmsKey",
  ]) {
    requireConfigValue(config, key);
  }
  if (!config.allowedSubjects.length) {
    throw new IssuerError("operator_subject_allowlist_missing", 500);
  }
  validateFrontendHandoffUrl(config);
  return config;
}

export function kmsVersionName(config) {
  return [
    `projects/${requireConfigValue(config, "kmsProject")}`,
    `locations/${requireConfigValue(config, "kmsLocation")}`,
    `keyRings/${requireConfigValue(config, "kmsKeyRing")}`,
    `cryptoKeys/${requireConfigValue(config, "kmsKey")}`,
    `cryptoKeyVersions/${cleanString(config.kmsKeyVersion || "1")}`,
  ].join("/");
}

export function kmsKid(config) {
  return cleanString(config.kmsKid || `${config.kmsKey}:${config.kmsKeyVersion || "1"}`);
}

export function parseCookies(header = "") {
  const cookies = {};
  for (const part of String(header || "").split(";")) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    cookies[part.slice(0, index).trim()] = decodeURIComponent(part.slice(index + 1).trim());
  }
  return cookies;
}

function hmacSha256(value, secret) {
  return crypto.createHmac("sha256", secret).update(value).digest();
}

export function signStateCookie(payload, secret) {
  const encoded = base64Url(stableStringify(payload));
  return `${encoded}.${base64Url(hmacSha256(encoded, secret))}`;
}

export function verifyStateCookie(cookieValue, secret, now = new Date()) {
  const [encoded, signature] = cleanString(cookieValue).split(".");
  if (!encoded || !signature) throw new IssuerError("oauth_state_cookie_missing", 401);
  const expected = base64Url(hmacSha256(encoded, secret));
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !crypto.timingSafeEqual(left, right)) {
    throw new IssuerError("oauth_state_cookie_invalid", 401);
  }
  const payload = JSON.parse(base64UrlDecode(encoded).toString("utf8"));
  if (!payload.state || !payload.nonce || !payload.expiresAt) {
    throw new IssuerError("oauth_state_cookie_invalid", 401);
  }
  if (new Date(payload.expiresAt).getTime() <= now.getTime()) {
    throw new IssuerError("oauth_state_expired", 401);
  }
  return payload;
}

export function createLoginResponse(config, now = new Date()) {
  validateRuntimeConfig(config);
  const state = base64Url(crypto.randomBytes(24));
  const nonce = base64Url(crypto.randomBytes(24));
  const expiresAt = new Date(now.getTime() + config.stateTtlSeconds * 1000).toISOString();
  const stateCookie = signStateCookie({ state, nonce, issuedAt: now.toISOString(), expiresAt }, config.sessionSecret);
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", config.googleClientId);
  url.searchParams.set("redirect_uri", config.googleRedirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("nonce", nonce);
  url.searchParams.set("prompt", "select_account");

  return {
    status: 302,
    location: url.toString(),
    state,
    nonce,
    headers: {
      "Location": url.toString(),
      "Set-Cookie": [
        `staffordos_oauth_state=${encodeURIComponent(stateCookie)}`,
        "HttpOnly",
        "SameSite=Lax",
        "Path=/",
        `Max-Age=${config.stateTtlSeconds}`,
        config.googleRedirectUri.startsWith("https://") ? "Secure" : "",
      ]
        .filter(Boolean)
        .join("; "),
      "Cache-Control": "no-store",
    },
  };
}

export async function exchangeCodeForTokens(code, config, fetchImpl = fetch) {
  const body = new URLSearchParams();
  body.set("code", code);
  body.set("client_id", config.googleClientId);
  body.set("client_secret", config.googleClientSecret);
  body.set("redirect_uri", config.googleRedirectUri);
  body.set("grant_type", "authorization_code");
  const response = await fetchImpl(config.googleTokenEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new IssuerError("google_token_exchange_failed", 401);
  if (!cleanString(json.id_token)) throw new IssuerError("google_id_token_missing", 401);
  return json;
}

function parseJwt(token) {
  const parts = cleanString(token).split(".");
  if (parts.length !== 3) throw new IssuerError("jwt_malformed", 401);
  return {
    parts,
    header: JSON.parse(base64UrlDecode(parts[0]).toString("utf8")),
    payload: JSON.parse(base64UrlDecode(parts[1]).toString("utf8")),
    signingInput: Buffer.from(`${parts[0]}.${parts[1]}`, "utf8"),
    signature: base64UrlDecode(parts[2]),
  };
}

export async function fetchGoogleJwks(config, fetchImpl = fetch) {
  const response = await fetchImpl(config.googleJwksUri, { headers: { Accept: "application/json" } });
  const json = await response.json().catch(() => ({}));
  if (!response.ok || !Array.isArray(json.keys)) throw new IssuerError("google_jwks_unavailable", 503);
  return json;
}

export async function verifyGoogleIdToken(idToken, config, options = {}) {
  const now = options.now || new Date();
  const jwt = parseJwt(idToken);
  if (jwt.header.alg !== "RS256") throw new IssuerError("google_id_token_algorithm_rejected", 401);
  if (!cleanString(jwt.header.kid)) throw new IssuerError("google_id_token_kid_missing", 401);

  const jwks = options.jwks || (await (options.jwksProvider || fetchGoogleJwks)(config, options.fetchImpl || fetch));
  const jwk = jwks.keys.find((key) => key.kid === jwt.header.kid);
  if (!jwk) throw new IssuerError("google_id_token_key_not_found", 401);
  const publicKey = crypto.createPublicKey({ key: jwk, format: "jwk" });
  const verified = crypto.verify("RSA-SHA256", jwt.signingInput, publicKey, jwt.signature);
  if (!verified) throw new IssuerError("google_id_token_signature_invalid", 401);

  const nowSeconds = Math.floor(now.getTime() / 1000);
  const skewSeconds = 60;
  const aud = Array.isArray(jwt.payload.aud) ? jwt.payload.aud : [jwt.payload.aud];
  if (cleanString(jwt.payload.iss) !== config.googleIssuer) throw new IssuerError("google_id_token_issuer_invalid", 401);
  if (!aud.map(cleanString).includes(config.googleAudience)) throw new IssuerError("google_id_token_audience_invalid", 401);
  if (!cleanString(jwt.payload.sub)) throw new IssuerError("google_id_token_subject_missing", 401);
  if (jwt.payload.email_verified !== true) throw new IssuerError("google_id_token_email_unverified", 401);
  if (!cleanString(jwt.payload.email)) throw new IssuerError("google_id_token_email_missing", 401);
  if (!Number.isFinite(Number(jwt.payload.exp)) || Number(jwt.payload.exp) <= nowSeconds) {
    throw new IssuerError("google_id_token_expired", 401);
  }
  if (!Number.isFinite(Number(jwt.payload.iat)) || Number(jwt.payload.iat) > nowSeconds + skewSeconds) {
    throw new IssuerError("google_id_token_iat_invalid", 401);
  }
  if (options.expectedNonce && cleanString(jwt.payload.nonce) !== cleanString(options.expectedNonce)) {
    throw new IssuerError("google_id_token_nonce_invalid", 401);
  }
  return jwt.payload;
}

export function assertOperatorAllowed(googleClaims, config) {
  const subject = cleanString(googleClaims.sub);
  const email = cleanLower(googleClaims.email);
  if (!config.allowedSubjects.includes(subject)) {
    throw new IssuerError("operator_subject_not_allowlisted", 403);
  }
  if (config.allowedEmails.length && !config.allowedEmails.includes(email)) {
    throw new IssuerError("operator_email_not_allowlisted", 403);
  }
}

export function buildOperatorAssertionPayload(googleClaims, config, now = new Date()) {
  assertOperatorAllowed(googleClaims, config);
  const issuedAt = Math.floor(now.getTime() / 1000);
  const expiresAt = issuedAt + config.assertionTtlSeconds;
  const jwtId = crypto.randomUUID();
  const sessionId = `staffordos_operator_session_${sha256Hex(
    stableStringify({ issuer: config.googleIssuer, subject: googleClaims.sub, jti: jwtId }),
  ).slice(0, 24)}`;
  return {
    iss: config.staffordosIssuer,
    aud: config.staffordosAudience,
    sub: cleanString(googleClaims.sub),
    iat: issuedAt,
    exp: expiresAt,
    jti: jwtId,
    email: cleanLower(googleClaims.email),
    email_verified: true,
    provider: "google_oidc",
    operator: {
      identity_provider: config.googleIssuer,
      external_subject: cleanString(googleClaims.sub),
      email: cleanLower(googleClaims.email),
      email_verified: true,
      display_name: cleanString(googleClaims.name || googleClaims.email),
    },
    roles: config.operatorRoles,
    permissions: config.operatorPermissions,
    session_id: sessionId,
    kid: kmsKid(config),
  };
}

export async function buildAndSignStaffordosJwt(googleClaims, config, signer, now = new Date()) {
  const header = {
    alg: "EdDSA",
    typ: "JWT",
    kid: signer.kid || kmsKid(config),
  };
  const payload = buildOperatorAssertionPayload(googleClaims, config, now);
  const signingInput = `${base64Url(stableStringify(header))}.${base64Url(stableStringify(payload))}`;
  const signature = await signer.sign(Buffer.from(signingInput, "utf8"));
  return {
    jwt: `${signingInput}.${base64Url(signature)}`,
    header,
    payload,
    signatureSha256: sha256Hex(signature),
  };
}

export async function completeOAuthCallback({ code, state, stateCookie, config, signer, deps = {}, now = new Date() }) {
  validateRuntimeConfig(config);
  if (!cleanString(code)) throw new IssuerError("oauth_code_missing", 400);
  const statePayload = verifyStateCookie(stateCookie, config.sessionSecret, now);
  if (cleanString(state) !== statePayload.state) throw new IssuerError("oauth_state_mismatch", 401);
  const tokens = await (deps.tokenExchanger || exchangeCodeForTokens)(code, config, deps.fetchImpl || fetch);
  const googleClaims = await verifyGoogleIdToken(tokens.id_token, config, {
    now,
    expectedNonce: statePayload.nonce,
    jwks: deps.googleJwks,
    jwksProvider: deps.jwksProvider,
    fetchImpl: deps.fetchImpl,
  });
  return buildAndSignStaffordosJwt(googleClaims, config, signer, now);
}

async function gcloudAccessToken(config) {
  const args = ["auth", "print-access-token"];
  if (config.kmsImpersonateServiceAccount) {
    args.push(`--impersonate-service-account=${config.kmsImpersonateServiceAccount}`);
  }
  const { stdout } = await execFileAsync("gcloud", args, {
    encoding: "utf8",
    maxBuffer: 1024 * 1024,
  });
  const token = cleanString(stdout);
  if (!token) throw new IssuerError("gcloud_access_token_missing", 503);
  return token;
}

async function metadataAccessToken(fetchImpl = fetch) {
  const response = await fetchImpl("http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token", {
    headers: { "Metadata-Flavor": "Google" },
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok || !cleanString(json.access_token)) throw new IssuerError("metadata_access_token_unavailable", 503);
  return json.access_token;
}

export class CloudKmsJwtSigner {
  constructor(config, deps = {}) {
    this.config = config;
    this.fetchImpl = deps.fetchImpl || fetch;
    this.accessTokenProvider = deps.accessTokenProvider;
    this.versionName = kmsVersionName(config);
    this.kid = kmsKid(config);
  }

  async accessToken() {
    if (this.accessTokenProvider) return this.accessTokenProvider();
    if (this.config.kmsAccessToken) return this.config.kmsAccessToken;
    if (this.config.kmsUseGcloudAuth) return gcloudAccessToken(this.config);
    return metadataAccessToken(this.fetchImpl);
  }

  async sign(signingInput) {
    const token = await this.accessToken();
    const response = await this.fetchImpl(`https://cloudkms.googleapis.com/v1/${this.versionName}:asymmetricSign`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ data: Buffer.from(signingInput).toString("base64") }),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok || !cleanString(json.signature)) throw new IssuerError("kms_asymmetric_sign_failed", 502);
    return Buffer.from(json.signature, "base64");
  }

  async publicKeyPem() {
    const token = await this.accessToken();
    const response = await this.fetchImpl(`https://cloudkms.googleapis.com/v1/${this.versionName}/publicKey`, {
      headers: { "Authorization": `Bearer ${token}` },
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok || !cleanString(json.pem)) throw new IssuerError("kms_public_key_unavailable", 502);
    return json.pem;
  }
}

export function verifyStaffordosJwt(jwt, publicKeyPem, config, now = new Date()) {
  const parsed = parseJwt(jwt);
  if (parsed.header.alg !== "EdDSA") throw new IssuerError("staffordos_jwt_algorithm_rejected", 401);
  const ok = crypto.verify(null, parsed.signingInput, crypto.createPublicKey(publicKeyPem), parsed.signature);
  if (!ok) throw new IssuerError("staffordos_jwt_signature_invalid", 401);
  const nowSeconds = Math.floor(now.getTime() / 1000);
  const aud = Array.isArray(parsed.payload.aud) ? parsed.payload.aud : [parsed.payload.aud];
  if (parsed.payload.iss !== config.staffordosIssuer) throw new IssuerError("staffordos_jwt_issuer_invalid", 401);
  if (!aud.includes(config.staffordosAudience)) throw new IssuerError("staffordos_jwt_audience_invalid", 401);
  if (!parsed.payload.sub) throw new IssuerError("staffordos_jwt_subject_missing", 401);
  if (!parsed.payload.jti) throw new IssuerError("staffordos_jwt_jti_missing", 401);
  if (!Number.isFinite(Number(parsed.payload.exp)) || Number(parsed.payload.exp) <= nowSeconds) {
    throw new IssuerError("staffordos_jwt_expired", 401);
  }
  return parsed.payload;
}
