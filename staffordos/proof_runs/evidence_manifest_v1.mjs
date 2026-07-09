import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(
  clean(process.env.STAFFORDOS_REPO_ROOT, path.resolve(MODULE_DIR, "..", ".."))
);
const DEFAULT_MANIFEST_PATH = path.join(MODULE_DIR, "output", "evidence_manifest_v1.json");
const DEFAULT_ARTIFACT_DIR = path.join(MODULE_DIR, "output", "artifacts");
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

function resolveArtifactDir(artifactDir) {
  const envPath = clean(process.env.STAFFORDOS_EVIDENCE_ARTIFACT_DIR);
  const candidate = clean(artifactDir, envPath || DEFAULT_ARTIFACT_DIR);
  return path.isAbsolute(candidate) ? candidate : path.resolve(REPO_ROOT, candidate);
}

function resolveManifestPath(manifestPath) {
  const envPath = clean(process.env.STAFFORDOS_EVIDENCE_MANIFEST_PATH);
  const candidate = clean(manifestPath, envPath || DEFAULT_MANIFEST_PATH);
  return path.isAbsolute(candidate) ? candidate : path.resolve(REPO_ROOT, candidate);
}

function ensureDirectory(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function ensureArtifactDirectory(artifactDir) {
  fs.mkdirSync(artifactDir, { recursive: true });
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

function isUrlReference(reference) {
  return /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(reference);
}

function resolveSourcePath(reference) {
  if (!reference || isUrlReference(reference)) return null;
  return path.isAbsolute(reference) ? reference : path.resolve(REPO_ROOT, reference);
}

function sanitizeArtifactName(reference) {
  const base = path.basename(reference || "screenshot");
  const cleaned = base.replace(/[^a-zA-Z0-9._-]+/g, "_");
  return cleaned.length ? cleaned : "screenshot";
}

function inferExtension(reference) {
  const base = sanitizeArtifactName(reference);
  const ext = path.extname(base);
  return ext || ".png";
}

function createScreenshotArtifact({
  proofRunId,
  stage,
  originalReference,
  createdAt,
  artifactDir
}) {
  const normalizedReference = clean(originalReference);
  const nextCreatedAt = clean(createdAt, new Date().toISOString());
  const resolvedArtifactDir = resolveArtifactDir(artifactDir);
  ensureArtifactDirectory(resolvedArtifactDir);

  const artifactId = crypto
    .createHash("sha256")
    .update([proofRunId, stage, normalizedReference].join("|"))
    .digest("hex")
    .slice(0, 16);
  const storedFileName = `${artifactId}${inferExtension(normalizedReference)}`;
  const storedPath = path.join(resolvedArtifactDir, storedFileName);
  const storedPathRelative = path.relative(REPO_ROOT, storedPath).split(path.sep).join("/");
  const sourcePath = resolveSourcePath(normalizedReference);
  const exists = Boolean(sourcePath && fs.existsSync(sourcePath));
  const status = exists ? "stored" : "referenced_missing";

  if (exists && sourcePath) {
    fs.copyFileSync(sourcePath, storedPath);
  }

  return {
    artifact_id: artifactId,
    original_reference: normalizedReference,
    stored_path: storedPathRelative,
    exists,
    stage,
    created_at: nextCreatedAt,
    status
  };
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
  screenshot_reference,
  status = "written",
  proof_run_id,
  created_at,
  manifestPath,
  artifactDir
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
        screenshot_artifacts: screenshot_reference
          ? [
              createScreenshotArtifact({
                proofRunId: nextProofRunId,
                stage,
                originalReference: screenshot_reference,
                createdAt: nextCreatedAt,
                artifactDir
              })
            ]
          : [],
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
