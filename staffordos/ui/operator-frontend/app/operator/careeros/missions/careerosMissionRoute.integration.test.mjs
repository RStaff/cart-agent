import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import Module from "node:module";
import path from "node:path";
import test from "node:test";

const frontendRoot = path.resolve(import.meta.dirname, "../../../../");
const requireFromFrontend = createRequire(path.join(frontendRoot, "package.json"));
const ts = requireFromFrontend("typescript");
const originalTsExtension = Module._extensions[".ts"];
Module._extensions[".ts"] = function compileTypeScript(module, filename) {
  const compiled = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { esModuleInterop: true, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  module._compile(compiled.outputText, filename);
};
process.on("exit", () => {
  if (originalTsExtension) Module._extensions[".ts"] = originalTsExtension;
  else delete Module._extensions[".ts"];
});

const access = requireFromFrontend(path.join(frontendRoot, "lib/operator/careerosBetaOperationsAccess.ts"));
const session = requireFromFrontend(path.join(frontendRoot, "lib/operator/staffordosOperatorSession.ts"));
const { getCareerOsBetaOperationsResult } = access;
const { CAREEROS_BETA_OPERATIONS_READ_PERMISSION, createStaffordOsOperatorSession } = session;

const now = new Date("2026-09-06T12:00:00.000Z");
const config = {
  issuer: "https://staffordos-operator.staffordmedia.ai",
  audience: "staffordos.operator.frontend.v1",
  allowedSubjects: ["synthetic-operator-subject"],
  sessionSecret: "synthetic-session-secret-with-enough-entropy",
  sessionTtlSeconds: 300,
  cookieSecure: false,
};

function sessionCookie(permissions) {
  const verified = {
    subject: "synthetic-operator-subject",
    issuer: config.issuer,
    audience: config.audience,
    issuedAt: Math.floor(now.getTime() / 1000),
    expiresAt: Math.floor(now.getTime() / 1000) + 300,
    jwtId: `synthetic-${permissions.join("-") || "none"}`,
    roles: [],
    permissions,
  };
  return createStaffordOsOperatorSession(verified, config, now).cookieValue;
}

test("route dependencies deny missing and insufficient operator authority before loading CareerOS", async () => {
  let reads = 0;
  const loadReadModel = async () => {
    reads += 1;
    return { summary: {} };
  };
  const missing = await getCareerOsBetaOperationsResult("", { config, now, loadReadModel });
  assert.equal(missing.status, 401);
  const denied = await getCareerOsBetaOperationsResult(sessionCookie([]), { config, now, loadReadModel });
  assert.equal(denied.status, 403);
  assert.equal(reads, 0);
});

test("authorized route dependency is read-only and returns only aggregate operations data", async () => {
  const result = await getCareerOsBetaOperationsResult(sessionCookie([CAREEROS_BETA_OPERATIONS_READ_PERMISSION]), {
    config,
    now,
    loadReadModel: async () => ({ summary: { totalOpportunities: 2 } }),
  });
  assert.equal(result.status, 200);
  assert.equal(result.body.authority, CAREEROS_BETA_OPERATIONS_READ_PERMISSION);
  assert.equal(result.body.customerDataMutated, false);
  assert.equal(result.body.privateCareerDataReturned, false);
  assert.equal(result.body.summary.totalOpportunities, 2);
});
