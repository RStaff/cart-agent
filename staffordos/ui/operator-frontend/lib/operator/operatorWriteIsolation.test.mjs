import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import Module from "node:module";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const frontendRoot = path.join(root, "staffordos/ui/operator-frontend");
const gatePath = path.join(frontendRoot, "lib/operator/operatorWriteIsolation.ts");
const g004DecisionPath = path.join(root, "staffordos/governance/G004_00_OPERATOR_WRITE_SURFACE_RISK_DECISION.json");
const requireFromFrontend = createRequire(path.join(frontendRoot, "package.json"));
const ts = requireFromFrontend("typescript");

function compileModule(source, filename) {
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
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

const gateSource = readFileSync(gatePath, "utf8");
const gate = compileModule(gateSource, gatePath);

const {
  OPERATOR_WRITE_DENIED_STATUS,
  OPERATOR_WRITE_DISABLED_ERROR,
  OPERATOR_WRITE_ENABLE_ENV,
  OperatorWriteIsolationError,
  assertOperatorWriteAllowed,
  evaluateOperatorWriteIsolation,
  operatorWriteDeniedResponseBody,
} = gate;

const postRouteFiles = [
  "app/api/operator/execute-primary-action/route.ts",
  "app/api/operator/workday/start/route.ts",
  "app/api/operator/workday/stop/route.ts",
  "app/api/operator/lead-registry/action/route.ts",
  "app/api/proof/abando-recovery/run/route.ts",
].map((relativePath) => path.join(frontendRoot, relativePath));

const postRouteMutationMarkers = new Map([
  [postRouteFiles[0], "const now = new Date"],
  [postRouteFiles[1], "const repoRoot = path.resolve"],
  [postRouteFiles[2], "const repoRoot = path.resolve"],
  [postRouteFiles[3], "const body = await req.json();"],
  [postRouteFiles[4], "const repoRoot = repoRootFromCwd();"],
]);

const serverActionFiles = [
  path.join(frontendRoot, "app/operator/command-center/page.tsx"),
  path.join(frontendRoot, "app/operator/shopifixer-pilot/page.tsx"),
];

function localEnv(overrides = {}) {
  return {
    NODE_ENV: "development",
    [OPERATOR_WRITE_ENABLE_ENV]: "true",
    ...overrides,
  };
}

function headers(values = {}) {
  const normalized = Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key.toLowerCase(), value])
  );
  return {
    get(name) {
      return normalized[name.toLowerCase()] ?? null;
    },
  };
}

function evaluate({ host = "localhost:3000", env = localEnv(), headerOverrides = {}, request } = {}) {
  const requestHeaders = host === null ? headerOverrides : { host, ...headerOverrides };
  return evaluateOperatorWriteIsolation({
    request,
    headers: headers(requestHeaders),
    env,
  });
}

function deniedCode(options) {
  return evaluate(options).code;
}

function allFilesUnder(directory) {
  const entries = readdirSync(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.name === "node_modules" || entry.name === ".next") continue;
    if (entry.isDirectory()) {
      files.push(...allFilesUnder(absolutePath));
    } else {
      files.push(absolutePath);
    }
  }

  return files;
}

test("missing enablement flag denies", () => {
  assert.equal(deniedCode({ env: { NODE_ENV: "development" } }), "DENIED_NOT_ENABLED");
});

test("false and malformed enablement flags deny", () => {
  assert.equal(deniedCode({ env: localEnv({ [OPERATOR_WRITE_ENABLE_ENV]: "false" }) }), "DENIED_INVALID_CONFIGURATION");
  assert.equal(deniedCode({ env: localEnv({ [OPERATOR_WRITE_ENABLE_ENV]: "TRUE" }) }), "DENIED_INVALID_CONFIGURATION");
  assert.equal(deniedCode({ env: localEnv({ [OPERATOR_WRITE_ENABLE_ENV]: "1" }) }), "DENIED_INVALID_CONFIGURATION");
});

test("true flag plus explicit loopback hosts allows under local development", () => {
  for (const host of ["localhost:3000", "127.0.0.1:3000", "[::1]:3000"]) {
    const result = evaluate({ host });
    assert.equal(result.allowed, true, host);
    assert.equal(result.code, "ALLOWED_LOCAL_EXPLICIT", host);
    assert.equal(result.observedBoundaryClassification, "LOOPBACK", host);
  }
});

test("true flag plus LAN or public hostname denies", () => {
  assert.equal(deniedCode({ host: "192.168.1.20:3000" }), "DENIED_NON_LOCAL");
  assert.equal(deniedCode({ host: "operator.example.invalid" }), "DENIED_NON_LOCAL");
  assert.equal(deniedCode({ host: "workstation.local:3000" }), "DENIED_NON_LOCAL");
});

test("cloud and preview markers deny even with explicit local flag", () => {
  assert.equal(deniedCode({ env: localEnv({ RENDER: "true" }) }), "DENIED_PRODUCTION_MODE");
  assert.equal(deniedCode({ env: localEnv({ VERCEL: "1" }) }), "DENIED_PRODUCTION_MODE");
  assert.equal(deniedCode({ env: localEnv({ VERCEL_ENV: "preview" }) }), "DENIED_PREVIEW_MODE");
  assert.equal(deniedCode({ env: localEnv({ DEPLOY_ENV: "preview" }) }), "DENIED_PREVIEW_MODE");
});

test("unknown host and non-development runtime deny", () => {
  assert.equal(deniedCode({ host: null }), "DENIED_UNKNOWN_HOST");
  assert.equal(deniedCode({ env: localEnv({ NODE_ENV: "production" }) }), "DENIED_PRODUCTION_MODE");
  assert.equal(deniedCode({ env: localEnv({ NODE_ENV: "test" }) }), "DENIED_PRODUCTION_MODE");
});

test("trusted loopback is determined from server-observed request URL only when headers are absent", () => {
  const result = evaluateOperatorWriteIsolation({
    request: new Request("http://127.0.0.1:3000/operator"),
    env: localEnv(),
  });

  assert.equal(result.allowed, true);
  assert.equal(result.code, "ALLOWED_LOCAL_EXPLICIT");
});

test("forwarded headers cannot create or preserve local authority", () => {
  assert.equal(
    deniedCode({
      host: "operator.example.invalid",
      headerOverrides: { "x-forwarded-host": "localhost:3000" },
    }),
    "DENIED_NON_LOCAL"
  );
  assert.equal(
    deniedCode({
      host: "localhost:3000",
      headerOverrides: { "x-forwarded-for": "203.0.113.10" },
    }),
    "DENIED_FORWARDED_REQUEST"
  );
});

test("development mode, enablement, and loopback are each insufficient alone", () => {
  assert.equal(deniedCode({ env: { NODE_ENV: "development" } }), "DENIED_NOT_ENABLED");
  assert.equal(deniedCode({ host: "operator.example.invalid" }), "DENIED_NON_LOCAL");
  assert.equal(deniedCode({ env: { [OPERATOR_WRITE_ENABLE_ENV]: "true" } }), "DENIED_PRODUCTION_MODE");
});

test("denied result and response body expose no environment values or internal paths", () => {
  const result = evaluate({
    env: localEnv({
      NODE_ENV: "production",
      INTERNAL_SECRET_PATH: "/tmp/private/secret",
    }),
  });
  const body = operatorWriteDeniedResponseBody(result);
  const serialized = JSON.stringify({ result, body });

  assert.equal(OPERATOR_WRITE_DENIED_STATUS, 403);
  assert.equal(body.ok, false);
  assert.equal(body.error, OPERATOR_WRITE_DISABLED_ERROR);
  assert.equal(body.message, "Operator changes are not available in this runtime.");
  assert.doesNotMatch(serialized, /STAFFORDOS_LOCAL_OPERATOR_WRITES_ENABLED|INTERNAL_SECRET_PATH|\/tmp\/private|production|true/);
});

test("gate performs no mutation and denied assertion fails predictably", () => {
  let mutated = false;
  const env = { NODE_ENV: "development" };
  const result = evaluateOperatorWriteIsolation({ headers: headers({ host: "localhost:3000" }), env });

  if (result.allowed) {
    mutated = true;
  }

  assert.equal(mutated, false);
  assert.throws(
    () => assertOperatorWriteAllowed({ headers: headers({ host: "localhost:3000" }), env }),
    OperatorWriteIsolationError
  );
  assert.equal(assertOperatorWriteAllowed({ headers: headers({ host: "localhost:3000" }), env: localEnv() }).allowed, true);
});

test("all five POST route handlers call the canonical gate before mutation work", () => {
  assert.equal(postRouteFiles.length, 5);

  for (const routeFile of postRouteFiles) {
    const source = readFileSync(routeFile, "utf8");
    const marker = postRouteMutationMarkers.get(routeFile);
    const gateIndex = source.indexOf("evaluateOperatorWriteIsolation");
    const responseIndex = source.indexOf("operatorWriteDeniedResponseBody");
    const markerIndex = source.indexOf(marker);

    assert.match(source, /operatorWriteIsolation/);
    assert.ok(gateIndex >= 0, `${routeFile} must evaluate the canonical write gate`);
    assert.ok(responseIndex >= 0, `${routeFile} must return the canonical denial body`);
    assert.ok(markerIndex >= 0, `${routeFile} must contain expected mutation marker ${marker}`);
    assert.ok(gateIndex < markerIndex, `${routeFile} must gate before mutation marker`);
  }
});

test("server-action directives are guarded before form data and write helpers", () => {
  const allServerActionSource = serverActionFiles.map((file) => readFileSync(file, "utf8")).join("\n");
  const directives = allServerActionSource.match(/"use server";/g) || [];
  const guardCalls = allServerActionSource.match(/assertOperatorWriteAllowed\(\{ headers: await headers\(\), env: process\.env \}\);/g) || [];

  assert.equal(directives.length, 10);
  assert.equal(guardCalls.length, 10);

  for (const file of serverActionFiles) {
    const source = readFileSync(file, "utf8");
    const segments = source.split('"use server";').slice(1);
    for (const segment of segments) {
      const guardIndex = segment.indexOf("assertOperatorWriteAllowed");
      const formIndex = segment.indexOf("formData.get");
      const writeIndex = segment.indexOf("writeShopifixer");
      assert.ok(guardIndex >= 0, `${file} server action must call the canonical write gate`);
      assert.ok(formIndex === -1 || guardIndex < formIndex, `${file} must gate before formData reads`);
      assert.ok(writeIndex === -1 || guardIndex < writeIndex, `${file} must gate before write helpers`);
    }
  }
});

test("high and critical surfaces have no alternate unguarded route entry in focused scope", () => {
  for (const routeFile of postRouteFiles) {
    const source = readFileSync(routeFile, "utf8");
    assert.match(source, /if \(!writeGate\.allowed\)/);
    assert.doesNotMatch(source, /OPERATOR_WRITE_BYPASS|ALLOW_UNSAFE_OPERATOR_WRITE|\|\| true/);
  }

  for (const file of serverActionFiles) {
    const source = readFileSync(file, "utf8");
    assert.match(source, /assertOperatorWriteAllowed/);
    assert.doesNotMatch(source, /OPERATOR_WRITE_BYPASS|ALLOW_UNSAFE_OPERATOR_WRITE|\|\| true/);
  }
});

test("no duplicate isolation utility, hardcoded bypass, permissive fallback, or private logging exists", () => {
  const operatorLibFiles = allFilesUnder(path.join(frontendRoot, "lib/operator"));
  const utilityFiles = operatorLibFiles.filter((file) => path.basename(file) === "operatorWriteIsolation.ts");

  assert.deepEqual(utilityFiles, [gatePath]);
  assert.doesNotMatch(gateSource, /OPERATOR_WRITE_BYPASS|ALLOW_UNSAFE_OPERATOR_WRITE|NEXT_PUBLIC_.*WRITE|\|\| true/);
  assert.doesNotMatch(gateSource, /console\./);
});

test("client-supplied request fields cannot override the gate", () => {
  for (const routeFile of postRouteFiles) {
    const source = readFileSync(routeFile, "utf8");
    const gateIndex = source.indexOf("evaluateOperatorWriteIsolation");
    const bodyIndex = source.indexOf(".json()");
    assert.ok(bodyIndex === -1 || gateIndex < bodyIndex, `${routeFile} must gate before request body parsing`);
    assert.doesNotMatch(source, /body\?\.(STAFFORDOS_LOCAL_OPERATOR_WRITES_ENABLED|operatorWrite|writeGate|bypass)/);
  }
});

test("read-only /os, Professional, Personal, and operator loader paths are unaffected", () => {
  for (const file of allFilesUnder(path.join(frontendRoot, "app/os"))) {
    assert.doesNotMatch(readFileSync(file, "utf8"), /operatorWriteIsolation/);
  }

  for (const file of allFilesUnder(path.join(frontendRoot, "lib/operator"))) {
    if (path.basename(file).startsWith("load")) {
      assert.doesNotMatch(readFileSync(file, "utf8"), /operatorWriteIsolation/);
    }
  }
});

test("G004 documentation count remains consistent with current source", () => {
  const decision = JSON.parse(readFileSync(g004DecisionPath, "utf8"));
  const sourceServerActionCount = serverActionFiles
    .map((file) => readFileSync(file, "utf8"))
    .join("\n")
    .match(/"use server";/g)?.length || 0;
  const routeCount = postRouteFiles.filter((file) => existsSync(file) && /export async function POST/.test(readFileSync(file, "utf8"))).length;

  assert.equal(decision.verifiedCounts.operatorFrontendPostWriteOrExecutionRoutes, 5);
  assert.equal(decision.verifiedCounts.operatorFrontendServerActionDirectives, 10);
  assert.equal(routeCount, 5);
  assert.equal(sourceServerActionCount, 10);
});

test("all focused source paths are regular repository files", () => {
  for (const file of [gatePath, ...postRouteFiles, ...serverActionFiles]) {
    assert.equal(statSync(file).isFile(), true);
  }
});
