import { appendFileSync, chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import * as path from "node:path";

export const CALIBRATION_LABELS_DIRECTORY = "match-engine-calibration";
export const CALIBRATION_LABELS_FILENAME = "human_labels.json";
export const CALIBRATION_EVENTS_FILENAME = "human_label_events.jsonl";

export const FIT_LABELS = ["STRONG_MATCH", "GOOD_MATCH", "TRANSFERABLE", "STRETCH", "POOR_MATCH", "HARD_NO"] as const;
export const INTEREST_LABELS = ["HIGH", "MEDIUM", "LOW", "NONE"] as const;
export const GEOGRAPHY_LABELS = ["ACCEPTABLE", "NOT_ACCEPTABLE", "UNKNOWN"] as const;
export const PURSUIT_LABELS = ["YES", "MAYBE", "NO"] as const;
export const SELF_CONFIDENCE_LABELS = ["HIGH", "MEDIUM", "LOW"] as const;

export type CalibrationReviewInput = {
  sampleId: string;
  evidenceFit: string;
  interest: string;
  geography: string;
  wouldPursue: string;
  selfConfidence: string;
  reason?: string;
  operatorId?: string;
  jobSearchRoot?: string;
};

export type CalibrationReviewRecord = Omit<CalibrationReviewInput, "jobSearchRoot" | "operatorId"> & {
  capturedAt: string;
  operatorAuthority: "ROSS_OPERATOR_EXPLICIT";
};

export type CalibrationReviewAuthority = {
  schemaVersion: "staffordos.careeros.match_engine_v1.human_review.v1";
  sampleCount: 40;
  labelsCaptured: number;
  records: Record<string, CalibrationReviewRecord>;
  workflowDecisionsUsedAsGroundTruth: false;
  selfConfidenceIsDiagnosticOnly: true;
};

function storageDirectory(jobSearchRoot = path.join(homedir(), ".staffordos/private/professional/job-search")) {
  return path.join(jobSearchRoot, CALIBRATION_LABELS_DIRECTORY);
}

function labelsPath(jobSearchRoot?: string) {
  return path.join(storageDirectory(jobSearchRoot), CALIBRATION_LABELS_FILENAME);
}

function eventsPath(jobSearchRoot?: string) {
  return path.join(storageDirectory(jobSearchRoot), CALIBRATION_EVENTS_FILENAME);
}

function readAuthority(filePath: string): CalibrationReviewAuthority {
  if (!existsSync(filePath)) return emptyAuthority();
  try {
    const value = JSON.parse(readFileSync(filePath, "utf8")) as Partial<CalibrationReviewAuthority>;
    if (value.schemaVersion !== "staffordos.careeros.match_engine_v1.human_review.v1" || value.workflowDecisionsUsedAsGroundTruth !== false) return emptyAuthority();
    return { ...emptyAuthority(), ...value, records: value.records || {}, labelsCaptured: Object.keys(value.records || {}).length } as CalibrationReviewAuthority;
  } catch {
    return emptyAuthority();
  }
}

function emptyAuthority(): CalibrationReviewAuthority {
  return {
    schemaVersion: "staffordos.careeros.match_engine_v1.human_review.v1",
    sampleCount: 40,
    labelsCaptured: 0,
    records: {},
    workflowDecisionsUsedAsGroundTruth: false,
    selfConfidenceIsDiagnosticOnly: true,
  };
}

function writePrivateJson(filePath: string, value: unknown) {
  mkdirSync(path.dirname(filePath), { recursive: true, mode: 0o700 });
  chmodSync(path.dirname(filePath), 0o700);
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
  chmodSync(filePath, 0o600);
}

export function loadCalibrationReviewAuthority(options: { jobSearchRoot?: string } = {}) {
  return readAuthority(labelsPath(options.jobSearchRoot));
}

export function isCompleteCalibrationReview(value: unknown): value is CalibrationReviewRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<CalibrationReviewRecord>;
  return typeof record.sampleId === "string"
    && FIT_LABELS.includes(record.evidenceFit as typeof FIT_LABELS[number])
    && INTEREST_LABELS.includes(record.interest as typeof INTEREST_LABELS[number])
    && GEOGRAPHY_LABELS.includes(record.geography as typeof GEOGRAPHY_LABELS[number])
    && PURSUIT_LABELS.includes(record.wouldPursue as typeof PURSUIT_LABELS[number])
    && SELF_CONFIDENCE_LABELS.includes(record.selfConfidence as typeof SELF_CONFIDENCE_LABELS[number]);
}

export function deriveCalibrationReviewProgress(sampleIds: readonly string[], authority: CalibrationReviewAuthority) {
  const completedIds = sampleIds.filter((sampleId) => isCompleteCalibrationReview(authority.records[sampleId]));
  const nextUnreviewedIndex = sampleIds.findIndex((sampleId) => !completedIds.includes(sampleId));
  return {
    total: sampleIds.length,
    completed: completedIds.length,
    remaining: sampleIds.length - completedIds.length,
    nextUnreviewedIndex: nextUnreviewedIndex < 0 ? null : nextUnreviewedIndex,
  };
}

export function saveCalibrationReview(input: CalibrationReviewInput) {
  const errors: string[] = [];
  const sampleNumber = Number(input.sampleId.replace(/^M21-/, ""));
  if (!/^M21-\d{3}$/.test(input.sampleId) || sampleNumber < 1 || sampleNumber > 40) errors.push("This calibration record is invalid.");
  if (!FIT_LABELS.includes(input.evidenceFit as typeof FIT_LABELS[number])) errors.push("Choose an evidence fit label.");
  if (!INTEREST_LABELS.includes(input.interest as typeof INTEREST_LABELS[number])) errors.push("Choose an interest level.");
  if (!GEOGRAPHY_LABELS.includes(input.geography as typeof GEOGRAPHY_LABELS[number])) errors.push("Choose a geography assessment.");
  if (!PURSUIT_LABELS.includes(input.wouldPursue as typeof PURSUIT_LABELS[number])) errors.push("Choose whether you would pursue this role.");
  if (!SELF_CONFIDENCE_LABELS.includes(input.selfConfidence as typeof SELF_CONFIDENCE_LABELS[number])) errors.push("Choose a self-confidence level.");
  if (errors.length) return { ok: false, errors };

  const authority = loadCalibrationReviewAuthority({ jobSearchRoot: input.jobSearchRoot });
  const capturedAt = new Date().toISOString();
  const nextRecord: CalibrationReviewRecord = {
    sampleId: input.sampleId,
    evidenceFit: input.evidenceFit,
    interest: input.interest,
    geography: input.geography,
    wouldPursue: input.wouldPursue,
    selfConfidence: input.selfConfidence,
    reason: (input.reason || "").trim().slice(0, 500),
    capturedAt,
    operatorAuthority: "ROSS_OPERATOR_EXPLICIT",
  };
  const nextAuthority: CalibrationReviewAuthority = {
    ...authority,
    records: { ...authority.records, [input.sampleId]: nextRecord },
    labelsCaptured: Object.keys({ ...authority.records, [input.sampleId]: nextRecord }).length,
  };
  const event = {
    eventType: "MATCH_ENGINE_HUMAN_REVIEW_SAVED",
    eventVersion: "CAREEROS_V1.22C",
    occurredAt: capturedAt,
    operatorAuthority: "ROSS_OPERATOR_EXPLICIT",
    operatorId: input.operatorId || "ROSS",
    sampleId: input.sampleId,
    careerFactMutated: false,
    careerEvidenceMutated: false,
    workflowDecisionMutated: false,
    opportunityTruthMutated: false,
    preferenceAuthorityMutated: false,
    selfConfidenceUsedAsFit: false,
  };
  writePrivateJson(labelsPath(input.jobSearchRoot), nextAuthority);
  mkdirSync(path.dirname(eventsPath(input.jobSearchRoot)), { recursive: true, mode: 0o700 });
  appendFileSync(eventsPath(input.jobSearchRoot), `${JSON.stringify(event)}\n`, { encoding: "utf8", mode: 0o600 });
  chmodSync(eventsPath(input.jobSearchRoot), 0o600);
  return { ok: true, record: nextRecord, errors: [] };
}

export function calibrationStoragePaths(options: { jobSearchRoot?: string } = {}) {
  return { labels: labelsPath(options.jobSearchRoot), events: eventsPath(options.jobSearchRoot) };
}
