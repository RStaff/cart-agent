import assert from "node:assert/strict";
import { createRequire } from "node:module";
import Module from "node:module";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const presentationPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/careerOsCommandCenterPresentation.ts");
const surfacePath = path.join(root, "staffordos/ui/operator-frontend/components/staffordos/JobCommandSurface.tsx");
const routePath = path.join(root, "staffordos/ui/operator-frontend/app/os/professional/jobs/page.tsx");
const requireFromFrontend = createRequire(path.join(root, "staffordos/ui/operator-frontend/package.json"));
const ts = requireFromFrontend("typescript");

const presentationSource = readFileSync(presentationPath, "utf8");
const surfaceSource = readFileSync(surfacePath, "utf8");
const routeSource = readFileSync(routePath, "utf8");
const implementationSource = [presentationSource, surfaceSource, routeSource].join("\n");

function registerTypeScriptRequire() {
  const originalTsExtension = Module._extensions[".ts"];
  Module._extensions[".ts"] = function compileTypeScriptModule(mod, filename) {
    const source = readFileSync(filename, "utf8");
    const compiled = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      },
    });
    mod._compile(compiled.outputText, filename);
  };
  return () => {
    if (originalTsExtension) {
      Module._extensions[".ts"] = originalTsExtension;
    } else {
      delete Module._extensions[".ts"];
    }
  };
}

const restoreTypeScriptRequire = registerTypeScriptRequire();
const presentation = requireFromFrontend(presentationPath);
restoreTypeScriptRequire();

const {
  CAREEROS_COMMAND_CENTER_EMPTY_AS_OF,
  EMPTY_CAREEROS_COMMAND_CENTER_PRESENTATION,
  buildCareerOsCommandCenterPresentation,
} = presentation;

const recommendationResult = {
  generatedAt: "2026-08-08T12:00:00.000Z",
  readModel: [
    {
      recommendationId: "rec_apply",
      queueItemId: "queue_apply",
      company: "Example Automation Co",
      role: "AI Automation Product Manager",
      recommendation: "APPLY_NOW",
      applicationReadiness: "READY_FOR_OPERATOR_APPROVED_APPLICATION",
      recommendedResumeVersion: {
        status: "SELECTED_EXISTING_RESUMEVERSION",
        safeLabel: "ROLE_TARGETED_RESUME / PDF / SUPPORTED_TRANSFERABLE / 2026-08-01 / abc12345",
        factSafetyStatus: "SUPPORTED_TRANSFERABLE",
      },
      missingSkillCount: 0,
      supportingEvidenceCount: 4,
      estimatedResumeUpdateEffort: "NONE",
      recommendedNextAction: "Confirm the selected ResumeVersion before applying manually.",
      capturedAsOf: "2026-08-08T12:00:00.000Z",
      limitations: ["Read model excludes private paths and raw source text."],
      privatePathVisible: false,
      rawResumeTextVisible: false,
      sourceUrlVisible: false,
      applicationActionAvailable: false,
      messageActionAvailable: false,
      resumeMutationAvailable: false,
    },
    {
      recommendationId: "rec_review",
      queueItemId: "queue_review",
      company: "Example Systems",
      role: "Business Technology Analyst",
      recommendation: "REVIEW",
      applicationReadiness: "NEEDS_EVIDENCE_REVIEW",
      recommendedResumeVersion: {
        status: "REVIEW_BEFORE_REUSE",
        safeLabel: null,
        factSafetyStatus: "NEEDS_EVIDENCE",
      },
      missingSkillCount: 2,
      supportingEvidenceCount: 1,
      estimatedResumeUpdateEffort: "MODERATE",
      recommendedNextAction: "Review missing evidence before application planning.",
      capturedAsOf: "2026-08-08T12:00:00.000Z",
      limitations: ["Read model fixture."],
      privatePathVisible: false,
      rawResumeTextVisible: false,
      sourceUrlVisible: false,
      applicationActionAvailable: false,
      messageActionAvailable: false,
      resumeMutationAvailable: false,
    },
    {
      recommendationId: "rec_wait",
      queueItemId: "queue_wait",
      company: "Example Platform",
      role: "Platform Operations Manager",
      recommendation: "WAIT",
      applicationReadiness: "WAITING_FOR_SOURCE_OR_DUPLICATE_REVIEW",
      recommendedResumeVersion: {
        status: "NO_RESUMEVERSION_AVAILABLE",
        safeLabel: null,
        factSafetyStatus: null,
      },
      missingSkillCount: 1,
      supportingEvidenceCount: 2,
      estimatedResumeUpdateEffort: "UNKNOWN",
      recommendedNextAction: "Resolve duplicate review before application planning.",
      capturedAsOf: "2026-08-08T12:00:00.000Z",
      limitations: ["Read model fixture."],
      privatePathVisible: false,
      rawResumeTextVisible: false,
      sourceUrlVisible: false,
      applicationActionAvailable: false,
      messageActionAvailable: false,
      resumeMutationAvailable: false,
    },
    {
      recommendationId: "rec_skip",
      queueItemId: "queue_skip",
      company: "Example Duplicate",
      role: "Marketing Specialist",
      recommendation: "SKIP",
      applicationReadiness: "SKIP_RECOMMENDED",
      recommendedResumeVersion: {
        status: "NO_SAFE_EXISTING_RESUMEVERSION",
        safeLabel: null,
        factSafetyStatus: null,
      },
      missingSkillCount: 3,
      supportingEvidenceCount: 0,
      estimatedResumeUpdateEffort: "HIGH",
      recommendedNextAction: "Skip this queue item.",
      capturedAsOf: "2026-08-08T12:00:00.000Z",
      limitations: ["Read model fixture."],
      privatePathVisible: false,
      rawResumeTextVisible: false,
      sourceUrlVisible: false,
      applicationActionAvailable: false,
      messageActionAvailable: false,
      resumeMutationAvailable: false,
    },
  ],
  recommendations: [
    {
      recommendationId: "rec_apply",
      explainableFit: {
        available: true,
        fitRecommendation: "Existing fit: apply with positioning",
      },
    },
    {
      recommendationId: "rec_review",
      explainableFit: {
        available: false,
        fitRecommendation: null,
      },
    },
  ],
  summary: {
    queueItemsReviewed: 4,
  },
};

const greenhouseDiscoveryResult = {
  generatedAt: "2026-08-08T11:45:00.000Z",
  providerManifest: {
    limitations: ["Provider manifest fixture."],
  },
  summary: {
    boardsRetrieved: 2,
    boardsFailed: 0,
    publishedJobsRetrieved: 12,
    eligibleJobs: 4,
    queueItems: 4,
  },
};

const applicationPipelineResult = {
  generatedAt: "2026-08-08T11:30:00.000Z",
  dailyCommand: {
    limitations: ["Pipeline fixture."],
    pipelineSummary: {
      submittedApplications: 4,
      followUpReviewsDue: 2,
      limitations: ["No conversion rates."],
    },
    searchHealth: {
      interviewsActive: 1,
    },
  },
};

test("empty Command Center is deterministic and disconnected", () => {
  assert.equal(EMPTY_CAREEROS_COMMAND_CENTER_PRESENTATION.title, "CareerOS Command Center");
  assert.equal(EMPTY_CAREEROS_COMMAND_CENTER_PRESENTATION.route, "/os/professional/jobs");
  assert.equal(EMPTY_CAREEROS_COMMAND_CENTER_PRESENTATION.capturedAsOf, CAREEROS_COMMAND_CENTER_EMPTY_AS_OF);
  assert.deepEqual(
    EMPTY_CAREEROS_COMMAND_CENTER_PRESENTATION.todaysBrief.map((item) => item.value),
    [0, 0, 0, 0, 0],
  );
  assert.equal(EMPTY_CAREEROS_COMMAND_CENTER_PRESENTATION.topRecommendations.length, 0);
  assert.equal(EMPTY_CAREEROS_COMMAND_CENTER_PRESENTATION.pipeline.applicationsSubmitted, 0);
  assert.equal(EMPTY_CAREEROS_COMMAND_CENTER_PRESENTATION.systemHealth.queueSize, 0);
});

test("Today's Brief counts come from existing opportunity and recommendation read models", () => {
  const commandCenter = buildCareerOsCommandCenterPresentation({
    recommendationResult,
    greenhouseDiscoveryResult,
    applicationPipelineResult,
  });

  assert.deepEqual(
    Object.fromEntries(commandCenter.todaysBrief.map((item) => [item.label, item.value])),
    {
      "New Opportunities": 4,
      "Ready to Apply": 1,
      Review: 1,
      Waiting: 1,
      Skipped: 1,
    },
  );
});

test("Top Recommendations display required fields without recomputing the recommendation", () => {
  const commandCenter = buildCareerOsCommandCenterPresentation({ recommendationResult });
  const first = commandCenter.topRecommendations[0];

  assert.equal(first.position, "AI Automation Product Manager");
  assert.equal(first.company, "Example Automation Co");
  assert.equal(first.recommendation, "APPLY_NOW");
  assert.equal(first.explainableFit, "Existing fit: apply with positioning");
  assert.match(first.resumeVersion, /ROLE_TARGETED_RESUME/);
  assert.equal(first.nextAction, "Confirm the selected ResumeVersion before applying manually.");
  assert.equal(first.applicationActionAvailable, false);
  assert.equal(first.messageActionAvailable, false);
  assert.equal(first.resumeMutationAvailable, false);
});

test("Pipeline section uses the existing application pipeline read model", () => {
  const commandCenter = buildCareerOsCommandCenterPresentation({ applicationPipelineResult });

  assert.equal(commandCenter.pipeline.applicationsSubmitted, 4);
  assert.equal(commandCenter.pipeline.interviews, 1);
  assert.equal(commandCenter.pipeline.followUpsDue, 2);
  assert.match(commandCenter.pipeline.sourceAuthority, /J001\.05B/);
});

test("System Health uses provider and queue run metadata", () => {
  const commandCenter = buildCareerOsCommandCenterPresentation({
    recommendationResult,
    greenhouseDiscoveryResult,
  });

  assert.equal(commandCenter.systemHealth.lastDiscoveryRun, "2026-08-08T11:45:00.000Z");
  assert.equal(commandCenter.systemHealth.queueSize, 4);
  assert.equal(commandCenter.systemHealth.providerStatus[0].label, "Greenhouse");
  assert.equal(commandCenter.systemHealth.providerStatus[0].state, "GREENHOUSE_DISCOVERY_RUN_AVAILABLE");
});

test("Command Center does not duplicate recommendation or ranking logic", () => {
  assert.doesNotMatch(presentationSource, /buildOpportunityRecommendationEngine/);
  assert.doesNotMatch(presentationSource, /rankingSummary|totalScore|categoryContributions|priorityTier/);
  assert.doesNotMatch(presentationSource, /finalRecommendation\s*===|APPLY_WITH_POSITIONING|STRONG_APPLY/);
});

test("Command Center route uses the existing Job Command route and shell", () => {
  assert.match(routeSource, /JobCommandSurface/);
  assert.doesNotMatch(routeSource, /StaffordOsShell|OperatorShell|WorkspaceSelector/);
  assert.doesNotMatch(surfaceSource, /StaffordOsShell|OperatorShell|WorkspaceSelector/);
});

test("Command Center has no external actions or private-data loaders", () => {
  assert.doesNotMatch(implementationSource, /fetch\(|XMLHttpRequest|method:\s*["']POST/);
  assert.doesNotMatch(implementationSource, /submitApplication|applyToJob|sendRecruiter|sendMessage|mailto:/);
  assert.doesNotMatch(implementationSource, /generateResume|generateCover|mutateResume|writeResume/);
  assert.doesNotMatch(implementationSource, /runOllama|OLLAMA_HOST|from\s+["']openai|from\s+["']@anthropic|modelAdapter|chiefOfStaffModel/i);
  assert.doesNotMatch(implementationSource, /lib\/operator|\/operator\//);
});

test("Command Center read model hides private payload surfaces", () => {
  const serialized = JSON.stringify(
    buildCareerOsCommandCenterPresentation({
      recommendationResult,
      greenhouseDiscoveryResult,
      applicationPipelineResult,
    }),
  );
  const privatePayloadPattern = new RegExp(
    [String.raw`\/Users\/`, "staffordos-" + "private" + "-intake", "raw job", "raw resume", "sourceUrl"].join("|"),
    "i",
  );

  assert.doesNotMatch(serialized, privatePayloadPattern);
  assert.match(serialized, /privatePathVisible":false/);
  assert.match(serialized, /rawJobTextVisible":false/);
  assert.match(serialized, /rawResumeTextVisible":false/);
});
