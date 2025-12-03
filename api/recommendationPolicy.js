'use strict';

/**
 * v2 Recommendation policy for /api/ai-segments
 *
 * Input shape:
 * {
 *   segment: string | undefined;
 *   urgency: string | undefined;
 *   risk: string | undefined;
 *   eventType: string | undefined;
 *   value: number | string | undefined;
 * }
 *
 * Returns either:
 *   { recommended_action, timing, channel, reason }
 * or
 *   null  (no explicit play)
 */

function normalize(input) {
  const segment = (input.segment || '').toString().toLowerCase();
  const urgency = (input.urgency || '').toString().toLowerCase();
  const risk = (input.risk || '').toString().toLowerCase();
  const eventType = (input.eventType || '').toString().toLowerCase();
  const valueNumber = Number(input.value || 0);
  const value = Number.isNaN(valueNumber) ? 0 : valueNumber;

  return { segment, urgency, risk, eventType, value };
}

function getRecommendation(input) {
  const { segment, urgency, risk, eventType, value } = normalize(input);

  // 0) Ignore pure internal probes – we don't want merchants to see these
  if (eventType === 'backend_probe') {
    return null;
  }

  // 1) High-value / VIP checkout abandoned → strong offer via email
  if (eventType === 'checkout_abandoned' && (segment === 'vip' || value >= 200)) {
    return {
      recommended_action:
        'Send a personalized recovery email with a limited-time perk (free shipping or VIP-only bonus).',
      timing: 'within 30 minutes of abandonment',
      channel: 'email',
      reason:
        'High-value / VIP cart was abandoned. A fast, personal follow-up with a meaningful perk has a strong chance of recovering this order.',
    };
  }

  // 2) Returning VIP / high-value purchase → loyalty reinforcement
  if (eventType === 'checkout_recovered' && (segment === 'vip' || value >= 200)) {
    return {
      recommended_action:
        'Send a thank-you email that highlights VIP benefits and invites them into your insider list.',
      timing: 'same day after order',
      channel: 'email',
      reason:
        'VIP or high-value customer just completed a purchase. Reinforcing status and benefits now builds long-term retention.',
    };
  }

  // 3) VIP with churn risk after recovery → personal SMS / DM
  if (eventType === 'checkout_recovered' && segment === 'vip' && risk === 'churn_risk') {
    return {
      recommended_action:
        'Send a short, personal check-in message (SMS or DM) asking how their last experience was.',
      timing: '24 hours after recovery',
      channel: 'sms',
      reason:
        'Recovered VIP is still flagged as churn-risk. A non-promotional, human check-in can defuse frustration and keep them.',
    };
  }

  // 4) Low-value browse-only bounce → gentle onsite incentive (your current dev case)
  if (eventType === 'browse_only' && segment === 'low_value') {
    return {
      recommended_action:
        'Show an exit-intent popup with a small first-order incentive (5–10% off or free shipping).',
      timing: 'next visit, at exit-intent',
      channel: 'onsite',
      reason:
        'Low-value visitor bounced quickly. A small, time-boxed incentive is usually enough to convert curious browsers into first-time buyers without eroding margin.',
    };
  }

  // 5) High urgency + high risk, any segment → nudge via email series
  if (urgency === 'high' && risk === 'churn_risk') {
    return {
      recommended_action:
        'Add them to a 2–3 touch win-back sequence with helpful content and a single clear offer.',
      timing: 'begin within 24 hours',
      channel: 'email',
      reason:
        'Signals show high urgency and churn risk. A short, focused win-back sequence often outperforms a single blast.',
    };
  }

  // 6) Fallback – generic, safe play if you want *something* instead of null
  if (segment || eventType) {
    return {
      recommended_action:
        'Send a short, value-first follow-up: remind them what makes your brand different and invite them back.',
      timing: 'within 24–48 hours',
      channel: 'email',
      reason:
        'Even without a strong signal, a light, value-first follow-up keeps your brand in their mind without feeling pushy.',
    };
  }

  // 7) Absolute fallback – no meaningful signal
  return null;
}

module.exports = {
  getRecommendation,
};
