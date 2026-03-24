function normalizeMetric(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

export function recordExecutionFeedback(feedback = {}) {
  return {
    beforeRecoveryRate: normalizeMetric(feedback.beforeRecoveryRate),
    afterRecoveryRate: normalizeMetric(feedback.afterRecoveryRate),
    revenueImpact: normalizeMetric(feedback.revenueImpact),
    taskSuccess: feedback.taskSuccess === true,
    recordedAt: new Date().toISOString(),
  };
}
