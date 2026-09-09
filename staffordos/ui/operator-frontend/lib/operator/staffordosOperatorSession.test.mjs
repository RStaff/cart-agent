import assert from "node:assert/strict";
import crypto from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import Module from "node:module";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const frontendRoot = path.join(root, "staffordos/ui/operator-frontend");
const modulePath = path.join(frontendRoot, "lib/operator/staffordosOperatorSession.ts");
const proofRoutePath = path.join(frontendRoot, "app/api/operator/careeros/beta-operations/proof/route.ts");
const requireFromFrontend = createRequire(path.join(frontendRoot, "package.json"));
const ts = requireFromFrontend("typescript");

function compileModule(source, filename) {
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  });
  const mod = new Module(filename);
  mod.filename = filename;
  mod.paths = Module._nodeModulePaths(path.dirname(filename));
  mod._compile(compiled.outputText, filename);
  return mod.exports;
}

const auth = compileModule(readFileSync(modulePath, "utf8"), modulePath);
const isolatedAuth = compileModule(readFileSync(modulePath, "utf8"), `${modulePath}.isolated`);

const {
  CAREEROS_BETA_OPERATIONS_READ_PERMISSION,
  STAFFORDOS_OPERATOR_SESSION_COOKIE,
  authorizeStaffordOsOperatorRead,
  browserBindingCookieOptions,
  careerOsBetaOperationsProtectedProof,
  createStaffordOsOperatorSession,
  destroyStaffordOsOperatorSession,
  isCanonicalStaffordOsOperatorHandoffSecret,
  isCanonicalStaffordOsOperatorBrowserBindingValue,
  operatorAuthorizationFailureBody,
  redeemStaffordOsIssuerHandoffCode,
  resolveStaffordOsOperatorReturnPath,
  resolveStaffordOsOperatorSession,
  sessionCookieOptions,
  STAFFORDOS_OPERATOR_DEFAULT_RETURN_PATH,
  validateStaffordOsOperatorReturnPath,
  verifyStaffordOsOperatorAssertion,
  createStaffordOsOperatorBrowserBinding,
  createStaffordOsOperatorCanonicalEntryToken,
  verifyStaffordOsOperatorCanonicalEntryToken,
  STAFFORDOS_OPERATOR_CANONICAL_ENTRY_CLOCK_SKEW_SECONDS,
  STAFFORDOS_OPERATOR_CANONICAL_ENTRY_TTL_SECONDS,
  STAFFORDOS_OPERATOR_BROWSER_BINDING_TTL_SECONDS,
  STAFFORDOS_OPERATOR_BROWSER_BINDING_REDIRECT_MARGIN_SECONDS,
  STAFFORDOS_OPERATOR_OAUTH_STATE_CLOCK_SKEW_SECONDS,
  STAFFORDOS_OPERATOR_OAUTH_STATE_MAX_TTL_SECONDS,
} = auth;

const keyPair = crypto.generateKeyPairSync("ed25519");
const publicKeyPem = keyPair.publicKey.export({ type: "spki", format: "pem" });
const operatorSubject = "synthetic-operator-subject";
const handoffSharedSecret = crypto.randomBytes(32).toString("base64url");
const now = new Date("2026-08-29T12:00:00.000Z");
const nowSeconds = Math.floor(now.getTime() / 1000);

function stableStringify(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  return `{${Object.keys(value)
    .sort()
    .filter((key) => value[key] !== undefined)
    .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
    .join(",")}}`;
}

function base64Url(input) {
  const buffer = Buffer.isBuffer(input) ? input : Buffer.from(String(input), "utf8");
  return buffer.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function testConfig(overrides = {}) {
  return {
    issuer: "https://staffordos-operator.staffordmedia.ai",
    audience: "staffordos.operator.frontend.v1",
    allowedSubjects: [operatorSubject],
    issuerBaseUrl: "http://127.0.0.1:8787",
    frontendHandoffUrl: "http://127.0.0.1:3000/api/operator/auth/callback",
    frontendOrigin: "http://127.0.0.1:3000",
    handoffSharedSecret,
    publicKeyUrl: "http://127.0.0.1:8787/public-key",
    publicKeyPem,
    sessionSecret: "synthetic-session-secret-with-enough-entropy",
    sessionTtlSeconds: 300,
    cookieSecure: false,
    ...overrides,
  };
}

function signAssertion(payloadOverrides = {}) {
  const header = { alg: "EdDSA", typ: "JWT", kid: "local-test-key:1" };
  const payload = {
    iss: "https://staffordos-operator.staffordmedia.ai",
    aud: "staffordos.operator.frontend.v1",
    sub: operatorSubject,
    iat: nowSeconds,
    exp: nowSeconds + 300,
    jti: crypto.randomUUID(),
    roles: ["careeros_beta_operations_viewer"],
    permissions: [CAREEROS_BETA_OPERATIONS_READ_PERMISSION],
    ...payloadOverrides,
  };
  const signingInput = `${base64Url(stableStringify(header))}.${base64Url(stableStringify(payload))}`;
  const signature = crypto.sign(null, Buffer.from(signingInput), keyPair.privateKey);
  return `${signingInput}.${base64Url(signature)}`;
}

test("frontend handoff secret validation accepts only canonical 32-byte base64url", () => {
  assert.equal(isCanonicalStaffordOsOperatorHandoffSecret(handoffSharedSecret), true);
  for (const value of ["", " ", "short", `${handoffSharedSecret}=`, `${handoffSharedSecret}!`, ` ${handoffSharedSecret}`, handoffSharedSecret.slice(0, -1)]) {
    assert.equal(isCanonicalStaffordOsOperatorHandoffSecret(value), false);
  }
});

test("frontend browser binding generates a canonical verifier and challenge", () => {
  const binding = createStaffordOsOperatorBrowserBinding();
  assert.equal(isCanonicalStaffordOsOperatorBrowserBindingValue(binding.verifier), true);
  assert.equal(binding.challenge.length, 43);
  assert.notEqual(binding.verifier, binding.challenge);
});

test("handoff redemption rejects issuer redirects without forwarding the service credential", async () => {
  const requests = [];
  const config = testConfig();
  await assert.rejects(
    redeemStaffordOsIssuerHandoffCode("synthetic-code", config, "synthetic-browser-verifier", async (url, options) => {
      requests.push({ url, options });
      if (options.redirect !== "error") requests.push({ url: "https://redirect-target.invalid", options });
      return { ok: false, status: 302, json: async () => ({}) };
    }),
  );
  assert.equal(requests.length, 1);
  assert.equal(new URL(requests[0].url).pathname, "/auth/staffordos/handoff");
  assert.equal(requests[0].options.redirect, "error");
  assert.equal(typeof requests[0].options.headers["X-StaffordOS-Handoff-Secret"], "string");
  assert.equal(requests[0].options.headers["X-StaffordOS-Handoff-Secret"].length, 43);
});

function verifiedSession(overrides = {}, configOverrides = {}) {
  const config = testConfig(configOverrides);
  const assertion = signAssertion(overrides);
  const verified = verifyStaffordOsOperatorAssertion(assertion, publicKeyPem, config, now);
  return { config, verified, ...createStaffordOsOperatorSession(verified, config, now) };
}

test("assertion validation accepts exact canonical issuer, audience, subject, and permission", () => {
  const verified = verifyStaffordOsOperatorAssertion(signAssertion(), publicKeyPem, testConfig(), now);

  assert.equal(verified.issuer, "https://staffordos-operator.staffordmedia.ai");
  assert.equal(verified.audience, "staffordos.operator.frontend.v1");
  assert.equal(verified.subject, operatorSubject);
  assert.deepEqual(verified.roles, ["careeros_beta_operations_viewer"]);
  assert.deepEqual(verified.permissions, [CAREEROS_BETA_OPERATIONS_READ_PERMISSION]);
});

test("assertion validation rejects wrong issuer, wrong audience, expiration, and unauthorized subject", () => {
  assert.throws(
    () => verifyStaffordOsOperatorAssertion(signAssertion({ iss: "https://issuer.example.invalid" }), publicKeyPem, testConfig(), now),
    /STAFFORDOS_ASSERTION_ISSUER_INVALID/,
  );
  assert.throws(
    () => verifyStaffordOsOperatorAssertion(signAssertion({ aud: "staffordos.other.audience" }), publicKeyPem, testConfig(), now),
    /STAFFORDOS_ASSERTION_AUDIENCE_INVALID/,
  );
  assert.throws(
    () => verifyStaffordOsOperatorAssertion(signAssertion({ exp: nowSeconds - 1 }), publicKeyPem, testConfig(), now),
    /STAFFORDOS_ASSERTION_EXPIRED/,
  );
  assert.throws(
    () => verifyStaffordOsOperatorAssertion(signAssertion({ sub: "unauthorized-subject" }), publicKeyPem, testConfig(), now),
    /STAFFORDOS_ASSERTION_SUBJECT_UNAUTHORIZED/,
  );
});

test("assertion validation rejects tampering and non-EdDSA algorithm claims", () => {
  const parts = signAssertion().split(".");
  const tamperedPayload = {
    iss: "https://staffordos-operator.staffordmedia.ai",
    aud: "staffordos.operator.frontend.v1",
    sub: "tampered-subject",
    iat: nowSeconds,
    exp: nowSeconds + 300,
    jti: crypto.randomUUID(),
    roles: ["careeros_beta_operations_viewer"],
    permissions: [CAREEROS_BETA_OPERATIONS_READ_PERMISSION],
  };
  assert.throws(
    () =>
      verifyStaffordOsOperatorAssertion(
        `${parts[0]}.${base64Url(stableStringify(tamperedPayload))}.${parts[2]}`,
        publicKeyPem,
        testConfig(),
        now,
      ),
    /STAFFORDOS_ASSERTION_SIGNATURE_INVALID/,
  );

  const wrongHeader = { alg: "HS256", typ: "JWT", kid: "local-test-key:1" };
  const payload = {
    iss: "https://staffordos-operator.staffordmedia.ai",
    aud: "staffordos.operator.frontend.v1",
    sub: operatorSubject,
    iat: nowSeconds,
    exp: nowSeconds + 300,
    jti: crypto.randomUUID(),
  };
  const signingInput = `${base64Url(stableStringify(wrongHeader))}.${base64Url(stableStringify(payload))}`;
  const signature = crypto.sign(null, Buffer.from(signingInput), keyPair.privateKey);
  assert.throws(
    () => verifyStaffordOsOperatorAssertion(`${signingInput}.${base64Url(signature)}`, publicKeyPem, testConfig(), now),
    /STAFFORDOS_ASSERTION_ALGORITHM_REJECTED/,
  );
});

test("session cookie is HttpOnly, bounded, and never stores assertion material", () => {
  const { cookieValue, cookieOptions, session } = verifiedSession();

  assert.equal(STAFFORDOS_OPERATOR_SESSION_COOKIE, "staffordos_operator_session");
  assert.equal(cookieOptions.httpOnly, true);
  assert.equal(cookieOptions.sameSite, "lax");
  assert.equal(cookieOptions.secure, false);
  assert.equal(cookieOptions.maxAge, 300);
  assert.equal(cookieValue.includes("StaffordOS-Operator-Assertion"), false);
  assert.equal(cookieValue.includes("."), true);
  assert.equal(session.expiresAt, nowSeconds + 300);
});

test("operator return paths accept only internal StaffordOS destinations", () => {
  assert.equal(validateStaffordOsOperatorReturnPath("/operator/careeros/missions/example"), "/operator/careeros/missions/example");
  assert.equal(validateStaffordOsOperatorReturnPath("/operator/careeros/beta-users"), "/operator/careeros/beta-users");
  assert.equal(validateStaffordOsOperatorReturnPath("/operator/careeros/beta-users?search=AI%20automation"), "/operator/careeros/beta-users?search=AI%20automation");
  assert.equal(validateStaffordOsOperatorReturnPath("/operator/careeros/missions/example?tab=technical%20details"), "/operator/careeros/missions/example?tab=technical%20details");
  assert.equal(validateStaffordOsOperatorReturnPath("/os/professional/jobs?filter=APPLY%5FNOW"), "/os/professional/jobs?filter=APPLY%5FNOW");
  assert.equal(validateStaffordOsOperatorReturnPath("/operator/products?next=https%3A%2F%2Fevil.example%2F"), "/operator/products?next=https%3A%2F%2Fevil.example%2F");
  assert.equal(validateStaffordOsOperatorReturnPath("/operator/products?a=1%2F2&b=3%3A4&c=5%3F6&d=7%26e%3D8&f=9%25"), "/operator/products?a=1%2F2&b=3%3A4&c=5%3F6&d=7%26e%3D8&f=9%25");
  assert.equal(validateStaffordOsOperatorReturnPath(""), null);
  assert.equal(validateStaffordOsOperatorReturnPath("https://evil.example/"), null);
  assert.equal(validateStaffordOsOperatorReturnPath("//evil.example/"), null);
  assert.equal(validateStaffordOsOperatorReturnPath("/operator/%2F%2Fevil"), null);
  assert.equal(validateStaffordOsOperatorReturnPath("/operator/items%2Fexample"), null);
  assert.equal(validateStaffordOsOperatorReturnPath("/operator/products?bad=%"), null);
  assert.equal(validateStaffordOsOperatorReturnPath("/operator/products?bad=%2"), null);
  assert.equal(validateStaffordOsOperatorReturnPath("/operator/products?bad=%GG"), null);
  assert.equal(validateStaffordOsOperatorReturnPath("/operator/products?bad=%00"), null);
  assert.equal(validateStaffordOsOperatorReturnPath("/operator/products?bad=%5C"), null);
  assert.equal(validateStaffordOsOperatorReturnPath("/operator/../os"), null);
  assert.equal(validateStaffordOsOperatorReturnPath("/operator/products#details"), null);
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
  ]) assert.equal(validateStaffordOsOperatorReturnPath(invalid), null);
  assert.equal(validateStaffordOsOperatorReturnPath("/career/profile"), null);
  assert.equal(validateStaffordOsOperatorReturnPath("javascript:alert(1)"), null);
  assert.equal(STAFFORDOS_OPERATOR_DEFAULT_RETURN_PATH, "/operator/cockpit");
});

test("operator login resolves an absent return path from a same-origin referer", () => {
  assert.equal(
    resolveStaffordOsOperatorReturnPath(
      null,
      "http://127.0.0.1:3000/operator/careeros/missions/example?view=summary#details",
      "http://127.0.0.1:3000",
    ),
    "/operator/careeros/missions/example?view=summary",
  );
  assert.equal(
    resolveStaffordOsOperatorReturnPath(
      null,
      "http://localhost:3000/operator/cockpit",
      "http://127.0.0.1:3000",
    ),
    "/operator/cockpit",
  );
  assert.equal(
    resolveStaffordOsOperatorReturnPath(
      "/operator/cockpit",
      "http://127.0.0.1:3000/operator/careeros/missions/example",
      "http://127.0.0.1:3000",
    ),
    "/operator/cockpit",
  );
  assert.equal(
    resolveStaffordOsOperatorReturnPath(
      "/career/profile",
      "http://127.0.0.1:3000/operator/careeros/missions/example",
      "http://127.0.0.1:3000",
    ),
    null,
  );
});

test("canonical login entry tokens preserve only validated return paths and expire", () => {
  const issued = new Date("2026-08-29T12:00:00.000Z");
  const token = createStaffordOsOperatorCanonicalEntryToken("/operator/careeros/beta-users?search=AI%20automation", handoffSharedSecret, issued);
  const verified = verifyStaffordOsOperatorCanonicalEntryToken(token, handoffSharedSecret, issued);
  assert.equal(verified.returnTo, "/operator/careeros/beta-users?search=AI%20automation");
  assert.equal(verifyStaffordOsOperatorCanonicalEntryToken(`${token}x`, handoffSharedSecret, issued), null);
  assert.equal(verifyStaffordOsOperatorCanonicalEntryToken(token, handoffSharedSecret, new Date(issued.getTime() + 91_000)), null);
});

test("browser binding lifetime covers the issuer OAuth state ceiling and bounded redirect margin", () => {
  const options = browserBindingCookieOptions(testConfig());
  assert.equal(STAFFORDOS_OPERATOR_OAUTH_STATE_MAX_TTL_SECONDS, 900);
  assert.equal(STAFFORDOS_OPERATOR_BROWSER_BINDING_REDIRECT_MARGIN_SECONDS, 30);
  assert.equal(
    STAFFORDOS_OPERATOR_BROWSER_BINDING_TTL_SECONDS,
    STAFFORDOS_OPERATOR_OAUTH_STATE_MAX_TTL_SECONDS +
      STAFFORDOS_OPERATOR_OAUTH_STATE_CLOCK_SKEW_SECONDS +
      STAFFORDOS_OPERATOR_BROWSER_BINDING_REDIRECT_MARGIN_SECONDS,
  );
  assert.equal(options.maxAge, 930);
  assert.ok(options.maxAge > STAFFORDOS_OPERATOR_OAUTH_STATE_MAX_TTL_SECONDS);
  assert.equal(Number.isFinite(options.maxAge), true);
  assert.equal(options.httpOnly, true);
  assert.equal(options.sameSite, "lax");
  assert.equal(options.path, "/");
});

test("canonical entry validation applies bounded clock skew without extending token lifetime", () => {
  const issued = new Date("2026-08-29T12:00:00.000Z");
  const token = createStaffordOsOperatorCanonicalEntryToken("/operator/careeros/beta-users?search=AI%20automation", handoffSharedSecret, issued);
  const skew = STAFFORDOS_OPERATOR_CANONICAL_ENTRY_CLOCK_SKEW_SECONDS;
  assert.ok(verifyStaffordOsOperatorCanonicalEntryToken(token, handoffSharedSecret, new Date(issued.getTime() - (skew - 1) * 1000)));
  assert.ok(verifyStaffordOsOperatorCanonicalEntryToken(token, handoffSharedSecret, new Date(issued.getTime() - skew * 1000)));
  assert.equal(verifyStaffordOsOperatorCanonicalEntryToken(token, handoffSharedSecret, new Date(issued.getTime() - (skew + 1) * 1000)), null);
  assert.ok(verifyStaffordOsOperatorCanonicalEntryToken(token, handoffSharedSecret, new Date(issued.getTime() + (60 + skew) * 1000)));
  assert.equal(verifyStaffordOsOperatorCanonicalEntryToken(token, handoffSharedSecret, new Date(issued.getTime() + (60 + skew + 1) * 1000)), null);
});

test("canonical entry validation rejects unsafe timestamp claims", () => {
  const issued = new Date("2026-08-29T12:00:00.000Z");
  const token = createStaffordOsOperatorCanonicalEntryToken("/operator/cockpit", handoffSharedSecret, issued);
  const [encoded, signature] = token.split(".");
  const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  for (const changes of [
    { issuedAt: -1 },
    { issuedAt: 1.5 },
    { issuedAt: Number.MAX_SAFE_INTEGER + 1 },
    { expiresAt: payload.issuedAt },
    { expiresAt: payload.issuedAt + STAFFORDOS_OPERATOR_CANONICAL_ENTRY_TTL_SECONDS + 1 },
  ]) {
    const altered = { ...payload, ...changes };
    const alteredEncoded = Buffer.from(JSON.stringify(altered), "utf8").toString("base64url");
    assert.equal(verifyStaffordOsOperatorCanonicalEntryToken(`${alteredEncoded}.${signature}`, handoffSharedSecret, issued), null);
  }
});

test("callback-created session validates through an independently loaded module", () => {
  const { config, cookieValue } = verifiedSession();
  const result = isolatedAuth.authorizeStaffordOsOperatorRead(
    cookieValue,
    CAREEROS_BETA_OPERATIONS_READ_PERMISSION,
    config,
    now,
  );

  assert.equal(result.ok, true);
  assert.equal(result.status, 200);
});

test("authenticated session rejects tampering, expiry, and configuration changes", () => {
  const { config, cookieValue } = verifiedSession();
  const parts = cookieValue.split(".");
  parts[3] = `${parts[3][0] === "A" ? "B" : "A"}${parts[3].slice(1)}`;
  assert.equal(resolveStaffordOsOperatorSession(parts.join("."), config, now).error, "OPERATOR_SESSION_INVALID");
  assert.equal(resolveStaffordOsOperatorSession(cookieValue, config, new Date(now.getTime() + 301_000)).error, "OPERATOR_SESSION_EXPIRED");
  assert.equal(resolveStaffordOsOperatorSession(cookieValue, { ...config, issuer: "https://wrong.example" }, now).error, "OPERATOR_SESSION_INVALID");
  assert.equal(resolveStaffordOsOperatorSession(cookieValue, { ...config, audience: "wrong-audience" }, now).error, "OPERATOR_SESSION_INVALID");
});

test("guard distinguishes missing, invalid, missing permission, and authorized sessions", () => {
  const config = testConfig();

  const missing = authorizeStaffordOsOperatorRead("", CAREEROS_BETA_OPERATIONS_READ_PERMISSION, config, now);
  assert.equal(missing.ok, false);
  assert.equal(missing.status, 401);
  assert.equal(missing.error, "OPERATOR_SESSION_MISSING");

  const invalid = authorizeStaffordOsOperatorRead("career_p0_session_fake", CAREEROS_BETA_OPERATIONS_READ_PERMISSION, config, now);
  assert.equal(invalid.ok, false);
  assert.equal(invalid.status, 401);
  assert.equal(invalid.error, "OPERATOR_SESSION_INVALID");

  const noPermission = verifiedSession({ permissions: [] });
  const forbidden = authorizeStaffordOsOperatorRead(
    noPermission.cookieValue,
    CAREEROS_BETA_OPERATIONS_READ_PERMISSION,
    noPermission.config,
    now,
  );
  assert.equal(forbidden.ok, false);
  assert.equal(forbidden.status, 403);
  assert.equal(forbidden.error, "OPERATOR_PERMISSION_MISSING");

  const authorized = verifiedSession();
  const allowed = authorizeStaffordOsOperatorRead(
    authorized.cookieValue,
    CAREEROS_BETA_OPERATIONS_READ_PERMISSION,
    authorized.config,
    now,
  );
  assert.equal(allowed.ok, true);
  assert.equal(allowed.status, 200);
});

test("logout clears only the StaffordOS operator session cookie", () => {
  const { config, cookieValue } = verifiedSession();

  assert.equal(authorizeStaffordOsOperatorRead(cookieValue, CAREEROS_BETA_OPERATIONS_READ_PERMISSION, config, now).ok, true);
  const destroyed = destroyStaffordOsOperatorSession(cookieValue, config);
  assert.equal(destroyed.cookieOptions.maxAge, 0);
  assert.equal(authorizeStaffordOsOperatorRead("", CAREEROS_BETA_OPERATIONS_READ_PERMISSION, config, now).error, "OPERATOR_SESSION_MISSING");
});

test("customer CareerOS cookie alone cannot authorize StaffordOS operator reads", () => {
  const result = authorizeStaffordOsOperatorRead("career_p0_session_customer_only", CAREEROS_BETA_OPERATIONS_READ_PERMISSION, testConfig(), now);

  assert.equal(result.ok, false);
  assert.equal(result.status, 401);
  assert.equal(result.error, "OPERATOR_SESSION_INVALID");
});

test("protected proof returns synthetic authorization status without private CareerOS evidence", () => {
  const { config, cookieValue } = verifiedSession();
  const authorization = authorizeStaffordOsOperatorRead(cookieValue, CAREEROS_BETA_OPERATIONS_READ_PERMISSION, config, now);
  assert.equal(authorization.ok, true);
  if (!authorization.ok) throw new Error("unexpected authorization failure");

  const proof = careerOsBetaOperationsProtectedProof(authorization.session);
  const body = JSON.stringify(proof);
  assert.equal(proof.ok, true);
  assert.equal(proof.authority, CAREEROS_BETA_OPERATIONS_READ_PERMISSION);
  assert.equal(proof.customerDataRead, false);
  assert.equal(proof.customerDataMutated, false);
  assert.equal(proof.privateCareerDataReturned, false);
  assert.equal(body.includes("Career Story testimony body"), false);
  assert.equal(body.includes("resume contents"), false);
  assert.equal(body.includes("invite-code"), false);
  assert.equal(body.includes("source excerpt"), false);
});

test("failure response body exposes no roles, permissions, cookies, assertions, or subject", () => {
  const body = operatorAuthorizationFailureBody({
    ok: false,
    status: 403,
    error: "OPERATOR_PERMISSION_MISSING",
  });

  assert.deepEqual(body, { ok: false, error: "OPERATOR_PERMISSION_MISSING" });
});

test("proof route is isolated from CareerOS customer auth and data modules", () => {
  const routeSource = readFileSync(proofRoutePath, "utf8");

  assert.match(routeSource, /authorizeStaffordOsOperatorRead/);
  assert.doesNotMatch(routeSource, /careerP0|CAREEROS_P0_COOKIE|careerOsBetaStore|CareerFact|CareerSource|resume|invite/i);
});

test("session option helper keeps Secure enabled for production configuration", () => {
  const options = sessionCookieOptions(testConfig({ cookieSecure: true }), 120);

  assert.equal(options.httpOnly, true);
  assert.equal(options.secure, true);
  assert.equal(options.sameSite, "lax");
  assert.equal(options.maxAge, 120);
});
