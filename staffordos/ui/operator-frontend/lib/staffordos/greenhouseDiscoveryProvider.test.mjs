import assert from "node:assert/strict";
import { createRequire } from "node:module";
import Module from "node:module";
import { existsSync, mkdtempSync, readFileSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const modulePath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/greenhouseDiscoveryProvider.ts");
const queueModulePath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/privateJobSourceImportQueue.ts");
const cliPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/runGreenhouseDiscovery.mjs");
const requireFromFrontend = createRequire(path.join(root, "staffordos/ui/operator-frontend/package.json"));
const ts = requireFromFrontend("typescript");
const source = readFileSync(modulePath, "utf8");
const queueSource = readFileSync(queueModulePath, "utf8");
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

const greenhouse = requireTypeScriptModule(modulePath);

function job(overrides = {}) {
  return {
    id: overrides.id ?? 12345,
    internal_job_id: overrides.internal_job_id ?? 98765,
    absolute_url: overrides.absolute_url ?? "https://job-boards.greenhouse.io/example/jobs/12345",
    title: overrides.title ?? "AI Automation Platform Product Manager",
    company_name: overrides.company_name ?? "Example AI Systems",
    first_published: overrides.first_published ?? "2026-08-01T10:00:00-04:00",
    updated_at: overrides.updated_at ?? "2026-08-04T10:00:00-04:00",
    requisition_id: overrides.requisition_id ?? "REQ-123",
    location: overrides.location ?? { name: "Remote-Friendly, United States" },
    departments: overrides.departments ?? [{ id: 1, name: "Product" }],
    offices: overrides.offices ?? [{ id: 2, name: "Remote" }],
    metadata:
      overrides.metadata ??
      [
        { id: 10, name: "Time Type", value: "Full time", value_type: "single_select" },
        { id: 11, name: "Location Type", value: "Remote", value_type: "single_select" },
      ],
    content:
      overrides.content ??
      "<p>Lead AI automation, platform workflow, requirements, user stories, APIs, stakeholder alignment, and product roadmap delivery.</p>",
  };
}

function manifest(overrides = {}) {
  return {
    schemaVersion: greenhouse.GREENHOUSE_PROVIDER_MANIFEST_SCHEMA_VERSION,
    sources: [
      {
        company: overrides.company || "Example AI Systems",
        provider: "greenhouse",
        boardToken: overrides.boardToken || "example",
        enabled: true,
      },
    ],
  };
}

function mockFetcher(jobsByToken, calls = []) {
  return async (url, init) => {
    calls.push({ url, init });
    const token = decodeURIComponent(url.match(/boards\/([^/]+)\/jobs/)?.[1] || "");
    const value = jobsByToken[token];
    if (!value) {
      return {
        ok: false,
        status: 404,
        text: async () => JSON.stringify({ status: 404, error: "Job not found" }),
      };
    }
    return {
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ jobs: value }),
    };
  };
}

function application(overrides = {}) {
  return {
    applicationId: "synthetic_application_001",
    companyReference: {
      label: overrides.company || "Example AI Systems",
      requisitionAlias: overrides.requisitionAlias ?? null,
    },
    roleReference: {
      title: overrides.title || "AI Automation Platform Product Manager",
    },
    status: "SUBMITTED_MANUAL_EXTERNAL",
    currentStage: "SUBMITTED_MANUAL_EXTERNAL",
    submittedAt: "2026-08-05",
    submittedAtPrecision: "DATE",
    employerResponseStatus: "NONE_RECORDED",
    submittedByStaffordOS: false,
    applicationSubmittedByThisWorkflow: false,
    noEmployerInterestInferred: true,
    noFitInferred: true,
  };
}

function serialize(value) {
  return JSON.stringify(value);
}

test("provider manifest resolves Greenhouse board tokens without a plugin framework", () => {
  assert.equal(
    greenhouse.greenhouseBoardTokenForSource({
      company: "Example AI Systems",
      provider: "greenhouse",
      boardUrl: "https://job-boards.greenhouse.io/exampleai",
    }),
    "exampleai",
  );
  assert.equal(
    greenhouse.greenhouseBoardTokenForSource({
      company: "Example AI Systems",
      provider: "greenhouse",
    }),
    "exampleaisystems",
  );
});

test("Greenhouse retrieval uses the public Job Board API with GET only", async () => {
  const calls = [];
  const retrieval = await greenhouse.retrieveGreenhousePublishedJobs({
    source: manifest().sources[0],
    retrievedAt: "2026-08-08T12:00:00Z",
    fetcher: mockFetcher({ example: [job()] }, calls),
  });

  assert.equal(retrieval.status, "RETRIEVED");
  assert.equal(retrieval.jobCount, 1);
  assert.match(calls[0].url, /^https:\/\/boards-api\.greenhouse\.io\/v1\/boards\/example\/jobs\?content=true$/);
  assert.equal(calls[0].init.method, "GET");
  assert.equal(retrieval.noAuthentication, true);
  assert.equal(retrieval.noCookies, true);
  assert.equal(retrieval.noBrowserAutomation, true);
  assert.equal(retrieval.noScraping, true);
});

test("Greenhouse normalization captures provider job metadata", () => {
  const raw = greenhouse.normalizeGreenhouseJobToRawInput({
    source: manifest().sources[0],
    job: job(),
    boardToken: "example",
    retrievedAt: "2026-08-08T12:00:00Z",
  });

  assert.equal(raw.providerId, "GREENHOUSE");
  assert.equal(raw.providerType, "GREENHOUSE");
  assert.equal(raw.accessMode, "PUBLIC_API");
  assert.equal(raw.sourceAuthority, "PUBLIC_READ_ONLY_PROVIDER");
  assert.equal(raw.providerJobId, "12345");
  assert.equal(raw.requisitionId, "REQ-123");
  assert.equal(raw.title, "AI Automation Platform Product Manager");
  assert.equal(raw.company, "Example AI Systems");
  assert.equal(raw.location, "Remote-Friendly, United States");
  assert.equal(raw.remoteState, "Remote or remote-friendly");
  assert.equal(raw.employmentType, "Full time");
  assert.equal(raw.publicationDate, "2026-08-01T10:00:00-04:00");
  assert.equal(raw.sourceUrl, "https://job-boards.greenhouse.io/example/jobs/12345");
});

test("Greenhouse normalization preserves raw HTML and deterministic source blocks", () => {
  const raw = greenhouse.normalizeGreenhouseJobToRawInput({
    source: manifest().sources[0],
    job: job({ content: "<h2>Responsibilities</h2><ul><li>Lead programs</li><li>Coordinate stakeholders</li></ul><h2>Preferred qualifications</h2><p>AI experience</p>" }),
    boardToken: "example",
    retrievedAt: "2026-08-08T12:00:00Z",
  });
  assert.equal(raw.rawSourceContentType, "text/html");
  assert.match(raw.rawSourceContent, /<h2>Responsibilities<\/h2>/);
  assert.equal(raw.sourceStructure.format, "HTML");
  assert.equal(raw.sourceStructure.blocks[0].normalizedSection, "RESPONSIBILITIES");
  assert.deepEqual(raw.sourceStructure.blocks[0].items, ["Lead programs", "Coordinate stakeholders"]);
  assert.equal(raw.sourceStructure.blocks[1].normalizedSection, "PREFERRED_QUALIFICATIONS");
  assert.equal(raw.title, "AI Automation Platform Product Manager");
  assert.equal(raw.providerJobId, "12345");
});

test("semantically marked provider labels preserve section identity", () => {
  const raw = greenhouse.normalizeGreenhouseJobToRawInput({
    source: manifest().sources[0],
    job: job({ content: "<p><strong>What You’ll Do:</strong></p><ul><li>Lead delivery</li></ul><p><strong>Preferred Qualifications:</strong></p><p>AI experience</p>" }),
    boardToken: "example",
    retrievedAt: "2026-08-08T12:00:00Z",
  });
  assert.equal(raw.sourceStructure.blocks[0].normalizedSection, "RESPONSIBILITIES");
  assert.equal(raw.sourceStructure.blocks[1].normalizedSection, "PREFERRED_QUALIFICATIONS");
  assert.deepEqual(raw.sourceStructure.blocks[0].items, ["Lead delivery"]);
});

test("structured parsing is non-executing and excludes script content from blocks", () => {
  const raw = greenhouse.normalizeGreenhouseJobToRawInput({
    source: manifest().sources[0],
    job: job({ content: "<h2>Requirements</h2><p onclick=alert(1)>Lead programs</p><script>alert(2)</script>" }),
    boardToken: "example",
    retrievedAt: "2026-08-08T12:00:00Z",
  });
  assert.match(raw.rawSourceContent, /onclick=alert/);
  assert.doesNotMatch(raw.sourceStructure.blocks[0].text, /alert\(2\)|<script|onclick=/i);
  assert.equal(raw.sourceStructure.blocks[0].detectionMethod, "PROVIDER_STRUCTURED_HTML");
});

test("structured source fallback is explicit when provider content is absent", () => {
  const raw = greenhouse.normalizeGreenhouseJobToRawInput({
    source: manifest().sources[0],
    job: job({ content: "" }),
    boardToken: "example",
    retrievedAt: "2026-08-08T12:00:00Z",
  });
  assert.equal(raw.rawSourceContent, null);
  assert.equal(raw.sourceStructure, null);
  assert.match(raw.descriptionText, /Department: Product/);
});

test("eligibility filtering rejects obvious non-target opportunities", () => {
  const sourceRecord = manifest().sources[0];
  const rejected = [
    greenhouse.evaluateGreenhouseJobEligibility(job({ title: "SEO Specialist" }), sourceRecord),
    greenhouse.evaluateGreenhouseJobEligibility(job({ title: "AI Product Manager", location: { name: "Paris, France" } }), sourceRecord),
    greenhouse.evaluateGreenhouseJobEligibility(job({ title: "AI Platform Lead", content: "Active security clearance required." }), sourceRecord),
    greenhouse.evaluateGreenhouseJobEligibility(job({ title: "Account Executive, Public Sector", content: "Own territory." }), sourceRecord),
  ];
  const accepted = greenhouse.evaluateGreenhouseJobEligibility(job(), sourceRecord);

  assert.equal(accepted.status, "ELIGIBLE");
  assert.equal(rejected.every((review) => review.status === "REJECTED"), true);
  assert.ok(rejected[0].reasons.includes("TRADITIONAL_MARKETING_SPECIALIST_ROLE"));
  assert.ok(rejected[1].reasons.includes("LOCATION_INCOMPATIBLE"));
  assert.ok(rejected[2].reasons.includes("SECURITY_CLEARANCE_REQUIRED"));
  assert.ok(rejected[3].reasons.includes("CLEARLY_UNRELATED_DISCIPLINE"));
  assert.equal(accepted.successProbabilityGenerated, false);
});

test("discovery builds a ranked Opportunity Queue through J002.02 and J002.01", async () => {
  const result = await greenhouse.buildGreenhouseDiscoveryQueue({
    manifest: manifest(),
    generatedAt: "2026-08-08T12:00:00Z",
    fetcher: mockFetcher({ example: [job()] }),
  });
  const record = result.jobSourceImportQueue.normalizedSourceRecords[0];
  const snapshot = result.jobSourceImportQueue.sourceSnapshots[0];

  assert.equal(result.summary.boardsRetrieved, 1);
  assert.equal(result.summary.publishedJobsRetrieved, 1);
  assert.equal(result.summary.eligibleJobs, 1);
  assert.equal(result.jobSourceImportQueue.prioritization.workflowVersion, "J002.01");
  assert.equal(result.opportunityQueue.length, 1);
  assert.equal(result.summary.readyForOpportunityImport, 1);
  assert.equal(result.opportunityQueue[0].state, "READY_FOR_OPPORTUNITY_IMPORT");
  assert.equal(record.sourceAuthority, "PUBLIC_READ_ONLY_PROVIDER");
  assert.match(record.rawSourceDigest, /^sha256:/);
  assert.equal(snapshot.sourceType, "PROVIDER_CONFIRMED");
  assert.equal(snapshot.authorizationStatus, "AUTHORIZED_BY_PROVIDER");
  assert.ok(result.opportunityQueue[0].rankingSummary.totalScore > 0);
});

test("duplicate detection integration preserves duplicates without silent merge", async () => {
  const result = await greenhouse.buildGreenhouseDiscoveryQueue({
    manifest: manifest(),
    generatedAt: "2026-08-08T12:00:00Z",
    fetcher: mockFetcher({
      example: [
        job({ id: 111, absolute_url: "https://job-boards.greenhouse.io/example/jobs/111" }),
        job({ id: 111, absolute_url: "https://job-boards.greenhouse.io/example/jobs/111-copy", title: "Product Manager, AI Automation Platform" }),
      ],
    }),
  });

  assert.equal(result.summary.eligibleJobs, 2);
  assert.equal(result.summary.duplicateItems, 2);
  assert.ok(result.jobSourceImportQueue.prioritization.duplicateReview.length >= 1);
  assert.equal(result.jobSourceImportQueue.prioritization.duplicateReview.every((item) => item.silentlyMerged === false), true);
});

test("existing Application prevention blocks duplicate apply recommendation", async () => {
  const result = await greenhouse.buildGreenhouseDiscoveryQueue({
    manifest: manifest(),
    applications: [application()],
    generatedAt: "2026-08-08T12:00:00Z",
    fetcher: mockFetcher({ example: [job()] }),
  });

  assert.equal(result.summary.existingApplicationItems, 1);
  assert.equal(result.opportunityQueue[0].state, "EXISTING_APPLICATION");
  assert.equal(result.opportunityQueue[0].existingApplicationStatus, "EXISTING_APPLICATION_MATCH");
  assert.equal(result.jobSourceImportQueue.prioritization.opportunities[0].recommendedAction, "DO_NOT_APPLY_DUPLICATE");
});

test("existing explainable fit artifacts are generated without CareerFact promotion", async () => {
  const result = await greenhouse.buildGreenhouseDiscoveryQueue({
    manifest: manifest(),
    generatedAt: "2026-08-08T12:00:00Z",
    fetcher: mockFetcher({ example: [job()] }),
  });
  const artifact = result.explainableFitArtifacts[0];

  assert.equal(artifact.existingFitEngine, "J001.03A_PRIVATE_JOB_FIT_ASSESSMENT");
  assert.equal(artifact.fitAssessment.schemaVersion, "staffordos.job_search.private_fit_assessment.v1");
  assert.equal(artifact.noCareerFactPromoted, true);
  assert.equal(artifact.noResumeGenerated, true);
  assert.equal(artifact.noApplicationSubmitted, true);
  assert.equal(artifact.noExternalAi, true);
  assert.ok(artifact.requirementCount > 0);
});

test("discovery can load existing Career Evidence into fit artifacts without promoting facts", async () => {
  const result = await greenhouse.buildGreenhouseDiscoveryQueue({
    manifest: manifest(),
    generatedAt: "2026-08-08T12:00:00Z",
    fetcher: mockFetcher({ example: [job()] }),
    careerFacts: [
      {
        id: "careerfact_synthetic_ai_automation",
        factType: "PROJECT",
        statement: "AI automation platform workflow delivery.",
        normalizedStatement: "ai automation platform workflow delivery",
        technologyOrSkill: "AI",
        verificationStatus: "VERIFIED",
        supportLevel: "DIRECT",
        authorityClassification: "OPERATOR_CONFIRMED",
        conflictTypes: [],
        conflictingEvidenceIds: [],
      },
    ],
    careerEvidence: [
      {
        id: "careerev_synthetic_ai_automation",
        evidenceType: "PROJECT_ARTIFACT",
        sourceType: "PROJECT_ARTIFACT",
        authorityClassification: "OPERATOR_CONFIRMED",
        supportsFactIds: ["careerfact_synthetic_ai_automation"],
        challengesFactIds: [],
      },
    ],
  });
  const artifact = result.explainableFitArtifacts[0];
  const supportedMappings = artifact.mappings.filter((mapping) => mapping.careerEvidenceIds.includes("careerev_synthetic_ai_automation"));

  assert.equal(result.summary.careerFactsLoadedFromAuthority, 1);
  assert.equal(result.summary.careerEvidenceRecordsLoadedFromAuthority, 1);
  assert.equal(result.summary.fitArtifactsWithSupportingEvidence, 1);
  assert.equal(result.auditSummary.noCareerFactPromoted, true);
  assert.equal(result.auditSummary.noCareerEvidenceMutated, true);
  assert.ok(supportedMappings.length >= 1);
  assert.equal(artifact.careerFactsLoadedFromAuthority, 1);
  assert.equal(artifact.careerEvidenceRecordsLoadedFromAuthority, 1);
});

test("Greenhouse escaped HTML is cleaned before requirement extraction", async () => {
  const result = await greenhouse.buildGreenhouseDiscoveryQueue({
    manifest: manifest(),
    generatedAt: "2026-08-08T12:00:00Z",
    fetcher: mockFetcher({
      example: [
        job({
          content:
            "&lt;ul&gt;&lt;li&gt;You will lead AI automation workflows and product roadmap delivery.&lt;/li&gt;&lt;li&gt;Partner with stakeholders on APIs and analytics.&lt;/li&gt;&lt;/ul&gt;",
        }),
      ],
    }),
  });
  const requirementText = result.explainableFitArtifacts[0].requirements.map((requirement) => requirement.requirementText).join(" ");

  assert.doesNotMatch(requirementText, /&lt;|&gt;|<li>|<\/li>|<ul>/i);
  assert.match(requirementText, /lead AI automation workflows/i);
});

test("failed Greenhouse board is recorded without fallback scraping", async () => {
  const result = await greenhouse.buildGreenhouseDiscoveryQueue({
    manifest: manifest({ boardToken: "missing" }),
    generatedAt: "2026-08-08T12:00:00Z",
    fetcher: mockFetcher({}),
  });

  assert.equal(result.summary.boardsFailed, 1);
  assert.equal(result.summary.publishedJobsRetrieved, 0);
  assert.equal(result.summary.queueItems, 0);
  assert.equal(result.retrievals[0].noScraping, true);
  assert.equal(result.retrievals[0].noBrowserAutomation, true);
});

test("private output writer rejects repository paths", async () => {
  const result = await greenhouse.buildGreenhouseDiscoveryQueue({
    manifest: manifest(),
    generatedAt: "2026-08-08T12:00:00Z",
    fetcher: mockFetcher({ example: [job()] }),
  });

  assert.throws(
    () =>
      greenhouse.writeGreenhouseDiscoveryOutputs({
        outputRoot: path.join(root, "staffordos/job-search"),
        repositoryRoot: root,
        result,
      }),
      /outside the repository/,
  );
});

test("private output writer stores a full queue result for downstream recommendation handoff", async () => {
  const result = await greenhouse.buildGreenhouseDiscoveryQueue({
    manifest: manifest(),
    generatedAt: "2026-08-08T12:00:00Z",
    fetcher: mockFetcher({ example: [job()] }),
  });
  const outputRoot = mkdtempSync(path.join(tmpdir(), "greenhouse-discovery-"));
  const written = greenhouse.writeGreenhouseDiscoveryOutputs({
    outputRoot,
    repositoryRoot: root,
    result,
  });
  const runDirectory = path.dirname(written[0]);
  const fullQueueResultPath = path.join(runDirectory, "job_source_import_queue_result.json");
  const fullQueueResult = JSON.parse(readFileSync(fullQueueResultPath, "utf8"));

  assert.equal(written.length, 8);
  assert.equal(statSync(runDirectory).mode & 0o777, 0o700);
  assert.equal(existsSync(path.join(runDirectory, "job_source_import_queue.json")), true);
  assert.equal(existsSync(fullQueueResultPath), true);
  assert.equal(statSync(fullQueueResultPath).mode & 0o777, 0o600);
  assert.equal(Array.isArray(fullQueueResult.importQueue), true);
  assert.equal(fullQueueResult.prioritization.workflowVersion, "J002.01");
  assert.match(fullQueueResult.normalizedSourceRecords[0].rawSourceDigest, /^sha256:/);
  assert.equal(fullQueueResult.normalizedSourceRecords[0].sourceStructure.parserVersion, greenhouse.GREENHOUSE_SOURCE_STRUCTURE_PARSER_VERSION);
  const retrievals = JSON.parse(readFileSync(path.join(runDirectory, "greenhouse_retrievals.json"), "utf8"));
  assert.match(retrievals[0].jobs[0].content, /<p>/);
});

test("source and CLI contain no forbidden execution surfaces", () => {
  const implementation = `${source}\n${queueSource}\n${cliSource}`;

  assert.doesNotMatch(implementation, /method:\s*["']POST["']/i);
  assert.doesNotMatch(implementation, /apply\(|submit\(|sendMessage\(|generateResume\(|generateCoverLetter\(|puppeteer|playwright|chromium|selenium/i);
  assert.doesNotMatch(implementation, /openai\.|anthropic\.|gemini\.|runOllama|localhost:11434/i);
  assert.doesNotMatch(implementation, /from\s+["'].*\/os|from\s+["'].*\/operator|app\/os|app\/operator/);
});

test("CLI summary is redacted and reports public-provider safety flags", async () => {
  const result = await greenhouse.buildGreenhouseDiscoveryQueue({
    manifest: manifest(),
    generatedAt: "2026-08-08T12:00:00Z",
    fetcher: mockFetcher({ example: [job()] }),
  });
  const summary = greenhouse.buildGreenhouseDiscoveryCliSummary(result, 0);
  const summaryText = serialize(summary);

  assert.equal(summary.externalProviderCalls, 1);
  assert.equal(summary.noAuthentication, true);
  assert.equal(summary.noCookies, true);
  assert.equal(summary.noBrowserAutomation, true);
  assert.equal(summary.noScraping, true);
  assert.equal(summary.noApplicationSubmitted, true);
  assert.equal(summary.noResumeGenerated, true);
  assert.equal(summary.noMessageSent, true);
  assert.equal(summary.noExternalAi, true);
  assert.doesNotMatch(summaryText, /\/Users\//);
  assert.doesNotMatch(summaryText, /\.staffordos/);
});
