import assert from "node:assert/strict";
import { createRequire } from "node:module";
import Module from "node:module";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const adapterPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/primaryActionSourceAdapter.ts");
const validatorPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/chiefOfStaffValidator.ts");
const requireFromFrontend = createRequire(path.join(root, "staffordos/ui/operator-frontend/package.json"));
const ts = requireFromFrontend("typescript");

const adapterSource = readFileSync(adapterPath, "utf8");
const validatorSource = readFileSync(validatorPath, "utf8");

function compileModule(source, filename, overrides = {}) {
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  });
  const mod = new Module(filename);
  mod.filename = filename;
  mod.paths = Module._nodeModulePaths(path.dirname(filename));
  const originalRequire = mod.require.bind(mod);
  mod.require = (id) => overrides[id] || originalRequire(id);
  mod._compile(compiled.outputText, filename);
  return mod.exports;
}

const adapterModule = compileModule(adapterSource, adapterPath);
const validatorModule = compileModule(validatorSource, validatorPath);

const {
  PRIMARY_ACTION_EXCLUDED_FIELD_CLASSIFICATIONS,
  PRIMARY_ACTION_PERMISSION_DECISION_FIXTURE,
  PRIMARY_ACTION_SAFE_FIELD_ALLOWLIST,
  PRIMARY_ACTION_SOURCE_FAILURE_MESSAGE,
  adaptPrimaryActionSource,
  classifyPrimaryActionFreshness,
  toChiefOfStaffSourceFixture,
} = adapterModule;

const {
  STAFFORD_MEDIA_CHIEF_OF_STAFF_REQUEST_FIXTURE,
  validateChiefOfStaffResponse,
} = validatorModule;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function validPrimaryActionRecord(overrides = {}) {
  return {
    schema: "staffordos.operator_primary_action.v1",
    generated_at: "2026-08-03T10:00:00-04:00",
    primary_action: {
      action_id: "start-my-day-home-action",
      action_label: "Start My Day",
      next_step: "Open the current Stafford Media Home page before choosing deeper work.",
      why_now: "This is the current operating surface for the workday, main priority, current risks, and business health.",
      expected_outcome: "Ross continues from the existing Home page instead of a duplicate view.",
      product_id: "stafford-media",
      related_capability: "start-my-day",
      objective_id: "stafford-media-operating-loop",
      decision_id: "s008-start-my-day-static-home-action",
      merchant: "sensitive-merchant-name",
      email: "private@example.com",
      store_domain: "private-shop.myshopify.com",
      payment_reference: "pay_sensitive_reference",
      packet_id: "pkt_sensitive_reference",
      revenue_gap: "$12,000",
      priority_score: 100,
      confidence: 0.82,
      raw_notes: "Do not expose this private note.",
      ...overrides,
    },
  };
}

function validInput(overrides = {}) {
  return {
    adapterExecutionId: "s009-06-test-execution",
    requestWorkspaceId: "stafford-media",
    permissionDecision: clone(PRIMARY_ACTION_PERMISSION_DECISION_FIXTURE),
    primaryActionRecord: validPrimaryActionRecord(),
    sourceReference: "staffordos/snapshots/primary_action_snapshot_v1.json#primary_action",
    capturedAt: "2026-08-03T12:00:00-04:00",
    sourceUpdatedAt: "2026-08-03T10:00:00-04:00",
    privacyClassification: "owner_private_stafford_media_fixture",
    authorityClassification: "Derived read model",
    fallbackClassification: "REPOSITORY_BACKED_FALLBACK",
    ...overrides,
  };
}

function adapt(overrides = {}) {
  return adaptPrimaryActionSource(validInput(overrides));
}

function assertFailure(result, code) {
  assert.equal(result.ok, false);
  assert.equal(result.failureCode, code);
  assert.equal(result.operatorSafeMessage, PRIMARY_ACTION_SOURCE_FAILURE_MESSAGE);
  assert.equal(result.sourceSnapshot, undefined);
}

function outputText(value) {
  return JSON.stringify(value);
}

test("valid Stafford Media fixture produces a source snapshot", () => {
  const result = adapt();

  assert.equal(result.ok, true);
  assert.equal(result.sourceSnapshot.title, "Start My Day");
  assert.equal(result.sourceSnapshot.immutable, true);
});

test("snapshot uses the expected explicit source type", () => {
  const result = adapt();

  assert.equal(result.sourceSnapshot.sourceType, "primary_action_snapshot");
});

test("snapshot workspace is Stafford Media", () => {
  const result = adapt();

  assert.equal(result.sourceSnapshot.workspaceId, "stafford-media");
});

test("exact safe fields are included", () => {
  const result = adapt();
  const included = result.auditSummary.includedFields;

  assert.deepEqual(included, PRIMARY_ACTION_SAFE_FIELD_ALLOWLIST.map((field) => field.field));
  assert.equal(result.sourceSnapshot.structuredFacts.actionId, "start-my-day-home-action");
  assert.equal(result.sourceSnapshot.structuredFacts.relatedObjectiveId, "stafford-media-operating-loop");
  assert.equal(result.sourceSnapshot.structuredFacts.relatedDecisionId, "s008-start-my-day-static-home-action");
});

test("sensitive field classifications are excluded", () => {
  const result = adapt();
  const excluded = new Set(result.sourceSnapshot.excludedFieldClassifications);

  for (const classification of [
    "merchant_or_customer_identifier",
    "customer_contact",
    "store_domain",
    "payment_reference",
    "packet_or_checkout_identifier",
    "revenue_or_numeric_business_metric",
    "priority_or_confidence_score",
    "raw_notes_or_contact_content",
  ]) {
    assert.ok(excluded.has(classification), `${classification} should be excluded`);
  }
});

test("excluded sensitive values do not appear anywhere in adapter output", () => {
  const result = adapt();
  const text = outputText(result);

  for (const forbidden of [
    "sensitive-merchant-name",
    "private@example.com",
    "private-shop.myshopify.com",
    "pay_sensitive_reference",
    "pkt_sensitive_reference",
    "$12,000",
    "Do not expose this private note.",
  ]) {
    assert.doesNotMatch(text, new RegExp(forbidden.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("permission denied returns no snapshot", () => {
  const permissionDecision = { ...PRIMARY_ACTION_PERMISSION_DECISION_FIXTURE, allowed: false };
  const result = adapt({ permissionDecision });

  assertFailure(result, "PERMISSION_DENIED");
});

test("missing permission returns no snapshot", () => {
  const result = adapt({ permissionDecision: null });

  assertFailure(result, "PERMISSION_MISSING");
});

test("workspace mismatch returns no snapshot", () => {
  const permissionDecision = { ...PRIMARY_ACTION_PERMISSION_DECISION_FIXTURE, workspaceId: "personal" };
  const result = adapt({ permissionDecision });

  assertFailure(result, "PERMISSION_WORKSPACE_MISMATCH");
});

test("Professional input returns no snapshot", () => {
  const permissionDecision = { ...PRIMARY_ACTION_PERMISSION_DECISION_FIXTURE, workspaceId: "professional" };
  const result = adapt({ requestWorkspaceId: "professional", permissionDecision });

  assertFailure(result, "WORKSPACE_NOT_ALLOWED");
});

test("Personal input returns no snapshot", () => {
  const permissionDecision = { ...PRIMARY_ACTION_PERMISSION_DECISION_FIXTURE, workspaceId: "personal" };
  const result = adapt({ requestWorkspaceId: "personal", permissionDecision });

  assertFailure(result, "WORKSPACE_NOT_ALLOWED");
});

test("missing timestamp does not classify as Current", () => {
  const result = adapt({
    sourceUpdatedAt: null,
    primaryActionRecord: {
      schema: "staffordos.operator_primary_action.v1",
      primary_action: validPrimaryActionRecord().primary_action,
    },
  });

  assert.equal(result.ok, true);
  assert.equal(result.sourceSnapshot.sourceUpdatedAt, null);
  assert.notEqual(result.sourceSnapshot.freshness, "Current");
  assert.equal(result.sourceSnapshot.freshness, "Unknown");
});

test("stale source is disclosed", () => {
  const result = adapt({
    sourceUpdatedAt: "2026-01-01T00:00:00-05:00",
    capturedAt: "2026-08-03T12:00:00-04:00",
  });

  assert.equal(result.ok, true);
  assert.equal(result.sourceSnapshot.freshness, "Stale");
  assert.match(result.sourceSnapshot.limitations.join(" "), /stale/i);
});

test("conflict is preserved for review", () => {
  const result = adapt({
    conflicts: [
      {
        code: "STATIC_RUNTIME_CONFLICT",
        description: "Static registry names Start My Day while the supplied read model names another primary action.",
        sourceReferences: [
          "staffordos/ui/operator-frontend/lib/staffordos/actionRegistry.ts#start-my-day-home-action",
          "staffordos/snapshots/primary_action_snapshot_v1.json#primary_action",
        ],
        severity: "warning",
      },
    ],
  });

  assert.equal(result.ok, true);
  assert.equal(result.sourceSnapshot.conflictStatus.status, "Needs review");
  assert.equal(result.warnings.some((warning) => warning.code === "SOURCE_CONFLICT_DISCLOSED"), true);
});

test("unsafe conflict fails closed", () => {
  const result = adapt({
    conflicts: [
      {
        code: "SOURCE_CONFLICT",
        description: "Two supplied sources disagree and authority cannot be established.",
        sourceReferences: ["source-a", "source-b"],
        severity: "blocking",
      },
    ],
  });

  assertFailure(result, "SOURCE_CONFLICT");
  assert.equal(result.auditSummary.conflictStatus, "Blocked");
});

test("generated fallback is labeled and does not become runtime truth", () => {
  const result = adapt({ fallbackClassification: "GENERATED_PLACEHOLDER" });

  assertFailure(result, "GENERATED_FALLBACK_CONFLICT");
  assert.equal(result.auditSummary.fallbackClassification, "GENERATED_PLACEHOLDER");
});

test("malformed source fails closed", () => {
  const result = adapt({
    primaryActionRecord: {
      schema: "staffordos.operator_primary_action.v1",
      primary_action: {
        action_id: "",
      },
    },
  });

  assertFailure(result, "SOURCE_MALFORMED");
});

test("provenance is preserved", () => {
  const result = adapt();

  assert.equal(result.sourceSnapshot.exactSourceReference, "staffordos/snapshots/primary_action_snapshot_v1.json#primary_action");
  assert.equal(result.sourceSnapshot.adapterId, "s009-06-primary-action-source-adapter");
  assert.equal(result.auditSummary.sourceReference, result.sourceSnapshot.exactSourceReference);
});

test("source reference is exact and missing provenance fails closed", () => {
  const result = adapt({ sourceReference: "" });

  assertFailure(result, "PROVENANCE_MISSING");
});

test("audit summary contains included and excluded classifications", () => {
  const result = adapt();

  assert.ok(result.auditSummary.includedFields.includes("operatorFacingTitle"));
  assert.ok(result.auditSummary.excludedFieldClassifications.includes("customer_contact"));
});

test("audit summary contains no sensitive values", () => {
  const result = adapt();
  const text = outputText(result.auditSummary);

  assert.doesNotMatch(text, /private@example\.com/);
  assert.doesNotMatch(text, /private-shop\.myshopify\.com/);
  assert.doesNotMatch(text, /sensitive-merchant-name/);
});

test("adapter does not mutate input", () => {
  const input = validInput();
  const before = clone(input);

  adaptPrimaryActionSource(input);

  assert.deepEqual(input, before);
});

test("adapter exports no write methods", () => {
  const exportedNames = Object.keys(adapterModule).join("\n");

  assert.doesNotMatch(exportedNames, /\b(create|update|delete|verify|reject|complete|execute|approve|persist|sync)\w*/i);
});

test("adapter imports no write-capable modules", () => {
  assert.doesNotMatch(adapterSource, /from\s+["'][^"']*\/operator/);
  assert.doesNotMatch(adapterSource, /writeShopifixer/);
  assert.doesNotMatch(adapterSource, /ExecutePrimaryActionButton/);
  assert.doesNotMatch(adapterSource, /LeadActions/);
  assert.doesNotMatch(adapterSource, /WorkdayControlPanel/);
});

test("no API database queue provider model or operator-page import exists", () => {
  for (const forbidden of [
    "fetch(",
    "XMLHttpRequest",
    "prisma",
    "ollama",
    "openai",
    "anthropic",
    "google",
    "embedding",
    "vector",
    "/api/operator",
    "app/operator",
    "app/api/operator",
    "execFile",
    "writeFileSync",
  ]) {
    assert.doesNotMatch(adapterSource.toLowerCase(), new RegExp(forbidden.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("successful snapshot is compatible with S009 source contracts", () => {
  const result = adapt();
  const source = toChiefOfStaffSourceFixture(result.sourceSnapshot);
  const request = {
    ...clone(STAFFORD_MEDIA_CHIEF_OF_STAFF_REQUEST_FIXTURE),
    allowedSourceTypes: ["action"],
    sourceSnapshotIds: [source.sourceId],
    policyContext: {
      ...clone(STAFFORD_MEDIA_CHIEF_OF_STAFF_REQUEST_FIXTURE.policyContext),
      authorizedPrivacyClassifications: [source.privacyClassification],
    },
  };
  const claimStatement = `${source.title} is the current primary action.`;
  const response = {
    responseId: "s009-06-compatibility-response",
    workspaceId: "stafford-media",
    headline: "Current primary action.",
    summary: "The supplied source snapshot identifies the current primary action.",
    attentionItems: [
      {
        title: source.title,
        reason: "It is the supplied primary action source.",
        claimIds: ["claim-primary-action-current"],
      },
    ],
    supportingClaims: [
      {
        claimId: "claim-primary-action-current",
        claimType: "SOURCE_FACT",
        statement: claimStatement,
        supportingSourceIds: [source.sourceId],
        confidenceClassification: "High confidence",
        limitation: "Source snapshot only; no execution or approval authority.",
        workspaceId: "stafford-media",
        authorityStatus: "Informational only",
      },
    ],
    missingInformation: [],
    candidateActions: [],
    risks: [],
    approvalsNeeded: [],
    proofExpected: "No proof is claimed by this compatibility check.",
    learningReferences: [],
    sources: [
      {
        sourceId: source.sourceId,
        exactSourceReference: source.exactSourceReference,
      },
    ],
    limitations: ["Compatibility fixture only."],
    generatedAt: "2026-08-03T12:00:00-04:00",
    authorityStatus: "Informational only",
  };

  const validation = validateChiefOfStaffResponse(request, [source], response);

  assert.equal(source.sourceType, "action");
  assert.equal(validation.valid, true, validation.errors.map((error) => error.code).join(", "));
});

test("permission fixture remains visibly test-only", () => {
  const result = adapt();

  assert.equal(PRIMARY_ACTION_PERMISSION_DECISION_FIXTURE.testOnly, true);
  assert.equal(result.auditSummary.testOnly, true);
  assert.match(result.sourceSnapshot.limitations.join(" "), /static test permission fixture/i);
});

test("client-selected workspace alone is insufficient", () => {
  const result = adapt({ permissionDecision: null, requestWorkspaceId: "stafford-media" });

  assertFailure(result, "PERMISSION_MISSING");
});

test("source record cannot override trusted workspace context", () => {
  const result = adapt({
    primaryActionRecord: validPrimaryActionRecord({ workspaceId: "personal" }),
  });

  assert.equal(result.ok, true);
  assert.equal(result.sourceSnapshot.workspaceId, "stafford-media");
  assert.doesNotMatch(outputText(result.sourceSnapshot), /personal/);
});

test("sourceUpdatedAt and capturedAt are preserved", () => {
  const result = adapt();

  assert.equal(result.sourceSnapshot.sourceUpdatedAt, "2026-08-03T10:00:00-04:00");
  assert.equal(result.sourceSnapshot.capturedAt, "2026-08-03T12:00:00-04:00");
});

test("freshness classifier uses deterministic fixture policy", () => {
  assert.equal(
    classifyPrimaryActionFreshness("2026-08-03T11:00:00-04:00", "2026-08-03T12:00:00-04:00").freshness,
    "Current",
  );
  assert.equal(
    classifyPrimaryActionFreshness("2026-07-31T12:00:00-04:00", "2026-08-03T12:00:00-04:00").freshness,
    "Recent",
  );
  assert.equal(
    classifyPrimaryActionFreshness("2026-06-01T12:00:00-04:00", "2026-08-03T12:00:00-04:00").freshness,
    "Historical",
  );
  assert.equal(
    classifyPrimaryActionFreshness("2026-01-01T12:00:00-05:00", "2026-08-03T12:00:00-04:00").freshness,
    "Stale",
  );
});

test("excluded classification catalog contains required categories", () => {
  for (const classification of [
    "merchant_or_customer_identifier",
    "customer_contact",
    "payment_reference",
    "credential_or_secret",
    "execution_or_mutation_instruction",
  ]) {
    assert.ok(PRIMARY_ACTION_EXCLUDED_FIELD_CLASSIFICATIONS.includes(classification));
  }
});
