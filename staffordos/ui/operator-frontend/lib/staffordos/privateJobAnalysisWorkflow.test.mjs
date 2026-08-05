import assert from "node:assert/strict";
import { createRequire } from "node:module";
import Module from "node:module";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const workflowPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/privateJobAnalysisWorkflow.ts");
const requireFromFrontend = createRequire(path.join(root, "staffordos/ui/operator-frontend/package.json"));
const ts = requireFromFrontend("typescript");
const workflowSource = readFileSync(workflowPath, "utf8");
const relatedSources = [
  workflowPath,
  path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/jobRequirementExtractor.ts"),
  path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/candidateEvidenceMapper.ts"),
  path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/jobFitAssessment.ts"),
].map((file) => readFileSync(file, "utf8")).join("\n");

function requireTypeScriptModule(modulePath) {
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
    return requireFromFrontend(modulePath);
  } finally {
    if (originalTsExtension) {
      Module._extensions[".ts"] = originalTsExtension;
    } else {
      delete Module._extensions[".ts"];
    }
  }
}

const {
  assertPrivateAnalysisOutputDirectory,
  buildManualExternalApplicationEvent,
  buildPrivateJobAnalysisBundle,
  buildPrivateJobAnalysisPreview,
  writePrivateJobAnalysisBundle,
} = requireTypeScriptModule(workflowPath);

function opportunity() {
  return {
    schemaVersion: "staffordos.job_search.private_opportunity.normalized.v1",
    id: "privjobopp_synthetic001",
    workspaceId: "professional",
    sourceId: "privjobsrc_synthetic001",
    sourceRecord: { sourceObservedAt: "2026-08-04T12:00:00Z" },
    roleTitle: "Synthetic Product Role",
    companyName: "Synthetic Employer",
    locationText: "Remote",
    workArrangement: "Remote",
    compensationText: null,
    employmentType: "Full time",
    intakeTimestamp: "2026-08-04T12:00:00Z",
  };
}

function bundle() {
  return buildPrivateJobAnalysisBundle({
    opportunity: opportunity(),
    intakeRecord: {
      listingText: `
Requirements
- Must have AI automation product experience.
Preferred
- Nice to have SQL analytics.
Responsibilities
- You will partner with engineering.
      `,
      sourceSummary: null,
    },
    careerFacts: [
      {
        id: "careerfact_synthetic_ai",
        factType: "PROJECT",
        statement: "Synthetic AI automation product project.",
        normalizedStatement: "synthetic ai automation product project",
        sourceEvidenceIds: ["careerev_synthetic_ai"],
        verificationStatus: "PARTIALLY_SUPPORTED",
        supportLevel: "PARTIAL",
        conflictTypes: [],
        conflictingEvidenceIds: [],
        testOnly: true,
      },
    ],
    careerEvidence: [
      {
        id: "careerev_synthetic_ai",
        evidenceType: "PROJECT_ARTIFACT",
        sourceType: "PROJECT_ARTIFACT",
        authorityClassification: "OPERATOR_CONFIRMED",
        supportsFactIds: ["careerfact_synthetic_ai"],
        challengesFactIds: [],
        testOnly: true,
      },
    ],
    generatedAt: "2026-08-04T12:00:00Z",
    applicationEvent: buildManualExternalApplicationEvent({
      opportunityId: "privjobopp_synthetic001",
      rossConfirmedSubmission: true,
    }),
  });
}

test("workflow creates requirements, mappings, assessment, positioning, review queue, and next action", () => {
  const result = bundle();

  assert.ok(result.requirements.length >= 3);
  assert.equal(result.mappings.length, result.requirements.length);
  assert.equal(result.fitAssessment.finalRecommendation, "ALREADY_APPLIED_MONITOR");
  assert.equal(result.positioningBrief.finalResumeGenerated, false);
  assert.ok(result.reviewQueue.length > 0);
  assert.equal(result.nextAction.externalActionAuthorized, false);
  assert.equal(result.auditSummary.noApplicationSubmitted, true);
  assert.equal(result.auditSummary.noMessageSent, true);
  assert.equal(result.auditSummary.noResumeMutated, true);
});

test("preview exposes no private paths, raw listing text, source URL, or contact details", () => {
  const preview = buildPrivateJobAnalysisPreview(bundle());
  const serialized = JSON.stringify(preview);

  assert.equal(preview.privatePathVisible, false);
  assert.equal(preview.rawListingTextVisible, false);
  assert.equal(preview.sourceUrlVisible, false);
  assert.equal(preview.recruiterOrContactVisible, false);
  assert.doesNotMatch(serialized, /\.staffordos\/private|staffordos-private-intake|https?:\/\//);
});

test("output directory must remain outside repository", () => {
  assert.throws(
    () => assertPrivateAnalysisOutputDirectory(path.join(root, "staffordos/job-search/private-output"), root),
    /outside the repository/,
  );
});

test("private bundle writer writes only local JSON artifacts outside Git", () => {
  const tmp = mkdtempSync(path.join(os.tmpdir(), "j001-03a-synthetic-"));
  try {
    const result = writePrivateJobAnalysisBundle(bundle(), {
      outputRoot: tmp,
      repositoryRoot: root,
    });

    assert.equal(result.privateArtifactNames.length, 8);
    assert.ok(result.privateArtifactNames.includes("requirements.json"));
    assert.ok(result.privateArtifactNames.includes("processing_audit_summary.json"));
    assert.ok(result.privateArtifacts.every((artifact) => artifact.startsWith(tmp)));
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test("workflow source has no provider calls, API calls, database calls, external AI, or mutation methods", () => {
  assert.doesNotMatch(relatedSources, /fetch\(|XMLHttpRequest|\/api\/|from ["']@prisma\/client|prisma\.|database\.|dbClient|sql`/i);
  assert.doesNotMatch(relatedSources, /from ["'][^"']*(ollama|openai|anthropic|gemini)|\b(ollama|openai|anthropic|gemini)\.|modelAdapter/i);
  assert.doesNotMatch(relatedSources, /submitApplication\(|sendMessage\(|mutateResume\(|localStorage|sessionStorage/i);
});

test("workflow does not modify G004 write isolation", () => {
  const gateSource = readFileSync(path.join(root, "staffordos/ui/operator-frontend/lib/operator/operatorWriteIsolation.ts"), "utf8");

  assert.match(gateSource, /STAFFORDOS_LOCAL_OPERATOR_WRITES_ENABLED/);
  assert.doesNotMatch(workflowSource, /operatorWriteIsolation|STAFFORDOS_LOCAL_OPERATOR_WRITES_ENABLED/);
});
