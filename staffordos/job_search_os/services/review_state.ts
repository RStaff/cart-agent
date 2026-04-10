import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { CandidateProfileRecord } from "../db/candidate_profile_repo";
import type { ResumeBlockRecord } from "../db/resume_blocks_repo";
import type { ScoredJobRecord } from "./tracker";

const MODULE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA_DIR = path.join(MODULE_ROOT, "data");
export const REVIEW_STATE_PATH = path.join(DATA_DIR, "review_state.json");

export type JobSearchReviewState = {
  jobs: ScoredJobRecord[];
  candidateProfile: CandidateProfileRecord | null;
  resumeBlocks: ResumeBlockRecord[];
  canonicalResumeMarkdown: string;
  updatedAt: string;
};

// Seed-only review context for local development and manual testing.
// Canonical application workflow state lives in db/applications_repo.ts.

function nowIsoString() {
  return new Date().toISOString();
}

function defaultState(): JobSearchReviewState {
  return {
    jobs: [],
    candidateProfile: null,
    resumeBlocks: [],
    canonicalResumeMarkdown: "",
    updatedAt: nowIsoString(),
  };
}

function ensureDataDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export function readReviewState(): JobSearchReviewState {
  ensureDataDir();

  if (!fs.existsSync(REVIEW_STATE_PATH)) {
    return defaultState();
  }

  try {
    const raw = fs.readFileSync(REVIEW_STATE_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<JobSearchReviewState>;

    return {
      jobs: Array.isArray(parsed.jobs) ? parsed.jobs : [],
      candidateProfile: parsed.candidateProfile || null,
      resumeBlocks: Array.isArray(parsed.resumeBlocks) ? parsed.resumeBlocks : [],
      canonicalResumeMarkdown: typeof parsed.canonicalResumeMarkdown === "string" ? parsed.canonicalResumeMarkdown : "",
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : nowIsoString(),
    };
  } catch {
    return defaultState();
  }
}

export function writeReviewState(state: JobSearchReviewState) {
  ensureDataDir();
  const nextState: JobSearchReviewState = {
    ...state,
    updatedAt: nowIsoString(),
  };
  fs.writeFileSync(REVIEW_STATE_PATH, JSON.stringify(nextState, null, 2));
  return nextState;
}
