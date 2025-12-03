// Simple v1 recommendation policy for Abando
// CommonJS so it can be required from server.js

/**
 * @typedef {Object} RecommendationContext
 * @property {string} segment        // 'vip' | 'high_value' | 'low_value' | etc.
 * @property {string} urgency        // 'hot' | 'elevated' | 'normal'
 * @property {string} risk           // 'churn_risk' | 'standard' | etc.
 * @property {string} [eventType]    // 'checkout_abandoned' | 'checkout_recovered' | 'browse_only' | etc.
 * @property {number} [value]        // cart or order value
 */

/**
 * @typedef {Object} Recommendation
 * @property {string} recommended_action
 * @property {string} timing
 * @property {string} channel
 * @property {string} reason
 */

/**
 * @param {RecommendationContext} ctx
 * @returns {Recommendation | null}
 */
function getRecommendation(ctx) {
  const segment = ctx.segment;
  const urgency = ctx.urgency;
  const risk = ctx.risk;
  const eventType = ctx.eventType || '';
  const value = typeof ctx.value === 'number' ? ctx.value : Number(ctx.value || 0);

  // 1) VIP / high-value abandoned or churn-risk → urgent personalized outreach
  if (eventType === 'checkout_abandoned') {
    if (segment === 'vip' || segment === 'high_value') {
      return {
        recommended_action:
          'Send a personal email acknowledging the dropped cart and offering a tailored incentive (e.g. free shipping or small discount).',
        timing: 'within 1–2 hours of abandonment',
        channel: 'email',
        reason:
          'High-value or VIP carts are worth rescuing quickly. A personal, specific nudge often recovers these orders.',
      };
    }

    if (segment === 'low_value') {
      return {
        recommended_action:
          'Send an automated reminder email with a simple “You left something behind” message.',
        timing: 'within 24 hours of abandonment',
        channel: 'email',
        reason:
          'Low-value carts still add up, but don’t justify heavy incentives. A simple reminder is usually enough.',
      };
    }
  }

  // 2) Recovered orders → follow-up to reinforce loyalty
  if (eventType === 'checkout_recovered') {
    if (segment === 'vip' || value >= 200) {
      return {
        recommended_action:
          'Send a short thank-you email with early-access or loyalty-style messaging.',
        timing: '12–24 hours after recovery',
        channel: 'email',
        reason:
          'VIP and high-value customers respond well to recognition. Reinforcing benefits and early access strengthens retention.',
      };
    }
  }

  // 3) VIP with churn risk after recovery → personal SMS
  if (eventType === 'checkout_recovered' && segment === 'vip' && risk === 'churn_risk') {
    return {
      recommended_action:
        'Send a personal check-in SMS thanking them and inviting feedback.',
      timing: '24 hours after recovery',
      channel: 'sms',
      reason:
        'Recovered VIP still shows churn risk. A personal, non-promotional check-in strengthens the relationship.',
    };
  }

  // 4) Fallback – no explicit recommendation
  return null;
}

module.exports = {
  getRecommendation,
};
