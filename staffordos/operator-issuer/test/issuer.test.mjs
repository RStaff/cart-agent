import assert from "node:assert/strict";
import crypto from "node:crypto";
import test, { mock } from "node:test";
import { createIssuerServer } from "../src/server.mjs";
import { createInMemoryHandoffStore, createPostgresHandoffStore } from "../src/handoffStore.mjs";
import {
  IssuerError,
  STAFFORDOS_OPERATOR_OAUTH_STATE_MAX_TTL_SECONDS,
  STAFFORDOS_OPERATOR_PERMISSIONS,
  base64Url,
  base64UrlDecode,
  buildAndSignStaffordosJwt,
  browserBindingChallenge,
  browserBindingMatches,
  completeOAuthCallback,
  configFromEnv,
  createLoginResponse,
  isCanonicalHandoffSharedSecret,
  sha256Hex,
  stableStringify,
  validateRuntimeConfig,
  validateOperatorReturnPath,
  validateFrontendHandoffUrl,
  verifyStaffordosJwt,
} from "../src/issuer.mjs";

const testHandoffSecret = base64Url(crypto.randomBytes(32));
const testBrowserVerifier = base64Url(crypto.randomBytes(32));

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
    kmsKey: "test-fixture-kms-key",
    kmsKeyVersion: "1",
    frontendHandoffUrl: "http://127.0.0.1:3000/api/operator/auth/callback",
    handoffSharedSecret: testHandoffSecret,
    browserChallenge: browserBindingChallenge(testBrowserVerifier),
    nonInteractiveAssertionMode: false,
    ...overrides,
  };
}

function nonInteractiveTestConfig(overrides = {}) {
  const config = testConfig({
    nonInteractiveAssertionMode: true,
    ...overrides,
  });
  delete config.frontendHandoffUrl;
  delete config.handoffSharedSecret;
  return config;
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

function invokeServer(server, { method = "GET", path = "/", cookie = "", remoteAddress = "127.0.0.1", headers = {} } = {}) {
  const listener = server.listeners("request")[0];
  return new Promise((resolve, reject) => {
    const req = {
      method,
      url: path,
      headers: { ...(cookie ? { cookie } : {}), ...headers },
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
  assert.equal(location.searchParams.get("browserChallenge"), null);
  assert.match(login.headers["Set-Cookie"], /HttpOnly/);
});

test("return path is restricted to internal StaffordOS routes", () => {
  assert.equal(validateOperatorReturnPath("/operator/careeros/missions/example"), "/operator/careeros/missions/example");
  assert.equal(validateOperatorReturnPath("/operator/careeros/beta-users"), "/operator/careeros/beta-users");
  assert.equal(validateOperatorReturnPath("/operator/careeros/beta-users?search=AI%20automation"), "/operator/careeros/beta-users?search=AI%20automation");
  assert.equal(validateOperatorReturnPath("/operator/careeros/missions/example?tab=technical%20details"), "/operator/careeros/missions/example?tab=technical%20details");
  assert.equal(validateOperatorReturnPath("/os/professional/jobs?filter=APPLY%5FNOW"), "/os/professional/jobs?filter=APPLY%5FNOW");
  assert.equal(validateOperatorReturnPath("/operator/products?next=https%3A%2F%2Fevil.example%2F"), "/operator/products?next=https%3A%2F%2Fevil.example%2F");
  assert.equal(validateOperatorReturnPath("/operator/products?a=1%2F2&b=3%3A4&c=5%3F6&d=7%26e%3D8&f=9%25"), "/operator/products?a=1%2F2&b=3%3A4&c=5%3F6&d=7%26e%3D8&f=9%25");
  assert.equal(validateOperatorReturnPath(""), "");
  assert.equal(validateOperatorReturnPath("https://evil.example/"), "");
  assert.equal(validateOperatorReturnPath("//evil.example/"), "");
  assert.equal(validateOperatorReturnPath("/operator/%2F%2Fevil"), "");
  assert.equal(validateOperatorReturnPath("/operator/items%2Fexample"), "");
  assert.equal(validateOperatorReturnPath("/operator/products?bad=%"), "");
  assert.equal(validateOperatorReturnPath("/operator/products?bad=%2"), "");
  assert.equal(validateOperatorReturnPath("/operator/products?bad=%GG"), "");
  assert.equal(validateOperatorReturnPath("/operator/products?bad=%00"), "");
  assert.equal(validateOperatorReturnPath("/operator/products?bad=%5C"), "");
  assert.equal(validateOperatorReturnPath("/operator/../os"), "");
  assert.equal(validateOperatorReturnPath("/operator/products#details"), "");
  for (const invalid of [
    " /operator/careeros/beta-users",
    "/operator/careeros/beta-users ",
    "\t/operator/careeros/beta-users\t",
    "\r/operator/careeros/beta-users",
    "/operator/careeros/beta-users\n",
    "/operator/careeros/beta-users\r\n",
    "/operator/careeros/beta-users\0",
    "/operator/careeros/beta-users\x1b",
    "/operator/careeros/beta-users\x7f",
    "\u00a0/operator/careeros/beta-users",
    "/operator/careeros/beta-users\u2003",
    "/operator/careeros/beta-users?search=AI automation",
  ]) assert.equal(validateOperatorReturnPath(invalid), "");
  assert.equal(validateOperatorReturnPath("/%2Foperator"), "");
  assert.equal(validateOperatorReturnPath("/career/profile"), "");
  assert.equal(validateOperatorReturnPath("javascript:alert(1)"), "");
  assert.equal(validateOperatorReturnPath("/operator\\\\evil"), "");
});

test("signed OAuth state preserves a validated return path and rejects invalid paths", () => {
  const config = testConfig();
  const valid = createLoginResponse(config, new Date("2026-07-30T00:00:00.000Z"), "/operator/careeros/missions/example?tab=technical%20details");
  const validState = new URL(valid.location).searchParams.get("state");
  assert.equal(JSON.parse(base64UrlDecode(cookieValue(valid.headers["Set-Cookie"]).split(".")[0]).toString("utf8")).returnTo, "/operator/careeros/missions/example?tab=technical%20details");
  assert.ok(validState);

  const invalid = createLoginResponse(config, new Date("2026-07-30T00:00:00.000Z"), "https://evil.example/");
  assert.equal(JSON.parse(base64UrlDecode(cookieValue(invalid.headers["Set-Cookie"]).split(".")[0]).toString("utf8")).returnTo, "");
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
    KMS_KEY: "test-fixture-kms-key",
    STAFFORDOS_OPERATOR_FRONTEND_HANDOFF_URL: "http://127.0.0.1:3000/api/operator/auth/callback",
  });

  assert.deepEqual(config.operatorRoles, ["careeros_beta_operations_viewer"]);
  assert.deepEqual(config.operatorPermissions, [STAFFORDOS_OPERATOR_PERMISSIONS.CAREEROS_BETA_OPERATIONS_READ]);
  assert.equal(validateFrontendHandoffUrl(config), "http://127.0.0.1:3000/api/operator/auth/callback");
  assert.equal(
    validateFrontendHandoffUrl({ frontendHandoffUrl: "http://[::1]:3000/api/operator/auth/callback" }),
    "http://[::1]:3000/api/operator/auth/callback",
  );
});

test("frontend handoff URL accepts production HTTPS and rejects unsafe configuration", () => {
  assert.equal(
    validateFrontendHandoffUrl({ frontendHandoffUrl: "https://staffordos-operator.staffordmedia.ai/api/operator/auth/callback" }),
    "https://staffordos-operator.staffordmedia.ai/api/operator/auth/callback",
  );
  assert.throws(
    () => validateFrontendHandoffUrl({ frontendHandoffUrl: "http://operator.example.invalid/api/operator/auth/callback" }),
    (error) => error instanceof IssuerError && error.code === "frontend_handoff_url_not_trusted",
  );
  for (const value of [
    "https://user:password@staffordos.example/api/operator/auth/callback",
    "https://staffordos.example/api/operator/auth/callback?x=1",
    "https://staffordos.example/api/operator/auth/callback#fragment",
    "https://staffordos.example/wrong-callback",
  ]) {
    assert.throws(
      () => validateFrontendHandoffUrl({ frontendHandoffUrl: value }),
      (error) => error instanceof IssuerError && error.code === "frontend_handoff_url_invalid",
    );
  }
  for (const value of [null, "", " ", "\t", "\r\n", "\0", "\u00a0", {}, [], 0, false]) {
    assert.throws(
      () => validateFrontendHandoffUrl({ frontendHandoffUrl: value }),
      (error) => error instanceof IssuerError && error.code === "frontend_handoff_url_invalid",
    );
  }
});

test("interactive issuer configuration fails closed without a handoff", () => {
  assert.throws(
    () => createLoginResponse(testConfig({ frontendHandoffUrl: "" }), new Date("2026-07-30T00:00:00.000Z")),
    (error) => error instanceof IssuerError && error.code === "frontend_handoff_url_invalid",
  );
  assert.doesNotThrow(() => createLoginResponse(nonInteractiveTestConfig(), new Date("2026-07-30T00:00:00.000Z")));
  assert.throws(
    () => validateRuntimeConfig(testConfig({ nonInteractiveAssertionMode: true })),
    (error) => error instanceof IssuerError && error.code === "authentication_modes_conflict",
  );
  assert.throws(
    () => validateRuntimeConfig(testConfig({ frontendHandoffUrl: "", handoffSharedSecret: "", nonInteractiveAssertionMode: false })),
    (error) => error instanceof IssuerError && error.code === "frontend_handoff_url_invalid",
  );
  assert.throws(
    () => validateRuntimeConfig({ ...nonInteractiveTestConfig(), handoffSharedSecret: "" }),
    (error) => error instanceof IssuerError && error.code === "handoff_secret_without_interactive_mode",
  );
  assert.throws(
    () => createIssuerServer({ config: testConfig({ handoffSharedSecret: "" }) }),
    (error) => error instanceof IssuerError && error.code === "handoff_shared_secret_required",
  );
});

test("configuration derives raw handoff-secret presence and rejects supplied values in noninteractive mode", () => {
  assert.equal(configFromEnv({}).handoffSharedSecret, undefined);
  assert.equal(configFromEnv({ STAFFORDOS_OPERATOR_HANDOFF_SHARED_SECRET: "" }).handoffSharedSecret, "");
  assert.equal(Object.prototype.hasOwnProperty.call(configFromEnv({}), "handoffSharedSecretConfigured"), false);
  assert.doesNotThrow(() => validateRuntimeConfig(nonInteractiveTestConfig()));

  const invalidSecrets = [
    "",
    " ",
    "\t",
    "\r\n",
    "\0",
    "\u0001",
    "\u007f",
    "\u00a0",
    "\u2003",
    "short",
    `${testHandoffSecret}=`,
    `${testHandoffSecret}!`,
    `${testHandoffSecret} `,
    `${testHandoffSecret}${testHandoffSecret}`,
    testHandoffSecret.slice(0, -1),
    testHandoffSecret,
    null,
    {},
    [],
    0,
    false,
  ];
  for (const value of invalidSecrets) {
    assert.throws(
      () => validateRuntimeConfig({
        ...nonInteractiveTestConfig(),
        handoffSharedSecret: value,
      }),
      (error) => error instanceof IssuerError && error.code === "handoff_secret_without_interactive_mode"
        && (typeof value !== "string" || !value || !error.message.includes(value)),
    );
  }

  assert.doesNotThrow(() => validateRuntimeConfig(testConfig({ handoffSharedSecret: testHandoffSecret })));
  for (const value of invalidSecrets.filter((value) => value !== testHandoffSecret)) {
    assert.throws(
      () => validateRuntimeConfig(testConfig({ handoffSharedSecret: value })),
      (error) => error instanceof IssuerError && error.code === "handoff_shared_secret_required"
        && (typeof value !== "string" || !value || !error.message.includes(value)),
    );
  }

  assert.throws(
    () => validateRuntimeConfig({ ...nonInteractiveTestConfig(), handoffSharedSecret: testHandoffSecret, handoffSharedSecretConfigured: false }),
    (error) => error instanceof IssuerError && error.code === "handoff_secret_without_interactive_mode",
  );
  assert.throws(
    () => validateRuntimeConfig({ ...nonInteractiveTestConfig(), handoffSharedSecret: testHandoffSecret, handoffSharedSecretConfigured: true }),
    (error) => error instanceof IssuerError && error.code === "handoff_secret_without_interactive_mode",
  );
  assert.throws(
    () => validateRuntimeConfig({ ...nonInteractiveTestConfig(), handoffSharedSecret: "short" }),
    (error) => error instanceof IssuerError && error.code === "handoff_secret_without_interactive_mode",
  );
  assert.doesNotThrow(() => validateRuntimeConfig({ ...nonInteractiveTestConfig(), handoffSharedSecretConfigured: false }));
  assert.doesNotThrow(() => validateRuntimeConfig({ ...nonInteractiveTestConfig(), handoffSharedSecretConfigured: true }));
});

test("configuration preserves supplied frontend handoff URL presence", () => {
  assert.equal(configFromEnv({}).frontendHandoffUrl, undefined);
  assert.equal(configFromEnv({ STAFFORDOS_OPERATOR_FRONTEND_HANDOFF_URL: "" }).frontendHandoffUrl, "");
  assert.equal(configFromEnv({ STAFFORDOS_OPERATOR_FRONTEND_HANDOFF_URL: " " }).frontendHandoffUrl, " ");

  for (const value of ["", " ", "\t", "\r\n", "\0", "\u00a0", "malformed"]) {
    assert.throws(
      () => validateRuntimeConfig({ ...nonInteractiveTestConfig(), frontendHandoffUrl: value }),
      (error) => error instanceof IssuerError && error.code === "frontend_handoff_url_invalid",
    );
  }
  assert.throws(
    () => validateRuntimeConfig({ ...nonInteractiveTestConfig(), frontendHandoffUrl: "https://stafford.example/api/operator/auth/callback" }),
    (error) => error instanceof IssuerError && error.code === "authentication_modes_conflict",
  );
  assert.throws(
    () => validateRuntimeConfig({ ...nonInteractiveTestConfig(), frontendHandoffUrl: " ", handoffSharedSecret: undefined }),
    (error) => error instanceof IssuerError && error.code === "frontend_handoff_url_invalid",
  );
});

test("OAuth state ceiling is the authoritative interactive transaction lifetime", () => {
  const config = configFromEnv({ OAUTH_STATE_TTL_SECONDS: "9999" });
  assert.equal(config.stateTtlSeconds, STAFFORDOS_OPERATOR_OAUTH_STATE_MAX_TTL_SECONDS);
  assert.equal(configFromEnv({ OAUTH_STATE_TTL_SECONDS: String(STAFFORDOS_OPERATOR_OAUTH_STATE_MAX_TTL_SECONDS) }).stateTtlSeconds, STAFFORDOS_OPERATOR_OAUTH_STATE_MAX_TTL_SECONDS);
});

test("handoff shared secrets require canonical 32-byte base64url", () => {
  assert.equal(isCanonicalHandoffSharedSecret(testHandoffSecret), true);
  for (const value of [
    "",
    " ",
    "short",
    `${testHandoffSecret}=`,
    `${testHandoffSecret.slice(0, -1)}!`,
    ` ${testHandoffSecret}`,
    `${testHandoffSecret} `,
    testHandoffSecret.slice(0, -1),
  ]) {
    assert.equal(isCanonicalHandoffSharedSecret(value), false);
  }
});

test("browser binding proofs require canonical verifiers and match in constant-time", () => {
  assert.equal(browserBindingMatches(testBrowserVerifier, browserBindingChallenge(testBrowserVerifier)), true);
  assert.equal(browserBindingMatches(testBrowserVerifier.slice(0, -1), browserBindingChallenge(testBrowserVerifier)), false);
  assert.equal(browserBindingMatches(`${testBrowserVerifier}=`, browserBindingChallenge(testBrowserVerifier)), false);
  assert.equal(browserBindingMatches(testBrowserVerifier, "malformed"), false);
});

test("interactive login requires a browser binding challenge", () => {
  assert.throws(
    () => createLoginResponse(testConfig({ browserChallenge: "" }), new Date("2026-07-30T00:00:00.000Z")),
    (error) => error instanceof IssuerError && error.code === "browser_binding_required",
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
      handoffStore: createInMemoryHandoffStore(),
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
      handoffStore: createInMemoryHandoffStore(),
      tokenExchanger: async () => ({ id_token: idToken }),
      googleJwks: google.jwks,
    },
  });

  const login = await invokeServer(server, { path: "/login?returnTo=%2Foperator%2Fcareeros%2Fmissions%2Fexample" });
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
    headers: {
      "x-staffordos-handoff-secret": config.handoffSharedSecret,
      "x-staffordos-browser-verifier": testBrowserVerifier,
    },
  });
  const body = JSON.parse(redeem.body);
  assert.equal(redeem.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.token_type, "StaffordOS-Operator-Assertion");
  assert.ok(body.assertion);
  assert.equal(body.return_to, "/operator/careeros/missions/example");
  assert.equal(verifyStaffordosJwt(body.assertion, publicKeyPem, config, new Date()).sub, "google-subject-1");

  const secondRedeem = await invokeServer(server, {
    path: `/auth/staffordos/handoff?code=${location.searchParams.get("code")}`,
    headers: {
      "x-staffordos-handoff-secret": config.handoffSharedSecret,
      "x-staffordos-browser-verifier": testBrowserVerifier,
    },
  });
  assert.equal(secondRedeem.status, 401);
});

test("configured HTTPS handoff accepts non-loopback callback traffic but requires service authentication for redemption", async () => {
  const signer = new LocalEd25519Signer();
  const google = createGoogleFixture();
  let idToken = "";
  const config = testConfig({ frontendHandoffUrl: "https://stafford.example/api/operator/auth/callback" });
  const server = createIssuerServer({
    config,
    signer,
    deps: { handoffStore: createInMemoryHandoffStore(), tokenExchanger: async () => ({ id_token: idToken }), googleJwks: google.jwks },
  });

  const login = await invokeServer(server, { path: "/login?returnTo=%2Foperator%2Fcareeros%2Fmissions%2Fexample" });
  const loginLocation = new URL(login.headers.Location);
  const nowSeconds = Math.floor(Date.now() / 1000);
  idToken = google.signGoogleIdToken({
    nonce: loginLocation.searchParams.get("nonce"),
    iat: nowSeconds,
    exp: nowSeconds + 300,
  });
  const callback = await invokeServer(server, {
    remoteAddress: "10.20.30.40",
    path: `/auth/google/callback?code=google-code&state=${loginLocation.searchParams.get("state")}`,
    cookie: `staffordos_oauth_state=${cookieValue(login.headers["Set-Cookie"])}`,
    headers: {
      host: "evil.example",
      "x-forwarded-host": "evil.example",
      forwarded: "host=evil.example",
      "x-forwarded-proto": "http",
    },
  });
  assert.equal(callback.status, 302);
  const callbackLocation = new URL(callback.headers.Location);
  assert.equal(callbackLocation.origin, "https://stafford.example");
  assert.equal(callbackLocation.pathname, "/api/operator/auth/callback");
  const handoffCode = callbackLocation.searchParams.get("code");
  assert.ok(handoffCode);

  const unauthorized = await invokeServer(server, {
    remoteAddress: "10.20.30.41",
    path: `/auth/staffordos/handoff?code=${handoffCode}`,
  });
  assert.equal(unauthorized.status, 401);

  const foreignBrowser = await invokeServer(server, {
    remoteAddress: "10.20.30.41",
    path: `/auth/staffordos/handoff?code=${handoffCode}`,
    headers: {
      "x-staffordos-handoff-secret": config.handoffSharedSecret,
      "x-staffordos-browser-verifier": base64Url(crypto.randomBytes(32)),
    },
  });
  assert.equal(foreignBrowser.status, 401);

  const redeemed = await invokeServer(server, {
    remoteAddress: "10.20.30.41",
    path: `/auth/staffordos/handoff?code=${handoffCode}`,
    headers: {
      "x-staffordos-handoff-secret": config.handoffSharedSecret,
      "x-staffordos-browser-verifier": testBrowserVerifier,
    },
  });
  assert.equal(redeemed.status, 200);
  assert.equal(JSON.parse(redeemed.body).return_to, "/operator/careeros/missions/example");
});

test("successful grant creation invokes bounded opportunistic cleanup", async () => {
  const signer = new LocalEd25519Signer();
  const google = createGoogleFixture();
  let idToken = "";
  let now = Date.now();
  const cleanupCalls = [];
  const handoffStore = {
    async create(grant) { return { code: grant.code, expiresAt: grant.expiresAt, returnTo: grant.returnTo }; },
    async cleanupExpired(limit, cleanupNow) { cleanupCalls.push({ limit, now: cleanupNow.getTime() }); return 0; },
  };
  const config = testConfig({ frontendHandoffUrl: "https://stafford.example/api/operator/auth/callback" });
  const server = createIssuerServer({
    config,
    signer,
    deps: { handoffStore, clock: () => now, tokenExchanger: async () => ({ id_token: idToken }), googleJwks: google.jwks },
  });

  async function completeLogin() {
    const login = await invokeServer(server, { path: "/login" });
    const loginLocation = new URL(login.headers.Location);
    idToken = google.signGoogleIdToken({
      nonce: loginLocation.searchParams.get("nonce"),
      iat: Math.floor(now / 1000),
      exp: Math.floor(now / 1000) + 300,
    });
    return invokeServer(server, {
      remoteAddress: "10.20.30.40",
      path: `/auth/google/callback?code=google-code&state=${loginLocation.searchParams.get("state")}`,
      cookie: `staffordos_oauth_state=${cookieValue(login.headers["Set-Cookie"])}`,
    });
  }

  assert.equal((await completeLogin()).status, 302);
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(cleanupCalls, [{ limit: 100, now }]);

  assert.equal((await completeLogin()).status, 302);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(cleanupCalls.length, 1);

  now += 10_000;
  assert.equal((await completeLogin()).status, 302);
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(cleanupCalls, [{ limit: 100, now: now - 10_000 }, { limit: 100, now }]);
});

test("cleanup failure is contained after successful grant creation", async () => {
  const signer = new LocalEd25519Signer();
  const google = createGoogleFixture();
  let idToken = "";
  const config = testConfig({ frontendHandoffUrl: "https://stafford.example/api/operator/auth/callback" });
  const server = createIssuerServer({
    config,
    signer,
    deps: {
      handoffStore: {
        async create(grant) { return { code: grant.code, expiresAt: grant.expiresAt, returnTo: grant.returnTo }; },
        async cleanupExpired() { throw new Error("synthetic storage failure"); },
      },
      tokenExchanger: async () => ({ id_token: idToken }),
      googleJwks: google.jwks,
    },
  });
  const login = await invokeServer(server, { path: "/login" });
  const loginLocation = new URL(login.headers.Location);
  idToken = google.signGoogleIdToken({ nonce: loginLocation.searchParams.get("nonce"), iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 300 });
  const callback = await invokeServer(server, {
    remoteAddress: "10.20.30.40",
    path: `/auth/google/callback?code=google-code&state=${loginLocation.searchParams.get("state")}`,
    cookie: `staffordos_oauth_state=${cookieValue(login.headers["Set-Cookie"])}`,
  });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(callback.status, 302);
  assert.equal(new URL(callback.headers.Location).origin, "https://stafford.example");
});

test("local HTTP handoff transport remains loopback-only", async () => {
  const signer = new LocalEd25519Signer();
  const google = createGoogleFixture();
  let idToken = "";
  const config = testConfig();
  const server = createIssuerServer({
    config,
    signer,
    deps: { handoffStore: createInMemoryHandoffStore(), tokenExchanger: async () => ({ id_token: idToken }), googleJwks: google.jwks },
  });
  const login = await invokeServer(server, { path: "/login" });
  const loginLocation = new URL(login.headers.Location);
  const nowSeconds = Math.floor(Date.now() / 1000);
  idToken = google.signGoogleIdToken({
    nonce: loginLocation.searchParams.get("nonce"),
    iat: nowSeconds,
    exp: nowSeconds + 300,
  });
  const callback = await invokeServer(server, {
    remoteAddress: "10.20.30.40",
    path: `/auth/google/callback?code=google-code&state=${loginLocation.searchParams.get("state")}`,
    cookie: `staffordos_oauth_state=${cookieValue(login.headers["Set-Cookie"])}`,
  });
  assert.equal(callback.status, 403);
  assert.match(callback.body, /staffordos_handoff_not_local/);
});

test("expired opaque handoff is rejected by the production redemption path", async () => {
  const clockStart = new Date("2026-07-30T00:00:00.000Z");
  mock.timers.enable({ apis: ["Date"], now: clockStart });
  try {
    const signer = new LocalEd25519Signer();
    const google = createGoogleFixture();
    let idToken = "";
    const server = createIssuerServer({
      config: testConfig(),
      signer,
      deps: {
        handoffStore: createInMemoryHandoffStore(),
        tokenExchanger: async () => ({ id_token: idToken }),
        googleJwks: google.jwks,
      },
    });

    const login = await invokeServer(server, { path: "/login?returnTo=%2Foperator%2Fcockpit" });
    const loginLocation = new URL(login.headers.Location);
    idToken = google.signGoogleIdToken({
      nonce: loginLocation.searchParams.get("nonce"),
      iat: Math.floor(clockStart.getTime() / 1000),
      exp: Math.floor(clockStart.getTime() / 1000) + 61,
    });

    const callback = await invokeServer(server, {
      path: `/auth/google/callback?code=google-code&state=${loginLocation.searchParams.get("state")}`,
      cookie: `staffordos_oauth_state=${cookieValue(login.headers["Set-Cookie"])}`,
    });
    assert.equal(callback.status, 302);
    const handoffCode = new URL(callback.headers.Location).searchParams.get("code");
    assert.ok(handoffCode);

    mock.timers.setTime(clockStart.getTime() + 62_000);
    const expired = await invokeServer(server, {
      path: `/auth/staffordos/handoff?code=${handoffCode}`,
      headers: {
        "x-staffordos-handoff-secret": testConfig().handoffSharedSecret,
        "x-staffordos-browser-verifier": testBrowserVerifier,
      },
    });
    assert.equal(expired.status, 401);
    assert.match(expired.body, /staffordos_handoff_code_expired/);

    const replay = await invokeServer(server, {
      path: `/auth/staffordos/handoff?code=${handoffCode}`,
      headers: {
        "x-staffordos-handoff-secret": testConfig().handoffSharedSecret,
        "x-staffordos-browser-verifier": testBrowserVerifier,
      },
    });
    assert.equal(replay.status, 401);
    assert.match(replay.body, /staffordos_handoff_code_invalid/);
  } finally {
    mock.timers.reset();
  }
});

test("postgres handoff adapter encrypts records and consumes once across adapter instances", async () => {
  const encryptionKey = base64Url(crypto.randomBytes(32));
  const rows = new Map();
  const fakePool = {
    async query(query) {
      const text = typeof query === "string" ? query : query.text;
      if (text.startsWith("INSERT")) { rows.set(query.values[0].toString("hex"), Object.fromEntries([["code_hash", query.values[0]], ["ciphertext", query.values[1]], ["auth_tag", query.values[2]], ["nonce", query.values[3]], ["key_id", query.values[4]], ["browser_challenge", query.values[5]], ["return_to", query.values[6]], ["created_at", query.values[7]], ["expires_at", query.values[8]]])); return { rows: [], rowCount: 1 }; }
      throw new Error(`unexpected_query_${text}`);
    },
    async connect() {
      return {
        async query(query) {
          const text = typeof query === "string" ? query : query.text;
          if (text === "BEGIN" || text === "COMMIT" || text === "ROLLBACK") return { rows: [] };
          if (text.startsWith("SELECT")) return { rows: [...rows.values()] };
          if (text.startsWith("DELETE")) { rows.delete(query.values[0].toString("hex")); return { rows: [], rowCount: 1 }; }
          throw new Error(`unexpected_transaction_${text}`);
        },
        release() {},
      };
    },
    async end() {},
  };
  const config = testConfig({ handoffDatabaseUrl: "postgres://test.invalid/db", handoffEncryptionKey: encryptionKey });
  const storeA = createPostgresHandoffStore(config, { pool: fakePool });
  const storeB = createPostgresHandoffStore(config, { pool: fakePool });
  const grant = { code: "opaque-test-code", jwt: "synthetic-jwt", header: { kid: "k" }, payload: { exp: Math.floor(Date.now() / 1000) + 60 }, createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 60_000).toISOString(), returnTo: "/operator/cockpit", browserChallenge: browserBindingChallenge(testBrowserVerifier) };
  await storeA.create(grant);
  const stored = [...rows.values()][0];
  assert.equal(stored.ciphertext.includes(Buffer.from(grant.jwt)), false);
  const redeemed = await storeB.consume(grant.code, testBrowserVerifier);
  assert.equal(redeemed.jwt, grant.jwt);
  await assert.rejects(storeA.consume(grant.code, testBrowserVerifier), /staffordos_handoff_code_invalid/);
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
