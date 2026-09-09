import assert from "node:assert/strict";
import crypto from "node:crypto";
import Module from "node:module";
import path from "node:path";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createRequire } from "node:module";

const root = process.cwd();
const frontendRoot = path.join(root, "staffordos/ui/operator-frontend");
const routeRoot = path.join(frontendRoot, "app/api/operator/auth");
const requireFromFrontend = createRequire(path.join(frontendRoot, "package.json"));
const ts = requireFromFrontend("typescript");
const handoffSharedSecret = crypto.randomBytes(32).toString("base64url");

function compileModule(source, filename, replacements = {}) {
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
  const originalLoad = Module._load;
  Module._load = function load(request, parent, isMain) {
    if (request === "next/server") return { NextResponse: MockNextResponse };
    for (const [suffix, replacement] of Object.entries(replacements)) {
      if (request.endsWith(suffix)) return replacement;
    }
    return originalLoad.call(this, request, parent, isMain);
  };
  try {
    mod._compile(compiled.outputText, filename);
  } finally {
    Module._load = originalLoad;
  }
  return mod.exports;
}

class MockNextResponse {
  constructor(status, headers = {}, body = null) {
    this.status = status;
    this.headers = new Headers(headers);
    this.body = body;
    this.cookieSet = null;
    this.cookieSets = [];
    this.cookies = {
      set: (name, value, options) => {
        this.cookieSet = { name, value, options };
        this.cookieSets.push(this.cookieSet);
      },
    };
  }

  static redirect(url) {
    return new MockNextResponse(307, { location: String(url) });
  }

  static json(body, init = {}) {
    return new MockNextResponse(init.status || 200, { "content-type": "application/json" }, body);
  }
}

const authSource = readFileSync(path.join(frontendRoot, "lib/operator/staffordosOperatorSession.ts"), "utf8");
const authModule = compileModule(authSource, path.join(frontendRoot, "lib/operator/staffordosOperatorSession.ts"));
const verified = {
  subject: "route-test-subject",
  issuer: "https://staffordos-operator.test",
  audience: "staffordos.operator.test",
  roles: ["viewer"],
  permissions: [],
  jwtId: "route-test-jti",
  expiresAt: Math.floor(Date.now() / 1000) + 300,
};
let callbackReturnTo = "/operator/careeros/missions/example";
const browserVerifier = crypto.randomBytes(32).toString("base64url");
const routeAuth = {
  ...authModule,
  redeemStaffordOsIssuerHandoffCode: async (_code, _config, verifier) => {
    if (verifier !== browserVerifier) throw new Error("browser binding rejected");
    return { assertion: "synthetic-assertion", returnTo: callbackReturnTo };
  },
  fetchStaffordOsOperatorPublicKey: async () => "synthetic-public-key",
  verifyStaffordOsOperatorAssertion: () => verified,
};

const loginRoute = compileModule(
  readFileSync(path.join(routeRoot, "login/route.ts"), "utf8"),
  path.join(routeRoot, "login/route.ts"),
  { "lib/operator/staffordosOperatorSession": routeAuth },
);
const callbackRoute = compileModule(
  readFileSync(path.join(routeRoot, "callback/route.ts"), "utf8"),
  path.join(routeRoot, "callback/route.ts"),
  { "lib/operator/staffordosOperatorSession": routeAuth },
);

const env = {
  STAFFORDOS_OPERATOR_ISSUER_BASE_URL: "http://127.0.0.1:8787",
  STAFFORDOS_OPERATOR_FRONTEND_HANDOFF_URL: "http://127.0.0.1:3000/api/operator/auth/callback",
  STAFFORDOS_OPERATOR_JWT_ISSUER: verified.issuer,
  STAFFORDOS_OPERATOR_JWT_AUDIENCE: verified.audience,
  STAFFORDOS_OPERATOR_ALLOWED_SUBJECTS: verified.subject,
  STAFFORDOS_OPERATOR_FRONTEND_SESSION_SECRET: "route-test-session-secret",
  STAFFORDOS_OPERATOR_JWT_PUBLIC_KEY_URL: "http://127.0.0.1:8787/public-key",
  STAFFORDOS_OPERATOR_COOKIE_SECURE: "false",
  STAFFORDOS_OPERATOR_HANDOFF_SHARED_SECRET: handoffSharedSecret,
};

function setTestEnv(overrides = {}) {
  for (const [name, value] of Object.entries({ ...env, ...overrides })) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
}

test("login route transports the mission path using configured origin policy", async () => {
  setTestEnv();
  const response = await loginRoute.GET(new Request("http://localhost:3000/api/operator/auth/login", {
    headers: {
      host: "evil.example",
      "x-forwarded-host": "evil.example",
      forwarded: "host=evil.example",
      "x-forwarded-proto": "https",
      referer: "http://127.0.0.1:3000/operator/careeros/missions/example",
    },
  }));
  const canonical = new URL(response.headers.get("location"));
  assert.equal(response.status, 307);
  assert.equal(canonical.origin, "http://127.0.0.1:3000");
  assert.equal(canonical.pathname, "/api/operator/auth/login");
  assert.equal(response.cookieSet, null);
  const canonicalResponse = await loginRoute.GET(new Request(canonical.toString()));
  const location = new URL(canonicalResponse.headers.get("location"));
  assert.equal(location.origin, "http://127.0.0.1:8787");
  assert.equal(location.pathname, "/login");
  assert.equal(location.searchParams.get("returnTo"), "/operator/careeros/missions/example");
  assert.ok(canonicalResponse.cookieSet);
});

test("login route preserves validated encoded query data without changing its path", async () => {
  setTestEnv();
  const response = await loginRoute.GET(new Request("http://127.0.0.1:3000/api/operator/auth/login?returnTo=%2Foperator%2Fcareeros%2Fbeta-users%3Fsearch%3DAI%2520automation"));
  const canonical = new URL(response.headers.get("location"));
  const canonicalResponse = await loginRoute.GET(new Request(canonical.toString()));
  const location = new URL(canonicalResponse.headers.get("location"));
  assert.equal(location.searchParams.get("returnTo"), "/operator/careeros/beta-users?search=AI%20automation");
});

test("callback redirects to configured frontend origin and attaches the encrypted session cookie", async () => {
  setTestEnv();
  const response = await callbackRoute.GET(new Request("http://localhost:3000/api/operator/auth/callback?code=opaque", {
    headers: {
      cookie: `staffordos_operator_browser_binding=${browserVerifier}`,
      host: "evil.example",
      "x-forwarded-host": "evil.example",
      forwarded: "host=evil.example",
      "x-forwarded-proto": "https",
    },
  }));
  const location = new URL(response.headers.get("location"));
  assert.equal(response.status, 307);
  assert.equal(location.origin, "http://127.0.0.1:3000");
  assert.equal(location.pathname, "/operator/careeros/missions/example");
  const sessionCookie = response.cookieSets.find((cookie) => cookie.name === "staffordos_operator_session");
  const bindingCookie = response.cookieSets.find((cookie) => cookie.name === "staffordos_operator_browser_binding");
  assert.ok(sessionCookie);
  assert.equal(sessionCookie.options.httpOnly, true);
  assert.equal(sessionCookie.options.sameSite, "lax");
  assert.equal(sessionCookie.options.path, "/");
  assert.equal(sessionCookie.options.secure, false);
  assert.equal(bindingCookie.value, "");
});

test("callback preserves the encoded query returned by the production handoff contract", async () => {
  setTestEnv();
  callbackReturnTo = "/operator/careeros/beta-users?search=AI%20automation";
  try {
    const response = await callbackRoute.GET(new Request("http://127.0.0.1:3000/api/operator/auth/callback?code=opaque", {
      headers: {
        cookie: `staffordos_operator_browser_binding=${browserVerifier}`,
        host: "evil.example",
        "x-forwarded-host": "evil.example",
      },
    }));
    const location = new URL(response.headers.get("location"));
    assert.equal(location.origin, "http://127.0.0.1:3000");
    assert.equal(location.pathname, "/operator/careeros/beta-users");
    assert.equal(location.search, "?search=AI%20automation");
    assert.ok(response.cookieSets.some((cookie) => cookie.name === "staffordos_operator_session"));
  } finally {
    callbackReturnTo = "/operator/careeros/missions/example";
  }
});

test("callback fails closed without the initiating browser binding", async () => {
  setTestEnv();
  const response = await callbackRoute.GET(new Request("http://127.0.0.1:3000/api/operator/auth/callback?code=opaque"));
  assert.equal(response.status, 401);
  assert.deepEqual(response.body, { ok: false, error: "OPERATOR_BROWSER_BINDING_MISSING" });
  assert.equal(response.cookieSet, null);
  assert.equal(response.headers.has("location"), false);
});

test("callback rejects a foreign browser binding without session or redirect", async () => {
  setTestEnv();
  const response = await callbackRoute.GET(new Request("http://127.0.0.1:3000/api/operator/auth/callback?code=opaque", {
    headers: { cookie: `staffordos_operator_browser_binding=${crypto.randomBytes(32).toString("base64url")}` },
  }));
  assert.equal(response.status, 401);
  assert.equal(response.cookieSet, null);
  assert.equal(response.headers.has("location"), false);
});

test("missing handoff configuration fails closed instead of returning an interactive assertion", async () => {
  setTestEnv({ STAFFORDOS_OPERATOR_FRONTEND_HANDOFF_URL: undefined });
  const response = await loginRoute.GET(new Request("http://127.0.0.1:3000/api/operator/auth/login"));
  assert.equal(response.status, 500);
  assert.deepEqual(response.body, { ok: false, error: "OPERATOR_AUTH_CONFIG_UNAVAILABLE" });
  setTestEnv();
});
