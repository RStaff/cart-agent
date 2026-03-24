function hasNonEmptyArray(value) {
  return Array.isArray(value) && value.some((item) => String(item || "").trim());
}

export function validateExecution(packet = {}, submission = {}) {
  const qcRequirements = Array.isArray(packet?.qcRequirements) ? packet.qcRequirements : [];
  const proof = submission?.proof || {};

  const hasScreenshots = hasNonEmptyArray(proof.screenshots);
  const hasLiveLinks = hasNonEmptyArray(proof.liveLinks);
  const hasTests = hasNonEmptyArray(proof.testVerifications);

  const needsScreenshot = qcRequirements.some((item) => String(item).toLowerCase().includes("screenshot"));
  const needsLiveLink = qcRequirements.some((item) => String(item).toLowerCase().includes("live link"));
  const needsTest = qcRequirements.some((item) => String(item).toLowerCase().includes("test"));

  const fullyMet = (!needsScreenshot || hasScreenshots)
    && (!needsLiveLink || hasLiveLinks)
    && (!needsTest || hasTests);

  if (fullyMet && submission?.approvedByHuman === true) {
    return "APPROVED";
  }

  if (!hasScreenshots && !hasLiveLinks && !hasTests) {
    return "REJECTED";
  }

  return "REVISION_REQUIRED";
}
