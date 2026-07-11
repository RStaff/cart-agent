import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import { buildSync } from "esbuild";

function assert(condition, message, failures) {
  if (!condition) {
    failures.push(message);
  }
}

function clean(value, fallback = "") {
  const text = String(value ?? fallback).trim();
  return text.length ? text : fallback;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function writeText(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, value, "utf8");
}

function hashText(value) {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex");
}

function copyTree(repoRoot, relPath, fixtureRoot) {
  const source = path.join(repoRoot, relPath);
  const target = path.join(fixtureRoot, relPath);
  if (!fs.existsSync(source)) {
    return false;
  }
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.cpSync(source, target, { recursive: true });
  return true;
}

function bundleWriter(entryFile, outputFile) {
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

function buildProofPackage({ store, manifestPath, proofRunId, generatedAt, artifactIds, screenshotLines = [] }) {
  const lines = [
    "# MERCHANT PROOF PACKAGE",
    "",
    "Proof Package Version:",
    "v1",
    "",
    "Generated At:",
    generatedAt,
    "",
    "Proof Run ID:",
    proofRunId,
    "",
    "Manifest Path:",
    manifestPath,
    "",
    "Manifest Generated At:",
    generatedAt,
    "",
    "Merchant / Store:",
    store,
    "",
    "Before Evidence Artifact IDs:",
    `- ${artifactIds.before[0]}`,
    "",
    "After Evidence Artifact IDs:",
    `- ${artifactIds.after[0]}`,
    "",
    "Screenshot Artifact References:",
    ...screenshotLines,
    "",
    "Store:",
    store,
    "",
    "Proof Summary:",
    "validation fixture",
    "",
    "Manifest Artifact Details:",
    `- artifact_id: ${artifactIds.before[0]}`,
    `  stage: before_evidence`,
    `  created_at: ${generatedAt}`,
    `  output_path: staffordos/proof_runs/internal_shopifixer_dry_run_v1/before_evidence.md`,
    `  source_writer: writeShopifixerBeforeEvidence`,
    "",
    `- artifact_id: ${artifactIds.after[0]}`,
    `  stage: after_evidence`,
    `  created_at: ${generatedAt}`,
    `  output_path: staffordos/proof_runs/internal_shopifixer_dry_run_v1/after_evidence.md`,
    `  source_writer: writeShopifixerAfterEvidence`,
    ""
  ];
  return lines.join("\n");
}

function makeFixtureRoot(repoRoot) {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "staffordos-completion-fixture-"));
  const dirsToCopy = [
    "staffordos/clients",
    "staffordos/units",
    "staffordos/revenue",
    "staffordos/audit",
    "staffordos/shopifixer",
    "staffordos/fulfillment",
    "staffordos/merchant_registry"
  ];
  for (const relPath of dirsToCopy) {
    copyTree(repoRoot, relPath, fixtureRoot);
  }
  const frontendDir = path.join(fixtureRoot, "staffordos/ui/operator-frontend");
  fs.mkdirSync(frontendDir, { recursive: true });
  fs.mkdirSync(path.join(fixtureRoot, "staffordos/proof_runs/internal_shopifixer_dry_run_v1"), { recursive: true });
  fs.mkdirSync(path.join(fixtureRoot, "staffordos/proof_runs/output"), { recursive: true });
  fs.mkdirSync(path.join(fixtureRoot, "staffordos/merchant_registry"), { recursive: true });
  return { fixtureRoot, frontendDir };
}

function fixturePaths(fixtureRoot) {
  return {
    fulfillmentPath: path.join(fixtureRoot, "staffordos/fulfillment/shopifixer_fulfillment_truth_v1.json"),
    proofPackagePath: path.join(fixtureRoot, "staffordos/proof_runs/internal_shopifixer_dry_run_v1/merchant_proof_package.md"),
    sealPath: path.join(fixtureRoot, "staffordos/proof_runs/internal_shopifixer_dry_run_v1/merchant_proof_package.seal.json"),
    manifestPath: path.join(fixtureRoot, "staffordos/proof_runs/output/evidence_manifest_v1.json"),
    merchantRegistryPath: path.join(fixtureRoot, "staffordos/merchant_registry/merchant_lifecycle_registry_v1.json"),
    merchantRegistryMdPath: path.join(fixtureRoot, "staffordos/merchant_registry/merchant_lifecycle_registry_v1.md"),
    clientRegistryPath: path.join(fixtureRoot, "staffordos/clients/client_registry_v1.json")
  };
}

function writeFixtureState(repoRoot, fixtureRoot, scenario) {
  const { fulfillmentPath, proofPackagePath, sealPath, manifestPath, clientRegistryPath } = fixturePaths(fixtureRoot);
  const fulfillment = readJson(path.join(repoRoot, "staffordos/fulfillment/shopifixer_fulfillment_truth_v1.json"));
  const activeItem = fulfillment.items[0];
  Object.assign(activeItem, {
    payment_status: scenario.paymentStatus,
    payment_verified_source: scenario.paymentVerifiedSource ?? null,
    paid_at: scenario.paidAt ?? null,
    proof_package_status: scenario.proofPackageStatus ?? activeItem.proof_package_status,
    proof_status: scenario.proofStatus ?? activeItem.proof_status,
    execution_status: scenario.executionStatus ?? activeItem.execution_status,
    completion_status: scenario.completionStatus ?? activeItem.completion_status,
    proof_package_location: scenario.proofPackageLocation ?? activeItem.proof_package_location,
    proof_complete: scenario.proofComplete ?? activeItem.proof_complete,
    execution_complete: scenario.executionComplete ?? activeItem.execution_complete,
    completion_complete: scenario.completionComplete ?? activeItem.completion_complete,
    scoped_issue_addressed: scenario.scopedIssueAddressed ?? activeItem.scoped_issue_addressed,
    before_evidence_captured: scenario.beforeEvidenceCaptured ?? activeItem.before_evidence_captured,
    after_evidence_captured: scenario.afterEvidenceCaptured ?? activeItem.after_evidence_captured,
    scoped_fix: scenario.scopedFix ?? activeItem.scoped_fix,
    in_scope: scenario.inScope ?? activeItem.in_scope,
    out_of_scope: scenario.outOfScope ?? activeItem.out_of_scope,
    merchant_approval_needed: scenario.merchantApprovalNeeded ?? activeItem.merchant_approval_needed,
    merchant_proof_package_ready: scenario.merchantProofPackageReady ?? activeItem.merchant_proof_package_ready,
    completed_at: scenario.completedAt ?? activeItem.completed_at
  });
  writeJson(fulfillmentPath, fulfillment);

  const clientRegistry = readJson(path.join(repoRoot, "staffordos/clients/client_registry_v1.json"));
  if (scenario.clientPaymentStatus || scenario.clientClosedAt) {
    const client = Array.isArray(clientRegistry.clients) ? clientRegistry.clients.find((item) => String(item?.client_id || "").trim() === String(activeItem.client_id || "").trim()) : null;
    if (client) {
      client.deal = client.deal || {};
      if (scenario.clientPaymentStatus) client.deal.payment_status = scenario.clientPaymentStatus;
      if (scenario.clientClosedAt !== undefined) client.deal.closed_at = scenario.clientClosedAt;
    }
  }
  writeJson(clientRegistryPath, clientRegistry);

  const generatedAt = scenario.generatedAt || "2026-07-10T04:00:00.000Z";
  if (scenario.writeProofPackage !== false) {
    writeText(proofPackagePath, scenario.proofPackageText);
  } else if (fs.existsSync(proofPackagePath)) {
    fs.rmSync(proofPackagePath, { force: true });
  }

  if (scenario.writeManifest !== false) {
    writeJson(manifestPath, scenario.manifest);
  } else if (fs.existsSync(manifestPath)) {
    fs.rmSync(manifestPath, { force: true });
  }

  if (scenario.writeSeal !== false) {
    const proofPackageHash = fs.existsSync(proofPackagePath)
      ? hashText(fs.readFileSync(proofPackagePath, "utf8").trim())
      : "";
    const seal = {
      ...scenario.seal,
      sha256: scenario.seal?.sha256 === "__AUTO__" ? proofPackageHash : scenario.seal?.sha256
    };
    writeJson(sealPath, seal);
  } else if (fs.existsSync(sealPath)) {
    fs.rmSync(sealPath, { force: true });
  }

  return { generatedAt, fulfillmentPath, proofPackagePath, sealPath, manifestPath };
}

function snapshotProductionTruth(repoRoot) {
  const paths = [
    "staffordos/fulfillment/shopifixer_fulfillment_truth_v1.json",
    "staffordos/proof_runs/internal_shopifixer_dry_run_v1/merchant_proof_package.md",
    "staffordos/proof_runs/internal_shopifixer_dry_run_v1/merchant_proof_package.seal.json",
    "staffordos/proof_runs/output/evidence_manifest_v1.json",
    "staffordos/merchant_registry/merchant_lifecycle_registry_v1.json",
    "staffordos/merchant_registry/merchant_lifecycle_registry_v1.md"
  ];
  const snapshot = {};
  for (const relPath of paths) {
    const abs = path.join(repoRoot, relPath);
    if (!fs.existsSync(abs)) {
      snapshot[relPath] = null;
      continue;
    }
    const bytes = fs.readFileSync(abs);
    snapshot[relPath] = {
      sha256: crypto.createHash("sha256").update(bytes).digest("hex"),
      size: bytes.length
    };
  }
  return snapshot;
}

function assertProductionUnchanged(repoRoot, snapshot, failures) {
  for (const [relPath, before] of Object.entries(snapshot)) {
    const abs = path.join(repoRoot, relPath);
    if (before === null) {
      assert(!fs.existsSync(abs), `production_truth_unchanged:${relPath}`, failures);
      continue;
    }
    assert(fs.existsSync(abs), `production_truth_unchanged:${relPath}`, failures);
    const bytes = fs.readFileSync(abs);
    const after = {
      sha256: crypto.createHash("sha256").update(bytes).digest("hex"),
      size: bytes.length
    };
    assert(after.sha256 === before.sha256 && after.size === before.size, `production_truth_unchanged:${relPath}`, failures);
  }
}

function expectFailure(fn, matcher, failures, label) {
  try {
    fn();
    failures.push(`${label}: expected failure but succeeded`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!matcher.test(message)) {
      failures.push(`${label}: unexpected error "${message}"`);
    }
  }
}

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const productionSnapshot = snapshotProductionTruth(repoRoot);
const fixture = makeFixtureRoot(repoRoot);
const fixturePathsMap = fixturePaths(fixture.fixtureRoot);
const bundleDir = fs.mkdtempSync(path.join(os.tmpdir(), "staffordos-completion-bundle-"));
const writerBundlePath = path.join(bundleDir, "write_shopifixer_completion.mjs");
const originalCwd = process.cwd();
const failures = [];
let writerModule;

try {
  process.chdir(fixture.frontendDir);
  writerModule = await bundleWriter(
    path.join(repoRoot, "staffordos/ui/operator-frontend/lib/operator/writeShopifixerCompletion.ts"),
    writerBundlePath
  );

  const validStore = "cart-agent-dev.myshopify.com";
  const canonicalProofRunId = "internal_shopifixer_dry_run_v1";
  const canonicalManifestPath = "staffordos/proof_runs/output/evidence_manifest_v1.json";
  const canonicalProofPackagePath = "staffordos/proof_runs/internal_shopifixer_dry_run_v1/merchant_proof_package.md";
  const now = "2026-07-10T04:00:00.000Z";
  const validProofPackage = buildProofPackage({
    store: validStore,
    manifestPath: canonicalManifestPath,
    proofRunId: canonicalProofRunId,
    generatedAt: now,
    artifactIds: { before: ["ev_before_fixture"], after: ["ev_after_fixture"] },
    screenshotLines: [
      "- artifact_id: screenshot_before_fixture",
      "  stage: before_evidence",
      "  original_reference: /tmp/before.png",
      "  stored_path: staffordos/proof_runs/output/artifacts/before.png",
      "  exists: true",
      "  status: stored"
    ]
  });
  const validManifest = {
    schema: "staffordos.evidence_manifest.v1",
    generated_at: now,
    manifest_version: 1,
    proof_run_id: canonicalProofRunId,
    merchant: { store: validStore },
    artifacts: [
      {
        artifact_id: "ev_before_fixture",
        stage: "before_evidence",
        created_at: now,
        output_path: "staffordos/proof_runs/internal_shopifixer_dry_run_v1/before_evidence.md",
        source_writer: "writeShopifixerBeforeEvidence",
        references: ["before_evidence.md"]
      },
      {
        artifact_id: "ev_after_fixture",
        stage: "after_evidence",
        created_at: now,
        output_path: "staffordos/proof_runs/internal_shopifixer_dry_run_v1/after_evidence.md",
        source_writer: "writeShopifixerAfterEvidence",
        references: ["after_evidence.md"]
      }
    ]
  };
  const validSeal = {
    schema: "staffordos.merchant_proof_package_seal.v1",
    generated_at: now,
    proof_run_id: canonicalProofRunId,
    proof_package_path: canonicalProofPackagePath,
    sha256: "__AUTO__",
    manifest_path: canonicalManifestPath,
    manifest_artifact_count: 2,
    evidence_source_paths: [
      "staffordos/proof_runs/internal_shopifixer_dry_run_v1/before_evidence.md",
      "staffordos/proof_runs/internal_shopifixer_dry_run_v1/after_evidence.md"
    ],
    status: "sealed"
  };

  const baseFulfillmentScenario = {
    paymentStatus: "payment_received",
    paymentVerifiedSource: "web/src/routes/stripeWebhook.esm.js",
    paidAt: now,
    proofPackageStatus: "complete",
    proofStatus: "complete",
    executionStatus: "complete",
    completionStatus: "not_started",
    proofPackageLocation: canonicalProofPackagePath,
    proofComplete: true,
    executionComplete: true,
    completionComplete: false,
    scopedIssueAddressed: true,
    beforeEvidenceCaptured: true,
    afterEvidenceCaptured: true,
    scopedFix: "Validation fixture completion gate",
    inScope: ["checkout banner copy"],
    outOfScope: ["payment integration"],
    merchantApprovalNeeded: "yes",
    merchantProofPackageReady: true,
    clientPaymentStatus: "paid",
    clientClosedAt: now,
    proofPackageText: validProofPackage,
    manifest: validManifest,
    seal: validSeal
  };

  // Guard the current production truth from any rejection paths.
  const productionBeforeInvalidTests = snapshotProductionTruth(repoRoot);

  const { fulfillmentPath } = fixturePathsMap;

  // unpaid merchant is rejected
  writeFixtureState(repoRoot, fixture.fixtureRoot, {
    ...baseFulfillmentScenario,
    paymentStatus: "waiting_for_payment",
    paymentVerifiedSource: null,
    paidAt: null
  });
  const unpaidBefore = fs.readFileSync(fulfillmentPath, "utf8");
  expectFailure(
    () => writerModule.writeShopifixerCompletion({ store: validStore, date: "2026-07-10" }),
    /payment to be verified/i,
    failures,
    "unpaid_rejected"
  );
  assert(fs.readFileSync(fulfillmentPath, "utf8") === unpaidBefore, "unpaid rejection did not mutate fixture fulfillment truth", failures);

  // missing seal is rejected
  writeFixtureState(repoRoot, fixture.fixtureRoot, {
    ...baseFulfillmentScenario,
    writeSeal: false
  });
  const missingSealBefore = fs.readFileSync(fulfillmentPath, "utf8");
  expectFailure(
    () => writerModule.writeShopifixerCompletion({ store: validStore, date: "2026-07-10" }),
    /merchant proof package seal/i,
    failures,
    "missing_seal_rejected"
  );
  assert(fs.readFileSync(fulfillmentPath, "utf8") === missingSealBefore, "missing seal rejection did not mutate fixture fulfillment truth", failures);

  // invalid sha is rejected
  writeFixtureState(repoRoot, fixture.fixtureRoot, {
    ...baseFulfillmentScenario,
    seal: { ...validSeal, sha256: "deadbeef" }
  });
  expectFailure(
    () => writerModule.writeShopifixerCompletion({ store: validStore, date: "2026-07-10" }),
    /sha256 to match the seal/i,
    failures,
    "invalid_sha_rejected"
  );

  // non-canonical manifest path is rejected
  writeFixtureState(repoRoot, fixture.fixtureRoot, {
    ...baseFulfillmentScenario,
    seal: { ...validSeal, manifest_path: "../../../../var/folders/noncanonical-manifest.json" }
  });
  expectFailure(
    () => writerModule.writeShopifixerCompletion({ store: validStore, date: "2026-07-10" }),
    /canonical manifest path/i,
    failures,
    "noncanonical_manifest_rejected"
  );

  // mismatched merchant/store is rejected
  writeFixtureState(repoRoot, fixture.fixtureRoot, {
    ...baseFulfillmentScenario
  });
  expectFailure(
    () => writerModule.writeShopifixerCompletion({ store: "wrong.example.com", date: "2026-07-10" }),
    /No matching ShopiFixer fulfillment item found|Ambiguous ShopiFixer fulfillment item match/i,
    failures,
    "mismatched_store_rejected"
  );

  // incomplete prior phase is rejected
  writeFixtureState(repoRoot, fixture.fixtureRoot, {
    ...baseFulfillmentScenario,
    scopedIssueAddressed: false,
    beforeEvidenceCaptured: false
  });
  expectFailure(
    () => writerModule.writeShopifixerCompletion({ store: validStore, date: "2026-07-10" }),
    /scope to be complete/i,
    failures,
    "prior_phase_incomplete_rejected"
  );

  // valid paid + sealed path succeeds in an isolated fixture
  writeFixtureState(repoRoot, fixture.fixtureRoot, baseFulfillmentScenario);
  const successResult = writerModule.writeShopifixerCompletion({ store: validStore, date: "2026-07-10" });
  const completedTruth = readJson(successResult.outputPath);
  const completedItem = completedTruth.items[0];
  assert(completedItem.completion_status === "complete", "successful completion writes completion_status=complete", failures);
  assert(completedItem.proof_package_status === "complete", "successful completion preserves proof_package_status=complete", failures);
  assert(completedItem.completion_complete === true, "successful completion sets completion_complete=true", failures);
  assert(completedItem.proof_package_location === canonicalProofPackagePath, "successful completion preserves canonical proof package location", failures);
  assert(fs.existsSync(fixturePathsMap.merchantRegistryPath), "successful completion rebuilds merchant lifecycle registry", failures);
  assert(fs.existsSync(fixturePathsMap.merchantRegistryMdPath), "successful completion rebuilds merchant lifecycle registry markdown", failures);

  assertProductionUnchanged(repoRoot, productionBeforeInvalidTests, failures);
  assertProductionUnchanged(repoRoot, productionSnapshot, failures);

  const result = {
    schema: "staffordos.shopifixer_completion_authority_validation.v1",
    generated_at: new Date().toISOString(),
    status: failures.length ? "failed" : "passed",
    checks: {
      unpaid_rejected: true,
      missing_seal_rejected: true,
      invalid_sha_rejected: true,
      noncanonical_manifest_rejected: true,
      mismatched_store_rejected: true,
      prior_phase_incomplete_rejected: true,
      valid_paid_and_sealed_fixture_succeeds: true,
      production_truth_unchanged: failures.filter((item) => item.startsWith("production_truth_unchanged")).length === 0
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
        schema: "staffordos.shopifixer_completion_authority_validation.v1",
        generated_at: new Date().toISOString(),
        status: "failed",
        checks: {
          unpaid_rejected: false,
          missing_seal_rejected: false,
          invalid_sha_rejected: false,
          noncanonical_manifest_rejected: false,
          mismatched_store_rejected: false,
          prior_phase_incomplete_rejected: false,
          valid_paid_and_sealed_fixture_succeeds: false,
          production_truth_unchanged: false
        },
        failures
      },
      null,
      2
    )
  );
  process.exit(1);
} finally {
  process.chdir(originalCwd);
}
