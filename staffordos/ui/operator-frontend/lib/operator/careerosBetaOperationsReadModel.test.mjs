import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import Module from "node:module";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const frontendRoot = path.join(root, "staffordos/ui/operator-frontend");
const requireFromFrontend = createRequire(path.join(frontendRoot, "package.json"));
const ts = requireFromFrontend("typescript");
const originalTsExtension = Module._extensions[".ts"];

Module._extensions[".ts"] = function compileTypeScript(module, filename) {
  const compiled = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  });
  module._compile(compiled.outputText, filename);
};

process.on("exit", () => {
  if (originalTsExtension) Module._extensions[".ts"] = originalTsExtension;
  else delete Module._extensions[".ts"];
});

const readModelModule = requireFromFrontend(path.join(frontendRoot, "lib/operator/careerosBetaOperationsReadModel.ts"));
const accessModule = requireFromFrontend(path.join(frontendRoot, "lib/operator/careerosBetaOperationsAccess.ts"));
const sessionModule = requireFromFrontend(path.join(frontendRoot, "lib/operator/staffordosOperatorSession.ts"));

const {
  buildCareerOsBetaOperationsReadModel,
  rowsFromLocalStoreData,
  CAREEROS_BETA_OPERATIONS_MODEL_VERSION,
} = readModelModule;
const { getCareerOsBetaOperationsResult } = accessModule;
const {
  CAREEROS_BETA_OPERATIONS_READ_PERMISSION,
  STAFFORDOS_OPERATOR_SESSION_COOKIE,
  createStaffordOsOperatorSession,
} = sessionModule;

const now = new Date("2026-08-29T12:00:00.000Z");
const nowSeconds = Math.floor(now.getTime() / 1000);
const operatorSubject = "synthetic-operator-subject";

const sentinels = [
  "PRIVATE_CAREER_STORY_SENTINEL",
  "PRIVATE_CAREER_FACT_SENTINEL",
  "PRIVATE_SOURCE_SENTINEL",
  "PRIVATE_RESUME_SENTINEL",
  "PRIVATE_NOTE_SENTINEL",
  "PRIVATE_JOB_DESCRIPTION_SENTINEL",
  "PRIVATE_INVITE_SENTINEL",
  "PRIVATE_PASSWORD_HASH_SENTINEL",
  "PRIVATE_SESSION_TOKEN_SENTINEL",
  "PRIVATE_EMAIL_SENTINEL",
];

function config(overrides = {}) {
  return {
    issuer: "https://staffordos-operator.staffordmedia.ai",
    audience: "staffordos.operator.frontend.v1",
    allowedSubjects: [operatorSubject],
    issuerBaseUrl: "http://127.0.0.1:8787",
    publicKeyUrl: "http://127.0.0.1:8787/public-key",
    publicKeyPem: "synthetic-public-key",
    sessionSecret: "synthetic-session-secret-with-enough-entropy",
    sessionTtlSeconds: 300,
    cookieSecure: false,
    ...overrides,
  };
}

function verifiedOperator(permissions = [CAREEROS_BETA_OPERATIONS_READ_PERMISSION]) {
  return {
    subject: operatorSubject,
    issuer: "https://staffordos-operator.staffordmedia.ai",
    audience: "staffordos.operator.frontend.v1",
    roles: permissions.includes(CAREEROS_BETA_OPERATIONS_READ_PERMISSION) ? ["careeros_beta_operations_viewer"] : [],
    permissions,
    jwtId: `synthetic-jti-${permissions.join("-") || "none"}`,
    issuedAt: nowSeconds,
    expiresAt: nowSeconds + 300,
  };
}

function sessionCookie(permissions) {
  return createStaffordOsOperatorSession(verifiedOperator(permissions), config(), now).cookieValue;
}

function syntheticRows() {
  return rowsFromLocalStoreData({
    users: [
      {
        id: "usr_alpha",
        email: "PRIVATE_EMAIL_SENTINEL@example.com",
        password: { hash: "PRIVATE_PASSWORD_HASH_SENTINEL", salt: "PRIVATE_PASSWORD_SALT_SENTINEL" },
        createdAt: "2026-08-20T08:00:00.000Z",
        updatedAt: "2026-08-29T10:00:00.000Z",
      },
      {
        id: "usr_beta",
        email: "PRIVATE_EMAIL_SENTINEL_2@example.com",
        passwordHash: "PRIVATE_PASSWORD_HASH_SENTINEL",
        tokenDigest: "PRIVATE_SESSION_TOKEN_SENTINEL",
        createdAt: "2026-08-01T08:00:00.000Z",
        updatedAt: "2026-08-01T08:00:00.000Z",
      },
    ],
    tenants: [
      { id: "ten_alpha", name: "PRIVATE_CAREER_STORY_SENTINEL", createdAt: "2026-08-20T08:00:00.000Z" },
    ],
    memberships: [{ id: "mem_alpha", tenantId: "ten_alpha", userId: "usr_alpha", role: "OWNER", createdAt: "2026-08-20T08:00:00.000Z" }],
    sessions: [
      {
        id: "ses_alpha",
        tokenDigest: "PRIVATE_SESSION_TOKEN_SENTINEL",
        tenantId: "ten_alpha",
        userId: "usr_alpha",
        expiresAt: "2026-09-01T00:00:00.000Z",
        createdAt: "2026-08-20T08:00:00.000Z",
        lastUsedAt: "2026-08-29T10:30:00.000Z",
      },
      {
        id: "ses_beta",
        tokenDigest: "PRIVATE_SESSION_TOKEN_SENTINEL",
        userId: "usr_beta",
        expiresAt: "2026-08-02T00:00:00.000Z",
        createdAt: "2026-08-01T08:00:00.000Z",
        lastUsedAt: "2026-08-01T08:01:30.000Z",
      },
    ],
    profiles: [
      {
        id: "profile_alpha",
        tenantId: "ten_alpha",
        userId: "usr_alpha",
        displayName: "PRIVATE_CAREER_STORY_SENTINEL",
        headline: "PRIVATE_CAREER_STORY_SENTINEL",
        status: "ACTIVE",
        version: 3,
        createdAt: "2026-08-20T09:00:00.000Z",
        updatedAt: "2026-08-29T09:00:00.000Z",
      },
    ],
    onboarding: [{ id: "onboarding_alpha", tenantId: "ten_alpha", userId: "usr_alpha", profileId: "profile_alpha", stage: "READY_FOR_CAPABILITIES", updatedAt: "2026-08-22T09:00:00.000Z" }],
    sources: [
      {
        id: "source_alpha_1",
        tenantId: "ten_alpha",
        userId: "usr_alpha",
        profileId: "profile_alpha",
        sourceStatus: "READY",
        originalFilename: "PRIVATE_RESUME_SENTINEL.pdf",
        textContent: "PRIVATE_SOURCE_SENTINEL",
        createdAt: "2026-08-20T10:00:00.000Z",
        updatedAt: "2026-08-22T10:00:00.000Z",
      },
      {
        id: "source_alpha_2",
        tenantId: "ten_alpha",
        userId: "usr_alpha",
        profileId: "profile_alpha",
        sourceStatus: "READY",
        textContent: "PRIVATE_CAREER_STORY_SENTINEL",
        createdAt: "2026-08-21T10:00:00.000Z",
        updatedAt: "2026-08-22T11:00:00.000Z",
      },
    ],
    candidateFacts: [
      {
        id: "candidate_alpha_1",
        candidateFactId: "candidate_fact_alpha_1",
        tenantId: "ten_alpha",
        userId: "usr_alpha",
        profileId: "profile_alpha",
        sourceId: "source_alpha_1",
        status: "CONFIRMED",
        statement: "PRIVATE_CAREER_FACT_SENTINEL",
        sourceExcerpt: "PRIVATE_SOURCE_SENTINEL",
        createdAt: "2026-08-22T12:00:00.000Z",
        updatedAt: "2026-08-23T12:00:00.000Z",
      },
      {
        id: "candidate_alpha_2",
        candidateFactId: "candidate_fact_alpha_2",
        tenantId: "ten_alpha",
        userId: "usr_alpha",
        profileId: "profile_alpha",
        sourceId: "source_alpha_2",
        status: "CORRECTED",
        statement: "PRIVATE_CAREER_FACT_SENTINEL",
        sourceExcerpt: "PRIVATE_SOURCE_SENTINEL",
        createdAt: "2026-08-22T13:00:00.000Z",
        updatedAt: "2026-08-23T13:00:00.000Z",
      },
    ],
    reviewDecisions: [
      {
        id: "review_alpha",
        tenantId: "ten_alpha",
        userId: "usr_alpha",
        candidateFactId: "candidate_fact_alpha_1",
        decision: "CONFIRM",
        previousStatement: "PRIVATE_CAREER_FACT_SENTINEL",
        activeStatement: "PRIVATE_CAREER_FACT_SENTINEL",
        createdAt: "2026-08-23T13:00:00.000Z",
      },
    ],
    careerFacts: [
      {
        id: "fact_alpha_1",
        tenantId: "ten_alpha",
        userId: "usr_alpha",
        profileId: "profile_alpha",
        status: "CUSTOMER_CONFIRMED",
        authorityState: "CUSTOMER_CONFIRMED_SOURCE_BACKED",
        statement: "PRIVATE_CAREER_FACT_SENTINEL",
        sourceExcerpt: "PRIVATE_SOURCE_SENTINEL",
        createdAt: "2026-08-23T14:00:00.000Z",
        updatedAt: "2026-08-24T14:00:00.000Z",
      },
      {
        id: "fact_alpha_2",
        tenantId: "ten_alpha",
        userId: "usr_alpha",
        profileId: "profile_alpha",
        status: "CUSTOMER_CONFIRMED",
        authorityState: "CUSTOMER_CONFIRMED_SOURCE_BACKED",
        statement: "PRIVATE_CAREER_FACT_SENTINEL",
        sourceExcerpt: "PRIVATE_SOURCE_SENTINEL",
        createdAt: "2026-08-23T15:00:00.000Z",
        updatedAt: "2026-08-24T15:00:00.000Z",
      },
    ],
    contextClaims: [
      {
        id: "context_alpha",
        tenantId: "ten_alpha",
        userId: "usr_alpha",
        profileId: "profile_alpha",
        displayValue: "PRIVATE_CAREER_FACT_SENTINEL",
        sourceAnchor: { excerpt: "PRIVATE_SOURCE_SENTINEL" },
        authorityState: "CUSTOMER_CONFIRMED",
        status: "ACTIVE",
        createdAt: "2026-08-24T16:00:00.000Z",
        updatedAt: "2026-08-24T16:00:00.000Z",
      },
    ],
    capabilities: [
      {
        id: "capability_alpha",
        tenantId: "ten_alpha",
        userId: "usr_alpha",
        profileId: "profile_alpha",
        label: "PRIVATE_CAREER_FACT_SENTINEL",
        provenance: "PRIVATE_SOURCE_SENTINEL",
        authorityState: "CUSTOMER_CONFIRMED",
        createdAt: "2026-08-24T17:00:00.000Z",
        updatedAt: "2026-08-24T17:00:00.000Z",
      },
    ],
    capabilityDecisions: [
      {
        id: "capability_decision_alpha",
        tenantId: "ten_alpha",
        userId: "usr_alpha",
        capabilityId: "capability_alpha",
        decisionState: "CONFIRMED",
        createdAt: "2026-08-24T17:10:00.000Z",
      },
    ],
    searchPreferences: [
      {
        id: "search_alpha",
        tenantId: "ten_alpha",
        userId: "usr_alpha",
        keywords: ["PRIVATE_CAREER_FACT_SENTINEL"],
        location: "PRIVATE_CAREER_STORY_SENTINEL",
        active: true,
        createdAt: "2026-08-25T10:00:00.000Z",
        updatedAt: "2026-08-25T10:00:00.000Z",
      },
    ],
    opportunities: [
      {
        id: "opportunity_alpha_1",
        tenantId: "ten_alpha",
        userId: "usr_alpha",
        profileId: "profile_alpha",
        title: "PRIVATE_JOB_DESCRIPTION_SENTINEL",
        company: "PRIVATE_JOB_DESCRIPTION_SENTINEL",
        description: "PRIVATE_JOB_DESCRIPTION_SENTINEL",
        decisionState: "PURSUE",
        lifecycleState: "TRACKING",
        createdAt: "2026-08-26T10:00:00.000Z",
        updatedAt: "2026-08-27T10:00:00.000Z",
      },
      {
        id: "opportunity_alpha_2",
        tenantId: "ten_alpha",
        userId: "usr_alpha",
        profileId: "profile_alpha",
        title: "PRIVATE_JOB_DESCRIPTION_SENTINEL",
        description: "PRIVATE_JOB_DESCRIPTION_SENTINEL",
        decisionState: "CONSIDERING",
        lifecycleState: "NEW",
        createdAt: "2026-08-26T11:00:00.000Z",
        updatedAt: "2026-08-27T11:00:00.000Z",
      },
    ],
    matchEvaluations: [
      {
        id: "evaluation_alpha_1",
        tenantId: "ten_alpha",
        userId: "usr_alpha",
        profileId: "profile_alpha",
        opportunityId: "opportunity_alpha_1",
        summary: "PRIVATE_CAREER_FACT_SENTINEL",
        stale: false,
        createdAt: "2026-08-27T12:00:00.000Z",
      },
      {
        id: "evaluation_alpha_2",
        tenantId: "ten_alpha",
        userId: "usr_alpha",
        profileId: "profile_alpha",
        opportunityId: "opportunity_alpha_2",
        summary: "PRIVATE_CAREER_FACT_SENTINEL",
        stale: false,
        createdAt: "2026-08-27T13:00:00.000Z",
      },
    ],
    opportunityEvents: [
      {
        id: "opportunity_event_alpha_1",
        tenantId: "ten_alpha",
        userId: "usr_alpha",
        opportunityId: "opportunity_alpha_1",
        eventType: "OPPORTUNITY_DECISION_CHANGED",
        metadata: { note: "PRIVATE_NOTE_SENTINEL" },
        createdAt: "2026-08-27T14:00:00.000Z",
      },
      {
        id: "opportunity_event_alpha_2",
        tenantId: "ten_alpha",
        userId: "usr_alpha",
        opportunityId: "opportunity_alpha_1",
        eventType: "OPPORTUNITY_LIFECYCLE_STATE_CHANGED",
        metadata: { note: "PRIVATE_NOTE_SENTINEL" },
        createdAt: "2026-08-27T15:00:00.000Z",
      },
    ],
    inboxItems: [
      {
        id: "inbox_alpha",
        tenantId: "ten_alpha",
        userId: "usr_alpha",
        profileId: "profile_alpha",
        status: "IMPORTED",
        title: "PRIVATE_JOB_DESCRIPTION_SENTINEL",
        description: "PRIVATE_JOB_DESCRIPTION_SENTINEL",
        provenance: "PRIVATE_JOB_DESCRIPTION_SENTINEL",
        discoveredAt: "2026-08-26T09:00:00.000Z",
        importedAt: "2026-08-26T09:30:00.000Z",
        createdAt: "2026-08-26T09:00:00.000Z",
        updatedAt: "2026-08-26T09:30:00.000Z",
      },
    ],
    auditEvents: [
      {
        id: "audit_alpha",
        tenantId: "ten_alpha",
        userId: "usr_alpha",
        eventType: "LOGIN",
        entityType: "CareerSession",
        metadata: { note: "PRIVATE_NOTE_SENTINEL" },
        createdAt: "2026-08-29T10:45:00.000Z",
      },
    ],
    careerStory: [{ body: "PRIVATE_CAREER_STORY_SENTINEL" }],
    opportunityNotes: [{ content: "PRIVATE_NOTE_SENTINEL" }],
    resumeDrafts: [{ content: "PRIVATE_RESUME_SENTINEL" }],
    invites: [{ tokenDigest: "PRIVATE_INVITE_SENTINEL", code: "PRIVATE_INVITE_SENTINEL" }],
  });
}

function buildModel() {
  return buildCareerOsBetaOperationsReadModel(syntheticRows(), { now, persistence: "local_json" });
}

test("read model returns only aggregate and pseudonymous CareerOS beta operations data", () => {
  const model = buildModel();
  const serialized = JSON.stringify(model);

  assert.equal(model.modelVersion, CAREEROS_BETA_OPERATIONS_MODEL_VERSION);
  assert.equal(model.readOnly, true);
  assert.equal(model.schemaChangeRequired, false);
  assert.equal(model.customerDataMutated, false);
  assert.equal(model.privateEvidenceReturned, false);
  assert.equal(model.userIdentifierStrategy, "stable_pseudonymous_user_id_hash");
  assert.equal(model.summary.totalBetaUsers, 2);
  assert.equal(model.summary.activeLast7Days, 1);
  assert.equal(model.summary.usersWithKnowMeObserved, 1);
  assert.equal(model.summary.usersWithDiscoveryObserved, 1);
  assert.equal(model.summary.usersWithEvaluations, 1);
  assert.equal(model.summary.usersWithPursuitObserved, 1);
  assert.equal(model.summary.usersWithReturnObserved, 2);
  assert.equal(model.summary.usersNeedingAttention, 1);
  assert.equal(model.summary.totalOpportunities, 2);
  assert.equal(model.summary.totalEvaluations, 2);
  assert.match(model.users[0].userIdentifier, /^beta-user-[a-f0-9]{12}$/);
  assert.equal(model.users[0].userIdentifier.includes("usr_alpha"), false);

  for (const sentinel of sentinels) {
    assert.equal(serialized.includes(sentinel), false, `${sentinel} leaked`);
  }

  for (const forbiddenKey of [
    "\"email\"",
    "\"password\"",
    "\"passwordHash\"",
    "\"tokenDigest\"",
    "\"textContent\"",
    "\"statement\"",
    "\"sourceExcerpt\"",
    "\"displayValue\"",
    "\"sourceAnchor\"",
    "\"description\"",
    "\"content\"",
    "\"metadata\"",
    "\"keywords\"",
    "\"location\"",
    "\"originalFilename\"",
  ]) {
    assert.equal(serialized.includes(forbiddenKey), false, `${forbiddenKey} leaked`);
  }
});

test("read model derives lifecycle, health, counts, and ordering deterministically", () => {
  const model = buildModel();
  const active = model.users[0];
  const inactive = model.users[1];

  assert.equal(active.currentLifecycleStage, "RETURN");
  assert.deepEqual(active.lifecycle, {
    KNOW_ME: "OBSERVED",
    FIND: "OBSERVED",
    UNDERSTAND: "OBSERVED",
    PURSUE: "OBSERVED",
    MANAGE: "OBSERVED",
    RETURN: "OBSERVED",
  });
  assert.equal(active.accountStatus, "ACTIVE_SESSION");
  assert.equal(active.counts.sourceCount, 2);
  assert.equal(active.counts.candidateFactCount, 2);
  assert.equal(active.counts.reviewDecisionCount, 1);
  assert.equal(active.counts.confirmedCareerFactCount, 2);
  assert.equal(active.counts.contextClaimCount, 1);
  assert.equal(active.counts.capabilityCount, 1);
  assert.equal(active.counts.searchPreferenceCount, 1);
  assert.equal(active.counts.opportunityInboxCount, 1);
  assert.equal(active.counts.opportunityCount, 2);
  assert.equal(active.counts.evaluationCount, 2);
  assert.equal(active.counts.staleEvaluationCount, 0);
  assert.equal(active.aggregates.opportunityDecisionCounts.PURSUE, 1);
  assert.equal(active.aggregates.opportunityLifecycleCounts.TRACKING, 1);
  assert.deepEqual(active.health, { state: "OK", reasons: ["OK"] });
  assert.equal(active.lastSafeActivityAt, "2026-08-29T10:45:00.000Z");

  assert.equal(inactive.accountStatus, "ACCOUNT_RECORD_INCOMPLETE");
  assert.equal(inactive.lifecycle.KNOW_ME, "NOT_STARTED");
  assert.equal(inactive.health.state, "SETUP_NEEDED");
  assert.deepEqual(inactive.health.reasons, ["ACCOUNT_RECORD_INCOMPLETE", "NO_PROFILE", "NO_RECENT_SAFE_ACTIVITY"]);
});

test("operator access denies before loading the read model and distinguishes 401, 403, and 200", async () => {
  let loadCalls = 0;
  const loadReadModel = async () => {
    loadCalls += 1;
    return buildModel();
  };

  const missing = await getCareerOsBetaOperationsResult("", { config: config(), now, loadReadModel });
  assert.equal(missing.status, 401);
  assert.equal(missing.body.error, "OPERATOR_SESSION_MISSING");
  assert.equal(loadCalls, 0);

  const customerSessionOnly = await getCareerOsBetaOperationsResult("career_p0_session_customer_only", {
    config: config(),
    now,
    loadReadModel,
  });
  assert.equal(customerSessionOnly.status, 401);
  assert.equal(customerSessionOnly.body.error, "OPERATOR_SESSION_INVALID");
  assert.equal(loadCalls, 0);

  const noPermission = await getCareerOsBetaOperationsResult(sessionCookie([]), { config: config(), now, loadReadModel });
  assert.equal(noPermission.status, 403);
  assert.equal(noPermission.body.error, "OPERATOR_PERMISSION_MISSING");
  assert.equal(loadCalls, 0);

  const authorized = await getCareerOsBetaOperationsResult(sessionCookie([CAREEROS_BETA_OPERATIONS_READ_PERMISSION]), {
    config: config(),
    now,
    loadReadModel,
  });
  assert.equal(authorized.status, 200);
  assert.equal(authorized.body.ok, true);
  assert.equal(authorized.body.authority, CAREEROS_BETA_OPERATIONS_READ_PERMISSION);
  assert.equal(authorized.body.customerDataRead, true);
  assert.equal(authorized.body.customerDataMutated, false);
  assert.equal(authorized.body.privateCareerDataReturned, false);
  assert.equal(authorized.body.users.length, 2);
  assert.equal(loadCalls, 1);
});

test("operator API and page use the canonical StaffordOS guard boundary", () => {
  const routeSource = readFileSync(path.join(frontendRoot, "app/api/operator/careeros/beta-users/route.ts"), "utf8");
  const accessSource = readFileSync(path.join(frontendRoot, "lib/operator/careerosBetaOperationsAccess.ts"), "utf8");
  const pageSource = readFileSync(path.join(frontendRoot, "app/operator/careeros/beta-users/page.tsx"), "utf8");

  assert.match(routeSource, /getCareerOsBetaOperationsResult/);
  assert.match(routeSource, /STAFFORDOS_OPERATOR_SESSION_COOKIE/);
  assert.match(accessSource, /authorizeStaffordOsOperatorRead/);
  assert.match(accessSource, /CAREEROS_BETA_OPERATIONS_READ_PERMISSION/);
  assert.match(pageSource, /getCareerOsBetaOperationsResult/);

  assert.doesNotMatch(routeSource, /careerP0|CAREEROS_P0_COOKIE|CareerStory|CareerFact|CareerSource|Resume|Invite|tokenDigest/i);
  assert.doesNotMatch(accessSource, /CAREEROS_P0_COOKIE|CareerStory|Resume|Invite|tokenDigest/i);
  assert.doesNotMatch(pageSource, /CAREEROS_P0_COOKIE|CareerStory|sourceExcerpt|tokenDigest|passwordHash|invite code/i);
});
