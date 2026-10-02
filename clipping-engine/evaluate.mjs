// Stateless scenario evaluation. No publishing, payment or provider calls.
const MAX = 10_000_000;
function num(v, name, max = MAX) {
  if (typeof v !== 'number' || !Number.isFinite(v) || v < 0 || v > max) throw new Error(`Invalid ${name}`);
  return v;
}
function cents(v, name) {
  num(v, name);
  if (Math.abs(v * 100 - Math.round(v * 100)) > 1e-7) throw new Error(`${name} must have at most two decimal places`);
  return Math.round(v * 100);
}
function identifier(v, name) {
  if (typeof v !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(v)) throw new Error(`Invalid ${name}`);
  return v;
}
export function evaluate(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Input object required');
  if (input.mode !== 'assumptions_only') throw new Error('mode must be assumptions_only');
  const campaign = input.campaign;
  if (!campaign || typeof campaign !== 'object') throw new Error('Campaign required');
  identifier(campaign.id, 'campaign.id');
  const rate = cents(campaign.rateUsdPerThousand, 'rate');
  if (!rate) throw new Error('Positive rate required');
  const fee = num(campaign.feeFraction, 'feeFraction', 1);
  const minimum = cents(campaign.minimumGrossUsd, 'minimum');
  const cap = cents(campaign.maximumGrossUsd, 'maximum');
  if (cap < minimum) throw new Error('Maximum below minimum');
  const budget = cents(campaign.remainingGrossBudgetUsd, 'budget');
  const fixed = cents(input.subscriptionUsd, 'subscription');
  const window = num(input.earningWindowDays, 'earningWindowDays', 365);
  if (!window) throw new Error('Positive earning window required');
  if (!Array.isArray(input.clips) || !input.clips.length || input.clips.length > 100) throw new Error('Supply 1–100 clips');
  const ids = new Set();
  const clips = input.clips.map(c => {
    if (!c || typeof c !== 'object') throw new Error('Clip object required');
    const id = identifier(c.id, 'clip.id');
    if (ids.has(id)) throw new Error('Duplicate clip id');
    ids.add(id);
    if (!['unknown', 'eligible', 'ineligible'].includes(c.eligibility)) throw new Error('Invalid eligibility');
    const cost = cents(c.directCostUsd, 'directCost');
    const minutes = num(c.workMinutes, 'workMinutes', 100_000);
    if (!minutes) throw new Error('Positive workMinutes required');
    if (!c.payableViews || typeof c.payableViews !== 'object') throw new Error('payableViews scenarios required');
    const views = ['low', 'base', 'high'].map(s => {
      const n = num(c.payableViews[s], `payableViews.${s}`, 1_000_000_000);
      if (!Number.isSafeInteger(n)) throw new Error('Views must be integer');
      return n;
    });
    if (views[0] > views[1] || views[1] > views[2]) throw new Error('Views must be ordered low <= base <= high');
    return {id, eligibility:c.eligibility, cost, minutes, views};
  });
  function payout(c, index, remaining) {
    if (c.eligibility !== 'eligible') return 0;
    const gross = Math.min(Math.floor(c.views[index] * rate / 1000), cap, remaining);
    return gross < minimum ? 0 : gross;
  }
  // Order is an explicit scenario assumption; it does not reserve campaign money.
  const ranked = [...clips].sort((a,b) => {
    const score = c => (Math.floor(payout(c,1,budget) * (1-fee)) - c.cost) / c.minutes;
    return score(b) - score(a) || a.id.localeCompare(b.id);
  });
  const scenarios = {};
  ['low', 'base', 'high'].forEach((name,index) => {
    let remaining = budget;
    let grossTotal = 0, netTotal = 0, costs = fixed, minutes = 0;
    const results = ranked.map(c => {
      const gross = payout(c,index,remaining);
      remaining -= gross;
      const net = Math.floor(gross * (1-fee) + 1e-8);
      grossTotal += gross; netTotal += net; costs += c.cost; minutes += c.minutes;
      return {id:c.id, assumedPayableViews:c.views[index], eligibility:c.eligibility,
        conditionalGrossUsd:gross/100, conditionalAfterFeeUsd:net/100,
        directCostUsd:c.cost/100, contributionBeforeSubscriptionUsd:(net-c.cost)/100};
    });
    scenarios[name] = {clips:results, conditionalGrossUsd:grossTotal/100,
      conditionalAfterFeeUsd:netTotal/100, totalDirectAndSubscriptionCostUsd:costs/100,
      conditionalProfitBeforeTaxAndLaborUsd:(netTotal-costs)/100,
      workHours:minutes/60, conditionalProfitPerWorkHourUsd:Math.round((netTotal-costs)/100/(minutes/60)*100)/100};
  });
  return {schemaVersion:1, mode:'assumptions_only', campaignId:campaign.id,
    earningWindowDays:window, actualReceivedRevenueUsd:null,
    eligibleCount:clips.filter(c=>c.eligibility==='eligible').length,
    reviewQueue:clips.filter(c=>c.eligibility==='unknown').map(c=>c.id),
    conditionalRankedClipIds:ranked.map(c=>c.id), scenarios,
    warnings:['User-entered scenarios, not calibrated forecasts or approval decisions.',
      'All eligible clips are assumed accepted; rejection can reduce gross earnings to zero.',
      'Budget allocated in base ranking order; competitors can consume it first.',
      'Subscription counted once for this batch; do not subtract it again across the same billing month.',
      'No actual views, earnings, publication or payment has been verified.']};
}
