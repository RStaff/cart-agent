import fs from "node:fs";
import path from "node:path";
import { appendEvidenceArtifact } from "../../../../proof_runs/evidence_manifest_v1.mjs";

type EvidenceManifestAppend = (input: {
  stage: string;
  output_path: string;
  source_writer: string;
  merchant?: Record<string, unknown>;
  references?: string[];
  status?: string;
}) => unknown;

const appendEvidenceArtifactTyped = appendEvidenceArtifact as unknown as EvidenceManifestAppend;

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
  appendEvidenceArtifactTyped({
    stage: "before_evidence",
    output_path: outputPath,
    source_writer: "writeShopifixerBeforeEvidence",
    merchant: {
      store: input.store
    },
    references: [input.affected_page_or_artifact, input.screenshot, input.notes],
    status: "written"
  });

  return {
    outputPath,
    stdout: "",
    stderr: ""
  };
}
