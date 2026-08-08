import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
  utimesSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import Module from "node:module";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const modulePath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/resumeVersionApplicationLinkage.ts");
const cliPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/runResumeVersionApplicationLinkage.mjs");
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

const linkage = requireTypeScriptModule(modulePath);

function application(overrides = {}) {
  const applicationId = overrides.applicationId || "synthetic_application_001";
  return {
    applicationId,
    workspaceId: "professional",
    capabilityFamily: "Career Operations",
    opportunityId: overrides.opportunityId ?? "synthetic_opportunity_001",
    analysisRunId: overrides.analysisRunId ?? "synthetic_analysis_001",
    companyReference: {
      label: overrides.companyName || "Synthetic Health Systems",
      requisitionAlias: overrides.requisitionAlias || "REQ-SYN-001",
    },
    roleReference: {
      title: overrides.roleTitle || "Synthetic AI Governance Lead",
    },
    status: "SUBMITTED_MANUAL_EXTERNAL",
    submissionMethod: "MANUAL_EXTERNAL",
    submissionChannel: "Synthetic careers portal",
    submittedAt: "2026-08-03",
    submittedAtPrecision: "DATE",
    operatorConfirmed: true,
    resumeReference: {
      resumeReferenceId: `synthetic_resume_ref_${applicationId}`,
      applicationId,
      status: overrides.resumeStatus || "UNKNOWN",
      filename: overrides.resumeFilename || null,
      assetReferenceId: null,
      version: null,
      createdAt: null,
      purpose: "Synthetic fixture only.",
      authority: overrides.resumeFilename ? "ROSS_CONFIRMED" : "UNKNOWN",
      privacy: "Professional owner-private",
      limitations: ["Synthetic fixture only."],
      resumeIsCanonicalCareerTruth: false,
    },
    coverLetterReference: {
      coverLetterReferenceId: `synthetic_cover_ref_${applicationId}`,
      applicationId,
      status: "UNKNOWN",
      filename: null,
      authority: "UNKNOWN",
      privacy: "Professional owner-private",
      limitations: ["Synthetic fixture only."],
    },
    employerResponseStatus: "NONE_RECORDED",
    currentStage: "SUBMITTED_MANUAL_EXTERNAL",
    nextAction: {
      nextActionId: `synthetic_next_${applicationId}`,
      applicationId,
      confirmationRecordId: null,
      what: "Synthetic next action.",
      whyNow: "Synthetic fixture only.",
      when: "2026-08-17",
      proofOfCompletion: "Synthetic proof.",
      authorityRequired: "ROSS_APPROVAL",
      limitations: ["Synthetic fixture only."],
    },
    nextReviewAt: "2026-08-17",
    sourceAuthority: "ROSS_CONFIRMED_MANUAL_EXTERNAL",
    privacy: "Professional owner-private",
    duplicateStatus: "NO_DUPLICATE",
    limitations: ["Synthetic fixture only."],
    createdAt: "2026-08-07T12:00:00Z",
    updatedAt: "2026-08-07T12:00:00Z",
    submittedByStaffordOS: false,
    applicationSubmittedByThisWorkflow: false,
    noEmployerInterestInferred: true,
    noFitInferred: true,
    testOnly: true,
  };
}

function setupFixture(options = {}) {
  const base = mkdtempSync(path.join(os.tmpdir(), "j001-06-resume-"));
  const sourceRoot = path.join(base, "career-source");
  const careerRoot = path.join(base, "career-authority");
  const outputRoot = path.join(base, "resume-linkage-output");
  const applicationRoot = path.join(base, "applications");
  for (const directory of [sourceRoot, careerRoot, outputRoot, applicationRoot]) {
    writeFileSync(path.join(base, ".keep"), "synthetic");
    mkdirSync(directory, { recursive: true });
  }
  const resumeText =
    options.resumeText ||
    [
      "Synthetic Resume",
      "Professional summary",
      "Experience managing AI governance programs and automation.",
      "Skills: Python, SQL, Kubernetes, Terraform, CI/CD.",
      "Certification: Project Management Professional PMP.",
      "Education: Master degree.",
      "Increased synthetic throughput by 40%.",
      "10 years experience in synthetic delivery.",
    ].join("\n");
  writeFileSync(path.join(sourceRoot, options.resumeFilename || "Synthetic AI Governance Resume.txt"), resumeText);
  if (options.secondResumeText) {
    writeFileSync(path.join(sourceRoot, options.secondResumeFilename || "Synthetic AI Governance Resume Copy.txt"), options.secondResumeText);
  }
  if (options.coverLetter) {
    writeFileSync(path.join(sourceRoot, "Synthetic Cover Letter.txt"), "Dear Hiring Team,\nPlease accept my application.\nSincerely,\nSynthetic Candidate");
  }
  const facts = [
    {
      schemaVersion: "staffordos.professional.canonical_career_fact.v1",
      id: "synthetic_fact_pmp",
      workspaceId: "professional",
      statement: "Project Management Professional PMP credential is verified.",
      verificationStatus: "VERIFIED",
    },
  ];
  if (options.verifiedEducation) {
    facts.push({
      schemaVersion: "staffordos.professional.canonical_career_fact.v1",
      id: "synthetic_fact_education",
      workspaceId: "professional",
      statement: "Master degree from Synthetic University is verified.",
      verificationStatus: "VERIFIED",
    });
  }
  if (options.conflictingEmployment) {
    facts.push({
      schemaVersion: "staffordos.professional.canonical_career_fact.v1",
      id: "synthetic_fact_employment_conflict",
      workspaceId: "professional",
      statement: "Employment title or date conflict requires review.",
      verificationStatus: "CONFLICTING",
    });
  }
  writeFileSync(path.join(careerRoot, "canonical_career_facts.private.json"), JSON.stringify(facts, null, 2));
  return { base, sourceRoot, careerRoot, outputRoot, applicationRoot };
}

function build(options = {}) {
  const fixture = setupFixture(options);
  const applicationStore = {
    applications: options.applications || [application(options.applicationOverrides || {})],
    applicationEvents: [],
    followUpReviews: [],
    confirmationNeeded: options.confirmationNeeded || [],
  };
  const result = linkage.buildResumeVersionApplicationLinkage({
    sourceRoots: [fixture.sourceRoot],
    careerRoots: [fixture.careerRoot],
    applicationStore,
    repositoryRoot: root,
    generatedAt: "2026-08-07T12:00:00Z",
    outputRoot: fixture.outputRoot,
    decisions: options.decisions || [],
  });
  return { fixture, result, applicationStore };
}

test("ResumeVersion is distinct from CareerFact and CareerEvidence", () => {
  const { fixture, result } = build();
  try {
    const version = result.resumeVersions[0];
    assert.equal(version.schemaVersion, "staffordos.job_search.private_resume_version.v1");
    assert.equal(version.resumeIsCareerTruth, false);
    assert.equal(Object.hasOwn(version, "verificationStatus"), false);
    assert.equal(Object.hasOwn(version, "supportsFactIds"), false);
  } finally {
    rmSync(fixture.base, { recursive: true, force: true });
  }
});

test("filename is not the primary ID", () => {
  const { fixture, result } = build({ resumeFilename: "Synthetic Resume Filename.txt" });
  try {
    const version = result.resumeVersions[0];
    assert.doesNotMatch(version.resumeVersionId, /Synthetic|Filename/i);
    assert.match(version.resumeVersionId, /^privresumeversion_/);
  } finally {
    rmSync(fixture.base, { recursive: true, force: true });
  }
});

test("exact duplicate uses digest and does not merge silently", () => {
  const duplicateText = "Synthetic Resume\nExperience\nSkills\nEducation\nProject Management Professional PMP.";
  const { fixture, result } = build({
    resumeText: duplicateText,
    secondResumeText: duplicateText,
  });
  try {
    assert.equal(result.duplicateVersionAnalysis.some((group) => group.classification === "EXACT_DUPLICATE"), true);
    assert.equal(result.duplicateVersionAnalysis[0].automaticMergeAllowed, false);
  } finally {
    rmSync(fixture.base, { recursive: true, force: true });
  }
});

test("likely version does not silently merge", () => {
  const { fixture, result } = build({
    secondResumeText: "Synthetic Resume\nExperience\nSkills\nEducation\nAutomation program manager.",
    secondResumeFilename: "Synthetic AI Governance Resume v2.txt",
  });
  try {
    assert.equal(result.duplicateVersionAnalysis.some((group) => group.classification === "LIKELY_VERSION"), true);
    assert.equal(result.duplicateVersionAnalysis.some((group) => group.automaticMergeAllowed), false);
  } finally {
    rmSync(fixture.base, { recursive: true, force: true });
  }
});

test("USED_FOR_SUBMISSION requires operator confirmation", () => {
  const initial = build();
  const applicationId = initial.applicationStore.applications[0].applicationId;
  const resumeVersionId = initial.result.resumeVersions[0].resumeVersionId;
  rmSync(initial.fixture.base, { recursive: true, force: true });
  const { fixture, result } = build({
    decisions: [{ applicationId, resumeVersionId, outcome: "CONFIRM_USED", operatorConfirmed: true, createdAt: "2026-08-07T12:00:00Z" }],
    applications: [application({ applicationId })],
  });
  try {
    assert.equal(result.applicationResumeLinks[0].linkType, "USED_FOR_SUBMISSION");
    assert.equal(result.applicationResumeLinks[0].operatorConfirmed, true);
    assert.equal(result.resumeLinkApplicationEvents[0].eventType, "RESUME_LINK_CONFIRMED");
  } finally {
    rmSync(fixture.base, { recursive: true, force: true });
  }
});

test("resume linkage cannot be inferred from filename alone", () => {
  const { fixture, result } = build({
    applicationOverrides: {
      resumeStatus: "PRIVATE_LEGACY_REFERENCE",
      resumeFilename: "Synthetic AI Governance Resume.txt",
    },
  });
  try {
    assert.equal(result.applicationCandidates[0].confidence, "HIGH_REQUIRES_OPERATOR_CONFIRMATION");
    assert.equal(result.applicationResumeLinks[0].linkType, "UNKNOWN");
    assert.equal(result.applicationResumeLinks[0].usedForSubmission, false);
  } finally {
    rmSync(fixture.base, { recursive: true, force: true });
  }
});

test("cover letter remains separate", () => {
  const { fixture, result } = build({ coverLetter: true });
  try {
    assert.equal(result.coverLetterReferences.length, 1);
    assert.equal(result.coverLetterReferences[0].coverLetterIsCareerTruth, false);
    assert.equal(result.applicationResumeLinks[0].resumeVersionId, null);
  } finally {
    rmSync(fixture.base, { recursive: true, force: true });
  }
});

test("resume wording cannot verify a Career fact", () => {
  const { fixture, result } = build();
  try {
    assert.equal(result.resumeVersions[0].resumeIsCareerTruth, false);
    assert.equal(result.auditSummary.noResumeMutated, true);
  } finally {
    rmSync(fixture.base, { recursive: true, force: true });
  }
});

test("verified PMP supports only credential claim", () => {
  const { fixture, result } = build();
  try {
    const pmp = result.factSafetyReports[0].claims.find((claim) => claim.claimType === "PMP_CREDENTIAL");
    assert.equal(pmp.classification, "SUPPORTED_VERIFIED");
    assert.match(pmp.limitations.join(" "), /supports only the credential wording/);
    assert.match(pmp.limitations.join(" "), /Do not infer years/);
  } finally {
    rmSync(fixture.base, { recursive: true, force: true });
  }
});

test("unsupported metric and year remain needs evidence", () => {
  const { fixture, result } = build();
  try {
    const metric = result.factSafetyReports[0].claims.find((claim) => claim.claimType === "METRIC");
    const years = result.factSafetyReports[0].claims.find((claim) => claim.claimType === "YEARS_EXPERIENCE");
    assert.equal(metric.classification, "NEEDS_EVIDENCE");
    assert.equal(years.classification, "NEEDS_EVIDENCE");
  } finally {
    rmSync(fixture.base, { recursive: true, force: true });
  }
});

test("conflicting employment fact remains conflicting", () => {
  const { fixture, result } = build({ conflictingEmployment: true });
  try {
    const employment = result.factSafetyReports[0].claims.find((claim) => claim.claimType === "EMPLOYMENT");
    assert.equal(employment.classification, "CONFLICTING");
  } finally {
    rmSync(fixture.base, { recursive: true, force: true });
  }
});

test("stale resume can be flagged", () => {
  const fixture = setupFixture();
  try {
    const old = new Date("2024-01-01T12:00:00Z");
    utimesSync(path.join(fixture.sourceRoot, "Synthetic AI Governance Resume.txt"), old, old);
    const result = linkage.buildResumeVersionApplicationLinkage({
      sourceRoots: [fixture.sourceRoot],
      careerRoots: [fixture.careerRoot],
      applicationStore: { applications: [application()], applicationEvents: [], followUpReviews: [], confirmationNeeded: [] },
      repositoryRoot: root,
      generatedAt: "2026-08-07T12:00:00Z",
      outputRoot: fixture.outputRoot,
    });
    assert.equal(result.factSafetyReports[0].claims.some((claim) => claim.classification === "STALE"), true);
  } finally {
    rmSync(fixture.base, { recursive: true, force: true });
  }
});

test("source file is not mutated", () => {
  const fixture = setupFixture();
  try {
    const filePath = path.join(fixture.sourceRoot, "Synthetic AI Governance Resume.txt");
    const before = readFileSync(filePath, "utf8");
    const beforeStat = statSync(filePath);
    linkage.buildResumeVersionApplicationLinkage({
      sourceRoots: [fixture.sourceRoot],
      careerRoots: [fixture.careerRoot],
      applicationStore: { applications: [application()], applicationEvents: [], followUpReviews: [], confirmationNeeded: [] },
      repositoryRoot: root,
      generatedAt: "2026-08-07T12:00:00Z",
      outputRoot: fixture.outputRoot,
    });
    assert.equal(readFileSync(filePath, "utf8"), before);
    assert.equal(statSync(filePath).size, beforeStat.size);
  } finally {
    rmSync(fixture.base, { recursive: true, force: true });
  }
});

test("private path is hidden from read models", () => {
  const { fixture, result } = build();
  try {
    assert.equal(result.futureReadModel[0].privatePathVisible, false);
    assert.equal(result.futureReadModel[0].rawResumeTextVisible, false);
    assert.equal(JSON.stringify(result.futureReadModel).includes(fixture.sourceRoot), false);
  } finally {
    rmSync(fixture.base, { recursive: true, force: true });
  }
});

test("Application history remains append-only", () => {
  const initial = build();
  const applicationId = initial.applicationStore.applications[0].applicationId;
  const resumeVersionId = initial.result.resumeVersions[0].resumeVersionId;
  rmSync(initial.fixture.base, { recursive: true, force: true });
  const { fixture, result } = build({
    decisions: [{ applicationId, resumeVersionId, outcome: "CONFIRM_USED", operatorConfirmed: true, createdAt: "2026-08-07T12:00:00Z" }],
    applications: [application({ applicationId })],
  });
  try {
    assert.equal(result.resumeLinkApplicationEvents.length, 1);
    assert.equal(result.resumeLinkApplicationEvents[0].submittedByStaffordOS, false);
    assert.equal(result.resumeLinkApplicationEvents[0].externalActionPerformedByStaffordOS, false);
  } finally {
    rmSync(fixture.base, { recursive: true, force: true });
  }
});

test("unknown application resume remains unknown unless confirmed", () => {
  const { fixture, result } = build();
  try {
    assert.equal(result.applicationResumeLinks[0].linkType, "UNKNOWN");
    assert.equal(result.applicationResumeLinks[0].operatorConfirmed, false);
  } finally {
    rmSync(fixture.base, { recursive: true, force: true });
  }
});

test("role-specific linkage still requires operator confirmation", () => {
  const { fixture, result } = build({
    resumeText: "Synthetic Resume\nProfessional summary\nExperience\nSkills\nEducation\nAI Advanced Analytics manager resume.",
    applicationOverrides: {
      companyName: "Synthetic Biotech",
      roleTitle: "Synthetic Manager AI Advanced Analytics",
    },
  });
  try {
    assert.equal(result.applicationCandidates.length > 0, true);
    assert.equal(result.applicationResumeLinks[0].linkType, "UNKNOWN");
  } finally {
    rmSync(fixture.base, { recursive: true, force: true });
  }
});

test("governance linkage still requires operator confirmation", () => {
  const { fixture, result } = build({
    resumeText: "Synthetic Resume\nProfessional summary\nExperience\nSkills\nEducation\nAI Governance director resume.",
    applicationOverrides: {
      companyName: "Synthetic Insurer",
      roleTitle: "Synthetic Associate Director AI Governance",
    },
  });
  try {
    assert.equal(result.applicationCandidates.length > 0, true);
    assert.equal(result.applicationResumeLinks[0].usedForSubmission, false);
  } finally {
    rmSync(fixture.base, { recursive: true, force: true });
  }
});

test("unconfirmed candidate cannot link before Application confirmation", () => {
  const { fixture, result } = build({
    applications: [],
    confirmationNeeded: [{ confirmationRecordId: "synthetic_confirm", status: "NEEDS_OPERATOR_CONFIRMATION", shouldCreateApplication: false }],
  });
  try {
    assert.equal(result.applicationResumeLinks.length, 0);
    assert.equal(result.auditSummary.bitsightLikeUnconfirmedCandidateBlocked, true);
  } finally {
    rmSync(fixture.base, { recursive: true, force: true });
  }
});

test("private outputs are written outside Git with owner-private permissions", () => {
  const { fixture, result } = build();
  try {
    const written = linkage.writeResumeVersionApplicationLinkageOutputs({
      outputRoot: fixture.outputRoot,
      repositoryRoot: root,
      result,
    });
    assert.equal(written.privatePathVisible, false);
    assert.equal(written.artifactNames.includes("resume_versions.json"), true);
    assert.equal(statSync(written.runDirectory).mode & 0o777, 0o700);
    assert.equal(statSync(path.join(written.runDirectory, "resume_versions.json")).mode & 0o777, 0o600);
  } finally {
    rmSync(fixture.base, { recursive: true, force: true });
  }
});

test("repository-internal private roots are rejected", () => {
  assert.throws(
    () =>
      linkage.buildResumeVersionApplicationLinkage({
        sourceRoots: [root],
        careerRoots: [],
        applicationStore: { applications: [], applicationEvents: [], followUpReviews: [], confirmationNeeded: [] },
        repositoryRoot: root,
        generatedAt: "2026-08-07T12:00:00Z",
      }),
    /outside the repository/,
  );
});

test("source file is not copied into Git", () => {
  const { fixture, result } = build();
  try {
    assert.equal(result.auditSummary.noResumeMutated, true);
    assert.equal(JSON.stringify(result.futureReadModel).includes("Synthetic AI Governance Resume.txt"), false);
  } finally {
    rmSync(fixture.base, { recursive: true, force: true });
  }
});

test("future read model excludes credentials and document internals", () => {
  const { fixture, result } = build();
  try {
    const readModel = result.futureReadModel[0];
    assert.equal(readModel.credentialsVisible, false);
    assert.equal(readModel.documentInternalsVisible, false);
  } finally {
    rmSync(fixture.base, { recursive: true, force: true });
  }
});

test("summary exposes counts only", () => {
  const { fixture, result } = build();
  try {
    const summary = linkage.buildResumeLinkageCliSummary(result);
    assert.equal(summary.privatePathVisible, false);
    assert.equal(Object.hasOwn(summary, "originalFilename"), false);
    assert.equal(Object.hasOwn(summary, "sourcePath"), false);
  } finally {
    rmSync(fixture.base, { recursive: true, force: true });
  }
});

test("no resume generation, mutation, submit, message, provider, AI, API, database, or route import exists", () => {
  const combined = `${source}\n${cliSource}`;
  assert.doesNotMatch(combined, /generateResume|createResume|rewriteResume|mutateResume/i);
  assert.doesNotMatch(combined, /submitApplication|applyToJob|sendMessage|sendRecruiter|method:\s*["']POST["']/i);
  assert.doesNotMatch(combined, /\bfetch\s*\(|from\s+["'][^"']*(openai|anthropic|gemini|ollama)/i);
  assert.doesNotMatch(combined, /from\s+["'][^"']*(prisma|database|dbClient|sql)/i);
  assert.doesNotMatch(combined, /from\s+["'][^"']*\/os|from\s+["'][^"']*\/operator/);
});

test("repository fixtures contain no real private values", () => {
  const testSource = readFileSync(new URL(import.meta.url), "utf8");
  assert.match(testSource, /Synthetic Health Systems/);
  assert.doesNotMatch(testSource, /privjobopp_[0-9a-f]{12,}|https?:\/\/|@[a-z0-9.-]+\.[a-z]{2,}/i);
});
