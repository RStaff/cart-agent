export function capabilityNeedsReview(item) {
  return !item?.decision?.answer || item.authorityState === "NEEDS_MORE_EVIDENCE";
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
    if (!items[index]?.decision?.answer) return index;
  }
  return -1;
}
