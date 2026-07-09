import fs from "node:fs";
import path from "node:path";
import { appendEvidenceArtifact } from "../../../../proof_runs/evidence_manifest_v1.mjs";

type EvidenceManifestAppend = (input: {
  stage: string;
  output_path: string;
  source_writer: string;
  merchant?: Record<string, unknown>;
  references?: string[];
  screenshot_reference?: string;
  status?: string;
}) => unknown;

const appendEvidenceArtifactTyped = appendEvidenceArtifact as unknown as EvidenceManifestAppend;

export type ShopifixerAfterEvidenceInput = {
  store: string;
  date: string;
  affected_page_or_artifact: string;
  after_screenshot: string;
  after_notes: string;
  remaining_limitations: string;
  observed_improvement: string;
  merchant_facing_summary: string;
};

export function writeShopifixerAfterEvidence(input: ShopifixerAfterEvidenceInput) {
  const outputPath = path.resolve(
    process.cwd(),
    "../../proof_runs/internal_shopifixer_dry_run_v1/after_evidence.md"
  );

  const content = [
    "# AFTER EVIDENCE",
    "",
    "Store:",
    input.store,
    "",
    "Date:",
    input.date,
    "",
    "Affected Page / Artifact:",
    input.affected_page_or_artifact,
    "",
    "Screenshot:",
    input.after_screenshot,
    "",
    "After Notes:",
    input.after_notes,
    "",
    "Observed Improvement:",
    input.observed_improvement,
    "",
    "Remaining Limitations:",
    input.remaining_limitations,
    "",
    "Merchant-Facing Summary:",
    input.merchant_facing_summary,
    ""
  ].join("\n");

  fs.writeFileSync(outputPath, content, "utf8");
  appendEvidenceArtifactTyped({
    stage: "after_evidence",
    output_path: outputPath,
    source_writer: "writeShopifixerAfterEvidence",
    merchant: {
      store: input.store
    },
    references: [
      input.affected_page_or_artifact,
      input.after_notes,
      input.remaining_limitations,
      input.observed_improvement,
      input.merchant_facing_summary
    ],
    screenshot_reference: input.after_screenshot,
    status: "written"
  });

  return {
    outputPath,
    stdout: "",
    stderr: ""
  };
}
