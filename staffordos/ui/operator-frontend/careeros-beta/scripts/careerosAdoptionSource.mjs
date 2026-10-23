import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";

const exec = promisify(execFile);

export const ADOPTION_CRITICAL_FILES = Object.freeze([
  "scripts/adopt-careeros-schema.mjs",
  "scripts/careerosAdoptionApproval.mjs",
  "scripts/careerosAdoptionSource.mjs",
  "scripts/careerosSchemaFingerprint.mjs",
  "scripts/careerosSchemaReference.mjs",
  "scripts/migrate-careeros.mjs",
  "scripts/prepare-careeros-adoption-evidence.mjs",
  "scripts/reconcile-careeros-story-status.mjs",
  "prisma/migrations/20260816000000_careeros_p0_foundation/migration.sql",
  "prisma/migrations/20260817000000_careeros_capability_match_product/migration.sql",
  "prisma/migrations/20260817010000_add_career_story_status/migration.sql",
  "prisma/migrations/20260817020000_add_opportunity_decision_state/migration.sql",
  "prisma/migrations/20260818030000_add_resume_drafts/migration.sql",
  "prisma/migrations/20260820050000_add_career_search_preferences/migration.sql",
  "prisma/migrations/20260822010000_add_career_fact_context_claims/migration.sql",
  "prisma/migrations/20260830100000_add_role_intent_and_relevance_feedback/migration.sql",
]);

export async function executingSourceRevision(root) {
  const { stdout } = await exec("git", ["rev-parse", "HEAD"], { cwd: root });
  const revision = stdout.trim();
  if (!/^[0-9a-f]{40}$/.test(revision)) throw new Error("CAREEROS_EXECUTING_SOURCE_REVISION_UNAVAILABLE");
  return revision;
}

export async function sourceFileDigests(root) {
  const result = {};
  for (const relativePath of ADOPTION_CRITICAL_FILES) {
    const bytes = await readFile(new URL(`../${relativePath}`, import.meta.url));
    result[relativePath] = createHash("sha256").update(bytes).digest("hex");
  }
  return result;
}

export async function sourceFileDigestsAtRevision(root, revision) {
  const result = {};
  for (const relativePath of ADOPTION_CRITICAL_FILES) {
    const { stdout } = await exec("git", ["show", `${revision}:${relativePath}`], { cwd: root, encoding: "buffer", maxBuffer: 8 * 1024 * 1024 });
    result[relativePath] = createHash("sha256").update(stdout).digest("hex");
  }
  return result;
}
