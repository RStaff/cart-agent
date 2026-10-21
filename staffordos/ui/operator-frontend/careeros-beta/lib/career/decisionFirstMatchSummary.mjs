const MIN_MEANINGFUL_REQUIREMENTS = 2;
const LABELS = Object.freeze({
  STRONG_ALIGNMENT: "Strong evidence alignment",
  PROMISING_ALIGNMENT: "Promising alignment",
  MIXED_ALIGNMENT: "Mixed evidence",
  LIMITED_ALIGNMENT: "Limited confirmed evidence",
  INSUFFICIENT_ANALYSIS: "More analysis needed",
  STALE_ANALYSIS: "Analysis needs to be refreshed",
});

function relationshipsFor(match) {
  return Array.isArray(match?.relationships) ? match.relationships : [];
}

function labelFor(relationship) {
  return String(relationship.capabilityLabel || relationship.text || "Requirement").trim();
}

function uniqueLabels(relationships, states) {
  return [...new Set(relationships.filter((item) => states.includes(item.state)).map(labelFor))].slice(0, 4);
}

function buildEvidenceFit({ relationships, counts, coverage, stale }) {
  const numerator = counts.DIRECT + counts.TRANSFERABLE;
  const denominator = relationships.length;
  const semanticKey = "EVIDENCE_COVERAGE_PERCENTAGE";
  if (stale) return { semanticKey, status: "STALE", percentage: null, numerator, denominator };
  if (coverage === "INSUFFICIENT") return { semanticKey, status: "INSUFFICIENT", percentage: null, numerator, denominator };
  return { semanticKey, status: "CURRENT", percentage: Math.floor((numerator / denominator) * 100), numerator, denominator };
}

export function buildDecisionFirstMatchSummary(match = {}) {
  const relationships = relationshipsFor(match);
  const counts = Object.fromEntries(["DIRECT", "TRANSFERABLE", "PARTIAL", "UNKNOWN", "SPECIALIST_BLOCKED", "SCOPE_BLOCKED"].map((state) => [state, relationships.filter((item) => item.state === state).length]));
  const coverage = relationships.length >= MIN_MEANINGFUL_REQUIREMENTS ? "MEANINGFUL" : "INSUFFICIENT";
  const decisionState = match.decisionState || null;
  const evidenceFit = buildEvidenceFit({ relationships, counts, coverage, stale: Boolean(match.stale) });
  let assessment = "INSUFFICIENT_ANALYSIS";

  if (match.stale) assessment = "STALE_ANALYSIS";
  else if (coverage === "MEANINGFUL" && counts.DIRECT >= 2 && counts.UNKNOWN === 0 && counts.PARTIAL === 0 && counts.SPECIALIST_BLOCKED === 0 && counts.SCOPE_BLOCKED === 0) assessment = "STRONG_ALIGNMENT";
  else if (coverage === "MEANINGFUL" && counts.DIRECT > 0 && counts.TRANSFERABLE > 0 && counts.PARTIAL === 0 && counts.UNKNOWN === 0 && counts.SPECIALIST_BLOCKED === 0 && counts.SCOPE_BLOCKED === 0) assessment = "PROMISING_ALIGNMENT";
  else if (coverage === "MEANINGFUL" && counts.DIRECT + counts.TRANSFERABLE + counts.PARTIAL > 0) assessment = "MIXED_ALIGNMENT";
  else if (coverage === "MEANINGFUL") assessment = "LIMITED_ALIGNMENT";

  const strongAreas = uniqueLabels(relationships, ["DIRECT"]);
  const gaps = uniqueLabels(relationships, ["PARTIAL", "UNKNOWN", "SCOPE_BLOCKED"]);
  const specialistConstraints = uniqueLabels(relationships, ["SPECIALIST_BLOCKED"]);
  const reasons = [];
  if (coverage === "INSUFFICIENT") reasons.push("CareerOS needs more meaningful job requirements before it can summarize this opportunity.");
  else {
    if (counts.DIRECT) reasons.push(`CareerOS has confirmed direct evidence for ${counts.DIRECT} requirement${counts.DIRECT === 1 ? "" : "s"}.`);
    if (counts.TRANSFERABLE) reasons.push(`${counts.TRANSFERABLE} requirement${counts.TRANSFERABLE === 1 ? " relies" : "s rely"} on transferable experience.`);
    if (counts.PARTIAL) reasons.push(`${counts.PARTIAL} requirement${counts.PARTIAL === 1 ? " has" : "s have"} partial evidence.`);
    if (counts.UNKNOWN) reasons.push(`${counts.UNKNOWN} requirement${counts.UNKNOWN === 1 ? " needs" : "s need"} more evidence.`);
    if (counts.SPECIALIST_BLOCKED) reasons.push(`${counts.SPECIALIST_BLOCKED} specialist requirement${counts.SPECIALIST_BLOCKED === 1 ? " is" : "s are"} not currently established.`);
  }

  let bottomLine = "Review the evidence and decide whether this opportunity is worth pursuing.";
  if (assessment === "STALE_ANALYSIS") bottomLine = "Re-analyze this opportunity before relying on the assessment.";
  else if (assessment === "INSUFFICIENT_ANALYSIS") bottomLine = "Add or review more job requirements before relying on this assessment.";
  else if (assessment === "LIMITED_ALIGNMENT") bottomLine = "Review the requirements carefully; the current analysis has limited confirmed support.";
  else if (assessment === "MIXED_ALIGNMENT") bottomLine = "This opportunity has meaningful alignment with your confirmed experience, but CareerOS identified areas where supporting evidence is limited. Review those gaps before deciding whether to pursue it.";
  else if (assessment === "PROMISING_ALIGNMENT") bottomLine = "This opportunity has meaningful alignment across your confirmed and transferable experience. Review the evidence before deciding whether to pursue it.";

  return {
    assessment,
    assessmentLabel: LABELS[assessment],
    coverage,
    counts,
    strongAreas,
    gaps,
    specialistConstraints,
    evidenceFit,
    reasons,
    explanation: reasons.join(" "),
    bottomLine,
    decisionState,
  };
}
