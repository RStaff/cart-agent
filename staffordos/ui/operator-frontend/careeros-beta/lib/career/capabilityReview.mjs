export function capabilityNeedsReview(item) {
  return !item?.decision?.answer || item.authorityState === "NEEDS_MORE_EVIDENCE";
}

export function capabilityReviewStatus(item) {
  if (!item?.decision?.answer) return "UNREVIEWED";
  return item.authorityState === "NEEDS_MORE_EVIDENCE" ? "NEEDS_REVIEW" : "REVIEWED_CURRENT";
}

export function capabilityReviewStatusLabel(item) {
  return { NEEDS_REVIEW: "Needs review", REVIEWED_CURRENT: "Reviewed/current", UNREVIEWED: "Unreviewed" }[capabilityReviewStatus(item)];
}

export function capabilityAnswerLabel(answer) {
  return { DIRECT: "Yes, directly", TRANSFERABLE: "Related experience", PARTIAL: "Part of this", NOT_SUPPORTED: "No, this does not describe my experience", KEEP_UNRESOLVED: "I need more context" }[answer] || answer;
}

export function unreviewedCapabilityCount(items = []) {
  return items.filter(capabilityNeedsReview).length;
}

export function capabilityReviewComplete(items = []) {
  return items.length > 0 && unreviewedCapabilityCount(items) === 0;
}

export function nextUnreviewedCapabilityIndex(items = [], currentIndex = 0) {
  if (!items.length) return -1;
  for (let offset = 1; offset <= items.length; offset += 1) {
    const index = (currentIndex + offset) % items.length;
    if (capabilityNeedsReview(items[index])) return index;
  }
  return -1;
}
