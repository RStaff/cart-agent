import assert from "node:assert/strict";
import { createRequire } from "node:module";
import Module from "node:module";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const envelopePath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/readModelEnvelope.ts");
const snapshotPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/sourceSnapshot.ts");
const decisionPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/decisionRegistry.ts");
const decisionSurfacePath = path.join(root, "staffordos/ui/operator-frontend/components/staffordos/DecisionSurface.tsx");
const workspaceContextPath = path.join(root, "staffordos/ui/operator-frontend/components/staffordos/WorkspaceContext.tsx");
const professionalModesPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/professionalModes.ts");
const workspaceRegistryPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/workspaceRegistry.ts");
const jobCommandSurfacePath = path.join(root, "staffordos/ui/operator-frontend/components/staffordos/JobCommandSurface.tsx");
const appOsRoot = path.join(root, "staffordos/ui/operator-frontend/app/os");
const componentsRoot = path.join(root, "staffordos/ui/operator-frontend/components/staffordos");
const libRoot = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos");
const requireFromFrontend = createRequire(path.join(root, "staffordos/ui/operator-frontend/package.json"));
const ts = requireFromFrontend("typescript");

const envelopeSource = readFileSync(envelopePath, "utf8");
const snapshotSource = readFileSync(snapshotPath, "utf8");
const decisionSource = readFileSync(decisionPath, "utf8");
const decisionSurfaceSource = readFileSync(decisionSurfacePath, "utf8");
const workspaceContextSource = readFileSync(workspaceContextPath, "utf8");
const professionalModesSource = readFileSync(professionalModesPath, "utf8");
const workspaceRegistrySource = readFileSync(workspaceRegistryPath, "utf8");
const jobCommandSurfaceSource = readFileSync(jobCommandSurfacePath, "utf8");

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

const snapshotModule = requireTypeScriptModule(snapshotPath);
const envelopeModule = requireTypeScriptModule(envelopePath);
const professionalModes = requireTypeScriptModule(professionalModesPath);

const {
  JOB_OPPORTUNITY_ADAPTER_READINESS,
  READ_MODEL_EMPTY_STATE_REASONS,
  createReadModelEnvelope,
  readModelStaticityLabel,
  validateReadModelEnvelope,
} = envelopeModule;

const { createSourceSnapshot } = snapshotModule;
const { PROFESSIONAL_MODES, PROFESSIONAL_NAVIGATION } = professionalModes;

function snapshotInput(overrides = {}) {
  return {
    snapshotId: "snapshot-synthetic-envelope-001",
    workspaceId: "professional",
    sourceType: "STATIC_REPOSITORY",
    sourceReference: "repository:synthetic-envelope-fixture",
    sourceAuthority: "Repository fixture authority",
    privacyClassification: "Synthetic public test fixture",
    capturedAt: "2026-08-02T10:00:00Z",
    observedAt: null,
    sourceUpdatedAt: "2026-08-01T10:00:00Z",
    freshness: "UNKNOWN",
    staticity: "STATIC_REPOSITORY",
    authorizationStatus: "NOT_REQUIRED_FOR_PUBLIC_STATIC",
    conflictStatus: "NO_CONFLICT",
    includedFields: ["summary"],
    excludedFields: ["rawContent"],
    limitations: ["Synthetic static source; not live."],
    contentDigest: "sha256:synthetic-read-model-source",
    adapterId: "synthetic-static-adapter",
    testOnly: true,
    ...overrides,
  };
}

function baseSnapshot(overrides = {}) {
  const input = snapshotInput(overrides);
  const result = createSourceSnapshot(input);

  assert.equal(result.valid, true, result.errors.map((error) => error.code).join(", "));
  return result.snapshot;
}

function baseEnvelope(overrides = {}) {
  return {
    readModelId: "read-model-synthetic-001",
    workspaceId: "professional",
    modelType: "syntheticOpportunityQueue",
    records: [{ id: "synthetic-record-001", label: "Synthetic record only" }],
    sourceSnapshotIds: ["snapshot-synthetic-envelope-001"],
    assembledAt: "2026-08-03T10:00:00Z",
    asOf: "2026-08-01T10:00:00Z",
    freshness: "UNKNOWN",
    staticity: "STATIC_REPOSITORY",
    authoritySummary: "Repository fixture authority",
    authorizationStatus: "NOT_REQUIRED_FOR_PUBLIC_STATIC",
    conflictStatus: "NO_CONFLICT",
    limitations: ["Synthetic read model; not live."],
    emptyStateReason: null,
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

function recursiveFiles(directory, extensions) {
  if (!existsSync(directory)) return [];
  const entries = readdirSync(directory).flatMap((entry) => {
    const fullPath = path.join(directory, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) return recursiveFiles(fullPath, extensions);
    return extensions.some((extension) => fullPath.endsWith(extension)) ? [fullPath] : [];
  });

  return entries.sort();
}

function sourceTextFor(files) {
  return files.map((file) => readFileSync(file, "utf8")).join("\n");
}

test("read-model envelope validates with explicit source snapshot authority", () => {
  const snapshot = baseSnapshot();
  const result = validateReadModelEnvelope(baseEnvelope(), [snapshot]);

  assert.equal(result.valid, true);
});

test("empty-state reasons cover all required fail-closed states", () => {
  assert.deepEqual(READ_MODEL_EMPTY_STATE_REASONS, [
    "NO_RECORDS",
    "SOURCE_UNAVAILABLE",
    "UNAUTHORIZED",
    "NOT_CONNECTED",
    "VALIDATION_FAILED",
    "PLANNED",
  ]);
});

test("static and historical read models require as-of or explicit unknown-date limitation", () => {
  const snapshot = baseSnapshot();

  assertInvalid(validateReadModelEnvelope(baseEnvelope({ asOf: null, limitations: ["Synthetic read model; not live."] }), [snapshot]), "AS_OF_REQUIRED");
  assert.equal(
    validateReadModelEnvelope(baseEnvelope({ asOf: null, limitations: ["As-of unknown for this synthetic read model."] }), [snapshot]).valid,
    true,
  );
});

test("assembledAt does not become source as-of", () => {
  const snapshot = baseSnapshot();

  assertInvalid(
    validateReadModelEnvelope(baseEnvelope({ asOf: "2026-08-03T10:00:00Z" }), [snapshot]),
    "ASSEMBLED_AT_USED_AS_AS_OF",
  );
});

test("unknown freshness remains unknown and is not inferred from assembly time", () => {
  const snapshot = baseSnapshot({ freshness: "UNKNOWN" });
  const result = createReadModelEnvelope(baseEnvelope({ freshness: "UNKNOWN" }), [snapshot]);

  assert.equal(result.valid, true);
  assert.equal(result.envelope.freshness, "UNKNOWN");
  assert.notEqual(result.envelope.asOf, result.envelope.assembledAt);
});

test("static source snapshots cannot produce live read models", () => {
  const snapshot = baseSnapshot({ staticity: "STATIC_REPOSITORY" });

  assertInvalid(validateReadModelEnvelope(baseEnvelope({ staticity: "LIVE_RUNTIME" }), [snapshot]), "STATIC_SOURCE_CLAIMS_LIVE");
});

test("captured snapshots do not claim live state", () => {
  const snapshot = baseSnapshot({
    sourceType: "PRIVATE_LOCAL",
    staticity: "CAPTURED_SNAPSHOT",
    authorizationStatus: "OPERATOR_CONFIRMED",
    freshness: "STALE",
  });
  const envelope = baseEnvelope({
    staticity: "CAPTURED_SNAPSHOT",
    freshness: "STALE",
    authorizationStatus: "OPERATOR_CONFIRMED",
  });

  assert.equal(validateReadModelEnvelope(envelope, [snapshot]).valid, true);
  assert.equal(readModelStaticityLabel(envelope), "Captured snapshot as of 2026-08-01T10:00:00Z");
});

test("missing authorization fails private read-model validation", () => {
  const snapshot = snapshotInput({
    sourceType: "PRIVATE_LOCAL",
    staticity: "CAPTURED_SNAPSHOT",
    authorizationStatus: "AUTHORIZATION_UNKNOWN",
  });

  assertInvalid(
    validateReadModelEnvelope(baseEnvelope({ staticity: "CAPTURED_SNAPSHOT", authorizationStatus: "AUTHORIZATION_UNKNOWN" }), [snapshot]),
    "SOURCE_SNAPSHOT_INVALID",
  );
});

test("denied authorization returns no private records", () => {
  const snapshot = baseSnapshot({
    sourceType: "PRIVATE_LOCAL",
    staticity: "CAPTURED_SNAPSHOT",
    authorizationStatus: "OPERATOR_CONFIRMED",
  });

  assertInvalid(
    validateReadModelEnvelope(
      baseEnvelope({ staticity: "CAPTURED_SNAPSHOT", authorizationStatus: "DENIED", emptyStateReason: "UNAUTHORIZED" }),
      [snapshot],
    ),
    "DENIED_AUTHORIZATION_HAS_RECORDS",
  );
  assert.equal(
    validateReadModelEnvelope(
      baseEnvelope({ records: [], staticity: "CAPTURED_SNAPSHOT", authorizationStatus: "DENIED", emptyStateReason: "UNAUTHORIZED" }),
      [snapshot],
    ).valid,
    true,
  );
});

test("blocking conflicts return no trusted envelope records", () => {
  const snapshot = baseSnapshot({ conflictStatus: "BLOCKING_CONFLICT" });

  assertInvalid(validateReadModelEnvelope(baseEnvelope(), [snapshot]), "BLOCKING_CONFLICT_NOT_DISCLOSED");
  assertInvalid(validateReadModelEnvelope(baseEnvelope({ conflictStatus: "BLOCKING_CONFLICT" }), [snapshot]), "BLOCKING_CONFLICT_HAS_RECORDS");
  assert.equal(
    validateReadModelEnvelope(baseEnvelope({ records: [], conflictStatus: "BLOCKING_CONFLICT", emptyStateReason: "VALIDATION_FAILED" }), [snapshot])
      .valid,
    true,
  );
});

test("non-blocking conflicts remain disclosed", () => {
  const snapshot = baseSnapshot({ conflictStatus: "CONFLICT_REQUIRES_REVIEW" });

  assertInvalid(validateReadModelEnvelope(baseEnvelope({ conflictStatus: "NO_CONFLICT" }), [snapshot]), "NON_BLOCKING_CONFLICT_NOT_DISCLOSED");
  assert.equal(validateReadModelEnvelope(baseEnvelope({ conflictStatus: "CONFLICT_REQUIRES_REVIEW" }), [snapshot]).valid, true);
});

test("planned placeholders contain no records and display planned language", () => {
  const snapshot = baseSnapshot({
    sourceType: "PLANNED_PLACEHOLDER",
    staticity: "PLANNED",
    freshness: "UNKNOWN",
  });
  const envelope = baseEnvelope({
    records: [],
    staticity: "PLANNED",
    sourceSnapshotIds: [snapshot.snapshotId],
    asOf: null,
    emptyStateReason: "PLANNED",
    limitations: ["Planned placeholder; not connected yet."],
  });

  assert.equal(validateReadModelEnvelope(envelope, [snapshot]).valid, true);
  assert.equal(readModelStaticityLabel(envelope), "Planned, not connected yet");
  assertInvalid(validateReadModelEnvelope({ ...envelope, records: [{ id: "synthetic-record" }] }, [snapshot]), "PLANNED_MODEL_HAS_RECORDS");
});

test("generated proposals are labeled generated and cannot claim source authority", () => {
  const generated = baseEnvelope({
    staticity: "GENERATED",
    sourceSnapshotIds: [],
    asOf: null,
    freshness: "UNKNOWN",
    authorizationStatus: "TEST_FIXTURE_ONLY",
    authoritySummary: "Generated proposal requiring review",
  });

  assert.equal(validateReadModelEnvelope(generated).valid, true);
  assert.equal(readModelStaticityLabel(generated), "Generated proposal, date unknown");
  assertInvalid(
    validateReadModelEnvelope({ ...generated, authoritySummary: "Verified official source truth" }),
    "GENERATED_AUTHORITY_OVERSTATED",
  );
});

test("provider-specific details do not leak into neutral envelope fields", () => {
  assertInvalid(validateReadModelEnvelope(baseEnvelope({ providerName: "Synthetic Provider" }), [baseSnapshot()]), "PROVIDER_DETAIL_LEAK");
});

test("read-model output is immutable", () => {
  const result = createReadModelEnvelope(baseEnvelope(), [baseSnapshot()]);

  assert.equal(result.valid, true);
  assert.ok(Object.isFrozen(result.envelope));
  assert.ok(Object.isFrozen(result.envelope.records));
  assert.ok(Object.isFrozen(result.envelope.limitations));
});

test("WorkspaceContext is presentation-only and not authorization", () => {
  assert.match(workspaceContextSource, /presentation only/);
  assert.match(workspaceContextSource, /not an authorization boundary/);
  assert.doesNotMatch(workspaceContextSource, /AUTHORIZED_BY_SERVER_POLICY|AUTHORIZED_BY_PROVIDER/);
});

test("Professional static mode records remain accurate", () => {
  const serializedModes = JSON.stringify(PROFESSIONAL_MODES);

  assert.match(serializedModes, /Career Home/);
  assert.match(serializedModes, /Job Search/);
  assert.match(serializedModes, /My Job/);
  assert.match(serializedModes, /No private Professional records are connected/);
  assert.match(serializedModes, /No live job automation is connected/);
  assert.match(serializedModes, /Planned only/);
  assert.deepEqual(PROFESSIONAL_NAVIGATION.filter((item) => item.href).map((item) => item.href), ["/os/professional", "/os/professional/jobs"]);
});

test("Stafford Media and Personal workspace behavior remain unchanged", () => {
  assert.match(workspaceRegistrySource, /id: "stafford-media"[\s\S]*?currentAuthorityStatus: "Current operating workspace."/);
  assert.match(workspaceRegistrySource, /id: "personal"[\s\S]*?currentAuthorityStatus: "Architecture defined; no runtime workflow yet."/);
  assert.doesNotMatch(workspaceRegistrySource, /id: "job-search"|id: "my-job"/);
});

test("historical decisions remain auditable and superseded records stay explicit", () => {
  assert.match(decisionSource, /staticity: "HISTORICAL"/);
  assert.match(decisionSource, /asOf: "2026-/);
  assert.match(decisionSource, /supersededBy: \["G002_00_PROFESSIONAL_MODE_AND_WORKSPACE_REGISTRY_RECONCILIATION"\]/);
  assert.match(decisionSurfaceSource, /Historical record/);
  assert.match(decisionSurfaceSource, /Not connected yet/);
});

test("Job Opportunity adapter readiness is blocked before private UI connection", () => {
  assert.equal(JOB_OPPORTUNITY_ADAPTER_READINESS.status, "BLOCKED_ON_SERVER_AUTHORIZATION");
  assert.notEqual(JOB_OPPORTUNITY_ADAPTER_READINESS.status, "READY_FOR_PRIVATE_UI_CONNECTION");
  assert.deepEqual(JOB_OPPORTUNITY_ADAPTER_READINESS.futurePath, [
    "PRIVATE JOB INTAKE FILE",
    "PRIVATE NORMALIZED OPPORTUNITY",
    "SERVER-SIDE PRIVATE SOURCE ADAPTER",
    "SOURCE SNAPSHOT",
    "REDACTED OPPORTUNITY QUEUE READ MODEL",
    "JOB COMMAND",
  ]);
});

test("/os source files do not import /operator loaders or server actions", () => {
  const osSource = sourceTextFor([...recursiveFiles(appOsRoot, [".ts", ".tsx"]), ...recursiveFiles(componentsRoot, [".ts", ".tsx"])]);

  assert.doesNotMatch(osSource, /from\s+["'][^"']*(?:app|components|lib)\/operator[^"']*["']/);
  assert.doesNotMatch(osSource, /from\s+["'][^"']*operator[^"']*(?:loader|action)[^"']*["']/i);
});

test("Job Command client component does not import filesystem or private-intake readers", () => {
  assert.doesNotMatch(jobCommandSurfaceSource, /from\s+["'](?:node:)?fs["']|readFileSync|readdirSync|statSync/);
  assert.doesNotMatch(jobCommandSurfaceSource, /privateJobOpportunityIntake|privateCareerEvidenceIntake/);
  assert.doesNotMatch(jobCommandSurfaceSource, /localStorage|sessionStorage|indexedDB/);
});

test("neutral contracts contain no write, execute, submit, send, or approve method", () => {
  const neutralSource = `${snapshotSource}\n${envelopeSource}`;

  assert.doesNotMatch(neutralSource, /export function (write|execute|submit|send|approve|reject|delete|persist|mutate)/);
  assert.doesNotMatch(neutralSource, /fetch\(|XMLHttpRequest|http\.request|https\.request|\/api\//);
  assert.doesNotMatch(neutralSource, /prisma|database|dbClient|sql`|from ".*db/i);
  assert.doesNotMatch(neutralSource, /ollama|openai|anthropic|gemini|modelAdapter/i);
});

test("static presentation fixtures contain no real private values", () => {
  const staticSource = sourceTextFor([
    envelopePath,
    snapshotPath,
    decisionPath,
    professionalModesPath,
    path.join(libRoot, "jobSearchCommandPresentation.ts"),
    path.join(libRoot, "jobOpportunityQueuePresentation.ts"),
  ]);

  assert.doesNotMatch(staticSource, /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  assert.doesNotMatch(staticSource, /\b\d{3}[-.]\d{3}[-.]\d{4}\b/);
  assert.doesNotMatch(staticSource, new RegExp(["linked", "in\\.com"].join(""), "i"));
  assert.doesNotMatch(staticSource, /providerRecordValue/i);
  assert.doesNotMatch(staticSource, new RegExp(["/", "Users", "/"].join("")));
  assert.doesNotMatch(staticSource, new RegExp(["staffordos", "private", "intake"].join("[-/]"), "i"));
  assert.doesNotMatch(staticSource, new RegExp(["\\.staffordos", "private"].join("\\/")));
});
