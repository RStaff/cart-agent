export const CAREEROS_COMPARISON_MIN = 2;
export const CAREEROS_COMPARISON_MAX = 4;

const STATES = ["DIRECT", "TRANSFERABLE", "PARTIAL", "UNKNOWN", "SPECIALIST_BLOCKED", "SCOPE_BLOCKED"];

export function normalizeComparisonIds(values) {
  const ids = [...new Set((Array.isArray(values) ? values : []).map((value) => String(value || "").trim()).filter(Boolean))];
  if (ids.length < CAREEROS_COMPARISON_MIN) throw Object.assign(new Error("COMPARISON_REQUIRES_TWO_OPPORTUNITIES"), { code: "COMPARISON_REQUIRES_TWO_OPPORTUNITIES" });
  if (ids.length > CAREEROS_COMPARISON_MAX) throw Object.assign(new Error("COMPARISON_LIMIT_EXCEEDED"), { code: "COMPARISON_LIMIT_EXCEEDED" });
  return ids;
}

function relationshipsFor(match) { return Array.isArray(match?.relationships) ? match.relationships : []; }

export function summarizeOpportunityForComparison(opportunity) {
  const relationships = relationshipsFor(opportunity.match);
  const counts = Object.fromEntries(STATES.map((state) => [state, relationships.filter((item) => item.state === state).length]));
  const analyzed = Boolean(opportunity.match);
  let priorityLabel = "Analysis needed";
  if (analyzed && opportunity.match.stale) priorityLabel = "Needs updated analysis";
  else if (analyzed && counts.DIRECT >= Math.max(1, Math.ceil(relationships.length / 2)) && counts.UNKNOWN === 0 && counts.PARTIAL === 0 && counts.SPECIALIST_BLOCKED === 0) priorityLabel = "Strong evidence alignment";
  else if (analyzed && counts.DIRECT > 0 && counts.TRANSFERABLE > 0) priorityLabel = "Promising, with transferable experience";
  else if (analyzed && (counts.DIRECT > 0 || counts.TRANSFERABLE > 0 || counts.PARTIAL > 0)) priorityLabel = "Worth reviewing - some evidence gaps";
  else if (analyzed) priorityLabel = "More information needed";

  const sentences = [];
  if (!analyzed) sentences.push("This opportunity has not been analyzed yet.");
  else if (opportunity.match.stale) sentences.push("Your career information has changed since this analysis.");
  else {
    if (counts.DIRECT) sentences.push(`CareerOS has confirmed direct evidence for ${counts.DIRECT} requirement${counts.DIRECT === 1 ? "" : "s"}.`);
    if (counts.TRANSFERABLE) sentences.push(`${counts.TRANSFERABLE} requirement${counts.TRANSFERABLE === 1 ? " relies" : "s rely"} on transferable experience.`);
    if (counts.PARTIAL) sentences.push(`${counts.PARTIAL} requirement${counts.PARTIAL === 1 ? " has" : "s have"} partial evidence.`);
    if (counts.UNKNOWN) sentences.push(`${counts.UNKNOWN} requirement${counts.UNKNOWN === 1 ? " needs" : "s need"} more evidence.`);
    if (counts.SPECIALIST_BLOCKED) sentences.push(`${counts.SPECIALIST_BLOCKED} specialist requirement${counts.SPECIALIST_BLOCKED === 1 ? " is" : "s are"} not currently established.`);
  }
  return {
    counts,
    priorityLabel,
    priorityExplanation: sentences.join(" ") || "CareerOS does not yet have enough confirmed evidence to explain this opportunity.",
    groups: {
      direct: relationships.filter((item) => item.state === "DIRECT"),
      transferable: relationships.filter((item) => item.state === "TRANSFERABLE"),
      partial: relationships.filter((item) => item.state === "PARTIAL"),
      unknown: relationships.filter((item) => item.state === "UNKNOWN"),
      specialist: relationships.filter((item) => item.state === "SPECIALIST_BLOCKED"),
    },
    analyzed,
    stale: Boolean(opportunity.match?.stale),
  };
}
