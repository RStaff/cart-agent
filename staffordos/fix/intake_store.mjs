#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { diagnoseIssue } from "../../scripts/fix/diagnose_issue.mjs";

const repoRoot = resolve(dirname(new URL(import.meta.url).pathname), "..", "..");
process.chdir(repoRoot);

const SUBMISSIONS_PATH = ".tmp/fix_intake_submissions.json";

async function readJson(path, fallback = []) {
  try {
    const raw = await readFile(path, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return fallback;
    }
    throw error;
  }
}

async function writeJson(path, payload) {
  await mkdir(".tmp", { recursive: true });
  await writeFile(path, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

async function withMutedConsole(fn) {
  const originalLog = console.log;
  const originalTable = console.table;
  const originalError = console.error;
  console.log = () => {};
  console.table = () => {};
  console.error = () => {};
  try {
    return await fn();
  } finally {
    console.log = originalLog;
    console.table = originalTable;
    console.error = originalError;
  }
}

function normalizeInput(input) {
  return {
    name: String(input?.name || "").trim(),
    email: String(input?.email || "").trim(),
    githubIssueUrl: String(input?.githubIssueUrl || "").trim(),
    repoOrSetupUrl: String(input?.repoOrSetupUrl || "").trim(),
    issueText: String(input?.issueText || "").trim(),
  };
}

export function buildDiagnosisExplanation(diagnosis) {
  switch (diagnosis?.caseType) {
    case "tunnel_issue":
      return "This usually means Shopify admin is still pointing at a stale or unstable public URL, or the tunnel path is drifting from the app path.";
    case "embedded_app_loading":
      return "This usually means the embedded render path, app URL, or Shopify admin handoff is misaligned even though parts of the app still look healthy.";
    case "stripe_env_missing":
      return "This looks like a setup problem around missing or mismatched environment/config values rather than an app feature bug.";
    default:
      return "This still looks like a Shopify dev path issue, but I’d want to verify the setup details.";
  }
}

function buildTypicalSymptoms(diagnosis) {
  switch (diagnosis?.caseType) {
    case "tunnel_issue":
      return [
        "preview works once, then breaks",
        "public URL keeps changing or dying",
        "Shopify admin keeps reopening the wrong hostname",
      ];
    case "embedded_app_loading":
      return [
        "embedded app opens blank or throws an iframe-style error",
        "auth or redirect loops happen only inside Shopify admin",
        "app is healthy locally but broken in embedded preview",
      ];
    default:
      return [
        "setup looks mostly correct but still fails",
        "behavior changes between restarts",
        "local app health and Shopify admin behavior do not match",
      ];
  }
}

function buildWhatIWouldFix(diagnosis) {
  const steps = Array.isArray(diagnosis?.suggestedFix) ? diagnosis.suggestedFix : [];
  if (steps.length) return steps;
  return [
    "stabilize the public dev URL",
    "align Shopify app URL + config",
    "restore embedded preview loading",
    "make startup repeatable",
  ];
}

export async function listFixIntakeSubmissions() {
  return readJson(SUBMISSIONS_PATH, []);
}

export async function createFixIntakeSubmission(input) {
  const normalized = normalizeInput(input);
  if (!normalized.name || !normalized.email || !normalized.issueText) {
    throw new Error("invalid_fix_intake");
  }

  const diagnosis = await withMutedConsole(() => diagnoseIssue(normalized.issueText));
  const explanation = buildDiagnosisExplanation(diagnosis);
  const typicalSymptoms = buildTypicalSymptoms(diagnosis);
  const whatIWouldFix = buildWhatIWouldFix(diagnosis);
  const recommendedNextStep = diagnosis.confidence >= 0.55 ? "payment" : "manual_review";

  const submissions = await listFixIntakeSubmissions();
  const record = {
    submissionId: `fix_intake_${Date.now()}`,
    ...normalized,
    diagnosis,
    explanation,
    typicalSymptoms,
    whatIWouldFix,
    recommendedNextStep,
    linkedLeadId: null,
    createdAt: new Date().toISOString(),
  };

  submissions.push(record);
  await writeJson(SUBMISSIONS_PATH, submissions);
  return record;
}

export async function linkIntakeToLead(submissionId, leadId) {
  const submissions = await listFixIntakeSubmissions();
  const record = submissions.find((item) => item.submissionId === submissionId);
  if (!record) {
    throw new Error(`submission_not_found:${submissionId}`);
  }
  record.linkedLeadId = leadId;
  record.linkedAt = new Date().toISOString();
  await writeJson(SUBMISSIONS_PATH, submissions);
  return record;
}

export function findLatestSubmissionForLead(submissions, lead) {
  const list = Array.isArray(submissions) ? submissions : [];
  return list
    .filter(
      (item) =>
        item.linkedLeadId === lead.id ||
        (item.githubIssueUrl && lead.sendTarget && item.githubIssueUrl === lead.sendTarget),
    )
    .sort((left, right) => String(right.createdAt || "").localeCompare(String(left.createdAt || "")))[0] || null;
}
