function getRecommendation(payload) {
  const {
    segment,
    urgency,
    risk,
    eventType,
    value,
  } = payload || {};

  // 1) High urgency, high value abandoned checkouts
  if (eventType === 'checkout_abandoned' && urgency === 'high' && Number(value || 0) >= 100) {
    return {
      recommended_action: 'Send a personalized recovery email with a small incentive.',
      timing: 'within 2–4 hours of abandonment',
      channel: 'email',
      reason: 'High-value, high-urgency abandonment has strong recovery potential with a timely nudge.',
    };
  }

  // 2) Repeat abandonment in at-risk segment
  if (
    (eventType === 'browse_only' || eventType === 'cart_abandoned') &&
    (segment === 'at_risk' || risk === 'churn_risk')
  ) {
    return {
      recommended_action: 'Trigger a limited-time offer sequence with urgency in subject line.',
      timing: 'within 24 hours of the latest event',
      channel: 'email',
      reason: 'Repeat at-risk behavior suggests hesitancy. A clear, time-bound offer can convert fence-sitters.',
    };
  }

  // 3) VIP & high-value customers with recovery
  if (eventType === 'checkout_recovered' && (segment === 'vip' || segment === 'high_value')) {
    return {
      recommended_action: 'Send a thank-you plus VIP loyalty benefits reminder.',
      timing: '12–24 hours after recovery',
      channel: 'email',
      reason: 'VIP and high-value customers respond well to recognition. Reinforcing benefits and early access strengthens retention.',
    };
  }

  // 4) VIP with churn risk after recovery → personal SMS
  if (eventType === 'checkout_recovered' && segment === 'vip' && risk === 'churn_risk') {
    return {
      recommended_action: 'Send a personal check-in SMS thanking them and inviting feedback.',
      timing: '24 hours after recovery',
      channel: 'sms',
      reason: 'Recovered VIP still shows churn risk. A personal, non-promotional check-in strengthens the relationship.',
    };
  }

  // 5) Fallback – no explicit recommendation
  return null;
}

module.exports = {
  getRecommendation,
};
