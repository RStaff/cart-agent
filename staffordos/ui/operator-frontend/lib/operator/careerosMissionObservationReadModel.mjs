import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const CAREEROS_MISSION_OBSERVATION_MODEL_VERSION = "careeros.mission.observation.read-model.v1";
export const CAREEROS_OBSERVATION_MISSION_ID = "CAREEROS_V1_P1_OUTCOME_TRACKING_AND_DAILY_TRIAGE";
export const CAREEROS_OBSERVATION_MISSION_AUTHORITY =
  "staffordos/ui/operator-frontend/careeros-beta/CAREEROS_V1_P1_DAILY_JOB_SEARCH_WORKSPACE_ACCEPTANCE.json";

const MODULE_REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../../../");

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function text(value) {
  const normalized = String(value ?? "").trim();
  return normalized || null;
}

function missionStatus(record) {
  const status = text(record?.status);
  if (status === "IMPLEMENTED_PENDING_GOVERNED_DEPLOYMENT") return "PENDING_DEPLOYMENT";
  if (status === "IMPLEMENTED" || status === "COMPLETE") return "COMPLETE";
  if (status === "IN_PROGRESS" || status === "RUNNING") return "RUNNING";
  return "UNAVAILABLE";
}

function approvalState(record) {
  if (typeof record?.manual_acceptance_required !== "boolean") return "UNAVAILABLE";
  if (record?.manual_acceptance_required === true) return "PENDING";
  return "NOT_REQUIRED";
}

function stepState(status, step) {
  if (status === "BLOCKED" || status === "PENDING_DEPLOYMENT") {
    return step === "preflight" ? "PASS" : step === "review" ? "BLOCKED" : "PENDING";
  }
  if (status === "COMPLETE") return "PASS";
  return "PENDING";
}

function aggregateSummary(operationsReadModel) {
  const summary = operationsReadModel?.summary;
  if (!summary) return null;
  return {
    totalBetaUsers: Number(summary.totalBetaUsers || 0),
    usersWithDiscoveryObserved: Number(summary.usersWithDiscoveryObserved || 0),
    totalOpportunities: Number(summary.totalOpportunities || 0),
    totalEvaluations: Number(summary.totalEvaluations || 0),
  };
}

export function buildCareerOsMissionObservation({ authorityRecord, operationsReadModel = null } = {}) {
  if (!authorityRecord || authorityRecord.mission !== CAREEROS_OBSERVATION_MISSION_ID) return null;

  const status = missionStatus(authorityRecord);
  const authoritySource = CAREEROS_OBSERVATION_MISSION_AUTHORITY;
  return {
    modelVersion: CAREEROS_MISSION_OBSERVATION_MODEL_VERSION,
    missionId: CAREEROS_OBSERVATION_MISSION_ID,
    missionName: text(authorityRecord.name || authorityRecord.missionName) || "UNAVAILABLE",
    product: "CareerOS",
    roadmapLane: "UNAVAILABLE",
    roadmapItem: "UNAVAILABLE",
    objective: "UNAVAILABLE",
    status,
    authorityStatus: text(authorityRecord.status) || "UNAVAILABLE",
    authority: {
      sourceRefs: [authoritySource],
      repository: "UNAVAILABLE",
      worktree: "UNAVAILABLE",
      branch: null,
      allowedMutations: [],
      prohibitedActions: [
        "invoke Codex",
        "launch a mission",
        "run validation",
        "mutate CareerOS",
        "create applications or packages",
        "call job providers",
      ],
      executor: "UNAVAILABLE",
      validators: [],
    },
    approval: {
      required: typeof authorityRecord.manual_acceptance_required === "boolean"
        ? authorityRecord.manual_acceptance_required
        : null,
      state: approvalState(authorityRecord),
      reference: null,
      approvedAt: null,
    },
    steps: [
      { id: "preflight", label: "Preflight", state: stepState(status, "preflight") },
      { id: "execution", label: "Read-only observation", state: stepState(status, "execution") },
      { id: "validation", label: "Validation evidence", state: stepState(status, "validation") },
      { id: "review", label: "Owner review", state: stepState(status, "review") },
      { id: "completion", label: "Completion", state: stepState(status, "completion") },
    ],
    validations: [
      {
        name: "Mission authority artifact",
        result: "PASS",
        evidenceRef: authoritySource,
        summary: "The fixed CareerOS mission acceptance artifact is present.",
      },
      {
        name: "Mission-specific validation evidence",
        result: "UNAVAILABLE",
        evidenceRef: null,
        summary: "No mission-specific validation result is recorded in the current authority.",
      },
    ],
    blockers: [
      ...(status === "PENDING_DEPLOYMENT" ? ["Mission is recorded as IMPLEMENTED_PENDING_GOVERNED_DEPLOYMENT.", "Manual acceptance is required before governed deployment."] : []),
      "Roadmap lane, objective, repository, worktree, executor, and validator identity are not recorded by this mission artifact.",
    ],
    risks: ["Current authority is an acceptance artifact, not a complete mission execution record."],
    changedFiles: [],
    rollback: {
      status: "UNAVAILABLE",
      reference: null,
    },
    audit: {
      eventRefs: [],
      lastUpdatedAt: null,
    },
    aggregateCareerOs: aggregateSummary(operationsReadModel),
    nextAction: "Record complete mission authority and validation evidence before treating this mission as complete.",
    readOnly: true,
  };
}

export async function loadCareerOsMissionObservation({ repoRoot = MODULE_REPO_ROOT, operationsReadModel = null } = {}) {
  const authorityPath = path.join(repoRoot, CAREEROS_OBSERVATION_MISSION_AUTHORITY);
  const authorityRecord = readJson(authorityPath);
  return buildCareerOsMissionObservation({ authorityRecord, operationsReadModel });
}
