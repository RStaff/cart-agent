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

/** @param {unknown} trace */
export function sanitizeCapabilityDerivationTrace(trace = null) {
  if (!trace || typeof trace !== "object") return {};
  return {
    candidateKeys: Array.isArray(trace.candidateKeys) ? trace.candidateKeys : [],
    refreshInvokedKeys: Array.isArray(trace.refreshInvokedKeys) ? trace.refreshInvokedKeys : [],
    reconciliationEnteredKeys: Array.isArray(trace.reconciliationEnteredKeys) ? trace.reconciliationEnteredKeys : [],
    reconciliationReturnedKeys: Array.isArray(trace.reconciliationReturnedKeys) ? trace.reconciliationReturnedKeys : [],
  };
}

/** @param {unknown} trace */
export function sanitizeCapabilityExecutionTrace(trace = null) {
  if (!trace || typeof trace !== "object") return {};
  return {
    getCapabilityProfileEntered: Boolean(trace.getCapabilityProfileEntered),
    getCapabilitiesEntered: Boolean(trace.getCapabilitiesEntered),
    deriveCapabilitiesEntered: Boolean(trace.deriveCapabilitiesEntered),
    factQueryExecuted: Boolean(trace.factQueryExecuted),
    factCountInsideDeriveCapabilities: Number(trace.factCountInsideDeriveCapabilities || 0),
    deriveCapabilityCandidatesCalled: Boolean(trace.deriveCapabilityCandidatesCalled),
    candidateCountInsideDeriveCapabilities: Number(trace.candidateCountInsideDeriveCapabilities || 0),
    candidateKeysInsideDeriveCapabilities: Array.isArray(trace.candidateKeysInsideDeriveCapabilities) ? trace.candidateKeysInsideDeriveCapabilities : [],
    deriveCapabilitiesReturnedCount: Number(trace.deriveCapabilitiesReturnedCount || 0),
    getCapabilitiesReturnedCount: Number(trace.getCapabilitiesReturnedCount || 0),
    getCapabilityProfileReturnedCount: Number(trace.getCapabilityProfileReturnedCount || 0),
    includeTraceAtProfile: Boolean(trace.includeTraceAtProfile),
    includeTraceAtGetCapabilities: Boolean(trace.includeTraceAtGetCapabilities),
    includeTraceAtDeriveCapabilities: Boolean(trace.includeTraceAtDeriveCapabilities),
  };
}
