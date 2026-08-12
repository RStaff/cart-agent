import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { createRequire } from "node:module";
import Module from "node:module";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const frontendPackage = path.join(root, "staffordos/ui/operator-frontend/package.json");
const draftPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/truthBoundResumeDraft.ts");
const cliPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/runTruthBoundResumeDraft.mjs");
const requireFromFrontend = createRequire(frontendPackage);
const ts = requireFromFrontend("typescript");
const draftSource = readFileSync(draftPath, "utf8");
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

const drafts = requireTypeScriptModule(draftPath);
const generatedAt = "2026-08-11T12:00:00Z";

function careerFact(overrides = {}) {
  return {
    id: overrides.id || "career_fact_ai_automation",
    workspaceId: "professional",
    factType: overrides.factType || "SKILL",
    subject: "Ross Stafford",
    statement: overrides.statement || "AI automation and workflow design are supported by synthetic CareerFact authority.",
    normalizedStatement: "ai automation workflow design",
    startDate: overrides.startDate ?? null,
    endDate: overrides.endDate ?? null,
    current: null,
    organization: overrides.organization || null,
    roleOrTitle: overrides.roleOrTitle || null,
    location: null,
    classification: overrides.classification || "AI Automation",
    supportLevel: overrides.supportLevel || "DIRECT",
    verificationStatus: overrides.verificationStatus || "VERIFIED",
    authorityClassification: overrides.authorityClassification || "REPOSITORY_BACKED",
    privacyClassification: "Professional owner-private",
    sourceEvidenceIds: overrides.sourceEvidenceIds || ["career_evidence_ai_automation"],
    conflictingEvidenceIds: [],
    conflictTypes: [],
    metricClassification: overrides.metricClassification || "NOT_APPLICABLE",
    measurementAuthority: overrides.measurementAuthority || null,
    experienceClassification: overrides.experienceClassification || "USED_IN_CONTROLLED_PROJECT",
    proficiencyLabel: null,
    yearsOfExperience: null,
    yearsAuthority: null,
    deploymentClaim: "CONTROLLED_PROJECT",
    customerUseClaim: "NONE",
    technologyOrSkill: overrides.technologyOrSkill || "AI automation",
    limitations: overrides.limitations || ["Synthetic CareerFact fixture."],
    operatorNotes: null,
    positioningBoundaries: [],
    testOnly: true,
    ...overrides,
  };
}

function careerEvidence(overrides = {}) {
  return {
    id: overrides.id || "career_evidence_ai_automation",
    workspaceId: "professional",
    evidenceType: overrides.evidenceType || "PROJECT_ARTIFACT",
    title: "Synthetic AI automation evidence",
    summary: "Synthetic evidence for AI automation and workflow design.",
    sourceType: overrides.sourceType || "PROJECT_ARTIFACT",
    sourceReference: "synthetic-source",
    sourceArtifact: null,
    sourceOwner: "test",
    observedAt: generatedAt,
    sourceCreatedAt: null,
    authorityClassification: overrides.authorityClassification || "REPOSITORY_BACKED",
    privacyClassification: "Professional owner-private",
    freshness: "Recent",
    supportsFactIds: overrides.supportsFactIds || ["career_fact_ai_automation"],
    challengesFactIds: [],
    contentDigest: "sha256:synthetic",
    excerptReference: "synthetic",
    limitations: overrides.limitations || ["Synthetic CareerEvidence fixture."],
    testOnly: true,
    ...overrides,
  };
}

function support(overrides = {}) {
  return {
    requirementId: overrides.requirementId || "requirement_ai_automation",
    careerFactIds: overrides.careerFactIds || ["career_fact_ai_automation"],
    careerEvidenceIds: overrides.careerEvidenceIds || ["career_evidence_ai_automation"],
    disposition: overrides.disposition || "SUPPORTED",
    safePositioning:
      overrides.safePositioning ||
      "Designed evidence-backed AI automation workflows using APIs and structured documentation.",
    factAuthority: [],
    evidenceAuthority: [],
    limitations: overrides.limitations || ["Synthetic support fixture."],
  };
}

function packet(overrides = {}) {
  return {
    schemaVersion: "staffordos.careeros.application_intelligence_packet.v1",
    workflowVersion: "CAREEROS_APPLICATION_INTELLIGENCE_V1_02",
    packetId: overrides.packetId || "packet_ai_automation",
    generatedAt,
    workspaceId: "professional",
    capabilityFamily: "Career Operations",
    identity: {
      jobOpportunityId: overrides.jobOpportunityId || "opportunity_ai_automation",
      queueItemId: "queue_ai_automation",
      sourceRecordId: "source_ai_automation",
      recommendationId: "recommendation_ai_automation",
      company: overrides.company || "Example Automation",
      role: overrides.role || "AI Automation Product Manager",
      location: null,
      employmentType: null,
      compensation: null,
      canonicalSourceUrl: null,
      sourceUrlAuthority: "UNKNOWN",
      observedAt: generatedAt,
    },
    sourceProvenance: {
      providerName: "Synthetic",
      providerId: "synthetic",
      providerType: "OPERATOR_IMPORTED_TEXT",
      sourceSnapshotId: null,
      sourceDigest: "sha256:synthetic",
      descriptionDigest: "sha256:synthetic-description",
      sourceAuthority: "SYNTHETIC_TEST",
      rawDescriptionStoredPrivately: true,
      limitations: ["Synthetic packet fixture."],
    },
    fit: {
      explainableFitReused: true,
      recommendationReused: true,
      fitRecommendation: "REVIEW",
      recommendationExplanation: "Synthetic fit.",
      coverage: null,
      rankedLanes: [],
      fitRationale: ["Synthetic fit rationale."],
      matchedRequirements: [],
      unmatchedRequirements: [],
      majorBlockers: [],
      limitations: [],
    },
    gapsAndRisks: {
      skillGaps: [],
      evidenceGaps: [],
      unsupportedRequirements: overrides.unsupportedRequirements || [],
      seniorityConcerns: [],
      geographicConcerns: [],
      compensationConcerns: [],
      overqualificationConcerns: [],
      limitations: [],
    },
    verifiedCareerEvidence: {
      supportingEvidence: overrides.supportingEvidence || [support()],
      supportedCapabilities: [],
      supportedProjectsOrProducts: [],
      supportedEnterpriseExperience: [],
      careerFactReferenceCount: 1,
      careerEvidenceReferenceCount: 1,
      limitations: [],
    },
    resume: {
      status: "NO_SAFE_EXISTING_RESUMEVERSION",
      resumeVersionId: "historical_resume_not_authority",
      safeLabel: "Historical resume candidate",
      factSafetyStatus: "CONFLICTING",
      reviewStatus: "NEEDS_OPERATOR_REVIEW",
      safetyState: "NOT_SAFE_TO_REUSE",
      safeToReuse: false,
      canReuseAsIs: false,
      whyBestCandidate: ["Synthetic historical candidate only."],
      claimSafetyLimitations: [],
      unsupportedClaims: overrides.resumeUnsupportedClaims || [],
      evidenceGaps: [],
      evaluatedResumeVersionCount: 1,
      privatePathVisible: false,
      rawResumeTextVisible: false,
      resumeGenerated: false,
      resumeMutated: false,
    },
    applicationDecision: {
      recommendation: "REVIEW",
      applicationReadiness: "WAITING_FOR_SOURCE_OR_DUPLICATE_REVIEW",
      recommendedNextAction: "Review evidence.",
      deterministicNextAction: "REVIEW_EVIDENCE",
      authorityRequired: "ROSS_APPROVAL_BEFORE_APPLICATION",
      humanReviewRequired: true,
    },
    claimDispositions: [],
    truthBoundary: {
      careerFactsAreAuthority: true,
      careerEvidenceSupportsFacts: true,
      resumesAreDownstreamArtifacts: true,
      resumeWordingDoesNotVerifyCareerTruth: true,
      unsupportedClaimsPromoted: false,
      limitations: [],
    },
    applicationCreated: false,
    applicationSubmitted: false,
    resumeGenerated: false,
    resumeMutated: false,
    coverLetterGenerated: false,
    messageSent: false,
    externalProviderCall: false,
    browserAutomationUsed: false,
    externalAiUsed: false,
    ollamaUsed: false,
    privatePathVisible: false,
    rawJobTextVisible: false,
    rawResumeTextVisible: false,
    limitations: [],
    ...overrides,
  };
}

function packetResult(overrides = {}) {
  return {
    schemaVersion: "staffordos.careeros.application_intelligence_packet_result.v1",
    workflowVersion: "CAREEROS_APPLICATION_INTELLIGENCE_V1_02",
    generatedAt,
    workspaceId: "professional",
    capabilityFamily: "Career Operations",
    sourceAuthority: {},
    packets: [packet(overrides.packet || {})],
    readModel: [],
    skippedRecommendations: [],
    summary: {},
    auditSummary: {},
  };
}

function build(overrides = {}) {
  return drafts.buildTruthBoundResumeDrafts({
    generatedAt,
    packetResult: overrides.packetResult || packetResult(overrides),
    careerFacts: overrides.careerFacts || [careerFact()],
    careerEvidence: overrides.careerEvidence || [careerEvidence()],
    previousArtifactVersions: overrides.previousArtifactVersions || [],
    limit: overrides.limit || 1,
  });
}

test("truth-bound draft uses verified CareerFact and CareerEvidence instead of ResumeVersion truth", () => {
  const result = build();
  const artifact = result.artifactVersions[0];

  assert.equal(result.modelExecutionAuthority.modelUsed, false);
  assert.equal(result.sourceAuthority.resumeVersionsUsedAsCareerTruth, false);
  assert.equal(artifact.generationMethod.modelUsed, false);
  assert.equal(artifact.safetyState, "DRAFT_READY_FOR_REVIEW");
  assert.equal(artifact.claimTraceability.length, 1);
  assert.match(artifact.draft.summary[0], /AI automation workflows/);
});

test("unsupported job requirements are omitted and counted without blocking export review", () => {
  const result = build({
    packet: {
      unsupportedRequirements: [
        {
          requirementId: "requirement_newsroom",
          requirementText: "Direct newsroom editorial experience.",
          category: "Experience",
          level: "REQUIRED",
          classification: "MISSING",
          disposition: "UNSUPPORTED",
          careerFactIds: [],
          careerEvidenceIds: [],
          safePositioning: "No support.",
          limitations: ["Synthetic unsupported requirement."],
        },
      ],
    },
  });

  assert.equal(result.artifactVersions[0].safetyState, "DRAFT_READY_FOR_REVIEW");
  assert.equal(result.artifactVersions[0].omittedUnsupportedClaimCount, 1);
  assert.equal(result.summary.omittedUnsupportedClaims, 1);
  assert.equal(result.artifactVersions[0].validationIssues.some((issue) => issue.code === "UNSUPPORTED_REQUIREMENT_REMAINS"), false);
  assert.doesNotMatch(JSON.stringify(result.artifactVersions[0].draft), /newsroom editorial/);
});

test("promoted CareerFact source evidence can refresh stale packet evidence references", () => {
  const result = build({
    packet: {
      supportingEvidence: [
        support({
          careerEvidenceIds: ["stale_packet_evidence"],
          safePositioning: "Position as adjacent or transferable experience; do not claim exact same-role experience.",
        }),
      ],
    },
    careerFacts: [
      careerFact({
        statement: "Architected governed AI automation workflows with source-of-truth controls and approval boundaries.",
        sourceEvidenceIds: ["career_evidence_ai_automation"],
      }),
    ],
    careerEvidence: [
      careerEvidence({
        supportsFactIds: ["career_fact_ai_automation"],
      }),
    ],
  });
  const artifact = result.artifactVersions[0];

  assert.equal(artifact.safetyState, "DRAFT_READY_FOR_REVIEW");
  assert.equal(artifact.claimTraceability[0].careerEvidenceIds.includes("career_evidence_ai_automation"), true);
  assert.match(JSON.stringify(artifact.draft), /Architected governed AI automation workflows/);
  assert.doesNotMatch(JSON.stringify(artifact.draft), /Position as adjacent or transferable/);
});

test("multi-fact support rows bind draft wording to one supported fact without cross-employer contamination", () => {
  const result = build({
    packet: {
      supportingEvidence: [
        support({
          requirementId: "requirement_cross_functional",
          careerFactIds: ["a_navy_fact", "b_csi_fact"],
          careerEvidenceIds: [],
          safePositioning: "Position as adjacent or transferable experience; do not claim exact same-role experience.",
        }),
        support({
          requirementId: "requirement_csi_automation",
          careerFactIds: ["b_csi_fact"],
          careerEvidenceIds: [],
          safePositioning: "Position as adjacent or transferable experience; do not claim exact same-role experience.",
        }),
        support({
          requirementId: "requirement_product_roadmap",
          careerFactIds: ["c_product_fact"],
          careerEvidenceIds: [],
          safePositioning: "Position as adjacent or transferable experience; do not claim exact same-role experience.",
        }),
        support({
          requirementId: "requirement_product_governance",
          careerFactIds: ["c_product_fact"],
          careerEvidenceIds: [],
          safePositioning: "Position as adjacent or transferable experience; do not claim exact same-role experience.",
        }),
      ],
    },
    careerFacts: [
      careerFact({
        id: "a_navy_fact",
        factType: "EMPLOYMENT",
        statement: "Example Employer A stakeholder requirements and automation work.",
        organization: "Example Employer A",
        roleOrTitle: "Solutions Architect",
        technologyOrSkill: "Automation requirements",
        sourceEvidenceIds: ["evidence_navy"],
      }),
      careerFact({
        id: "b_csi_fact",
        factType: "EMPLOYMENT",
        statement: "Example Employer B CRM automation and lifecycle workflow coordination.",
        organization: "Example Employer B",
        roleOrTitle: "Project Manager for Technology Solutions",
        technologyOrSkill: "CRM automation",
        sourceEvidenceIds: ["evidence_csi"],
      }),
      careerFact({
        id: "c_product_fact",
        factType: "PRODUCT",
        statement: "StaffordOS product roadmap, requirements, and governed AI automation workflows.",
        technologyOrSkill: "AI automation product operations",
        sourceEvidenceIds: ["evidence_product"],
      }),
    ],
    careerEvidence: [
      careerEvidence({ id: "evidence_navy", supportsFactIds: ["a_navy_fact"] }),
      careerEvidence({ id: "evidence_csi", supportsFactIds: ["b_csi_fact"] }),
      careerEvidence({ id: "evidence_product", supportsFactIds: ["c_product_fact"] }),
    ],
  });
  const artifact = result.artifactVersions[0];
  const employerA = artifact.draft.experience.find((entry) => entry.employer === "Example Employer A");
  const employerB = artifact.draft.experience.find((entry) => entry.employer === "Example Employer B");

  assert.equal(artifact.safetyState, "DRAFT_READY_FOR_REVIEW");
  assert.ok(employerA);
  assert.ok(employerB);
  assert.deepEqual(employerA.bullets, ["Example Employer A stakeholder requirements and automation work."]);
  assert.deepEqual(employerB.bullets, ["Example Employer B CRM automation and lifecycle workflow coordination."]);
  assert.equal(artifact.draft.projects.length, 1);
  assert.deepEqual(artifact.draft.projects[0].bullets, [
    "StaffordOS product roadmap, requirements, and governed AI automation workflows.",
  ]);
});

test("unsupported numeric metrics are excluded from draft claims", () => {
  const result = build({
    packet: {
      supportingEvidence: [
        support({
          safePositioning: "Reduced manual workflows by 30% using automation.",
        }),
      ],
    },
    careerFacts: [
      careerFact({
        metricClassification: "UNSUPPORTED",
        measurementAuthority: null,
      }),
    ],
  });
  const artifact = result.artifactVersions[0];

  assert.equal(artifact.safetyState, "DRAFT_BLOCKED");
  assert.ok(artifact.validationIssues.some((issue) => issue.code === "UNSUPPORTED_METRIC_OMITTED"));
  assert.doesNotMatch(JSON.stringify(artifact.draft), /30%/);
});

test("verified metric authority may support numeric wording", () => {
  const result = build({
    packet: {
      supportingEvidence: [
        support({
          safePositioning: "Reduced manual workflows by 30% using automation.",
        }),
      ],
    },
    careerFacts: [
      careerFact({
        metricClassification: "VERIFIED_METRIC",
        measurementAuthority: "Synthetic metric authority.",
      }),
    ],
  });

  assert.equal(result.artifactVersions[0].safetyState, "DRAFT_READY_FOR_REVIEW");
  assert.match(JSON.stringify(result.artifactVersions[0].draft), /30%/);
});

test("evidence-backed proposed CareerFacts are omitted until promoted", () => {
  const result = build({
    careerFacts: [
      careerFact({
        verificationStatus: "PROPOSED",
        supportLevel: "UNKNOWN",
      }),
    ],
    packet: {
      supportingEvidence: [
        support({
          disposition: "SUPPORTED_WITH_LIMITATION",
        }),
      ],
    },
  });
  const artifact = result.artifactVersions[0];

  assert.equal(artifact.safetyState, "DRAFT_BLOCKED");
  assert.equal(artifact.claimTraceability.length, 0);
  assert.equal(artifact.omittedUnsupportedClaimCount, 1);
  assert.ok(artifact.validationIssues.some((issue) => issue.code === "NO_TRACEABLE_SUPPORTED_CLAIMS"));
  assert.doesNotMatch(JSON.stringify(artifact.draft), /AI automation workflows/);
});

test("chronology fields are preserved only when supplied by CareerFact authority", () => {
  const result = build({
    careerFacts: [
      careerFact({
        id: "career_fact_employment",
        factType: "EMPLOYMENT",
        organization: "Example Employer",
        roleOrTitle: "Business Technology Lead",
        startDate: "2024-01",
        endDate: "2025-06",
        technologyOrSkill: "Business technology",
        sourceEvidenceIds: ["career_evidence_ai_automation"],
      }),
    ],
    careerEvidence: [
      careerEvidence({
        supportsFactIds: ["career_fact_employment"],
      }),
    ],
    packet: {
      supportingEvidence: [
        support({
          careerFactIds: ["career_fact_employment"],
          safePositioning: "Led supported business technology requirements and automation coordination.",
        }),
      ],
    },
  });
  const entry = result.artifactVersions[0].draft.experience[0];

  assert.equal(entry.employer, "Example Employer");
  assert.equal(entry.title, "Business Technology Lead");
  assert.equal(entry.startDate, "2024-01");
  assert.equal(entry.endDate, "2025-06");
});

test("job-specific emphasis uses only packet-linked facts", () => {
  const result = build({
    careerFacts: [
      careerFact(),
      careerFact({
        id: "career_fact_unrelated",
        statement: "Unrelated unsupported marketing specialist claim.",
        technologyOrSkill: "Unrelated marketing",
        sourceEvidenceIds: ["career_evidence_unrelated"],
      }),
    ],
    careerEvidence: [
      careerEvidence(),
      careerEvidence({ id: "career_evidence_unrelated", supportsFactIds: ["career_fact_unrelated"] }),
    ],
  });

  assert.doesNotMatch(JSON.stringify(result.artifactVersions[0].draft), /Unrelated marketing|marketing specialist/);
});

test("every substantive draft claim preserves private traceability references", () => {
  const artifact = build().artifactVersions[0];

  for (const claim of artifact.claimTraceability) {
    assert.equal(claim.sourcePacketId, "packet_ai_automation");
    assert.ok(claim.careerFactIds.length > 0);
    assert.ok(claim.careerEvidenceIds.length > 0);
    assert.ok(claim.packetRequirementIds.length > 0);
  }
});

test("artifact versioning is deterministic and records supersession", () => {
  const first = build().artifactVersions[0];
  const second = build({ previousArtifactVersions: [first] }).artifactVersions[0];
  const secondAgain = build({ previousArtifactVersions: [first] }).artifactVersions[0];

  assert.equal(first.version, 1);
  assert.equal(second.version, 2);
  assert.equal(second.supersedesArtifactVersionId, first.artifactVersionId);
  assert.equal(second.artifactVersionId, secondAgain.artifactVersionId);
});

test("missing CareerEvidence reference blocks user-facing draft wording", () => {
  const result = build({
    careerFacts: [
      careerFact({
        sourceEvidenceIds: [],
      }),
    ],
    packet: {
      supportingEvidence: [
        support({
          careerEvidenceIds: [],
        }),
      ],
    },
  });
  const artifact = result.artifactVersions[0];

  assert.equal(artifact.safetyState, "DRAFT_BLOCKED");
  assert.ok(artifact.validationIssues.some((issue) => issue.code === "MISSING_CAREER_EVIDENCE_REFERENCE"));
  assert.equal(artifact.claimTraceability.length, 0);
});

test("missing loaded CareerEvidence authority blocks copied evidence IDs", () => {
  const result = build({
    careerEvidence: [],
  });
  const artifact = result.artifactVersions[0];

  assert.equal(artifact.safetyState, "DRAFT_BLOCKED");
  assert.ok(artifact.validationIssues.some((issue) => issue.code === "MISSING_CAREER_EVIDENCE_REFERENCE"));
  assert.equal(artifact.claimTraceability.length, 0);
  assert.doesNotMatch(JSON.stringify(artifact.draft), /AI automation workflows/);
});

test("human review is mandatory and approval only changes artifact state", () => {
  const artifact = build().artifactVersions[0];
  const approved = drafts.applyApplicationArtifactReviewDecision({
    artifact,
    decision: "APPROVED",
    decidedAt: generatedAt,
  });

  assert.equal(artifact.operatorApprovalState, "PENDING_REVIEW");
  assert.equal(approved.operatorApprovalState, "APPROVED");
  assert.equal(approved.safetyState, "APPROVED_FOR_EXPORT");
  assert.equal(approved.applicationCreated, false);
  assert.equal(approved.applicationSubmitted, false);
  assert.equal(approved.resumeExported, false);
  assert.equal(approved.messageSent, false);
});

test("private writer stores draft content outside Git while read model is redacted", () => {
  const privateRoot = mkdtempSync(path.join(tmpdir(), "careeros-v103-drafts-"));
  const result = build();
  const writeResult = drafts.writeTruthBoundResumeDraftOutputs({
    outputRoot: path.join(privateRoot, "application-artifacts"),
    repositoryRoot: root,
    result,
  });
  const readModel = result.readModel[0];

  assert.equal(writeResult.artifactNames.length, 7);
  assert.equal(writeResult.privatePathVisible, false);
  assert.equal((statSync(writeResult.runDirectory).mode & 0o777).toString(8), "700");
  assert.equal((statSync(writeResult.writtenFiles[0]).mode & 0o777).toString(8), "600");
  assert.equal(readModel.draftContentVisible, false);
  assert.equal(readModel.privatePathVisible, false);
  assert.equal(readModel.sourceAuthorityIdsVisible, false);
});

test("source and CLI expose no external action, application creation, export, or model path", () => {
  const combined = `${draftSource}\n${cliSource}`;

  assert.doesNotMatch(combined, /fetch\(|XMLHttpRequest|playwright|puppeteer|selenium|browserControl/);
  assert.doesNotMatch(combined, /submitApplication|applyToJob|createApplication\(|sendRecruiter|sendMessage|mailto:/);
  assert.doesNotMatch(combined, /from\s+["']openai|from\s+["']@anthropic|OLLAMA_HOST|ollama\/api/i);
  assert.doesNotMatch(combined, /from\s+["']docx|from\s+["']pdfkit|uploadResume|exportPdf|exportDocx|createPdf|createDocx/i);
  assert.match(combined, /DETERMINISTIC_TRUTH_BOUND_ASSEMBLER/);
});
