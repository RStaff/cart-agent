import fs from "node:fs";
import path from "node:path";

export type ShopifixerBeforeEvidenceInput = {
  store: string;
  date: string;
  affected_page_or_artifact: string;
  issue: string;
  why_it_matters: string;
  screenshot: string;
  notes: string;
};

export function writeShopifixerBeforeEvidence(input: ShopifixerBeforeEvidenceInput) {
  const outputPath = path.resolve(
    process.cwd(),
    "../../proof_runs/internal_shopifixer_dry_run_v1/before_evidence.md"
  );

  const content = [
    "# BEFORE EVIDENCE",
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
    "Issue:",
    input.issue,
    "",
    "Why It Matters:",
    input.why_it_matters,
    "",
    "Screenshot:",
    input.screenshot,
    "",
    "Notes:",
    input.notes,
    ""
  ].join("\n");

  fs.writeFileSync(outputPath, content, "utf8");

  return {
    outputPath,
    stdout: "",
    stderr: ""
  };
}
