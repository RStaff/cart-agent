export function sanitizeCapabilityReconciliationTrace(trace = []) {
  const capabilities = [];
  const request = {};

  for (const item of Array.isArray(trace) ? trace : []) {
    if (item?.capabilityKey) {
      capabilities.push({
        capabilityKey: item.capabilityKey,
        expectedAuthorityState: item.expectedAuthorityState,
        priorAuthorityState: item.priorAuthorityState,
        existingAuthorityFound: Boolean(item.existingAuthority),
        reconciliationEntered: true,
        updateAttempted: Boolean(item.updateAttempted),
        updateRowCount: item.updateRowCount,
        insertAttempted: Boolean(item.insertAttempted),
        readbackAuthorityState: item.readbackAuthorityState,
        returnedAuthorityState: item.returnedAuthorityState,
        reconciliationSucceeded: Boolean(item.reconciliationSucceeded),
        publicAuthorityState: item.publicAuthorityState,
        capabilityNeedsReview: Boolean(item.capabilityNeedsReview),
      });
      continue;
    }

    if (Object.hasOwn(item || {}, "reviewed") || Object.hasOwn(item || {}, "total") || Object.hasOwn(item || {}, "completion")) {
      request.reviewedCount = item.reviewed;
      request.totalCount = item.total;
      request.completionResult = Boolean(item.completion);
      request.sameAuthenticatedProfileScope = true;
    }
  }

  return { capabilities, request };
}
