export const CAREEROS_CONTEXT_CLAIM_EXTRACTION_VERSION = "CONTEXT_CLAIM_EXTRACTOR_V1";

export const CONTEXT_DIMENSIONS = Object.freeze([
  "TOOL",
  "PROCESS",
  "STAKEHOLDER",
  "WORKFLOW",
  "METHOD",
  "DOMAIN",
  "OUTCOME",
]);

const TOOL_PATTERNS = Object.freeze([
  ["Jira", /\bjira\b/i],
  ["Salesforce", /\bsalesforce\b/i],
  ["Pardot", /\bpardot\b/i],
  ["HubSpot", /\bhubspot\b/i],
  ["Marketo", /\bmarketo\b/i],
  ["SQL", /\bsql\b/i],
  ["Python", /\bpython\b/i],
  ["JavaScript", /\bjavascript\b/i],
]);

const METHOD_PATTERNS = Object.freeze([
  ["Agile", /\bagile\b/i],
  ["Scrum", /\bscrum\b/i],
  ["stakeholder interviews", /\bstakeholder interviews?\b/i],
  ["requirements analysis", /\brequirements? analysis\b/i],
]);

const STAKEHOLDER_PATTERNS = Object.freeze([
  ["developers", /\bdevelopers?\b/i],
  ["marketing", /\bmarketing\b/i],
  ["business stakeholders", /\bbusiness stakeholders?\b/i],
  ["senior leadership", /\bsenior leadership\b/i],
  ["executives", /\bexecutives?\b/i],
  ["vendors", /\bvendors?\b/i],
  ["customers", /\bcustomers?\b/i],
]);

const DOMAIN_PATTERNS = Object.freeze([
  ["marketing technology", /\bmarketing technology\b/i],
  ["ecommerce", /\be-?commerce\b/i],
  ["financial services", /\bfinancial services?\b/i],
]);

function clean(value) { return String(value || "").replace(/\s+/g, " ").trim(); }
function normalize(value) { return clean(value).toLowerCase().replace(/[^a-z0-9+#]+/g, " ").trim(); }

function claim(dimension, displayValue, fact, sourceAnchor) {
  const value = clean(displayValue);
  const normalizedValue = normalize(value);
  if (!value || !normalizedValue) return null;
  return {
    dimension,
    displayValue: value,
    normalizedValue,
    sourceAnchor: { sourceOrder: fact.sourceOrder, match: sourceAnchor },
    extractionVersion: CAREEROS_CONTEXT_CLAIM_EXTRACTION_VERSION,
  };
}

function exactMatches(patterns, statement, dimension, fact) {
  return patterns.flatMap(([label, pattern]) => pattern.test(statement) ? [claim(dimension, label, fact, label)] : []);
}

export function extractContextClaims(fact = {}) {
  if (String(fact.authorityState || "").toUpperCase() !== "CUSTOMER_CONFIRMED_SOURCE_BACKED") return [];
  const statement = clean(fact.statement);
  if (!statement || /^(what|how|why|have you|tell me|describe)\b/i.test(statement) || /\?\s*$/.test(statement)) return [];
  const claims = [
    ...exactMatches(TOOL_PATTERNS, statement, "TOOL", fact),
    ...exactMatches(METHOD_PATTERNS, statement, "METHOD", fact),
    ...exactMatches(STAKEHOLDER_PATTERNS, statement, "STAKEHOLDER", fact),
    ...exactMatches(DOMAIN_PATTERNS, statement, "DOMAIN", fact),
  ];
  if (/\b(managed|managed the|requirements management|backlog management|project schedule|process management)\b/i.test(statement)) {
    claims.push(claim("PROCESS", "project scheduling", fact, "project schedule"));
  }
  if (/\b(implemented|deployed|validated|launched|launch|workflow)\b/i.test(statement) && /\b(from|through|to)\b/i.test(statement)) {
    claims.push(claim("WORKFLOW", "delivery workflow", fact, "workflow sequence"));
  }
  if (/\b(launched|launch|delivered|implemented|improved|resolved blockers|on schedule)\b/i.test(statement)) {
    claims.push(claim("OUTCOME", "launch or delivery", fact, "delivery outcome"));
  }
  return claims.filter(Boolean).filter((item, index, all) => all.findIndex((candidate) => candidate.dimension === item.dimension && candidate.normalizedValue === item.normalizedValue) === index);
}

export function contextSummary(claims = []) {
  return CONTEXT_DIMENSIONS.reduce((summary, dimension) => {
    summary[dimension] = claims.filter((claim) => claim.dimension === dimension && ["CUSTOMER_CONFIRMED", "CUSTOMER_CORRECTED"].includes(claim.authorityState) && claim.status === "ACTIVE").map((claim) => claim.displayValue);
    return summary;
  }, {});
}

export function normalizeContextCorrection(value) {
  const displayValue = clean(value).slice(0, 240);
  const normalizedValue = normalize(displayValue);
  if (!displayValue || !normalizedValue) throw Object.assign(new Error("CONTEXT_CORRECTION_REQUIRED"), { code: "CONTEXT_CORRECTION_REQUIRED" });
  return { displayValue, normalizedValue };
}
