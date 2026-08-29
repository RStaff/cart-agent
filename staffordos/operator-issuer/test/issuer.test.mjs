import assert from "node:assert/strict";
import crypto from "node:crypto";
import test from "node:test";
import { createIssuerServer } from "../src/server.mjs";
import {
  IssuerError,
  STAFFORDOS_OPERATOR_PERMISSIONS,
  base64Url,
  base64UrlDecode,
  buildAndSignStaffordosJwt,
  completeOAuthCallback,
  configFromEnv,
  createLoginResponse,
  sha256Hex,
  stableStringify,
  validateFrontendHandoffUrl,
  verifyStaffordosJwt,
} from "../src/issuer.mjs";

class LocalEd25519Signer {
  constructor(keyPair = crypto.generateKeyPairSync("ed25519"), kid = "local-test-key:1") {
    this.keyPair = keyPair;
    this.kid = kid;
  }

  async sign(signingInput) {
    return crypto.sign(null, Buffer.from(signingInput), this.keyPair.privateKey);
  }

  async publicKeyPem() {
    return this.keyPair.publicKey.export({ type: "spki", format: "pem" });
  }
}

function testConfig(overrides = {}) {
  return {
    googleClientId: "google-client-test",
    googleClientSecret: "test-secret-not-used-outside-test",
    googleRedirectUri: "http://127.0.0.1:8787/auth/google/callback",
    googleIssuer: "https://accounts.google.com",
    googleAudience: "google-client-test",
    googleTokenEndpoint: "https://oauth2.googleapis.com/token",
    googleJwksUri: "https://www.googleapis.com/oauth2/v3/certs",
    staffordosIssuer: "https://local.staffordos-operator.test",
    staffordosAudience: "staffordos.operator.local-test",
    sessionSecret: "test-session-secret",
    assertionTtlSeconds: 300,
    stateTtlSeconds: 600,
    allowedSubjects: ["google-subject-1"],
    allowedEmails: ["operator@example.test"],
    operatorRoles: ["viewer"],
    operatorPermissions: ["shopifixer.audit.read", "shopifixer.scope.read", "shopifixer.approval.read", "shopifixer.packet.read"],
    kmsProject: "staffordos-identity-prod",
    kmsLocation: "us-east1",
    kmsKeyRing: "staffordos-operator-issuer-prod",
    kmsKey: "staffordos-operator-ed25519-signing",
    kmsKeyVersion: "1",
    ...overrides,
  };
}

function createGoogleFixture() {
  const keyPair = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
  const jwk = keyPair.publicKey.export({ format: "jwk" });
  jwk.kid = "google-test-key";
  jwk.alg = "RS256";
  jwk.use = "sig";
  function signGoogleIdToken(payload = {}) {
    const header = { alg: "RS256", typ: "JWT", kid: jwk.kid };
    const body = {
      iss: "https://accounts.google.com",
      aud: "google-client-test",
      sub: "google-subject-1",
      email: "operator@example.test",
      email_verified: true,
      name: "Test Operator",
      iat: 1785369600,
      exp: 1785369900,
      nonce: "nonce",
      ...payload,
    };
    const signingInput = `${base64Url(stableStringify(header))}.${base64Url(stableStringify(body))}`;
    const signature = crypto.sign("RSA-SHA256", Buffer.from(signingInput), keyPair.privateKey);
    return `${signingInput}.${base64Url(signature)}`;
  }
  return { jwks: { keys: [jwk] }, signGoogleIdToken };
}

function cookieValue(setCookie) {
  return String(setCookie).split(";")[0].split("=").slice(1).join("=");
}

function invokeServer(server, { method = "GET", path = "/", cookie = "", remoteAddress = "127.0.0.1" } = {}) {
  const listener = server.listeners("request")[0];
  return new Promise((resolve, reject) => {
    const req = {
      method,
      url: path,
      headers: cookie ? { cookie } : {},
      socket: { remoteAddress },
    };
    const chunks = [];
    const res = {
      statusCode: 0,
      headers: {},
      writeHead(status, headers = {}) {
        this.statusCode = status;
        this.headers = headers;
      },
      end(chunk = "") {
        if (chunk) chunks.push(Buffer.from(chunk));
        resolve({
          status: this.statusCode,
          headers: this.headers,
          body: Buffer.concat(chunks).toString("utf8"),
        });
      },
    };
    Promise.resolve(listener(req, res)).catch(reject);
  });
}

test("login endpoint contract produces Google OAuth redirect with state and nonce", () => {
  const login = createLoginResponse(testConfig(), new Date("2026-07-30T00:00:00.000Z"));
  const location = new URL(login.location);
  assert.equal(login.status, 302);
  assert.equal(location.origin, "https://accounts.google.com");
  assert.equal(location.pathname, "/o/oauth2/v2/auth");
  assert.equal(location.searchParams.get("client_id"), "google-client-test");
  assert.equal(location.searchParams.get("redirect_uri"), "http://127.0.0.1:8787/auth/google/callback");
  assert.equal(location.searchParams.get("response_type"), "code");
  assert.equal(location.searchParams.get("scope"), "openid email profile");
  assert.ok(location.searchParams.get("state"));
  assert.ok(location.searchParams.get("nonce"));
  assert.match(login.headers["Set-Cookie"], /HttpOnly/);
});

test("CareerOS beta operations role grants only the narrow operations read permission", () => {
  const config = configFromEnv({
    GOOGLE_CLIENT_ID: "google-client-test",
    GOOGLE_CLIENT_SECRET: "test-secret-not-used-outside-test",
    GOOGLE_REDIRECT_URI: "http://127.0.0.1:8787/auth/google/callback",
    STAFFORDOS_OPERATOR_JWT_ISSUER: "https://staffordos-operator.staffordmedia.ai",
    STAFFORDOS_OPERATOR_JWT_AUDIENCE: "staffordos.operator.frontend.v1",
    ISSUER_SESSION_SECRET: "test-session-secret",
    STAFFORDOS_OPERATOR_ALLOWED_SUBJECTS: "google-subject-1",
    STAFFORDOS_OPERATOR_ROLES: "careeros_beta_operations_viewer",
    KMS_PROJECT: "staffordos-identity-prod",
    KMS_LOCATION: "us-east1",
    KMS_KEY_RING: "staffordos-operator-issuer-prod",
    KMS_KEY: "staffordos-operator-ed25519-signing",
    STAFFORDOS_OPERATOR_FRONTEND_HANDOFF_URL: "http://127.0.0.1:3000/api/operator/auth/callback",
  });

  assert.deepEqual(config.operatorRoles, ["careeros_beta_operations_viewer"]);
  assert.deepEqual(config.operatorPermissions, [STAFFORDOS_OPERATOR_PERMISSIONS.CAREEROS_BETA_OPERATIONS_READ]);
  assert.equal(validateFrontendHandoffUrl(config), "http://127.0.0.1:3000/api/operator/auth/callback");
});

test("frontend handoff URL remains local-only when configured", () => {
  assert.throws(
    () => validateFrontendHandoffUrl({ frontendHandoffUrl: "https://staffordos-operator.staffordmedia.ai/api/operator/auth/callback" }),
    (error) => error instanceof IssuerError && error.code === "frontend_handoff_url_not_local",
  );
  assert.throws(
    () => validateFrontendHandoffUrl({ frontendHandoffUrl: "http://operator.example.invalid/api/operator/auth/callback" }),
    (error) => error instanceof IssuerError && error.code === "frontend_handoff_url_not_local",
  );
});

test("callback validates Google identity and issues an EdDSA StaffordOS JWT", async () => {
  const config = testConfig();
  const signer = new LocalEd25519Signer();
  const publicKeyPem = await signer.publicKeyPem();
  const google = createGoogleFixture();
  const now = new Date("2026-07-30T00:00:00.000Z");
  const login = createLoginResponse(config, now);
  const location = new URL(login.location);
  const idToken = google.signGoogleIdToken({
    nonce: location.searchParams.get("nonce"),
  });
  const result = await completeOAuthCallback({
    code: "google-code",
    state: location.searchParams.get("state"),
    stateCookie: cookieValue(login.headers["Set-Cookie"]),
    config,
    signer,
    now,
    deps: {
      tokenExchanger: async () => ({ id_token: idToken }),
      googleJwks: google.jwks,
    },
  });
  const payload = verifyStaffordosJwt(result.jwt, publicKeyPem, config, now);
  assert.equal(result.header.alg, "EdDSA");
  assert.equal(payload.iss, config.staffordosIssuer);
  assert.equal(payload.aud, config.staffordosAudience);
  assert.equal(payload.sub, "google-subject-1");
  assert.equal(payload.email, "operator@example.test");
  assert.equal(payload.email_verified, true);
  assert.deepEqual(payload.roles, ["viewer"]);
  assert.equal(payload.operator.external_subject, "google-subject-1");
  assert.equal(payload.operator.email, "operator@example.test");
  assert.equal(payload.session_id.startsWith("staffordos_operator_session_"), true);
  assert.equal("merchant" in payload, false);
  assert.equal("packet" in payload, false);
});

test("local frontend handoff returns only an opaque code to the browser and redeems once", async () => {
  const signer = new LocalEd25519Signer();
  const publicKeyPem = await signer.publicKeyPem();
  const google = createGoogleFixture();
  let idToken = "";
  const config = testConfig({
    frontendHandoffUrl: "http://127.0.0.1:3000/api/operator/auth/callback",
  });
  const server = createIssuerServer({
    config,
    signer,
    deps: {
      tokenExchanger: async () => ({ id_token: idToken }),
      googleJwks: google.jwks,
    },
  });

  const login = await invokeServer(server, { path: "/login" });
  const loginLocation = new URL(login.headers.Location);
  const tokenIssuedAt = Math.floor(Date.now() / 1000);
  idToken = google.signGoogleIdToken({
    nonce: loginLocation.searchParams.get("nonce"),
    iat: tokenIssuedAt,
    exp: tokenIssuedAt + 300,
  });

  const callback = await invokeServer(server, {
    path: `/auth/google/callback?code=google-code&state=${loginLocation.searchParams.get("state")}`,
    cookie: `staffordos_oauth_state=${cookieValue(login.headers["Set-Cookie"])}`,
  });
  assert.equal(callback.status, 302);
  const location = new URL(callback.headers.Location);
  assert.equal(location.origin, "http://127.0.0.1:3000");
  assert.equal(location.pathname, "/api/operator/auth/callback");
  assert.ok(location.searchParams.get("code"));
  assert.equal(location.searchParams.has("assertion"), false);

  const redeem = await invokeServer(server, {
    path: `/auth/staffordos/handoff?code=${location.searchParams.get("code")}`,
  });
  const body = JSON.parse(redeem.body);
  assert.equal(redeem.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.token_type, "StaffordOS-Operator-Assertion");
  assert.ok(body.assertion);
  assert.equal(verifyStaffordosJwt(body.assertion, publicKeyPem, config, new Date()).sub, "google-subject-1");

  const secondRedeem = await invokeServer(server, {
    path: `/auth/staffordos/handoff?code=${location.searchParams.get("code")}`,
  });
  assert.equal(secondRedeem.status, 401);
});

test("issuer rejects invalid Google audience", async () => {
  const config = testConfig();
  const signer = new LocalEd25519Signer();
  const google = createGoogleFixture();
  const now = new Date("2026-07-30T00:00:00.000Z");
  const login = createLoginResponse(config, now);
  const location = new URL(login.location);
  const idToken = google.signGoogleIdToken({
    aud: "wrong-audience",
    nonce: location.searchParams.get("nonce"),
  });
  await assert.rejects(
    completeOAuthCallback({
      code: "google-code",
      state: location.searchParams.get("state"),
      stateCookie: cookieValue(login.headers["Set-Cookie"]),
      config,
      signer,
      now,
      deps: { tokenExchanger: async () => ({ id_token: idToken }), googleJwks: google.jwks },
    }),
    (error) => error instanceof IssuerError && error.code === "google_id_token_audience_invalid",
  );
});

test("issuer rejects invalid Google issuer", async () => {
  const config = testConfig();
  const signer = new LocalEd25519Signer();
  const google = createGoogleFixture();
  const now = new Date("2026-07-30T00:00:00.000Z");
  const login = createLoginResponse(config, now);
  const location = new URL(login.location);
  const idToken = google.signGoogleIdToken({
    iss: "https://issuer.example.invalid",
    nonce: location.searchParams.get("nonce"),
  });
  await assert.rejects(
    completeOAuthCallback({
      code: "google-code",
      state: location.searchParams.get("state"),
      stateCookie: cookieValue(login.headers["Set-Cookie"]),
      config,
      signer,
      now,
      deps: { tokenExchanger: async () => ({ id_token: idToken }), googleJwks: google.jwks },
    }),
    (error) => error instanceof IssuerError && error.code === "google_id_token_issuer_invalid",
  );
});

test("issuer rejects bad state, nonce, and unverified email", async () => {
  const config = testConfig();
  const signer = new LocalEd25519Signer();
  const google = createGoogleFixture();
  const now = new Date("2026-07-30T00:00:00.000Z");
  const login = createLoginResponse(config, now);
  const location = new URL(login.location);
  const idToken = google.signGoogleIdToken({ nonce: "wrong-nonce" });
  await assert.rejects(
    completeOAuthCallback({
      code: "google-code",
      state: "wrong-state",
      stateCookie: cookieValue(login.headers["Set-Cookie"]),
      config,
      signer,
      now,
      deps: { tokenExchanger: async () => ({ id_token: idToken }), googleJwks: google.jwks },
    }),
    (error) => error instanceof IssuerError && error.code === "oauth_state_mismatch",
  );

  await assert.rejects(
    completeOAuthCallback({
      code: "google-code",
      state: location.searchParams.get("state"),
      stateCookie: cookieValue(login.headers["Set-Cookie"]),
      config,
      signer,
      now,
      deps: { tokenExchanger: async () => ({ id_token: idToken }), googleJwks: google.jwks },
    }),
    (error) => error instanceof IssuerError && error.code === "google_id_token_nonce_invalid",
  );

  const unverified = google.signGoogleIdToken({
    nonce: location.searchParams.get("nonce"),
    email_verified: false,
  });
  await assert.rejects(
    completeOAuthCallback({
      code: "google-code",
      state: location.searchParams.get("state"),
      stateCookie: cookieValue(login.headers["Set-Cookie"]),
      config,
      signer,
      now,
      deps: { tokenExchanger: async () => ({ id_token: unverified }), googleJwks: google.jwks },
    }),
    (error) => error instanceof IssuerError && error.code === "google_id_token_email_unverified",
  );
});

test("StaffordOS JWT verification rejects expiration and tampering", async () => {
  const config = testConfig();
  const signer = new LocalEd25519Signer();
  const publicKeyPem = await signer.publicKeyPem();
  const now = new Date("2026-07-30T00:00:00.000Z");
  const result = await buildAndSignStaffordosJwt(
    {
      iss: config.googleIssuer,
      aud: config.googleAudience,
      sub: "google-subject-1",
      email: "operator@example.test",
      email_verified: true,
      name: "Test Operator",
    },
    config,
    signer,
    now,
  );
  assert.equal(verifyStaffordosJwt(result.jwt, publicKeyPem, config, now).sub, "google-subject-1");
  assert.throws(
    () => verifyStaffordosJwt(result.jwt, publicKeyPem, config, new Date(now.getTime() + 301000)),
    (error) => error instanceof IssuerError && error.code === "staffordos_jwt_expired",
  );

  const parts = result.jwt.split(".");
  const payload = JSON.parse(base64UrlDecode(parts[1]).toString("utf8"));
  payload.sub = "tampered-subject";
  const tampered = `${parts[0]}.${base64Url(stableStringify(payload))}.${parts[2]}`;
  assert.throws(
    () => verifyStaffordosJwt(tampered, publicKeyPem, config, now),
    (error) => error instanceof IssuerError && error.code === "staffordos_jwt_signature_invalid",
  );
  assert.match(sha256Hex(result.jwt), /^[a-f0-9]{64}$/);
});
