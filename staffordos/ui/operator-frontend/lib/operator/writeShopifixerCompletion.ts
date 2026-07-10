import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";

type ShopifixerCompletionInput = {
  store: string;
  date: string;
};

function readJson(filePath: string) {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as {
    items?: Array<Record<string, unknown>>;
  };
}

function readJsonOrNull(filePath: string) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as Record<string, any>;
  } catch {
    return null;
  }
}

function sha256(content: string) {
  return crypto.createHash("sha256").update(content, "utf8").digest("hex");
}

function repoRelative(absPath: string) {
  const repoRoot = path.resolve(process.cwd(), "../../..");
  return path.relative(repoRoot, absPath).split(path.sep).join("/");
}

function canonicalRepoPath(value: unknown) {
  const text = String(value || "").trim();
  if (!text) return "";
  if (path.isAbsolute(text)) {
    return repoRelative(text);
  }
  return text.split(path.sep).join("/");
}

function lowerText(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function canonicaliseStore(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function rebuildMerchantLifecycleRegistry() {
  const buildScriptPath = path.resolve(
    process.cwd(),
    "../../merchant_registry/build_merchant_lifecycle_registry_v1.mjs"
  );

  const result = spawnSync(process.execPath, [buildScriptPath], {
    cwd: process.cwd(),
    encoding: "utf8"
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(
      `Merchant lifecycle registry rebuild failed: ${result.stderr || result.stdout || "unknown error"}`
    );
  }

  return {
    stdout: result.stdout || "",
    stderr: result.stderr || ""
  };
}

function ensure(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

export function writeShopifixerCompletion(input: ShopifixerCompletionInput) {
  const canonicalProofRunId = "internal_shopifixer_dry_run_v1";
  const canonicalProofPackagePath = "staffordos/proof_runs/internal_shopifixer_dry_run_v1/merchant_proof_package.md";
  const canonicalSealPath = "staffordos/proof_runs/internal_shopifixer_dry_run_v1/merchant_proof_package.seal.json";
  const canonicalManifestPath = "staffordos/proof_runs/output/evidence_manifest_v1.json";
  const canonicalStripeWebhookPath = "web/src/routes/stripeWebhook.esm.js";

  const proofPackagePath = path.resolve(
    process.cwd(),
    "../../proof_runs/internal_shopifixer_dry_run_v1/merchant_proof_package.md"
  );
  const sealPath = path.resolve(
    process.cwd(),
    "../../proof_runs/internal_shopifixer_dry_run_v1/merchant_proof_package.seal.json"
  );
  const manifestPath = path.resolve(
    process.cwd(),
    "../../proof_runs/output/evidence_manifest_v1.json"
  );
  const fulfillmentTruthPath = path.resolve(
    process.cwd(),
    "../../fulfillment/shopifixer_fulfillment_truth_v1.json"
  );

  const proofPackageContents = fs.readFileSync(proofPackagePath, "utf8").trim();
  if (!proofPackageContents) {
    throw new Error("ShopiFixer completion requires a populated merchant proof package.");
  }

  if (!String(input.date || "").trim()) {
    throw new Error("ShopiFixer completion requires a completion date.");
  }

  ensure(canonicalRepoPath(proofPackagePath) === canonicalProofPackagePath, "ShopiFixer completion requires the canonical proof package path.");
  ensure(canonicalRepoPath(sealPath) === canonicalSealPath, "ShopiFixer completion requires the canonical proof package seal path.");
  ensure(canonicalRepoPath(manifestPath) === canonicalManifestPath, "ShopiFixer completion requires the canonical evidence manifest path.");

  const fulfillmentTruth = readJson(fulfillmentTruthPath);
  const items = Array.isArray(fulfillmentTruth.items) ? fulfillmentTruth.items : [];
  const normalizedStore = String(input.store || "").trim().toLowerCase();
  const matchedItems = items.filter((item) => {
    const itemStore = canonicaliseStore(item.store_domain || item.client_id || "");
    return Boolean(normalizedStore && itemStore && normalizedStore === itemStore);
  });

  if (matchedItems.length !== 1) {
    throw new Error(matchedItems.length === 0
      ? "No matching ShopiFixer fulfillment item found for the submitted store."
      : "Ambiguous ShopiFixer fulfillment item match for the submitted store.");
  }

  const activeItem = matchedItems[0];
  const paymentStatus = lowerText(activeItem.payment_status);
  const paymentVerifiedSource = String(activeItem.payment_verified_source || "").trim();
  const paidAt = String(activeItem.paid_at || "").trim();
  ensure(["payment_received", "paid"].includes(paymentStatus), "ShopiFixer completion requires payment to be verified before completion.");
  ensure(Boolean(paymentVerifiedSource), "ShopiFixer completion requires a verified payment source.");
  ensure(paymentVerifiedSource.includes(canonicalStripeWebhookPath), "ShopiFixer completion requires payment verification traceable to the canonical Stripe webhook path.");
  ensure(Boolean(paidAt), "ShopiFixer completion requires a verified paid_at timestamp.");

  const proofSeal = readJsonOrNull(sealPath);
  ensure(Boolean(proofSeal), "ShopiFixer completion requires a merchant proof package seal.");
  ensure(lowerText(proofSeal?.status) === "sealed", "ShopiFixer completion requires the proof seal to be sealed.");
  ensure(canonicalRepoPath(proofSeal?.proof_package_path || "") === canonicalProofPackagePath, "ShopiFixer completion requires the canonical proof package path in the seal.");
  ensure(canonicalRepoPath(proofSeal?.manifest_path || "") === canonicalManifestPath, "ShopiFixer completion requires the canonical manifest path in the seal.");
  ensure(String(proofSeal?.proof_run_id || "").trim() === canonicalProofRunId, "ShopiFixer completion requires the canonical proof run id in the seal.");
  ensure(Boolean(String(proofSeal?.sha256 || "").trim()), "ShopiFixer completion requires the seal sha256.");
  ensure(sha256(proofPackageContents) === String(proofSeal?.sha256 || "").trim(), "ShopiFixer completion requires the proof package sha256 to match the seal.");

  const evidenceManifest = readJsonOrNull(manifestPath);
  ensure(Boolean(evidenceManifest), "ShopiFixer completion requires the canonical evidence manifest.");
  const manifestArtifacts = Array.isArray(evidenceManifest?.artifacts) ? evidenceManifest.artifacts : [];
  const sealArtifactCount = Number(proofSeal?.manifest_artifact_count);
  ensure(Number.isFinite(sealArtifactCount), "ShopiFixer completion requires a manifest artifact count in the seal.");
  ensure(manifestArtifacts.length === sealArtifactCount, "ShopiFixer completion requires the seal artifact count to match the manifest.");

  const proofPackageMerchantMatch = proofPackageContents.match(/^Merchant \/ Store:\s*(.+)$/m) || proofPackageContents.match(/^Store:\s*(.+)$/m);
  if (proofPackageMerchantMatch?.[1]) {
    ensure(canonicaliseStore(proofPackageMerchantMatch[1]) === normalizedStore, "ShopiFixer completion requires the proof package merchant/store to match the submitted store.");
  }
  const proofPackageLocation = String(activeItem.proof_package_location || "").trim();
  ensure(!proofPackageLocation || proofPackageLocation === canonicalProofPackagePath, "ShopiFixer completion requires the fulfillment proof package location to be canonical.");
  const manifestMerchantStore = canonicaliseStore(evidenceManifest?.merchant?.store || "");
  if (manifestMerchantStore && manifestMerchantStore !== "unavailable") {
    ensure(manifestMerchantStore === normalizedStore, "ShopiFixer completion requires the manifest merchant/store to match the submitted store.");
  }

  const scopeComplete = Boolean(activeItem.scoped_issue_addressed) && Array.isArray(activeItem.in_scope) && activeItem.in_scope.length > 0 && Array.isArray(activeItem.out_of_scope) && activeItem.out_of_scope.length > 0;
  const beforeEvidenceCaptured = Boolean(activeItem.before_evidence_captured);
  const executionComplete = Boolean(activeItem.execution_complete) || lowerText(activeItem.execution_status) === "complete";
  const afterEvidenceCaptured = Boolean(activeItem.after_evidence_captured);
  const proofSealed = lowerText(activeItem.proof_package_status) === "complete" && lowerText(activeItem.proof_status) === "complete" && Boolean(activeItem.proof_complete) && Boolean(activeItem.merchant_proof_package_ready);
  ensure(scopeComplete, "ShopiFixer completion requires scope to be complete.");
  ensure(beforeEvidenceCaptured, "ShopiFixer completion requires before evidence to be captured.");
  ensure(executionComplete, "ShopiFixer completion requires execution to be complete.");
  ensure(afterEvidenceCaptured, "ShopiFixer completion requires after evidence to be captured.");
  ensure(proofSealed, "ShopiFixer completion requires the proof package to be sealed and complete.");

  const completedAt = new Date().toISOString();
  const updatedItem = {
    ...activeItem,
    proof_package_status: "complete",
    proof_status: "complete",
    execution_status: "complete",
    completion_status: "complete",
    proof_complete: true,
    execution_complete: true,
    completion_complete: true,
    completed_at: completedAt,
    proof_package_location: "staffordos/proof_runs/internal_shopifixer_dry_run_v1/merchant_proof_package.md"
  };

  const updatedItems = items.slice();
  const matchedItemIndex = items.findIndex((item) => item === activeItem);
  updatedItems[matchedItemIndex] = updatedItem;

  const updatedTruth = {
    ...fulfillmentTruth,
    items: updatedItems
  };

  fs.writeFileSync(fulfillmentTruthPath, `${JSON.stringify(updatedTruth, null, 2)}\n`, "utf8");
  const rebuildResult = rebuildMerchantLifecycleRegistry();

  return {
    outputPath: fulfillmentTruthPath,
    proofPackagePath,
    completedAt,
    stdout: rebuildResult.stdout,
    stderr: rebuildResult.stderr
  };
}
