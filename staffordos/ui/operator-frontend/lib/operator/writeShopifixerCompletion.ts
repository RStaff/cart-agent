import fs from "node:fs";
import path from "node:path";
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

export function writeShopifixerCompletion(input: ShopifixerCompletionInput) {
  const proofPackagePath = path.resolve(
    process.cwd(),
    "../../proof_runs/internal_shopifixer_dry_run_v1/merchant_proof_package.md"
  );
  const fulfillmentTruthPath = path.resolve(
    process.cwd(),
    "../../fulfillment/shopifixer_fulfillment_truth_v1.json"
  );

  const proofPackage = fs.readFileSync(proofPackagePath, "utf8").trim();
  if (!proofPackage) {
    throw new Error("ShopiFixer completion requires a populated merchant proof package.");
  }

  if (!String(input.date || "").trim()) {
    throw new Error("ShopiFixer completion requires a completion date.");
  }

  const fulfillmentTruth = readJson(fulfillmentTruthPath);
  const items = Array.isArray(fulfillmentTruth.items) ? fulfillmentTruth.items : [];
  const normalizedStore = String(input.store || "").trim().toLowerCase();
  const matchedItemIndex = items.findIndex((item) => {
    const itemStore = String(item.store_domain || item.client_id || "").trim().toLowerCase();
    return Boolean(normalizedStore && itemStore && normalizedStore === itemStore);
  });

  if (matchedItemIndex < 0) {
    throw new Error("No matching ShopiFixer fulfillment item found for the submitted store.");
  }

  const activeItem = items[matchedItemIndex];
  const paymentStatus = String(activeItem.payment_status || "").trim().toLowerCase();
  if (!["payment_received", "paid"].includes(paymentStatus)) {
    throw new Error("ShopiFixer completion requires payment to be verified before completion.");
  }

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
