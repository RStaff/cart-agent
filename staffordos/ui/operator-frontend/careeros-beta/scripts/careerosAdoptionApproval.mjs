import { createPublicKey, verify as verifySignature } from "node:crypto";
import { readFile } from "node:fs/promises";

export const APPROVAL_KIND = "CAREEROS_SCHEMA_ADOPTION_APPROVAL_V1";

const canonicalize = (value) => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
  return value;
};
const canonical = (value) => JSON.stringify(canonicalize({ kind: value.kind, target: value.target, reviewedBy: value.reviewedBy }));

export async function verifyAdoptionApproval({ approvalPath, trustedKeysJson, target, fingerprintVersion, sourceRevision, sourceFiles, referenceFingerprint, schemaFingerprint, migrationChecksums }) {
  if (!approvalPath) throw new Error("CAREEROS_ADOPTION_APPROVAL_REQUIRED");
  if (!trustedKeysJson) throw new Error("CAREEROS_ADOPTION_TRUSTED_KEYS_REQUIRED");
  let approval;
  try { approval = JSON.parse(await readFile(approvalPath, "utf8")); } catch { throw new Error("CAREEROS_ADOPTION_APPROVAL_INVALID"); }
  if (approval?.kind !== APPROVAL_KIND || !approval?.target || !approval?.reviewedBy || !approval?.signature) throw new Error("CAREEROS_ADOPTION_APPROVAL_INVALID");
  const expectedTarget = { databaseIdentity: target, fingerprintVersion, sourceRevision, sourceFiles, referenceFingerprint, schemaFingerprint, migrationChecksums };
  if (canonicalize(approval.target) === undefined || JSON.stringify(canonicalize(approval.target)) !== JSON.stringify(canonicalize(expectedTarget))) throw new Error("CAREEROS_ADOPTION_APPROVAL_TARGET_MISMATCH");
  if (approval.signature.algorithm !== "Ed25519" || !approval.signature.keyId || !approval.signature.value) throw new Error("CAREEROS_ADOPTION_APPROVAL_SIGNATURE_INVALID");
  let trusted;
  try { trusted = JSON.parse(trustedKeysJson); } catch { throw new Error("CAREEROS_ADOPTION_TRUSTED_KEYS_INVALID"); }
  const encodedKey = trusted[approval.signature.keyId];
  if (!encodedKey) throw new Error("CAREEROS_ADOPTION_APPROVAL_KEY_UNTRUSTED");
  let publicKey;
  try { publicKey = createPublicKey({ key: Buffer.from(encodedKey, "base64"), format: "der", type: "spki" }); } catch { throw new Error("CAREEROS_ADOPTION_APPROVAL_KEY_INVALID"); }
  let signature;
  try { signature = Buffer.from(approval.signature.value, "base64url"); } catch { throw new Error("CAREEROS_ADOPTION_APPROVAL_SIGNATURE_INVALID"); }
  if (signature.length !== 64 || !verifySignature(null, Buffer.from(canonical(approval), "utf8"), publicKey, signature)) throw new Error("CAREEROS_ADOPTION_APPROVAL_SIGNATURE_INVALID");
  return Object.freeze({ reviewedBy: approval.reviewedBy, keyId: approval.signature.keyId });
}

export function approvalPayload({ target, fingerprintVersion, sourceRevision, sourceFiles, referenceFingerprint, schemaFingerprint, migrationChecksums, reviewedBy }) {
  return canonical({ kind: APPROVAL_KIND, target: { databaseIdentity: target, fingerprintVersion, sourceRevision, sourceFiles, referenceFingerprint, schemaFingerprint, migrationChecksums }, reviewedBy });
}
