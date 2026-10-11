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

Module._extensions[".ts"] = (module, filename) => {
  const source = readFileSync(filename, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  });
  module._compile(compiled.outputText, filename);
};

const auth = compileModule(readFileSync(modulePath, "utf8"), modulePath);

const {
  CAREEROS_BETA_OPERATIONS_READ_PERMISSION,
  STAFFORDOS_OPERATOR_SESSION_COOKIE,
  authorizeStaffordOsOperatorRead,
  careerOsBetaOperationsProtectedProof,
  createStaffordOsOperatorSession,
  destroyStaffordOsOperatorSession,
  operatorAuthorizationFailureBody,
  resolveStaffordOsOperatorSession,
  sessionCookieOptions,
  verifyStaffordOsOperatorAssertion,
} = auth;

const keyPair = crypto.generateKeyPairSync("ed25519");
const publicKeyPem = keyPair.publicKey.export({ type: "spki", format: "pem" });
const operatorSubject = "synthetic-operator-subject";
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
    publicKeyUrl: "http://127.0.0.1:8787/public-key",
    publicKeyPem,
    sessionSecret: "synthetic-session-secret-with-enough-entropy",
    sessionTtlSeconds: 300,
    cookieSecure: false,
    sessionRepository: fakeSessionRepository(),
    ...overrides,
  };
}

function fakeSessionRepository() {
  const sessions = new Map();
  return {
    async createSession({ session }) {
      sessions.set(session.id, { ...session, revokedAt: null });
    },
    async resolveSession({ sessionId, config, now }) {
      const session = sessions.get(sessionId);
      if (!session || session.revokedAt || session.expiresAt <= Math.floor(now.getTime() / 1000)) return null;
      if (session.issuer !== config.issuer || session.audience !== config.audience || !config.allowedSubjects.includes(session.subject)) return null;
      return { ...session };
    },
    async revokeSession({ sessionId }) {
      const session = sessions.get(sessionId);
      if (session) session.revokedAt = new Date().toISOString();
    },
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
    email: "synthetic-operator@example.invalid",
    name: "Synthetic Operator",
    roles: ["careeros_beta_operations_viewer"],
    permissions: [CAREEROS_BETA_OPERATIONS_READ_PERMISSION],
    ...payloadOverrides,
  };
  const signingInput = `${base64Url(stableStringify(header))}.${base64Url(stableStringify(payload))}`;
  const signature = crypto.sign(null, Buffer.from(signingInput), keyPair.privateKey);
  return `${signingInput}.${base64Url(signature)}`;
}

async function verifiedSession(overrides = {}, configOverrides = {}) {
  const config = testConfig(configOverrides);
  const assertion = signAssertion(overrides);
  const verified = verifyStaffordOsOperatorAssertion(assertion, publicKeyPem, config, now);
  return { config, verified, ...(await createStaffordOsOperatorSession(verified, config, now)) };
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

test("session cookie is HttpOnly, bounded, and never stores assertion material", async () => {
  const { cookieValue, cookieOptions, session } = await verifiedSession();

  assert.equal(STAFFORDOS_OPERATOR_SESSION_COOKIE, "staffordos_operator_session");
  assert.equal(cookieOptions.httpOnly, true);
  assert.equal(cookieOptions.sameSite, "lax");
  assert.equal(cookieOptions.secure, false);
  assert.equal(cookieOptions.maxAge, 300);
  assert.equal(cookieValue.includes("StaffordOS-Operator-Assertion"), false);
  assert.equal(cookieValue.includes("."), true);
  assert.equal(session.expiresAt, nowSeconds + 300);
});

test("guard distinguishes missing, invalid, missing permission, and authorized sessions", async () => {
  const config = testConfig();

  const missing = await authorizeStaffordOsOperatorRead("", CAREEROS_BETA_OPERATIONS_READ_PERMISSION, config, now);
  assert.equal(missing.ok, false);
  assert.equal(missing.status, 401);
  assert.equal(missing.error, "OPERATOR_SESSION_MISSING");

  const invalid = await authorizeStaffordOsOperatorRead("career_p0_session_fake", CAREEROS_BETA_OPERATIONS_READ_PERMISSION, config, now);
  assert.equal(invalid.ok, false);
  assert.equal(invalid.status, 401);
  assert.equal(invalid.error, "OPERATOR_SESSION_INVALID");

  const noPermission = await verifiedSession({ permissions: [] });
  const forbidden = await authorizeStaffordOsOperatorRead(
    noPermission.cookieValue,
    CAREEROS_BETA_OPERATIONS_READ_PERMISSION,
    noPermission.config,
    now,
  );
  assert.equal(forbidden.ok, false);
  assert.equal(forbidden.status, 403);
  assert.equal(forbidden.error, "OPERATOR_PERMISSION_MISSING");

  const authorized = await verifiedSession();
  const allowed = await authorizeStaffordOsOperatorRead(
    authorized.cookieValue,
    CAREEROS_BETA_OPERATIONS_READ_PERMISSION,
    authorized.config,
    now,
  );
  assert.equal(allowed.ok, true);
  assert.equal(allowed.status, 200);
});

test("logout invalidates only the StaffordOS operator session", async () => {
  const { config, cookieValue } = await verifiedSession();

  assert.equal((await authorizeStaffordOsOperatorRead(cookieValue, CAREEROS_BETA_OPERATIONS_READ_PERMISSION, config, now)).ok, true);
  const destroyed = await destroyStaffordOsOperatorSession(cookieValue, config);
  assert.equal(destroyed.cookieOptions.maxAge, 0);
  assert.equal((await authorizeStaffordOsOperatorRead(cookieValue, CAREEROS_BETA_OPERATIONS_READ_PERMISSION, config, now)).status, 401);
});

test("durable-session contract rejects expiry and an audience/configuration mismatch", async () => {
  const created = await verifiedSession();
  const expired = await resolveStaffordOsOperatorSession(created.cookieValue, created.config, new Date("2026-08-29T12:06:00.000Z"));
  assert.equal(expired.status, 401);

  const wrongAudience = await resolveStaffordOsOperatorSession(
    created.cookieValue,
    testConfig({ sessionRepository: created.config.sessionRepository, audience: "staffordos.other.audience" }),
    now,
  );
  assert.equal(wrongAudience.status, 401);
});

test("customer CareerOS cookie alone cannot authorize StaffordOS operator reads", async () => {
  const result = await authorizeStaffordOsOperatorRead("career_p0_session_customer_only", CAREEROS_BETA_OPERATIONS_READ_PERMISSION, testConfig(), now);

  assert.equal(result.ok, false);
  assert.equal(result.status, 401);
  assert.equal(result.error, "OPERATOR_SESSION_INVALID");
});

test("protected proof returns synthetic authorization status without private CareerOS evidence", async () => {
  const { config, cookieValue } = await verifiedSession();
  const authorization = await authorizeStaffordOsOperatorRead(cookieValue, CAREEROS_BETA_OPERATIONS_READ_PERMISSION, config, now);
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
