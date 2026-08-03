import assert from "node:assert/strict";
import { createRequire } from "node:module";
import Module from "node:module";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const snapshotPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/sourceSnapshot.ts");
const requireFromFrontend = createRequire(path.join(root, "staffordos/ui/operator-frontend/package.json"));
const ts = requireFromFrontend("typescript");
const snapshotSource = readFileSync(snapshotPath, "utf8");

function requireTypeScriptModule(modulePath) {
  const originalTsExtension = Module._extensions[".ts"];
  Module._extensions[".ts"] = function compileTypeScriptModule(mod, filename) {
    const source = readFileSync(filename, "utf8");
    const compiled = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      },
    });
    mod._compile(compiled.outputText, filename);
  };

  try {
    return requireFromFrontend(modulePath);
  } finally {
    if (originalTsExtension) {
      Module._extensions[".ts"] = originalTsExtension;
    } else {
      delete Module._extensions[".ts"];
    }
  }
}

const {
  DISPLAYED_DATA_SOURCE_TYPES,
  SOURCE_AUTHORIZATION_STATUS_VALUES,
  SOURCE_CONFLICT_STATUS_VALUES,
  SOURCE_FRESHNESS_VALUES,
  SOURCE_STATICITY_VALUES,
  createSourceSnapshot,
  sourceSnapshotDisplayLabel,
  validateSourceSnapshot,
} = requireTypeScriptModule(snapshotPath);

function baseSnapshot(overrides = {}) {
  return {
    snapshotId: "snapshot-synthetic-static-001",
    workspaceId: "professional",
    sourceType: "STATIC_REPOSITORY",
    sourceReference: "repository:synthetic-static-fixture",
    sourceAuthority: "Repository fixture authority",
    privacyClassification: "Synthetic public test fixture",
    capturedAt: "2026-08-03T12:00:00Z",
    observedAt: null,
    sourceUpdatedAt: "2026-08-01T12:00:00Z",
    freshness: "UNKNOWN",
    staticity: "STATIC_REPOSITORY",
    authorizationStatus: "NOT_REQUIRED_FOR_PUBLIC_STATIC",
    conflictStatus: "NO_CONFLICT",
    includedFields: ["summary"],
    excludedFields: ["rawContent"],
    limitations: ["Synthetic static repository reference; not live."],
    contentDigest: "sha256:synthetic-source-snapshot",
    adapterId: "synthetic-static-adapter",
    testOnly: true,
    ...overrides,
  };
}

function errorCodes(result) {
  return result.errors.map((error) => error.code);
}

function assertInvalid(result, expectedCode) {
  assert.equal(result.valid, false);
  assert.ok(errorCodes(result).includes(expectedCode), `expected ${expectedCode}, got ${errorCodes(result).join(", ")}`);
}

test("canonical displayed source types are explicit", () => {
  assert.deepEqual(DISPLAYED_DATA_SOURCE_TYPES, [
    "STATIC_REPOSITORY",
    "HISTORICAL_RECORD",
    "PRIVATE_LOCAL",
    "RUNTIME_READ_MODEL",
    "PROVIDER_CONFIRMED",
    "OPERATOR_CONFIRMED",
    "GENERATED_PROPOSAL",
    "PLANNED_PLACEHOLDER",
  ]);
});

test("staticity, freshness, authorization, and conflict values are explicit", () => {
  assert.deepEqual(SOURCE_STATICITY_VALUES, [
    "LIVE_RUNTIME",
    "CAPTURED_SNAPSHOT",
    "STATIC_REPOSITORY",
    "HISTORICAL",
    "GENERATED",
    "PLANNED",
  ]);
  assert.deepEqual(SOURCE_FRESHNESS_VALUES, ["CURRENT", "RECENT", "HISTORICAL", "STALE", "UNKNOWN"]);
  assert.ok(SOURCE_AUTHORIZATION_STATUS_VALUES.includes("PRESENTATION_ONLY_NOT_AUTHORIZED"));
  assert.ok(SOURCE_CONFLICT_STATUS_VALUES.includes("BLOCKING_CONFLICT"));
});

test("static repository snapshots validate only when labeled static", () => {
  assert.equal(validateSourceSnapshot(baseSnapshot()).valid, true);
  assertInvalid(validateSourceSnapshot(baseSnapshot({ staticity: "LIVE_RUNTIME" })), "STATIC_REPOSITORY_STATICITY_REQUIRED");
});

test("static records include timestamp or an explicit unknown-date limitation", () => {
  assertInvalid(
    validateSourceSnapshot(baseSnapshot({ capturedAt: null, observedAt: null, sourceUpdatedAt: null, limitations: ["Synthetic fixture only."] })),
    "TIMESTAMP_OR_UNKNOWN_DATE_LIMITATION_REQUIRED",
  );
  assert.equal(
    validateSourceSnapshot(
      baseSnapshot({
        capturedAt: null,
        observedAt: null,
        sourceUpdatedAt: null,
        limitations: ["Source date unknown for this synthetic fixture."],
      }),
    ).valid,
    true,
  );
});

test("static, historical, generated, and planned labels use operator language", () => {
  assert.equal(sourceSnapshotDisplayLabel(baseSnapshot()), "Static reference as of 2026-08-01T12:00:00Z");
  assert.equal(sourceSnapshotDisplayLabel(baseSnapshot({ staticity: "HISTORICAL", sourceUpdatedAt: null })), "Historical record as of 2026-08-03T12:00:00Z");
  assert.equal(sourceSnapshotDisplayLabel(baseSnapshot({ staticity: "GENERATED", sourceUpdatedAt: null })), "Generated proposal from 2026-08-03T12:00:00Z");
  assert.equal(sourceSnapshotDisplayLabel(baseSnapshot({ staticity: "PLANNED", capturedAt: null, sourceUpdatedAt: null })), "Planned, not connected yet");
});

test("historical records must remain historical", () => {
  assert.equal(validateSourceSnapshot(baseSnapshot({ sourceType: "HISTORICAL_RECORD", staticity: "HISTORICAL", freshness: "HISTORICAL" })).valid, true);
  assertInvalid(validateSourceSnapshot(baseSnapshot({ sourceType: "HISTORICAL_RECORD", staticity: "STATIC_REPOSITORY" })), "HISTORICAL_STATICITY_REQUIRED");
});

test("captured snapshots do not claim live state", () => {
  const snapshot = baseSnapshot({
    sourceType: "PRIVATE_LOCAL",
    staticity: "CAPTURED_SNAPSHOT",
    authorizationStatus: "OPERATOR_CONFIRMED",
    freshness: "STALE",
  });

  assert.equal(validateSourceSnapshot(snapshot).valid, true);
  assert.equal(sourceSnapshotDisplayLabel(snapshot), "Captured snapshot from 2026-08-01T12:00:00Z");
});

test("private local snapshots fail closed without authorization", () => {
  assertInvalid(
    validateSourceSnapshot(
      baseSnapshot({
        sourceType: "PRIVATE_LOCAL",
        staticity: "CAPTURED_SNAPSHOT",
        authorizationStatus: "AUTHORIZATION_UNKNOWN",
      }),
    ),
    "PRIVATE_AUTHORIZATION_REQUIRED",
  );
});

test("generated proposals cannot claim source authority", () => {
  assertInvalid(
    validateSourceSnapshot(
      baseSnapshot({
        sourceType: "GENERATED_PROPOSAL",
        staticity: "GENERATED",
        sourceAuthority: "Verified source truth",
      }),
    ),
    "GENERATED_SOURCE_AUTHORITY_OVERSTATED",
  );
});

test("planned placeholders must be labeled planned", () => {
  assertInvalid(
    validateSourceSnapshot(baseSnapshot({ sourceType: "PLANNED_PLACEHOLDER", staticity: "STATIC_REPOSITORY" })),
    "PLANNED_STATICITY_REQUIRED",
  );
});

test("source snapshot output is immutable", () => {
  const result = createSourceSnapshot(baseSnapshot());

  assert.equal(result.valid, true);
  assert.ok(Object.isFrozen(result.snapshot));
  assert.ok(Object.isFrozen(result.snapshot.includedFields));
});

test("source snapshot contract has no network, database, model, or write path", () => {
  assert.doesNotMatch(snapshotSource, /fetch\(|XMLHttpRequest|http\.request|https\.request|\/api\//);
  assert.doesNotMatch(snapshotSource, /prisma|database|dbClient|sql`|from ".*db/i);
  assert.doesNotMatch(snapshotSource, /ollama|openai|anthropic|gemini|modelAdapter/i);
  assert.doesNotMatch(snapshotSource, /writeFile|appendFile|unlink|exec\(|spawn\(/);
});
