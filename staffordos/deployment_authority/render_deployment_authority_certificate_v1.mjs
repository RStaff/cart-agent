// Human-readable report for a deployment authority certificate.
//
// The report is derived only from a certificate that has been re-parsed from JSON text,
// schema-validated, digest-checked, signature-verified against the gate's trusted keys,
// audience-matched against the gate's expected audience, checked for consumption expiry, and
// status-re-derived. Every value printed below is bounded
// by an anchored schema pattern, so no line can carry raw output, secrets or line breaks.

import { canonicalize, verifyCertificate } from "./deployment_authority_certificate_v1.mjs";

export function renderReport(certificateText, verificationPolicy) {
  const certificate = verifyCertificate(certificateText, verificationPolicy);
  const { candidate, gitEvidence, providerEvidence, mismatches, signature } = certificate;
  const { repository, branch, commit, roots, provider } = candidate;
  const lines = [
    `Status: ${certificate.status}`,
    `Certificate version: ${certificate.certificateVersion}`,
    `Generated at: ${certificate.generatedAtUtc}`,
    `Signed by: ${signature.algorithm} key ${signature.keyId}`,
    `Audience: ${candidate.audience}`,
    `Repository: ${repository.forgeHost}/${repository.owner}/${repository.name} (remote ${repository.remoteName})`,
    `Branch: ${branch.shortName} (${branch.fullRef}; ${branch.nameByteLength} UTF-8 bytes; hex ${branch.nameUtf8Hex})`,
    `Commit: ${commit.sha}`,
    `Tree: ${commit.treeSha}`,
    ...roots.map((root) => `Root ${root.role}: ${root.path} (${root.pathByteLength} UTF-8 bytes; hex ${root.pathUtf8Hex}) tree ${root.treeObjectSha}`),
    `Provider: ${provider.name} (account ${provider.accountId})`,
    `Database policy: ${provider.databasePolicy}`,
    ...provider.services.map((service) => `Service ${service.id}: type ${service.type}; repository ${service.repository.forgeHost}/${service.repository.owner}/${service.repository.name}; branch ${service.branch}; root ${service.rootDirectory}; region ${service.region}`),
    ...provider.databases.map((database) => `Database ${database.id}: region ${database.region}`),
    `Git evidence observed at: ${gitEvidence.observedAtUtc} (ref ${gitEvidence.ref.fullRef} -> ${gitEvidence.ref.sha})`,
    `Provider evidence observed at: ${providerEvidence.observedAtUtc}`,
    `Mismatches: ${mismatches.length}`,
    ...mismatches.map((mismatch) => `  ${mismatch.field}: expected ${mismatch.expected}, observed ${mismatch.observed}`),
    `Candidate digest: ${candidate.candidatePayloadSha256}`,
    `Certificate digest: ${certificate.certificatePayloadSha256}`,
  ];
  return lines.join("\n");
}

export function reportPayload(certificateText, verificationPolicy) {
  return canonicalize(verifyCertificate(certificateText, verificationPolicy));
}
