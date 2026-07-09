import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { fileURLToPath } from "node:url";
import { buildSync } from "esbuild";
import { readEvidenceManifest } from "../proof_runs/evidence_manifest_v1.mjs";

function backupFile(filePath, backupDir) {
  const exists = fs.existsSync(filePath);
  const backupPath = path.join(backupDir, path.basename(filePath));
  if (exists) {
    fs.copyFileSync(filePath, backupPath);
  }
  return { exists, backupPath };
}

function restoreFile(filePath, snapshot) {
  if (snapshot.exists) {
    fs.copyFileSync(snapshot.backupPath, filePath);
  } else if (fs.existsSync(filePath)) {
    fs.rmSync(filePath, { force: true });
  }
}

function assert(condition, message, failures) {
  if (!condition) failures.push(message);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

async function bundleWriter(entryFile, outputFile) {
  buildSync({
    entryPoints: [entryFile],
    outfile: outputFile,
    bundle: true,
    platform: "node",
    format: "esm",
    target: "node20"
  });
  return import(pathToFileURL(outputFile).href);
}

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const manifestPath = path.join(os.tmpdir(), `staffordos-evidence-manifest-${process.pid}.json`);
const backupDir = fs.mkdtempSync(path.join(os.tmpdir(), "staffordos-evidence-backup-"));
const beforePath = path.join(repoRoot, "staffordos/proof_runs/internal_shopifixer_dry_run_v1/before_evidence.md");
const afterPath = path.join(repoRoot, "staffordos/proof_runs/internal_shopifixer_dry_run_v1/after_evidence.md");
const proofPackagePath = path.join(repoRoot, "staffordos/proof_runs/internal_shopifixer_dry_run_v1/merchant_proof_package.md");
const beforeBackup = backupFile(beforePath, backupDir);
const afterBackup = backupFile(afterPath, backupDir);
const proofPackageBackup = backupFile(proofPackagePath, backupDir);
const bundleDir = fs.mkdtempSync(path.join(os.tmpdir(), "staffordos-evidence-bundle-"));
const beforeBundlePath = path.join(bundleDir, "before_writer.mjs");
const afterBundlePath = path.join(bundleDir, "after_writer.mjs");
const frontendCwd = path.join(repoRoot, "staffordos/ui/operator-frontend");

const failures = [];
const originalManifestEnv = process.env.STAFFORDOS_EVIDENCE_MANIFEST_PATH;
const originalCwd = process.cwd();

try {
  process.env.STAFFORDOS_EVIDENCE_MANIFEST_PATH = manifestPath;
  process.chdir(frontendCwd);
  if (fs.existsSync(manifestPath)) {
    fs.rmSync(manifestPath, { force: true });
  }

  const proofPackageBefore = fs.existsSync(proofPackagePath) ? fs.readFileSync(proofPackagePath, "utf8") : "";
  const beforeModule = await bundleWriter(
    path.join(repoRoot, "staffordos/ui/operator-frontend/lib/operator/writeShopifixerBeforeEvidence.ts"),
    beforeBundlePath
  );
  const afterModule = await bundleWriter(
    path.join(repoRoot, "staffordos/ui/operator-frontend/lib/operator/writeShopifixerAfterEvidence.ts"),
    afterBundlePath
  );

  beforeModule.writeShopifixerBeforeEvidence({
    store: "validation-shop.example.com",
    date: "2026-07-08",
    affected_page_or_artifact: "staffordos/qa/validate_evidence_manifest_v1.mjs",
    issue: "before evidence validation fixture",
    why_it_matters: "prove append-only manifest behavior",
    screenshot: "proof_runs/internal_shopifixer_dry_run_v1/screenshots/before.png",
    notes: "validation fixture"
  });

  let manifest = readEvidenceManifest(manifestPath);
  assert(fs.existsSync(manifestPath), "manifest exists after before evidence write", failures);
  assert(manifest.artifacts.length === 1, "before evidence write appended one artifact", failures);
  assert(manifest.artifacts[0].stage === "before_evidence", "before evidence artifact stage recorded", failures);
  assert(manifest.artifacts[0].source_writer === "writeShopifixerBeforeEvidence", "before evidence source writer recorded", failures);
  assert(Array.isArray(manifest.artifacts[0].references) && manifest.artifacts[0].references.length > 0, "before evidence references recorded", failures);
  assert(fs.existsSync(beforePath) && fs.readFileSync(beforePath, "utf8").trim().length > 0, "before evidence markdown still produced", failures);

  afterModule.writeShopifixerAfterEvidence({
    store: "validation-shop.example.com",
    date: "2026-07-08",
    affected_page_or_artifact: "staffordos/qa/validate_evidence_manifest_v1.mjs",
    after_screenshot: "proof_runs/internal_shopifixer_dry_run_v1/screenshots/after.png",
    after_notes: "validation fixture",
    remaining_limitations: "none",
    observed_improvement: "manifest append recorded",
    merchant_facing_summary: "validation fixture"
  });

  manifest = readEvidenceManifest(manifestPath);
  assert(manifest.artifacts.length === 2, "after evidence write appended a second artifact", failures);
  assert(manifest.artifacts[1].stage === "after_evidence", "after evidence artifact stage recorded", failures);
  assert(manifest.artifacts[1].source_writer === "writeShopifixerAfterEvidence", "after evidence source writer recorded", failures);
  assert(fs.existsSync(afterPath) && fs.readFileSync(afterPath, "utf8").trim().length > 0, "after evidence markdown still produced", failures);

  const afterFirstSnapshot = JSON.stringify(manifest.artifacts);

  beforeModule.writeShopifixerBeforeEvidence({
    store: "validation-shop.example.com",
    date: "2026-07-08",
    affected_page_or_artifact: "staffordos/qa/validate_evidence_manifest_v1.mjs",
    issue: "before evidence validation fixture",
    why_it_matters: "prove append-only manifest behavior",
    screenshot: "proof_runs/internal_shopifixer_dry_run_v1/screenshots/before-2.png",
    notes: "validation fixture second append"
  });

  manifest = readEvidenceManifest(manifestPath);
  assert(manifest.artifacts.length === 3, "second before evidence write appended a third artifact", failures);
  assert(JSON.stringify(manifest.artifacts.slice(0, 2)) === afterFirstSnapshot, "previous manifest artifacts remained unchanged after second append", failures);

  afterModule.writeShopifixerAfterEvidence({
    store: "validation-shop.example.com",
    date: "2026-07-08",
    affected_page_or_artifact: "staffordos/qa/validate_evidence_manifest_v1.mjs",
    after_screenshot: "proof_runs/internal_shopifixer_dry_run_v1/screenshots/after-2.png",
    after_notes: "validation fixture second append",
    remaining_limitations: "none",
    observed_improvement: "manifest append recorded again",
    merchant_facing_summary: "validation fixture"
  });

  manifest = readEvidenceManifest(manifestPath);
  assert(manifest.artifacts.length === 4, "second after evidence write appended a fourth artifact", failures);
  assert(new Set(manifest.artifacts.map((artifact) => artifact.artifact_id)).size === manifest.artifacts.length, "artifact IDs are unique", failures);
  assert(JSON.stringify(manifest.artifacts.slice(0, 3)) === JSON.stringify(readJson(manifestPath).artifacts.slice(0, 3)), "manifest content is readable after appends", failures);
  assert((fs.existsSync(proofPackagePath) ? fs.readFileSync(proofPackagePath, "utf8") : "") === proofPackageBefore, "proof package remained unchanged", failures);
  const appendOnlyBehavior = JSON.stringify(manifest.artifacts.slice(0, 2)) === afterFirstSnapshot;

  const result = {
    schema: "staffordos.evidence_manifest_validation.v1",
    generated_at: new Date().toISOString(),
    status: failures.length ? "failed" : "passed",
    checks: {
      manifest_exists: fs.existsSync(manifestPath),
      append_only_behavior: appendOnlyBehavior,
      artifact_ids_unique: new Set(manifest.artifacts.map((artifact) => artifact.artifact_id)).size === manifest.artifacts.length,
      before_evidence_appends: true,
      after_evidence_appends: true,
      markdown_still_produced: fs.existsSync(beforePath) && fs.existsSync(afterPath),
      no_proof_package_regression: (fs.existsSync(proofPackagePath) ? fs.readFileSync(proofPackagePath, "utf8") : "") === proofPackageBefore
    },
    failures
  };

  console.log(JSON.stringify(result, null, 2));
  process.exit(result.status === "passed" ? 0 : 1);
} catch (error) {
  failures.push(error instanceof Error ? error.message : String(error));
  console.log(
    JSON.stringify(
      {
        schema: "staffordos.evidence_manifest_validation.v1",
        generated_at: new Date().toISOString(),
        status: "failed",
        checks: {
          manifest_exists: fs.existsSync(manifestPath),
          append_only_behavior: false,
          artifact_ids_unique: false,
          before_evidence_appends: false,
          after_evidence_appends: false,
          markdown_still_produced: false,
          no_proof_package_regression: false
        },
        failures
      },
      null,
      2
    )
  );
  process.exit(1);
} finally {
  process.env.STAFFORDOS_EVIDENCE_MANIFEST_PATH = originalManifestEnv;
  process.chdir(originalCwd);
  restoreFile(beforePath, beforeBackup);
  restoreFile(afterPath, afterBackup);
  restoreFile(proofPackagePath, proofPackageBackup);
}
