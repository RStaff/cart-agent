import assert from "node:assert/strict";
import { createRequire } from "node:module";
import Module from "node:module";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const modulePath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/privateJobSourceImportQueue.ts");
const cliPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/runPrivateJobSourceImport.mjs");
const requireFromFrontend = createRequire(path.join(root, "staffordos/ui/operator-frontend/package.json"));
const ts = requireFromFrontend("typescript");
const source = readFileSync(modulePath, "utf8");
const cliSource = readFileSync(cliPath, "utf8");

function requireTypeScriptModule(targetPath) {
  const originalTsExtension = Module._extensions[".ts"];
  Module._extensions[".ts"] = function compileTypeScriptModule(mod, filename) {
    const text = readFileSync(filename, "utf8");
    const compiled = ts.transpileModule(text, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        esModuleInterop: true,
      },
    });
    mod._compile(compiled.outputText, filename);
  };

  try {
    return requireFromFrontend(targetPath);
  } finally {
    if (originalTsExtension) {
      Module._extensions[".ts"] = originalTsExtension;
    } else {
      delete Module._extensions[".ts"];
    }
  }
}

const jobSourceImport = requireTypeScriptModule(modulePath);

function sourceInput(overrides = {}) {
  const has = (key) => Object.hasOwn(overrides, key);
  return {
    accessMode: overrides.accessMode || "OPERATOR_IMPORTED_JSON",
    providerId: overrides.providerId || "EMPLOYER_CAREER_SITE",
    providerName: overrides.providerName || "Synthetic employer career site",
    providerType: overrides.providerType || "EMPLOYER_CAREER_SITE",
    sourceUrl: has("sourceUrl") ? overrides.sourceUrl : "https://jobs.example.invalid/synthetic/ai-automation-business-technology",
    sourceText: overrides.sourceText || null,
    observedAt: overrides.observedAt || "2026-08-08T12:00:00Z",
    publicationDate: has("publicationDate") ? overrides.publicationDate : null,
    title: overrides.title || "AI Automation Business Technology Lead",
    company: overrides.company || "Example Systems",
    location: has("location") ? overrides.location : "Remote",
    remoteState: has("remoteState") ? overrides.remoteState : "Remote",
    employmentType: has("employmentType") ? overrides.employmentType : "Full Time",
    compensationText: has("compensationText") ? overrides.compensationText : null,
    descriptionText:
      overrides.descriptionText ||
      "Synthetic role for AI automation, business technology, workflow automation, integrations, requirements, APIs, and technical program delivery.",
    requisitionId: overrides.requisitionId || "SYN-J002-02",
    importedJson: overrides.importedJson || null,
    limitations: overrides.limitations || ["Synthetic fixture only."],
  };
}

function application(overrides = {}) {
  return {
    applicationId: overrides.applicationId || "synthetic_application_001",
    opportunityId: null,
    companyReference: {
      label: overrides.companyName || "Example Systems",
      requisitionAlias: overrides.requisitionAlias ?? null,
    },
    roleReference: {
      title: overrides.roleTitle || "AI Automation Business Technology Lead",
    },
    status: "SUBMITTED_MANUAL_EXTERNAL",
    currentStage: "SUBMITTED_MANUAL_EXTERNAL",
    submittedAt: "2026-08-08",
    submittedAtPrecision: "DATE",
    employerResponseStatus: "NONE_RECORDED",
    submittedByStaffordOS: false,
    applicationSubmittedByThisWorkflow: false,
    noEmployerInterestInferred: true,
    noFitInferred: true,
  };
}

function build(inputs, applications = []) {
  return jobSourceImport.buildPrivateJobSourceImportQueue({
    inputs,
    applications,
    generatedAt: "2026-08-08T12:00:00Z",
  });
}

function serialize(value) {
  return JSON.stringify(value);
}

test("provider-neutral adapters are read-only and expose no execution methods", () => {
  const adapters = [
    jobSourceImport.createOperatorPastedUrlAdapter(),
    jobSourceImport.createOperatorPastedTextAdapter(),
    jobSourceImport.createOperatorImportedJsonAdapter(),
  ];

  for (const adapter of adapters) {
    assert.equal(adapter.readOnly, true);
    assert.deepEqual(adapter.readMethods, [
      "normalize",
      "validate",
      "buildSourceSnapshot",
      "buildImportCandidate",
    ]);
    assert.equal(adapter.writeMethodsAvailable, false);
    assert.equal(adapter.authenticatedAccessConnected, false);
    assert.equal(adapter.browserAutomationAvailable, false);
    assert.equal(adapter.hasApplyMethod, false);
    assert.equal(adapter.hasSubmitMethod, false);
    assert.equal(adapter.hasMessageMethod, false);
    assert.equal(adapter.hasLoginMethod, false);
    assert.equal(adapter.hasBrowserControlMethod, false);
    assert.equal(Object.hasOwn(adapter, "apply"), false);
    assert.equal(Object.hasOwn(adapter, "submit"), false);
    assert.equal(Object.hasOwn(adapter, "message"), false);
  }
});

test("authenticated-source access fails closed", () => {
  const adapter = jobSourceImport.createUnsupportedAuthenticatedSourceAdapter({
    providerId: "LINKEDIN",
    providerName: "LinkedIn",
    providerType: "LINKEDIN",
  });
  const result = build([
    sourceInput({
      accessMode: "UNSUPPORTED_AUTHENTICATED_SOURCE",
      providerId: "LINKEDIN",
      providerName: "LinkedIn",
      providerType: "LINKEDIN",
    }),
  ]);

  assert.equal(adapter.authenticationRequired, true);
  assert.equal(adapter.connectionStatus, "AUTHENTICATED_ACCESS_NOT_CONNECTED");
  assert.equal(adapter.supportsSearch, false);
  assert.equal(result.normalizedSourceRecords.length, 0);
  assert.equal(result.summary.authenticatedSourcesRejected, 1);
  assert.equal(result.summary.externalProviderCalls, 0);
});

test("normalization preserves unknown publication date and does not invent source facts", () => {
  const record = jobSourceImport.normalizeJobSourceInput(
    sourceInput({
      sourceUrl: "https://jobs.example.invalid/synthetic/unknowns",
      publicationDate: null,
      remoteState: null,
      compensationText: null,
    }),
    "2026-08-08T12:00:00Z",
  );

  assert.equal(record.publicationDate, null);
  assert.equal(record.publicationDateAuthority, "UNKNOWN");
  assert.equal(record.observedAt, "2026-08-08T12:00:00Z");
  assert.equal(record.importedTimestampIsPublicationDate, false);
  assert.equal(record.remoteState, null);
  assert.equal(record.remoteStateInvented, false);
  assert.equal(record.compensationText, null);
  assert.equal(record.compensationInvented, false);
});

test("source provenance is preserved through G003 SourceSnapshot authority", () => {
  const result = build([sourceInput()]);
  const snapshot = result.sourceSnapshots[0];
  const record = result.normalizedSourceRecords[0];

  assert.equal(snapshot.schemaVersion, "staffordos.source_snapshot.v1");
  assert.equal(snapshot.sourceType, "PRIVATE_LOCAL");
  assert.equal(snapshot.staticity, "CAPTURED_SNAPSHOT");
  assert.equal(snapshot.authorizationStatus, "OPERATOR_CONFIRMED");
  assert.equal(snapshot.contentDigest, record.sourceDigest);
  assert.equal(record.rawDescriptionStoredPrivately, true);
  assert.equal(record.sourceAuthority, "OPERATOR_SUPPLIED_READ_ONLY");
});

test("J002.01 ranking is reused with mission weights and explanations", () => {
  const result = build([sourceInput()]);
  const opportunity = result.prioritization.opportunities[0];

  assert.equal(result.prioritization.workflowVersion, "J002.01");
  assert.equal(opportunity.ranking.deterministicRulesOnly, true);
  assert.equal(opportunity.ranking.externalAiUsed, false);
  assert.ok(opportunity.ranking.components.find((component) => component.componentId === "aiAutomation").weight === 45);
  assert.ok(opportunity.ranking.components.find((component) => component.componentId === "businessTechnology").weight === 25);
  assert.ok(result.importQueue[0].rankingSummary.whyRecommended.length > 0);
});

test("duplicate detection reuses J002.01 and does not silently merge", () => {
  const result = build([
    sourceInput({ requisitionId: "SAME-PROVIDER-ID", sourceUrl: "https://jobs.example.invalid/synthetic/dupe-a" }),
    sourceInput({
      requisitionId: "SAME-PROVIDER-ID",
      sourceUrl: "https://jobs.example.invalid/synthetic/dupe-b",
      title: "Program Lead, AI Automation",
    }),
  ]);

  assert.ok(result.prioritization.duplicateReview.length >= 1);
  assert.equal(result.prioritization.duplicateReview[0].silentlyMerged, false);
  assert.equal(result.summary.duplicateItems, 2);
  assert.equal(result.importQueue.every((item) => item.state === "DUPLICATE"), true);
});

test("existing Applications block duplicate Apply recommendations", () => {
  const result = build([sourceInput()], [application()]);

  assert.equal(result.importQueue[0].state, "EXISTING_APPLICATION");
  assert.equal(result.importQueue[0].duplicateResult, "EXISTING_APPLICATION");
  assert.equal(result.importQueue[0].existingApplicationStatus, "EXISTING_APPLICATION_MATCH");
  assert.equal(result.prioritization.opportunities[0].recommendedAction, "DO_NOT_APPLY_DUPLICATE");
  assert.equal(result.prioritization.priorityQueue.length, 0);
});

test("operator approval is required and creates Opportunity intake, not Application", () => {
  const result = build([sourceInput()]);
  const queueItem = result.importQueue[0];
  const approval = jobSourceImport.approveJobSourceImport({
    result,
    queueItemId: queueItem.queueItemId,
    decisionType: "APPROVE_IMPORT_OPPORTUNITY",
    generatedAt: "2026-08-08T12:15:00Z",
  });

  assert.equal(queueItem.state, "READY_FOR_OPPORTUNITY_IMPORT");
  assert.ok(queueItem.whatRossMustApprove.length > 0);
  assert.equal(approval.decision.operatorConfirmed, true);
  assert.equal(approval.normalizedOpportunity.noApplicationCreated, true);
  assert.equal(approval.applicationCreated, false);
  assert.equal(approval.applicationSubmitted, false);
  assert.equal(approval.messageSent, false);
  assert.equal(approval.resumeGenerated, false);
});

test("text-only imports normalize but do not become ready without source approval data", () => {
  const result = build([
    sourceInput({
      accessMode: "OPERATOR_PASTED_TEXT",
      sourceUrl: null,
      providerId: "OPERATOR_PASTED_TEXT",
      providerName: "Operator pasted text",
    }),
  ]);

  assert.equal(result.normalizedSourceRecords.length, 1);
  assert.equal(result.importQueue[0].state, "NEEDS_OPERATOR_REVIEW");
  assert.equal(result.importQueue[0].normalizedOpportunityCandidateId, null);
  assert.equal(result.importQueue[0].applicationSubmitted, false);
});

test("traditional narrow marketing roles are excluded by default", () => {
  const result = build([
    sourceInput({
      title: "SEO Specialist",
      descriptionText: "Synthetic traditional SEO role with keyword reporting.",
      sourceUrl: "https://jobs.example.invalid/synthetic/seo",
      requisitionId: "SEO-001",
    }),
  ]);

  assert.equal(result.normalizedSourceRecords[0].laneDisposition, "EXCLUDED_BY_DEFAULT");
  assert.equal(result.importQueue[0].state, "NEEDS_OPERATOR_REVIEW");
  assert.match(serialize(result.importQueue[0].limitations), /excluded by default/i);
});

test("read models and CLI summaries hide raw job text, URLs, and private paths", () => {
  const result = build([sourceInput()]);
  const queueItem = result.importQueue[0];
  const summary = jobSourceImport.buildJobSourceImportCliSummary(result, 0);
  const readModelText = serialize(result.prioritization.readModel);

  assert.equal(queueItem.privatePathVisible, false);
  assert.equal(queueItem.rawDescriptionVisible, false);
  assert.equal(summary.noApplicationSubmitted, true);
  assert.equal(summary.noResumeGenerated, true);
  assert.equal(summary.noMessageSent, true);
  assert.equal(summary.noExternalAi, true);
  assert.equal(summary.noOllama, true);
  assert.equal(summary.noOsConnection, true);
  assert.equal(summary.noOperatorConnection, true);
  assert.doesNotMatch(readModelText, /https:\/\/jobs\.example\.invalid/);
  assert.doesNotMatch(readModelText, /\/Users\//);
  assert.doesNotMatch(readModelText, /\.staffordos/);
});

test("private output writer rejects repository paths", () => {
  const result = build([sourceInput()]);

  assert.throws(
    () =>
      jobSourceImport.writePrivateJobSourceImportQueueOutputs({
        outputRoot: path.join(root, "staffordos/job-search"),
        repositoryRoot: root,
        result,
      }),
    /outside the repository/,
  );
});

test("provider capability matrix distinguishes identity from integration", () => {
  const matrix = jobSourceImport.JOB_SOURCE_PROVIDER_CAPABILITY_MATRIX;

  assert.ok(matrix.find((item) => item.providerId === "GREENHOUSE" && item.connectionStatus === "NOT_CONNECTED"));
  assert.ok(matrix.find((item) => item.providerId === "WORKDAY" && item.connectionStatus === "AUTHENTICATED_ACCESS_NOT_CONNECTED"));
  assert.ok(matrix.find((item) => item.providerId === "LINKEDIN" && item.accessMode === "UNSUPPORTED_AUTHENTICATED_SOURCE"));
  assert.ok(matrix.find((item) => item.providerId === "EMPLOYER_CAREER_SITE" && item.connectionStatus === "OPERATOR_INPUT_ONLY"));
});

test("target search lanes preserve primary and secondary bridge boundaries", () => {
  const result = build([sourceInput()]);

  assert.ok(result.targetSearchLanes.primary.includes("AI Automation"));
  assert.ok(result.targetSearchLanes.primary.includes("Business Technology"));
  assert.ok(result.targetSearchLanes.secondaryBridge.includes("Marketing Technology"));
  assert.ok(result.targetSearchLanes.excludedByDefault.includes("Social Media Manager"));
});

test("source and CLI contain no submission, resume generation, messaging, provider call, external AI, or private UI connection path", () => {
  const implementation = `${source}\n${cliSource}`;

  assert.doesNotMatch(implementation, /fetch\(|XMLHttpRequest|http\.request|https\.request|puppeteer|playwright|chromium|selenium/i);
  assert.doesNotMatch(implementation, /openai\.|anthropic\.|gemini\.|modelAdapter|runOllama|localhost:11434/i);
  assert.doesNotMatch(implementation, /submitApplication|sendApplication|generateResume|mutateResume|generateCoverLetter|sendRecruiter|sendMessage|mailto:/i);
  assert.doesNotMatch(implementation, /from\s+["'].*\/os|from\s+["'].*\/operator|app\/os|app\/operator/);
});
