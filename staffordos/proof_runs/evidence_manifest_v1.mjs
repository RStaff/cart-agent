import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(MODULE_DIR, "..", "..");
const DEFAULT_MANIFEST_PATH = path.join(MODULE_DIR, "output", "evidence_manifest_v1.json");
const DEFAULT_PROOF_RUN_ID = "internal_shopifixer_dry_run_v1";

function clean(value, fallback = "") {
  const text = String(value ?? fallback).trim();
  return text.length ? text : fallback;
}

function toRepoRelativePath(filePath) {
  const normalized = clean(filePath);
  if (!normalized) return "";

  const absolute = path.isAbsolute(normalized)
    ? normalized
    : path.resolve(REPO_ROOT, normalized);

  return path.relative(REPO_ROOT, absolute).split(path.sep).join("/");
}

function normalizeReferences(references) {
  return Array.from(
    new Set(
      (Array.isArray(references) ? references : [])
        .map((reference) => clean(reference))
        .filter(Boolean)
    )
  );
}

function resolveManifestPath(manifestPath) {
  const envPath = clean(process.env.STAFFORDOS_EVIDENCE_MANIFEST_PATH);
  const candidate = clean(manifestPath, envPath || DEFAULT_MANIFEST_PATH);
  return path.isAbsolute(candidate) ? candidate : path.resolve(REPO_ROOT, candidate);
}

function ensureDirectory(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function readManifest(manifestPath) {
  const resolvedManifestPath = resolveManifestPath(manifestPath);

  if (!fs.existsSync(resolvedManifestPath)) {
    return {
      schema: "staffordos.evidence_manifest.v1",
      generated_at: "",
      manifest_version: 1,
      proof_run_id: DEFAULT_PROOF_RUN_ID,
      merchant: {
        store: "unavailable"
      },
      artifacts: []
    };
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(resolvedManifestPath, "utf8"));
    return {
      schema: clean(parsed.schema, "staffordos.evidence_manifest.v1"),
      generated_at: clean(parsed.generated_at, ""),
      manifest_version: Number.isFinite(Number(parsed.manifest_version)) ? Number(parsed.manifest_version) : 1,
      proof_run_id: clean(parsed.proof_run_id, DEFAULT_PROOF_RUN_ID),
      merchant: parsed.merchant && typeof parsed.merchant === "object" ? parsed.merchant : { store: "unavailable" },
      artifacts: Array.isArray(parsed.artifacts) ? parsed.artifacts : []
    };
  } catch {
    return {
      schema: "staffordos.evidence_manifest.v1",
      generated_at: "",
      manifest_version: 1,
      proof_run_id: DEFAULT_PROOF_RUN_ID,
      merchant: {
        store: "unavailable"
      },
      artifacts: []
    };
  }
}

function artifactOrdinal(artifacts, stage, outputPath, sourceWriter) {
  return (
    artifacts.filter((artifact) =>
      clean(artifact.stage) === stage &&
      clean(artifact.output_path) === outputPath &&
      clean(artifact.source_writer) === sourceWriter
    ).length + 1
  );
}

function createArtifactId({ proofRunId, stage, outputPath, sourceWriter, ordinal }) {
  const hash = crypto
    .createHash("sha256")
    .update([proofRunId, stage, outputPath, sourceWriter, String(ordinal)].join("|"))
    .digest("hex")
    .slice(0, 16);

  return `ev_${hash}`;
}

export function getEvidenceManifestPath(manifestPath) {
  return resolveManifestPath(manifestPath);
}

export function readEvidenceManifest(manifestPath) {
  return readManifest(manifestPath);
}

export function appendEvidenceArtifact({
  stage,
  output_path,
  source_writer,
  merchant,
  references = [],
  status = "written",
  proof_run_id,
  created_at,
  manifestPath
}) {
  const resolvedManifestPath = resolveManifestPath(manifestPath);
  ensureDirectory(resolvedManifestPath);

  const manifest = readManifest(resolvedManifestPath);
  const nextCreatedAt = clean(created_at, new Date().toISOString());
  const nextProofRunId = clean(proof_run_id, manifest.proof_run_id || DEFAULT_PROOF_RUN_ID);
  const normalizedOutputPath = toRepoRelativePath(output_path);
  const normalizedMerchant = merchant && typeof merchant === "object" ? merchant : manifest.merchant || { store: "unavailable" };
  const nextOrdinal = artifactOrdinal(manifest.artifacts, stage, normalizedOutputPath, source_writer);
  const artifact_id = createArtifactId({
    proofRunId: nextProofRunId,
    stage,
    outputPath: normalizedOutputPath,
    sourceWriter: source_writer,
    ordinal: nextOrdinal
  });

  const updatedManifest = {
    schema: "staffordos.evidence_manifest.v1",
    generated_at: nextCreatedAt,
    manifest_version: 1,
    proof_run_id: nextProofRunId,
    merchant: normalizedMerchant,
    artifacts: [
      ...manifest.artifacts,
      {
        artifact_id,
        stage,
        created_at: nextCreatedAt,
        output_path: normalizedOutputPath,
        source_writer,
        references: normalizeReferences(references),
        status: clean(status, "written")
      }
    ]
  };

  fs.writeFileSync(resolvedManifestPath, `${JSON.stringify(updatedManifest, null, 2)}\n`, "utf8");

  return {
    manifestPath: resolvedManifestPath,
    artifact: updatedManifest.artifacts[updatedManifest.artifacts.length - 1],
    manifest: updatedManifest
  };
}
