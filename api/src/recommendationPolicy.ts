export type RecommendationChannel = 'email' | 'sms' | 'onsite';

export type Recommendation = {
  recommended_action: string;
  timing: string;
  channel: RecommendationChannel;
  reason: string;
};

export type Segment = 'low_value' | 'high_value' | 'vip';
export type Urgency = 'normal' | 'elevated' | 'hot';
export type Risk = 'standard' | 'churn_risk';

export type EventContext = {
  segment: Segment;
  urgency: Urgency;
  risk: Risk;
  eventType: string;
  value: number;
};

export function getRecommendation(ctx: EventContext): Recommendation | null {
  const { segment, urgency, risk, eventType, value } = ctx;

  // 1) Pure browse-only traffic → soft follow-up
  if (eventType === 'browse_only') {
    if (value >= 50) {
      return {
        recommended_action:
          'Send a browse-abandon email with the viewed products and a soft reminder',
        timing: '2–4 hours after session',
        channel: 'email',
        reason:
          'Higher-intent browser with meaningful value; gentle reminder can convert without discounting.',
      };
    }

    return {
      recommended_action:
        'Include this visitor in your next product highlights email, no discount',
      timing: 'next 24–48 hours campaign',
      channel: 'email',
      reason:
        'Low-value browse-only; nurture with regular content instead of immediate 1:1 follow-up.',
    };
  }

  // 2) Abandoned checkout → recovery play
  if (eventType === 'checkout_abandoned') {
    if (segment === 'high_value' || segment === 'vip') {
      return {
        recommended_action:
          'Trigger a two-step recovery: first reminder, then limited-time incentive',
        timing: 'reminder at 1 hour; incentive at 12–24 hours',
        channel: 'email',
        reason:
          'High-value abandoners often respond to a reminder + small incentive. Protects margin while maximizing recovery.',
      };
    }

    return {
      recommended_action:
        'Send a single reminder email with cart contents and clear next step (no discount)',
      timing: '3–6 hours after abandonment',
      channel: 'email',
      reason:
        'Standard-risk, low-value abandoners can often be recovered with one clear reminder without eroding margin.',
    };
  }

  // 3) Recovered checkout → retention play
  if (eventType === 'checkout_recovered') {
    if (segment === 'vip' && risk === 'churn_risk') {
      return {
        recommended_action:
          'Send personal check-in SMS thanking them and inviting feedback',
        timing: '24 hours after recovery',
        channel: 'sms',
        reason:
          'Recovered VIP still shows churn risk. A personal, non-promotional check-in strengthens the relationship.',
      };
    }

    if (segment === 'vip' || segment === 'high_value') {
      return {
        recommended_action:
          'Invite to a VIP early-access or loyalty offer via email',
        timing: '12–24 hours after recovery',
        channel: 'email',
        reason:
          'VIP and high-value customers respond well to recognition. Reinforcing benefits and early access strengthens retention.',
      };
    }
  }

  // 4) Fallback – no explicit recommendation
  return null;
}
