import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { createRequire } from "node:module";
import Module from "node:module";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const frontendPackage = path.join(root, "staffordos/ui/operator-frontend/package.json");
const packetPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/applicationIntelligencePacket.ts");
const bridgePath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/jobDescriptionIntakeBridge.ts");
const cliPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/runApplicationIntelligencePacket.mjs");
const requireFromFrontend = createRequire(frontendPackage);
const ts = requireFromFrontend("typescript");
const packetSource = readFileSync(packetPath, "utf8");
const cliSource = readFileSync(cliPath, "utf8");

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

const packets = requireTypeScriptModule(packetPath);
const bridge = requireTypeScriptModule(bridgePath);
const generatedAt = "2026-08-11T12:00:00Z";

function syntheticDescription(extra = "") {
  return [
    "Company: Example Automation",
    "Role: AI Automation Product Manager",
    "",
    "Required: AI automation, APIs, SQL, product delivery, stakeholder communication, and workflow automation.",
    "Preferred: Documentation and enablement for business technology teams.",
    extra,
  ].join("\n");
}

function careerFact(overrides = {}) {
  return {
    id: overrides.id || "career_fact_ai_automation",
    factType: overrides.factType || "PROJECT",
    statement: "Synthetic evidence-backed AI automation, APIs, SQL, product delivery, stakeholder communication, and workflow automation.",
    normalizedStatement: "ai automation apis sql product delivery stakeholder communication workflow automation",
    technologyOrSkill: overrides.technologyOrSkill || "AI automation",
    verificationStatus: overrides.verificationStatus || "VERIFIED",
    authorityClassification: overrides.authorityClassification || "REPOSITORY_BACKED",
    supportLevel: overrides.supportLevel || "DIRECT",
    experienceClassification: overrides.experienceClassification || "USED_IN_CONTROLLED_PROJECT",
    sourceEvidenceIds: overrides.sourceEvidenceIds || ["career_evidence_ai_automation"],
    limitations: overrides.limitations || ["Synthetic CareerFact fixture."],
    ...overrides,
  };
}

function careerEvidence(overrides = {}) {
  return {
    id: overrides.id || "career_evidence_ai_automation",
    evidenceType: overrides.evidenceType || "PROJECT_ARTIFACT",
    sourceType: overrides.sourceType || "PROJECT_ARTIFACT",
    title: "Synthetic AI automation evidence",
    summary: "Synthetic evidence for AI automation, APIs, SQL, product delivery, stakeholder communication, and workflow automation.",
    authorityClassification: overrides.authorityClassification || "REPOSITORY_BACKED",
    supportsFactIds: overrides.supportsFactIds || ["career_fact_ai_automation"],
    challengesFactIds: [],
    limitations: overrides.limitations || ["Synthetic CareerEvidence fixture."],
    ...overrides,
  };
}

function resumeVersion(overrides = {}) {
  return {
    schemaVersion: "staffordos.job_search.private_resume_version.v1",
    resumeVersionId: overrides.resumeVersionId || "resume_version_ai_automation_safe",
    workspaceId: "professional",
    assetReferenceId: "asset_ai_automation_safe",
    sourceDocumentReference: {
      privateSourceId: "source_ai_automation_safe",
      sourceRootAuthority: "APPROVED_PRIVATE_CAREER_SOURCE_ROOT",
      sourcePath: "/private/not-shown",
      sourcePathRedacted: "~/private/not-shown",
    },
    originalFilename: "synthetic_resume.pdf",
    contentDigest: "sha256:synthetic",
    documentFormat: "PDF",
    observedAt: "2026-08-11T10:00:00Z",
    createdAt: "2026-08-11T10:00:00Z",
    modifiedAtObserved: "2026-08-11T10:00:00Z",
    purpose: "ROLE_TARGETED_RESUME",
    targetRoleFamily: "AI Automation Product",
    targetCompanyReference: null,
    targetRoleReference: "AI Automation Product Manager",
    sourceAuthority: "PRIVATE_CAREER_SOURCE_DOCUMENT",
    privacy: "Professional owner-private",
    reviewStatus: overrides.reviewStatus || "OPERATOR_CONFIRMED",
    factSafetyStatus: overrides.factSafetyStatus || "SUPPORTED_VERIFIED",
    supersedesResumeVersionId: null,
    derivedFromResumeVersionId: null,
    claimSafety: overrides.claimSafety || [
      {
        claimId: "resume_claim_ai_supported",
        resumeVersionId: overrides.resumeVersionId || "resume_version_ai_automation_safe",
        claimType: "TECHNICAL_SKILL",
        safeClaimSummary: "AI automation capability is supported by synthetic fixture evidence.",
        classification: "SUPPORTED_VERIFIED",
        supportingCareerFactIds: ["career_fact_ai_automation"],
        supportingEvidenceIds: ["career_evidence_ai_automation"],
        limitations: ["Synthetic supported claim fixture."],
      },
    ],
    limitations: overrides.limitations || ["Synthetic ResumeVersion fixture."],
    resumeIsCareerTruth: false,
    ...overrides,
  };
}

function intake(overrides = {}) {
  return bridge.buildJobDescriptionIntakeBridge({
    generatedAt,
    sourceUrl: "https://jobs.example.invalid/ai-automation-product-manager",
    jobDescriptionText: syntheticDescription(overrides.extraDescription || ""),
    operatorApprovedForOpportunityImport: true,
    resumeVersions: overrides.resumeVersions || [resumeVersion()],
    careerFacts: overrides.careerFacts || [careerFact()],
    careerEvidence: overrides.careerEvidence || [careerEvidence()],
    applications: overrides.applications || [],
  });
}

function buildPacket(overrides = {}) {
  const result = overrides.intakeResult || intake(overrides);
  return packets.buildApplicationIntelligencePackets({
    generatedAt,
    queueResult: result.queueResult,
    recommendationResult: result.recommendationResult,
    analysisBundles: result.analysisBundle ? [result.analysisBundle] : [],
    normalizedOpportunities: result.normalizedOpportunity ? [result.normalizedOpportunity] : [],
    resumeVersions: overrides.resumeVersions || [resumeVersion()],
    careerFacts: overrides.careerFacts || [careerFact()],
    careerEvidence: overrides.careerEvidence || [careerEvidence()],
  });
}

test("packet assembly reuses existing Explainable Fit and recommendation output", () => {
  const result = buildPacket();
  const packet = result.packets[0];

  assert.equal(result.summary.packetsCreated, 1);
  assert.equal(packet.fit.explainableFitReused, true);
  assert.equal(packet.fit.recommendationReused, true);
  assert.equal(packet.applicationDecision.recommendation, packet.readModel?.recommendation || result.readModel[0].recommendation);
  assert.equal(result.sourceAuthority.newFitEngineCreated, false);
  assert.equal(result.sourceAuthority.newRecommendationEngineCreated, false);
});

test("packet attaches CareerFact and CareerEvidence references without promoting claims", () => {
  const result = buildPacket();
  const packet = result.packets[0];

  assert.ok(packet.verifiedCareerEvidence.careerFactReferenceCount > 0);
  assert.ok(packet.verifiedCareerEvidence.careerEvidenceReferenceCount > 0);
  assert.equal(packet.verifiedCareerEvidence.supportingEvidence[0].factAuthority[0].disposition, "SUPPORTED");
  assert.equal(packet.truthBoundary.unsupportedClaimsPromoted, false);
  assert.equal(result.auditSummary.unsupportedClaimsPromoted, false);
  assert.equal(result.auditSummary.noCareerFactPromoted, true);
  assert.equal(result.auditSummary.noCareerEvidenceMutated, true);
});

test("unsupported requirement mappings remain blockers instead of becoming facts", () => {
  const safeResume = resumeVersion();
  const result = buildPacket({
    resumeVersions: [safeResume],
    careerFacts: [],
    careerEvidence: [],
  });
  const packet = result.packets[0];

  assert.equal(packet.applicationDecision.recommendation, "REVIEW");
  assert.ok(packet.gapsAndRisks.evidenceGaps.length > 0);
  assert.ok(packet.claimDispositions.some((claim) => claim.disposition === "UNSUPPORTED"));
  assert.equal(packet.truthBoundary.unsupportedClaimsPromoted, false);
});

test("best ResumeVersion candidate is selected from existing recommendation authority", () => {
  const selectedResume = resumeVersion();
  const result = buildPacket({ resumeVersions: [selectedResume] });
  const packet = result.packets[0];

  assert.equal(packet.resume.resumeVersionId, selectedResume.resumeVersionId);
  assert.equal(packet.resume.safetyState, "SAFE_TO_REUSE");
  assert.equal(packet.resume.safeToReuse, true);
  assert.equal(packet.resume.resumeGenerated, false);
  assert.equal(packet.resume.resumeMutated, false);
});

test("no safe ResumeVersion keeps the best candidate blocked for review", () => {
  const unsafeResume = resumeVersion({
    resumeVersionId: "resume_version_conflicting",
    factSafetyStatus: "CONFLICTING",
    claimSafety: [
      {
        claimId: "resume_claim_conflicting",
        resumeVersionId: "resume_version_conflicting",
        claimType: "METRIC",
        safeClaimSummary: "Unsupported metric remains blocked.",
        classification: "CONFLICTING",
        supportingCareerFactIds: [],
        supportingEvidenceIds: [],
        limitations: ["Synthetic conflict fixture."],
      },
    ],
  });
  const result = buildPacket({ resumeVersions: [unsafeResume] });
  const packet = result.packets[0];

  assert.equal(packet.resume.resumeVersionId, unsafeResume.resumeVersionId);
  assert.equal(packet.resume.safetyState, "NOT_SAFE_TO_REUSE");
  assert.equal(packet.resume.safeToReuse, false);
  assert.equal(packet.applicationDecision.deterministicNextAction, "REVIEW_RESUME");
  assert.equal(packet.resume.unsupportedClaims[0].disposition, "CONFLICTING");
});

test("missing evidence with a safe resume produces REVIEW_EVIDENCE", () => {
  const selectedResume = resumeVersion();
  const result = buildPacket({
    resumeVersions: [selectedResume],
    careerFacts: [],
    careerEvidence: [],
  });

  assert.equal(result.packets[0].resume.safeToReuse, true);
  assert.equal(result.packets[0].applicationDecision.deterministicNextAction, "REVIEW_EVIDENCE");
});

test("existing Application prevention does not create a packet without normalized opportunity authority", () => {
  const duplicateIntake = intake({
    applications: [
      {
        applicationId: "app_existing",
        companyReference: { label: "Example Automation", requisitionAlias: null },
        roleReference: { title: "AI Automation Product Manager" },
      },
    ],
  });
  const result = buildPacket({ intakeResult: duplicateIntake });

  assert.equal(duplicateIntake.queueItem.state, "EXISTING_APPLICATION");
  assert.equal(result.summary.packetsCreated, 0);
  assert.equal(result.summary.skippedWithoutNormalizedOpportunity, 1);
  assert.equal(result.auditSummary.noApplicationCreated, true);
});

test("read model hides private paths, source URLs, raw job text, and raw resume text", () => {
  const result = buildPacket();
  const readModel = result.readModel[0];
  const serialized = JSON.stringify(readModel);

  assert.equal(readModel.privatePathVisible, false);
  assert.equal(readModel.rawJobTextVisible, false);
  assert.equal(readModel.rawResumeTextVisible, false);
  assert.equal(readModel.sourceUrlVisible, false);
  assert.doesNotMatch(serialized, /\/Users\/|jobs\.example\.invalid|Required: AI automation|sourcePath/);
});

test("read model projects human-safe fit, evidence, gap, resume, and next-action explanation", () => {
  const result = buildPacket({
    careerFacts: [
      careerFact({
        organization: "StaffordOS",
        roleOrTitle: "AI agent orchestration and governance",
        statement: "Ross built governed AI agent orchestration workflows with review boundaries.",
        technologyOrSkill: "AI agent orchestration",
      }),
    ],
    careerEvidence: [
      careerEvidence({
        title: "StaffordOS governance artifact",
        summary: "Evidence for governed AI agent orchestration and workflow review boundaries.",
      }),
    ],
  });
  const review = result.readModel[0].humanReview;
  const serialized = JSON.stringify(review);

  assert.ok(review.whyThisFits.some((reason) => /role asks/i.test(reason)));
  assert.ok(review.supportingExperience.some((item) => /StaffordOS/.test(item.label)));
  assert.ok(review.supportingExperience.some((item) => /governed AI agent orchestration/i.test(item.detail)));
  assert.ok(review.gapsAndRisks.length >= 1);
  assert.ok(["Ready to tailor", "Needs review", "Blocked"].includes(review.resumeReadiness.label));
  assert.match(review.nextAction, /Review|Ready|apply|hold|skip/i);
  assert.doesNotMatch(serialized, /CareerFact|CareerEvidence|ApplicationArtifactVersion|packet ID|ResumeVersion|authority digest|career_fact|career_evidence|sha256:|\/Users\//);
});

test("application intelligence does not surface posting boilerplate as candidate gaps", () => {
  const result = buildPacket({
    extraDescription: `
Equal opportunity employer. Compensation includes OTE, commission, bonus, and equity.
Benefits and perks are available to employees. How we're different is our culture.
Applications are accepted on a rolling basis; deadline to apply is none.
#LI-Hybrid. Sample customer projects are described below. See the privacy notice.
    `,
  });
  const serialized = JSON.stringify(result.readModel[0].humanReview);

  assert.doesNotMatch(serialized, /equal opportunity|compensation|OTE|commission|bonus|equity|benefits|perks|how we're different|rolling|deadline|#LI-Hybrid|sample customer|privacy notice/i);
});

test("unsupported mappings become gaps, not supporting experience", () => {
  const result = buildPacket({
    careerFacts: [],
    careerEvidence: [],
  });
  const review = result.readModel[0].humanReview;

  assert.equal(review.supportingExperience.length, 0);
  assert.ok(review.gapsAndRisks.some((item) => item.kind === "Clear gap" || item.kind === "Needs verification"));
  assert.equal(JSON.stringify(review.supportingExperience).includes("No verified support"), false);
});

test("private packet writer stores owner-private JSON outside the repository", () => {
  const privateRoot = mkdtempSync(path.join(tmpdir(), "careeros-v102-packets-"));
  const result = buildPacket();
  const writeResult = packets.writeApplicationIntelligencePacketOutputs({
    outputRoot: path.join(privateRoot, "application-intelligence-packets"),
    repositoryRoot: root,
    result,
  });

  assert.equal(writeResult.artifactNames.length, 6);
  assert.equal(writeResult.privatePathVisible, false);
  assert.equal((statSync(writeResult.runDirectory).mode & 0o777).toString(8), "700");
  assert.equal((statSync(writeResult.writtenFiles[0]).mode & 0o777).toString(8), "600");
});

test("source and CLI expose no external action, application creation, or resume generation path", () => {
  const combined = `${packetSource}\n${cliSource}`;

  assert.doesNotMatch(combined, /fetch\(|XMLHttpRequest|playwright|puppeteer|selenium|browserControl/);
  assert.doesNotMatch(combined, /submitApplication|applyToJob|createApplication\(|sendRecruiter|sendMessage|mailto:/);
  assert.doesNotMatch(combined, /generateResume|generateCover|mutateResume|writeResume|from\s+["']openai|from\s+["']@anthropic|OLLAMA_HOST/i);
  assert.match(cliSource, /from-intake/);
  assert.match(cliSource, /latest/);
});
