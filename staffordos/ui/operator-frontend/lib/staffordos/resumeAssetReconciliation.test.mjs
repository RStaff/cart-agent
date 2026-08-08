import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import Module from "node:module";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const modulePath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/resumeAssetReconciliation.ts");
const linkageModulePath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/resumeVersionApplicationLinkage.ts");
const cliPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/runResumeAssetReconciliation.mjs");
const requireFromFrontend = createRequire(path.join(root, "staffordos/ui/operator-frontend/package.json"));
const ts = requireFromFrontend("typescript");
const source = readFileSync(modulePath, "utf8");
const linkageSource = readFileSync(linkageModulePath, "utf8");
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

const reconciliation = requireTypeScriptModule(modulePath);

const resumeText = [
  "Synthetic Resume",
  "Professional summary",
  "Experience leading synthetic automation and governance work.",
  "Skills: Python, SQL, Kubernetes, Terraform, CI/CD.",
  "Education",
  "Certification: Project Management Professional PMP.",
].join("\n");

function application(overrides = {}) {
  const applicationId = overrides.applicationId || "synthetic_application_001";
  return {
    applicationId,
    companyReference: {
      label: overrides.companyName || "Synthetic Systems",
      requisitionAlias: null,
    },
    roleReference: {
      title: overrides.roleTitle || "Synthetic Automation Lead",
    },
    status: "SUBMITTED_MANUAL_EXTERNAL",
    currentStage: "SUBMITTED_MANUAL_EXTERNAL",
    submittedAt: "2026-08-07",
    submittedAtPrecision: "DATE",
    submissionChannel: "Synthetic careers portal",
    resumeReference: {
      status: overrides.resumeFilename ? "PRIVATE_LEGACY_REFERENCE" : "UNKNOWN",
      filename: overrides.resumeFilename || null,
    },
    employerResponseStatus: "NONE_RECORDED",
    nextAction: { what: "Synthetic next action." },
    nextReviewAt: "2026-08-21",
  };
}

function setupFixture(options = {}) {
  const base = mkdirTemp();
  const sourceRoot = path.join(base, "career");
  const careerRoot = path.join(base, "career-authority");
  const outputRoot = path.join(base, "resume-asset-output");
  const existingRoot = path.join(base, "existing-resume-linkage");
  const applicationRoot = path.join(base, "applications");
  for (const directory of [sourceRoot, careerRoot, outputRoot, existingRoot, applicationRoot]) {
    mkdirSync(directory, { recursive: true });
  }
  writeFileSync(
    path.join(careerRoot, "facts.json"),
    JSON.stringify(
      [
        {
          schemaVersion: "staffordos.professional.canonical_career_fact.v1",
          id: "synthetic_fact_pmp",
          statement: "Project Management Professional PMP credential is verified.",
          verificationStatus: "VERIFIED",
        },
      ],
      null,
      2,
    ),
  );
  if (options.defaultResume !== false) {
    writeFileSync(path.join(sourceRoot, options.resumeFilename || "Synthetic Automation Resume.txt"), options.resumeText || resumeText);
  }
  return { base, sourceRoot, careerRoot, outputRoot, existingRoot, applicationRoot };
}

function mkdirTemp() {
  return path.join(os.tmpdir(), `j001-06b-${Math.random().toString(16).slice(2)}`);
}

function build(options = {}) {
  const fixture = setupFixture(options);
  const result = reconciliation.buildResumeAssetReconciliation({
    sourceRoots: [fixture.sourceRoot],
    careerRoots: [fixture.careerRoot],
    applicationStore: {
      applications: options.applications || [application(options.applicationOverrides || {})],
      applicationEvents: [],
      followUpReviews: [],
      confirmationNeeded: options.confirmationNeeded || [],
    },
    repositoryRoot: root,
    generatedAt: "2026-08-08T12:00:00Z",
    outputRoot: fixture.outputRoot,
    existingResumeVersionRoot: fixture.existingRoot,
  });
  return { fixture, result };
}

function historicalVersion(overrides = {}) {
  const digest = overrides.contentDigest || "a".repeat(64);
  return {
    schemaVersion: "staffordos.job_search.private_resume_version.v1",
    resumeVersionId: overrides.resumeVersionId || "synthetic_historical_resume_version",
    workspaceId: "professional",
    assetReferenceId: "synthetic_asset",
    sourceDocumentReference: {
      privateSourceId: "synthetic_missing_source",
      sourceRootAuthority: "APPROVED_PRIVATE_CAREER_SOURCE_ROOT",
      sourcePath: "PRIVATE",
      sourcePathRedacted: "~/private",
    },
    originalFilename: "Synthetic Historical Resume.txt",
    contentDigest: digest,
    documentFormat: "TXT",
    observedAt: "2026-08-01T12:00:00Z",
    createdAt: null,
    modifiedAtObserved: "2026-08-01T12:00:00Z",
    purpose: "GENERAL_RESUME",
    targetRoleFamily: null,
    targetCompanyReference: null,
    targetRoleReference: null,
    sourceAuthority: "PRIVATE_CAREER_SOURCE_DOCUMENT",
    privacy: "Professional owner-private",
    reviewStatus: "NEEDS_OPERATOR_REVIEW",
    factSafetyStatus: "UNKNOWN",
    supersedesResumeVersionId: null,
    derivedFromResumeVersionId: null,
    claimSafety: [],
    limitations: ["Synthetic fixture only."],
    resumeIsCareerTruth: false,
  };
}

test("scans only configured approved Career root recursively", () => {
  const fixture = setupFixture({ defaultResume: false });
  const nested = path.join(fixture.sourceRoot, "nested");
  const siblingDownloads = path.join(fixture.base, "Downloads");
  mkdirSync(nested, { recursive: true });
  mkdirSync(siblingDownloads, { recursive: true });
  writeFileSync(path.join(nested, "Synthetic Nested Resume.txt"), resumeText);
  writeFileSync(path.join(siblingDownloads, "Synthetic Outside Resume.txt"), resumeText);
  try {
    const result = reconciliation.buildResumeAssetReconciliation({
      sourceRoots: [fixture.sourceRoot],
      careerRoots: [fixture.careerRoot],
      applicationStore: { applications: [], applicationEvents: [], followUpReviews: [], confirmationNeeded: [] },
      repositoryRoot: root,
      generatedAt: "2026-08-08T12:00:00Z",
      outputRoot: fixture.outputRoot,
      existingResumeVersionRoot: fixture.existingRoot,
    });
    assert.equal(result.sourceInventory.length, 1);
    assert.equal(result.resumeVersions.length, 1);
    assert.equal(result.approvedSourceAuthority.repositoryRootScanned, false);
    assert.equal(result.approvedSourceAuthority.entireHomeDirectoryScanned, false);
    assert.equal(result.approvedSourceAuthority.downloadsScanned, false);
    assert.match(result.sourceInventory[0].sourcePath, /nested/);
    assert.doesNotMatch(result.sourceInventory[0].sourcePath, /Downloads/);
  } finally {
    rmSync(fixture.base, { recursive: true, force: true });
  }
});

test("secret-like supported files are excluded from source inventory", () => {
  const fixture = setupFixture({ defaultResume: false });
  writeFileSync(path.join(fixture.sourceRoot, "Synthetic Resume.txt"), resumeText);
  writeFileSync(path.join(fixture.sourceRoot, "synthetic_recovery_codes.txt"), resumeText);
  writeFileSync(path.join(fixture.sourceRoot, "synthetic_password_note.md"), resumeText);
  try {
    const result = reconciliation.buildResumeAssetReconciliation({
      sourceRoots: [fixture.sourceRoot],
      careerRoots: [fixture.careerRoot],
      applicationStore: { applications: [], applicationEvents: [], followUpReviews: [], confirmationNeeded: [] },
      repositoryRoot: root,
      generatedAt: "2026-08-08T12:00:00Z",
      outputRoot: fixture.outputRoot,
      existingResumeVersionRoot: fixture.existingRoot,
    });
    assert.equal(result.sourceInventory.length, 1);
    assert.equal(result.sourceInventory[0].originalFilename, "Synthetic Resume.txt");
  } finally {
    rmSync(fixture.base, { recursive: true, force: true });
  }
});

test("resume and cover letter remain separate", () => {
  const { fixture, result } = build({ defaultResume: false });
  try {
    writeFileSync(path.join(fixture.sourceRoot, "Synthetic Resume.txt"), resumeText);
    writeFileSync(
      path.join(fixture.sourceRoot, "Synthetic Cover Letter.txt"),
      "Dear Hiring Team,\nPlease accept my application.\nSincerely,\nSynthetic Candidate",
    );
    const rebuilt = reconciliation.buildResumeAssetReconciliation({
      sourceRoots: [fixture.sourceRoot],
      careerRoots: [fixture.careerRoot],
      applicationStore: { applications: [], applicationEvents: [], followUpReviews: [], confirmationNeeded: [] },
      repositoryRoot: root,
      generatedAt: "2026-08-08T12:00:00Z",
      outputRoot: fixture.outputRoot,
      existingResumeVersionRoot: fixture.existingRoot,
    });
    assert.equal(rebuilt.documentClassification.RESUME, 1);
    assert.equal(rebuilt.documentClassification.COVER_LETTER, 1);
    assert.equal(rebuilt.resumeVersions.length, 1);
    assert.equal(result.auditSummary.noApplicationSubmitted, true);
  } finally {
    rmSync(fixture.base, { recursive: true, force: true });
  }
});

test("filename is not source or ResumeVersion identity", () => {
  const { fixture, result } = build({ resumeFilename: "Synthetic Identity Resume.txt" });
  try {
    const asset = result.assetCompatibleSources[0];
    const version = result.resumeVersions[0];
    assert.match(asset.assetReferenceId, /^privasset_/);
    assert.match(asset.sourceDocumentId, /^privresumesource_/);
    assert.match(version.resumeVersionId, /^privresumeversion_/);
    assert.doesNotMatch(asset.assetReferenceId, /Synthetic|Identity/i);
    assert.doesNotMatch(version.resumeVersionId, /Synthetic|Identity/i);
  } finally {
    rmSync(fixture.base, { recursive: true, force: true });
  }
});

test("exact duplicates reuse one reconciled ResumeVersion and keep a duplicate group", () => {
  const duplicateText = `${resumeText}\nExact duplicate fixture.`;
  const fixture = setupFixture({ defaultResume: false });
  writeFileSync(path.join(fixture.sourceRoot, "Synthetic Resume A.txt"), duplicateText);
  writeFileSync(path.join(fixture.sourceRoot, "Synthetic Resume B.txt"), duplicateText);
  try {
    const result = reconciliation.buildResumeAssetReconciliation({
      sourceRoots: [fixture.sourceRoot],
      careerRoots: [fixture.careerRoot],
      applicationStore: { applications: [], applicationEvents: [], followUpReviews: [], confirmationNeeded: [] },
      repositoryRoot: root,
      generatedAt: "2026-08-08T12:00:00Z",
      outputRoot: fixture.outputRoot,
      existingResumeVersionRoot: fixture.existingRoot,
    });
    assert.equal(result.documentClassification.RESUME, 2);
    assert.equal(result.resumeVersions.length, 1);
    assert.equal(result.exactDuplicateGroups.length, 1);
    assert.equal(result.exactDuplicateGroups[0].sourceFilesDeleted, false);
    assert.equal(result.resumeVersionReconciliation.some((record) => record.classification === "EXACT_DUPLICATE"), true);
  } finally {
    rmSync(fixture.base, { recursive: true, force: true });
  }
});

test("likely versions do not merge or supersede silently", () => {
  const fixture = setupFixture({ defaultResume: false });
  writeFileSync(path.join(fixture.sourceRoot, "Synthetic Platform Resume.txt"), `${resumeText}\nOriginal platform wording.`);
  writeFileSync(path.join(fixture.sourceRoot, "Synthetic Platform Resume v2.txt"), `${resumeText}\nRevised platform wording.`);
  try {
    const result = reconciliation.buildResumeAssetReconciliation({
      sourceRoots: [fixture.sourceRoot],
      careerRoots: [fixture.careerRoot],
      applicationStore: { applications: [], applicationEvents: [], followUpReviews: [], confirmationNeeded: [] },
      repositoryRoot: root,
      generatedAt: "2026-08-08T12:00:00Z",
      outputRoot: fixture.outputRoot,
      existingResumeVersionRoot: fixture.existingRoot,
    });
    assert.equal(result.resumeVersions.length, 2);
    assert.equal(result.likelyVersionFamilies.length, 1);
    assert.equal(result.likelyVersionFamilies[0].automaticMergeAllowed, false);
    assert.equal(result.likelyVersionFamilies[0].canonicalSupersessionCreated, false);
    assert.equal(result.resumeVersions.every((version) => version.supersedesResumeVersionId === null), true);
  } finally {
    rmSync(fixture.base, { recursive: true, force: true });
  }
});

test("format derivatives require deterministic text evidence", () => {
  const fixture = setupFixture({ defaultResume: false });
  writeFileSync(path.join(fixture.sourceRoot, "Synthetic Format Resume.txt"), resumeText);
  writeFileSync(path.join(fixture.sourceRoot, "Synthetic Format Resume.md"), `\n${resumeText}\n`);
  try {
    const result = reconciliation.buildResumeAssetReconciliation({
      sourceRoots: [fixture.sourceRoot],
      careerRoots: [fixture.careerRoot],
      applicationStore: { applications: [], applicationEvents: [], followUpReviews: [], confirmationNeeded: [] },
      repositoryRoot: root,
      generatedAt: "2026-08-08T12:00:00Z",
      outputRoot: fixture.outputRoot,
      existingResumeVersionRoot: fixture.existingRoot,
    });
    assert.equal(result.formatDerivativeGroups.length, 1);
    assert.equal(result.formatDerivativeGroups[0].evidence, "NORMALIZED_TEXT_DIGEST_MATCH");
    assert.equal(result.formatDerivativeGroups[0].automaticMergeAllowed, false);
  } finally {
    rmSync(fixture.base, { recursive: true, force: true });
  }
});

test("source files are not mutated, renamed, or deleted", () => {
  const fixture = setupFixture();
  const filePath = path.join(fixture.sourceRoot, "Synthetic Automation Resume.txt");
  const beforeText = readFileSync(filePath, "utf8");
  const beforeStat = statSync(filePath);
  try {
    const result = reconciliation.buildResumeAssetReconciliation({
      sourceRoots: [fixture.sourceRoot],
      careerRoots: [fixture.careerRoot],
      applicationStore: { applications: [], applicationEvents: [], followUpReviews: [], confirmationNeeded: [] },
      repositoryRoot: root,
      generatedAt: "2026-08-08T12:00:00Z",
      outputRoot: fixture.outputRoot,
      existingResumeVersionRoot: fixture.existingRoot,
    });
    assert.equal(readFileSync(filePath, "utf8"), beforeText);
    assert.equal(statSync(filePath).size, beforeStat.size);
    assert.equal(result.sourceIntegrity.every((record) => record.unchanged), true);
    assert.equal(result.sourceIntegrity.every((record) => !record.sourceMutated && !record.sourceRenamed && !record.sourceDeleted), true);
  } finally {
    rmSync(fixture.base, { recursive: true, force: true });
  }
});

test("fact safety is reused without promoting Career facts", () => {
  const { fixture, result } = build({
    resumeText: `${resumeText}\nIncreased synthetic throughput by 40%.\n10 years synthetic experience.`,
  });
  try {
    const claims = result.factSafetySummary.reports.flatMap((report) => report.claims);
    assert.equal(claims.some((claim) => claim.claimType === "PMP_CREDENTIAL" && claim.classification === "SUPPORTED_VERIFIED"), true);
    assert.equal(claims.some((claim) => claim.claimType === "METRIC" && claim.classification === "NEEDS_EVIDENCE"), true);
    assert.equal(claims.some((claim) => claim.claimType === "YEARS_EXPERIENCE" && claim.classification === "NEEDS_EVIDENCE"), true);
    assert.equal(result.factSafetySummary.pmpSupportsCredentialOnly, true);
    assert.equal(result.factSafetySummary.resumeContentVerifiesCareerFacts, false);
    assert.equal(result.auditSummary.noCareerFactPromoted, true);
  } finally {
    rmSync(fixture.base, { recursive: true, force: true });
  }
});

test("application readiness does not create ApplicationResumeLinks or change unknowns", () => {
  const { fixture, result } = build({
    resumeFilename: "Synthetic Automation Resume.txt",
    applicationOverrides: { resumeFilename: "Synthetic Automation Resume.txt" },
  });
  try {
    assert.equal(result.applicationLinkageReadiness.length, 1);
    assert.equal(result.applicationLinkageReadiness[0].readiness, "EXACT_SOURCE_READY");
    assert.equal(result.applicationLinkageReadiness[0].applicationResumeLinkCreated, false);
    assert.equal(result.applicationLinkageReadiness[0].existingUnknownDecisionChanged, false);
    assert.equal(result.auditSummary.applicationResumeLinksCreated, 0);
    assert.equal(Object.hasOwn(result, "applicationResumeLinks"), false);
  } finally {
    rmSync(fixture.base, { recursive: true, force: true });
  }
});

test("historical ResumeVersions without current source authority are preserved as orphan records", () => {
  const fixture = setupFixture();
  const runDirectory = path.join(fixture.existingRoot, "j001_06_synthetic");
  mkdirSync(runDirectory, { recursive: true });
  writeFileSync(path.join(runDirectory, "resume_versions.json"), JSON.stringify([historicalVersion()], null, 2));
  try {
    const result = reconciliation.buildResumeAssetReconciliation({
      sourceRoots: [fixture.sourceRoot],
      careerRoots: [fixture.careerRoot],
      applicationStore: { applications: [], applicationEvents: [], followUpReviews: [], confirmationNeeded: [] },
      repositoryRoot: root,
      generatedAt: "2026-08-08T12:00:00Z",
      outputRoot: fixture.outputRoot,
      existingResumeVersionRoot: fixture.existingRoot,
    });
    assert.equal(result.historicalResumeVersions.some((version) => version.state === "MISSING"), true);
    assert.equal(result.resumeLibraryHealth.orphanResumeVersions, 1);
    assert.equal(result.operatorReviewQueue.some((item) => item.classification === "ORPHAN_RESUMEVERSION"), true);
  } finally {
    rmSync(fixture.base, { recursive: true, force: true });
  }
});

test("private outputs stay outside Git and exclude application linkage artifacts", () => {
  const { fixture, result } = build();
  try {
    const written = reconciliation.writeResumeAssetReconciliationOutputs({
      outputRoot: fixture.outputRoot,
      repositoryRoot: root,
      result,
    });
    assert.equal(written.privatePathVisible, false);
    assert.equal(written.artifactNames.includes("application_resume_links.json"), false);
    assert.equal(written.artifactNames.includes("resume_link_application_events.json"), false);
    assert.equal(statSync(written.runDirectory).mode & 0o777, 0o700);
  } finally {
    rmSync(fixture.base, { recursive: true, force: true });
  }
});

test("CLI prints counts and safe labels without paths or raw content", () => {
  const fixture = setupFixture({ resumeFilename: "Synthetic CLI Resume.txt" });
  writeFileSync(path.join(fixture.applicationRoot, "applications.json"), JSON.stringify([application()], null, 2));
  try {
    const run = spawnSync(
      process.execPath,
      [
        cliPath,
        "resume-reconcile",
        "--source-root",
        fixture.sourceRoot,
        "--career-root",
        fixture.careerRoot,
        "--application-root",
        fixture.applicationRoot,
        "--output-root",
        fixture.outputRoot,
        "--existing-resume-version-root",
        fixture.existingRoot,
        "--as-of",
        "2026-08-08",
      ],
      { cwd: root, encoding: "utf8" },
    );
    assert.equal(run.status, 0, run.stderr);
    const parsed = JSON.parse(run.stdout);
    assert.equal(parsed.privatePathVisible, false);
    assert.equal(parsed.sourceRecordsInventoried, 1);
    assert.doesNotMatch(run.stdout, new RegExp(fixture.base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.doesNotMatch(run.stdout, /Professional summary|Experience leading synthetic automation/);
  } finally {
    rmSync(fixture.base, { recursive: true, force: true });
  }
});

test("source code has no external action or private UI connection", () => {
  const forbiddenRuntimePattern = /fetch\(|axios|submitApplication|sendMessage|https?:\/\//;
  const forbiddenRoutePattern = /from\s+["'][^"']*(\/os|\/operator)|app\/(os|operator)|routes\/(os|operator)/;
  assert.doesNotMatch(source, forbiddenRuntimePattern);
  assert.doesNotMatch(cliSource, forbiddenRuntimePattern);
  assert.doesNotMatch(linkageSource, forbiddenRuntimePattern);
  assert.doesNotMatch(source, forbiddenRoutePattern);
  assert.doesNotMatch(cliSource, forbiddenRoutePattern);
  assert.doesNotMatch(linkageSource, forbiddenRoutePattern);
});
