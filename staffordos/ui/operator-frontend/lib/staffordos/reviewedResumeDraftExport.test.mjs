import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { createRequire } from "node:module";
import Module from "node:module";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const frontendPackage = path.join(root, "staffordos/ui/operator-frontend/package.json");
const exportPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/reviewedResumeDraftExport.ts");
const cliPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/runReviewedResumeDraftExport.mjs");
const routePath = path.join(
  root,
  "staffordos/ui/operator-frontend/app/os/professional/jobs/artifacts/[artifactVersionId]/docx/route.ts",
);
const requireFromFrontend = createRequire(frontendPackage);
const ts = requireFromFrontend("typescript");
const exportSource = readFileSync(exportPath, "utf8");
const cliSource = readFileSync(cliPath, "utf8");
const routeSource = readFileSync(routePath, "utf8");
const implementationSource = [exportSource, cliSource, routeSource].join("\n");

function requireTypeScriptModule(targetPath) {
  const originalTsExtension = Module._extensions[".ts"];
  Module._extensions[".ts"] = function compileTypeScriptModule(mod, filename) {
    const source = readFileSync(filename, "utf8");
    const compiled = ts.transpileModule(source, {
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

const reviewedExport = requireTypeScriptModule(exportPath);
const generatedAt = "2026-08-11T12:00:00Z";

function claim(overrides = {}) {
  return {
    claimId: overrides.claimId || "claim_summary_ai_automation",
    section: overrides.section || "summary",
    draftText: overrides.draftText || "Builds AI automation workflows using verified APIs and structured governance.",
    disposition: overrides.disposition || "SUPPORTED",
    packetRequirementIds: overrides.packetRequirementIds || ["requirement_ai_automation"],
    careerFactIds: overrides.careerFactIds || ["fact_ai_automation"],
    careerEvidenceIds: overrides.careerEvidenceIds || ["evidence_ai_automation"],
    sourcePacketId: "packet_ai_automation",
    generatedFrom: overrides.generatedFrom || "CAREEROS_SAFE_POSITIONING",
    limitations: overrides.limitations || ["Synthetic traceability fixture."],
    ...overrides,
  };
}

function sourceArtifact(overrides = {}) {
  const draftOverrides = overrides.draft || {};
  const artifactOverrides = { ...overrides };
  delete artifactOverrides.draft;
  delete artifactOverrides.summary;
  const baseDraft = {
    summary: [
      "Builds AI automation workflows using verified APIs and structured governance.",
      ...(overrides.summary || []),
    ],
    skills: ["AI automation", "API integration", "workflow documentation"],
    experience: [
      {
        employer: "Example Systems",
        title: "Business Technology Lead",
        startDate: "2021-01",
        endDate: "2024-12",
        bullets: ["Delivered verified automation workflows with documented stakeholder requirements."],
        claimIds: ["claim_experience_automation"],
        limitations: ["Synthetic experience fixture."],
      },
    ],
    projects: [
      {
        label: "CareerOS",
        bullets: ["Built governed job-search workflow components with tests and rollback boundaries."],
        claimIds: ["claim_project_careeros"],
        limitations: ["Synthetic project fixture."],
      },
    ],
    education: ["B.A., Wesleyan University"],
    certifications: [],
    claimRefs: ["claim_summary_ai_automation", "claim_experience_automation", "claim_project_careeros"],
  };
  const draft = {
    ...baseDraft,
    ...draftOverrides,
    summary: draftOverrides.summary || baseDraft.summary,
    skills: draftOverrides.skills || baseDraft.skills,
    experience: draftOverrides.experience || baseDraft.experience,
    projects: draftOverrides.projects || baseDraft.projects,
    education: draftOverrides.education || baseDraft.education,
    certifications: draftOverrides.certifications || baseDraft.certifications,
    claimRefs: draftOverrides.claimRefs || baseDraft.claimRefs,
  };
  return {
    schemaVersion: "staffordos.careeros.application_artifact_version.v1",
    workflowVersion: "CAREEROS_APPLICATION_INTELLIGENCE_V1_03",
    artifactVersionId: overrides.artifactVersionId || "draft_artifact_ai_automation",
    artifactType: "RESUME",
    version: overrides.version || 1,
    createdAt: generatedAt,
    workspaceId: "professional",
    applicationIntelligencePacketId: "packet_ai_automation",
    jobOpportunityId: "opportunity_ai_automation",
    company: overrides.company || "Example Automation",
    role: overrides.role || "AI Automation Product Manager",
    sourceCareerAuthorityDigest: "sha256:career-authority",
    sourcePacketDigest: "sha256:packet",
    draftContentDigest: overrides.draftContentDigest || "sha256:draft-content",
    generationMethod: {
      method: "DETERMINISTIC_TRUTH_BOUND_ASSEMBLER",
      modelUsed: false,
      modelProvider: null,
      modelName: null,
      instructionVersion: null,
      externalAiUsed: false,
      ollamaUsed: false,
      limitations: ["Synthetic generation fixture."],
    },
    draft,
    claimTraceability: overrides.claimTraceability || [
      claim(),
      claim({
        claimId: "claim_experience_automation",
        section: "experience",
        draftText: "Delivered verified automation workflows with documented stakeholder requirements.",
      }),
      claim({
        claimId: "claim_project_careeros",
        section: "projects",
        draftText: "Built governed job-search workflow components with tests and rollback boundaries.",
      }),
    ],
    validationIssues: overrides.validationIssues || [],
    safetyState: overrides.safetyState || "DRAFT_READY_FOR_REVIEW",
    operatorApprovalState: overrides.operatorApprovalState || "PENDING_REVIEW",
    humanReviewRequired: true,
    supersedesArtifactVersionId: null,
    supersededByArtifactVersionId: null,
    fileReferences: [
      {
        fileReferenceId: "structured_json_ref",
        fileKind: "STRUCTURED_JSON",
        created: false,
        privatePathVisible: false,
        limitations: ["Synthetic structured fixture."],
      },
    ],
    privacy: "Professional owner-private",
    applicationCreated: false,
    applicationSubmitted: false,
    resumeExported: false,
    resumeUploaded: false,
    coverLetterGenerated: false,
    messageSent: false,
    browserAutomationUsed: false,
    externalProviderCall: false,
    externalAiUsed: false,
    ollamaUsed: false,
    privatePathVisible: false,
    rawCareerEvidenceVisibleInReadModel: false,
    limitations: ["Synthetic source draft fixture."],
    ...artifactOverrides,
  };
}

function approve(artifact) {
  return reviewedExport.recordResumeDraftExportReviewDecision({
    artifact,
    decision: "APPROVE_FOR_EXPORT",
    decidedAt: generatedAt,
  }).artifact;
}

test("export requires explicit operator approval", () => {
  const result = reviewedExport.buildReviewedResumeDraftExport({
    generatedAt,
    artifacts: [sourceArtifact()],
  });
  const exportArtifact = result.exportArtifacts[0];

  assert.equal(exportArtifact.exportState, "EXPORT_BLOCKED");
  assert.equal(exportArtifact.fileReferences.find((file) => file.fileKind === "DOCX").created, false);
  assert.equal(exportArtifact.validationIssues.some((issue) => issue.code === "OPERATOR_APPROVAL_REQUIRED"), true);
  assert.equal(result.summary.docxExportsCreated, 0);
  assert.equal(result.summary.blockedExports, 1);
});

test("approved structured draft exports deterministic ATS-friendly DOCX", () => {
  const approved = approve(sourceArtifact());
  const result = reviewedExport.buildReviewedResumeDraftExport({
    generatedAt,
    artifacts: [approved],
  });
  const exportArtifact = result.exportArtifacts[0];
  const docxReference = exportArtifact.fileReferences.find((file) => file.fileKind === "DOCX");
  const docx = reviewedExport.buildDocxForReviewedResumeDraft(approved);
  const docxText = docx.toString("utf8");

  assert.equal(exportArtifact.exportState, "DOCX_READY");
  assert.equal(docxReference.created, true);
  assert.equal(docxReference.mimeType, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
  assert.match(docxReference.filename, /^Ross_Stafford_Example_Automation_AI_Automation_Product_Manager_Resume_v1\.docx$/);
  assert.equal(docx.subarray(0, 2).toString("utf8"), "PK");
  assert.match(docxText, /PROFESSIONAL SUMMARY/);
  assert.match(docxText, /PROFESSIONAL EXPERIENCE/);
  assert.match(docxText, /CORE SKILLS \/ TECHNOLOGIES/);
  assert.doesNotMatch(docxText, /career_fact|career_evidence|claim_/i);
  assert.equal(exportArtifact.submissionStatus, "NOT_SUBMITTED");
  assert.equal(exportArtifact.applicationCreated, false);
  assert.equal(exportArtifact.applicationSubmitted, false);
  assert.equal(exportArtifact.resumeVersionCreated, false);
  assert.equal(exportArtifact.resumeVersionMutated, false);
  assert.equal(exportArtifact.messageSent, false);
  assert.equal(exportArtifact.externalAiUsed, false);
  assert.equal(exportArtifact.ollamaUsed, false);
});

test("blocked or evidence-review drafts fail closed even when approval is requested", () => {
  const blocked = approve(sourceArtifact({
    safetyState: "DRAFT_NEEDS_EVIDENCE_REVIEW",
    validationIssues: [
      {
        issueId: "issue_metric",
        claimId: "claim_metric",
        code: "UNSUPPORTED_METRIC_OMITTED",
        severity: "REVIEW",
        message: "Synthetic unsupported metric.",
        limitations: ["The metric remains unsupported."],
      },
    ],
  }));
  const result = reviewedExport.buildReviewedResumeDraftExport({
    generatedAt,
    artifacts: [blocked],
  });
  const exportArtifact = result.exportArtifacts[0];

  assert.equal(blocked.safetyState, "DRAFT_NEEDS_EVIDENCE_REVIEW");
  assert.equal(exportArtifact.exportState, "EXPORT_BLOCKED");
  assert.equal(exportArtifact.validationIssues.some((issue) => issue.code === "OPERATOR_APPROVAL_REQUIRED"), true);
  assert.equal(exportArtifact.validationIssues.some((issue) => issue.code === "DRAFT_VALIDATION_ISSUES_REMAIN"), true);
  assert.equal(exportArtifact.fileReferences.find((file) => file.fileKind === "DOCX").created, false);
});

test("claim traceability is required for every substantive draft claim", () => {
  const approved = approve(sourceArtifact({
    draft: {
      claimRefs: ["claim_summary_ai_automation", "claim_missing_trace"],
    },
  }));
  const issues = reviewedExport.validateReviewedResumeDraftForExport(approved);

  assert.equal(issues.some((issue) => issue.code === "CLAIM_TRACEABILITY_MISSING"), true);
});

test("internal IDs and placeholders block export instead of rendering private authority", () => {
  const approved = approve(sourceArtifact({
    summary: ["Supported by career_fact_private_123 and TODO review."],
  }));
  const result = reviewedExport.buildReviewedResumeDraftExport({
    generatedAt,
    artifacts: [approved],
  });
  const codes = result.exportArtifacts[0].validationIssues.map((issue) => issue.code);

  assert.equal(codes.includes("INTERNAL_ID_RENDERED"), true);
  assert.equal(codes.includes("UNSUPPORTED_PLACEHOLDER_RENDERED"), true);
  assert.equal(result.exportArtifacts[0].exportState, "EXPORT_BLOCKED");
});

test("artifact version increments and supersession are deterministic", () => {
  const approved = approve(sourceArtifact());
  const first = reviewedExport.buildReviewedResumeDraftExport({
    generatedAt,
    artifacts: [approved],
  }).exportArtifacts[0];
  const second = reviewedExport.buildReviewedResumeDraftExport({
    generatedAt,
    artifacts: [approved],
    previousExportVersions: [first],
  }).exportArtifacts[0];

  assert.equal(first.version, 1);
  assert.equal(second.version, 2);
  assert.equal(second.supersedesArtifactVersionId, first.artifactVersionId);
  assert.notEqual(second.artifactVersionId, first.artifactVersionId);
});

test("private output writer preserves permissions and writes DOCX outside Git", () => {
  const approved = approve(sourceArtifact());
  const result = reviewedExport.buildReviewedResumeDraftExport({
    generatedAt,
    artifacts: [approved],
  });
  const outputRoot = path.join(mkdtempSync(path.join(tmpdir(), "careeros-v103b-")), "exports");
  const writeResult = reviewedExport.writeReviewedResumeDraftExportOutputs({
    outputRoot,
    repositoryRoot: root,
    result,
    sourceArtifacts: [approved],
  });

  assert.equal(writeResult.privatePathVisible, false);
  assert.equal(writeResult.docxFilenames.length, 1);
  assert.equal(writeResult.jsonArtifactNames.includes("reviewed_resume_draft_export_result.json"), true);
  assert.equal(statSync(writeResult.runDirectory).mode & 0o777, 0o700);
  for (const filePath of writeResult.writtenFiles) {
    assert.equal(statSync(filePath).mode & 0o777, 0o600);
  }
});

test("read model exposes download route but hides content, paths, and authority IDs", () => {
  const approved = approve(sourceArtifact());
  const result = reviewedExport.buildReviewedResumeDraftExport({
    generatedAt,
    artifacts: [approved],
  });
  const record = result.readModel[0];

  assert.equal(record.docxCreated, true);
  assert.equal(record.nextAction, "DOWNLOAD_DOCX");
  assert.equal(record.downloadPath, `/os/professional/jobs/artifacts/${record.artifactVersionId}/docx`);
  assert.equal(record.operatorApprovalState, "APPROVED");
  assert.equal(record.sourceDraftSafetyState, "APPROVED_FOR_EXPORT");
  assert.equal(record.privatePathVisible, false);
  assert.equal(record.draftContentVisible, false);
  assert.equal(record.sourceAuthorityIdsVisible, false);
  assert.doesNotMatch(JSON.stringify(record), /career_fact|career_evidence|draftText|\/Users\//i);
});

test("review decision records approval without creating application or submission side effects", () => {
  const review = reviewedExport.recordResumeDraftExportReviewDecision({
    artifact: sourceArtifact(),
    decision: "APPROVE_FOR_EXPORT",
    decidedAt: generatedAt,
  });

  assert.equal(review.artifact.safetyState, "APPROVED_FOR_EXPORT");
  assert.equal(review.review.decision, "APPROVE_FOR_EXPORT");
  assert.equal(review.review.applicationCreated, false);
  assert.equal(review.review.applicationSubmitted, false);
  assert.equal(review.review.resumeUploaded, false);
  assert.equal(review.review.messageSent, false);
});

test("request changes and reject persist review state without creating DOCX or external side effects", () => {
  const requestChanges = reviewedExport.recordResumeDraftExportReviewDecision({
    artifact: sourceArtifact({ artifactVersionId: "draft_request_changes" }),
    decision: "REQUEST_CHANGES",
    decidedAt: generatedAt,
  }).artifact;
  const rejected = reviewedExport.recordResumeDraftExportReviewDecision({
    artifact: sourceArtifact({ artifactVersionId: "draft_rejected" }),
    decision: "REJECT",
    decidedAt: generatedAt,
  }).artifact;
  const result = reviewedExport.buildReviewedResumeDraftExport({
    generatedAt,
    artifacts: [requestChanges, rejected],
  });

  assert.equal(requestChanges.operatorApprovalState, "REQUEST_CHANGES");
  assert.equal(rejected.operatorApprovalState, "REJECTED");
  assert.equal(result.summary.docxExportsCreated, 0);
  assert.equal(result.summary.blockedExports, 2);
  assert.equal(result.readModel[0].operatorApprovalState, "REQUEST_CHANGES");
  assert.equal(result.readModel[1].operatorApprovalState, "REJECTED");
  assert.equal(result.exportArtifacts.every((artifact) => artifact.exportState === "EXPORT_BLOCKED"), true);
  assert.equal(result.exportArtifacts.every((artifact) => artifact.applicationCreated === false), true);
  assert.equal(result.exportArtifacts.every((artifact) => artifact.applicationSubmitted === false), true);
  assert.equal(result.exportArtifacts.every((artifact) => artifact.messageSent === false), true);
  assert.equal(result.exportArtifacts.every((artifact) => artifact.browserAutomationUsed === false), true);
  assert.equal(result.exportArtifacts.every((artifact) => artifact.externalAiUsed === false), true);
});

test("private runner applies explicit review decisions without using approval-only shortcut", () => {
  const privateRoot = mkdtempSync(path.join(tmpdir(), "careeros-v103b-review-"));
  const jobSearchRoot = path.join(privateRoot, "job-search");
  const draftRoot = path.join(jobSearchRoot, "application-artifacts", "run_20260811");
  const output = sourceArtifact({ artifactVersionId: "draft_review_runner" });
  mkdirSync(draftRoot, { recursive: true });
  writeFileSync(path.join(draftRoot, "application_artifact_versions.json"), `${JSON.stringify([output], null, 2)}\n`);

  const { result } = reviewedExport.runReviewedResumeDraftExportFromPrivateArtifacts({
    generatedAt,
    jobSearchRoot,
    repositoryRoot: root,
    artifactIds: ["draft_review_runner"],
    reviewDecision: "REQUEST_CHANGES",
    writeOutputs: false,
  });

  assert.equal(result.exportArtifacts[0].operatorApprovalState, "REQUEST_CHANGES");
  assert.equal(result.summary.docxExportsCreated, 0);
  assert.equal(result.summary.blockedExports, 1);
});

test("implementation contains no submission, messaging, browser, provider, AI, or PDF generation path", () => {
  assert.match(cliSource, /Only APPROVED_FOR_EXPORT/);
  assert.match(routeSource, /Cache-Control/);
  assert.doesNotMatch(implementationSource, /submitApplication|applyToJob|sendRecruiter|sendMessage|mailto:/);
  assert.doesNotMatch(implementationSource, /playwright|puppeteer|selenium|browserControl|fetch\(|XMLHttpRequest/i);
  assert.doesNotMatch(implementationSource, /from\s+["']openai|from\s+["']@anthropic|OLLAMA_HOST|runOllama/i);
  assert.doesNotMatch(implementationSource, /pdfkit|libreoffice|soffice|pandoc/i);
});
