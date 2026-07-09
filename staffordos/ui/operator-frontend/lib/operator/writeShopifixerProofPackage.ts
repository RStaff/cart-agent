import fs from "node:fs";
import crypto from "node:crypto";
import path from "node:path";
import { getEvidenceManifestPath, readEvidenceManifest } from "../../../../proof_runs/evidence_manifest_v1.mjs";

function readText(filePath: string) {
  return fs.readFileSync(filePath, "utf8");
}

function extractSection(text: string, label: string) {
  const pattern = new RegExp(
    `^${label}:\\s*$([\\s\\S]*?)(?=^\\w[\\w -]+:\\s*$|\\Z)`,
    "m"
  );
  const match = text.match(pattern);
  return match ? match[1].trim() : "";
}

function clean(value: unknown, fallback = "") {
  const text = String(value ?? fallback).trim();
  return text.length ? text : fallback;
}

function toRepoRelative(filePath: string) {
  const repoRoot = path.resolve(process.cwd(), "../../../");
  return path.relative(repoRoot, filePath).split(path.sep).join("/");
}

type ScreenshotArtifact = {
  artifact_id?: string;
  original_reference?: string;
  stored_path?: string;
  exists?: boolean;
  status?: string;
};

type ManifestArtifact = {
  artifact_id?: string;
  stage?: string;
  created_at?: string;
  output_path?: string;
  source_writer?: string;
  screenshot_artifacts?: ScreenshotArtifact[];
  references?: string[];
  status?: string;
};

function formatList(items: string[], fallback = "unavailable") {
  return items.length ? items.map((item) => `- ${item}`) : [`- ${fallback}`];
}

function formatArtifactSummary(artifact: ManifestArtifact) {
  const lines = [
    `- artifact_id: ${clean(artifact.artifact_id, "unavailable")}`,
    `  stage: ${clean(artifact.stage, "unavailable")}`,
    `  created_at: ${clean(artifact.created_at, "unavailable")}`,
    `  output_path: ${clean(artifact.output_path, "unavailable")}`,
    `  source_writer: ${clean(artifact.source_writer, "unavailable")}`
  ];

  const screenshotArtifacts = Array.isArray(artifact.screenshot_artifacts) ? artifact.screenshot_artifacts : [];
  if (!screenshotArtifacts.length) {
    lines.push("  screenshot_artifacts: []");
  } else {
    lines.push("  screenshot_artifacts:");
      for (const screenshotArtifact of screenshotArtifacts) {
        lines.push(`    - artifact_id: ${clean(screenshotArtifact.artifact_id, "unavailable")}`);
        lines.push(`      original_reference: ${clean(screenshotArtifact.original_reference, "unavailable")}`);
        lines.push(`      stored_path: ${clean(screenshotArtifact.stored_path, "unavailable")}`);
      lines.push(`      exists: ${String(Boolean(screenshotArtifact.exists))}`);
      lines.push(`      status: ${clean(screenshotArtifact.status, "unavailable")}`);
    }
  }

  return lines;
}

function sha256(content: string) {
  return crypto.createHash("sha256").update(content, "utf8").digest("hex");
}

export function writeShopifixerProofPackage() {
  const baseDir = path.resolve(process.cwd(), "../../proof_runs/internal_shopifixer_dry_run_v1");
  const beforePath = path.join(baseDir, "before_evidence.md");
  const fixScopePath = path.join(baseDir, "fix_scope.md");
  const afterPath = path.join(baseDir, "after_evidence.md");
  const outputPath = path.join(baseDir, "merchant_proof_package.md");
  const sealPath = path.join(baseDir, "merchant_proof_package.seal.json");
  const manifestPath = getEvidenceManifestPath();
  const manifest = readEvidenceManifest(manifestPath);
  const manifestPathDisplay = toRepoRelative(manifestPath);
  const manifestArtifacts = Array.isArray(manifest.artifacts) ? (manifest.artifacts as ManifestArtifact[]) : [];

  const before = readText(beforePath);
  const fixScope = readText(fixScopePath);
  const after = readText(afterPath);

  const store = clean(extractSection(before, "Store"), extractSection(fixScope, "Store"));
  const beforeIssue = clean(extractSection(before, "Issue"), "unavailable");
  const whyItMattered = clean(extractSection(before, "Why It Matters"), "unavailable");
  const scopedFix = clean(extractSection(fixScope, "Scoped Fix"), "unavailable");
  const whatWasChanged = [
    scopedFix,
    clean(extractSection(after, "What Changed"), "")
  ].filter(Boolean).join(" ");
  const beforeEvidence = clean(before.replace(/^# BEFORE EVIDENCE\s*/m, "").trim(), "unavailable");
  const afterEvidence = clean(after.replace(/^# AFTER EVIDENCE\s*/m, "").trim(), "unavailable");
  const proofSummary = clean(extractSection(after, "Observed Improvement"), "unavailable");
  const nextWatchItem = clean(
    extractSection(after, "Remaining Limitations"),
    "Complete a real merchant proof run with before screenshot, scoped fix, after screenshot, and merchant-facing summary."
  );
  const generatedAt = new Date().toISOString();
  const proofRunId = clean(manifest.proof_run_id, "internal_shopifixer_dry_run_v1");
  const merchantStore = clean(manifest.merchant?.store, store);
  const beforeArtifacts = manifestArtifacts.filter((artifact) => clean(artifact.stage) === "before_evidence");
  const afterArtifacts = manifestArtifacts.filter((artifact) => clean(artifact.stage) === "after_evidence");
  const screenshotArtifacts = manifestArtifacts.flatMap((artifact) =>
    Array.isArray(artifact.screenshot_artifacts)
      ? artifact.screenshot_artifacts.map((screenshotArtifact: ScreenshotArtifact) => ({
          ...screenshotArtifact,
          stage: clean(artifact.stage)
        }))
      : []
  );
  const missingScreenshotArtifacts = screenshotArtifacts.filter((artifact) => !Boolean(artifact.exists));
  const evidenceSourcePaths = [
    toRepoRelative(beforePath),
    toRepoRelative(fixScopePath),
    toRepoRelative(afterPath),
    ...screenshotArtifacts.map((artifact) => clean(artifact.stored_path, "unavailable")).filter(Boolean)
  ];
  const completionStatus = "proof_package_composed_from_existing_evidence";
  const manifestGeneratedAt = clean(manifest.generated_at, "unavailable");

  const content = [
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
    manifestPathDisplay,
    "",
    "Manifest Generated At:",
    manifestGeneratedAt,
    "",
    "Merchant / Store:",
    merchantStore,
    "",
    "Before Evidence Artifact IDs:",
    ...formatList(beforeArtifacts.map((artifact) => clean(artifact.artifact_id, "unavailable")).filter(Boolean)),
    "",
    "After Evidence Artifact IDs:",
    ...formatList(afterArtifacts.map((artifact) => clean(artifact.artifact_id, "unavailable")).filter(Boolean)),
    "",
    "Screenshot Artifact References:",
    ...(screenshotArtifacts.length
      ? screenshotArtifacts.flatMap((artifact) => [
          `- artifact_id: ${clean(artifact.artifact_id, "unavailable")}`,
          `  stage: ${clean(artifact.stage, "unavailable")}`,
          `  original_reference: ${clean(artifact.original_reference, "unavailable")}`,
          `  stored_path: ${clean(artifact.stored_path, "unavailable")}`,
          `  exists: ${String(Boolean(artifact.exists))}`,
          `  status: ${clean(artifact.status, "unavailable")}`
        ])
      : ["- unavailable"]),
    "",
    "Missing Screenshot Artifacts:",
    ...formatList(
      missingScreenshotArtifacts.map((artifact) => `${clean(artifact.artifact_id, "unavailable")} referenced_missing: ${clean(artifact.original_reference, "unavailable")}`),
      "none"
    ),
    "",
    "Evidence Source Paths:",
    ...formatList(Array.from(new Set(evidenceSourcePaths)).filter(Boolean)),
    "",
    "Store:",
    store,
    "",
    "Problem Found:",
    beforeIssue,
    "",
    "Why It Mattered:",
    whyItMattered,
    "",
    "What Was Changed:",
    whatWasChanged || "unavailable",
    "",
    "Before Evidence:",
    beforeEvidence,
    "",
    "After Evidence:",
    afterEvidence,
    "",
    "Proof Summary:",
    proofSummary,
    "",
    "Recommended Next Watch Item:",
    nextWatchItem,
    "",
    "Completion Status:",
    completionStatus,
    "",
    "Manifest Artifact Details:",
    ...manifestArtifacts.flatMap((artifact) => [
      ...formatArtifactSummary(artifact),
      ""
    ]),
    ""
  ].join("\n");

  fs.writeFileSync(outputPath, content, "utf8");
  const proofPackageSha256 = sha256(fs.readFileSync(outputPath, "utf8"));
  const seal = {
    schema: "staffordos.merchant_proof_package_seal.v1",
    generated_at: generatedAt,
    proof_run_id: proofRunId,
    proof_package_path: toRepoRelative(outputPath),
    sha256: proofPackageSha256,
    manifest_path: manifestPathDisplay,
    manifest_artifact_count: manifestArtifacts.length,
    evidence_source_paths: Array.from(new Set(evidenceSourcePaths)),
    status: "sealed"
  };
  fs.writeFileSync(sealPath, `${JSON.stringify(seal, null, 2)}\n`, "utf8");

  return {
    outputPath,
    stdout: "",
    stderr: ""
  };
}
