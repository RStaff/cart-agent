const STATES = Object.freeze({ DIRECT: "EXACT_OR_DIRECT_SUPPORT", TRANSFERABLE: "STRONG_TRANSFERABLE_SUPPORT", PARTIAL: "PARTIAL_SUPPORT", NONE: "NO_SUPPORTED_EVIDENCE", UNKNOWN: "UNKNOWN" });
const BOILERPLATE = [/^how you.?ll make a difference$/i, /^key responsibilities$/i, /^get to know /i, /^nice to haves$/i, /^preferred experience/i, /job scams?/i, /privacy collection/i, /it is unlawful/i, /visa sponsorship/i, /benefits? with company/i, /retirement benefits/i, /safety matters/i, /this is a full time role/i, /massachusetts applicants/i, /covey/i];
const RESPONSIBILITY_VERBS = /\b(own|owns|lead|leads|manage|manages|architect|architects|coordinate|coordinates|analy[sz]e|analy[sz]es|implement|implements|advise|advises|govern|governs|operate|operates|design|designs|build|builds|develop|develops|deliver|delivers|drive|drives|partner|partners|translate|translates|sell|sells|mentor|mentors|coach|coaches|facilitate|facilitates|launch|launches|scale|scales)\b/i;
const ROLE_FAMILIES = [
  ["FINANCE", /\b(finance|financial|accounting|pricing|packaging|market share|treasury|capital markets)\b/i],
  ["TAX", /\b(tax|taxation)\b/i],
  ["PAYROLL", /\b(payroll|wage and hour|hris|time tracking)\b/i],
  ["LEGAL", /\b(counsel|legal|attorney|law)\b/i],
  ["AV_MEDIA_PRODUCTION", /\b(av|audio visual|production specialist|media production|broadcast)\b/i],
  ["SOFTWARE_ENGINEERING", /\b(software engineer|engineering manager|frontend|backend|full stack|data engineer|developer productivity)\b/i],
  ["DATA_SCIENCE", /\b(data scientist|data science|machine learning scientist|statistician)\b/i],
  ["AI_AUTOMATION", /\b(ai|artificial intelligence|automation|agentic)\b/i],
  ["TECHNICAL_PROGRAM", /\b(technical program|program manager|project manager|transformation)\b/i],
  ["PRODUCT", /\b(product manager|product management|product strategy)\b/i],
  ["SOLUTIONS", /\b(solutions consulting|solutions architect|sales engineer|technical evangelist)\b/i],
  ["MARKETING_TECHNOLOGY", /\b(marketing technology|martech|marketing operations|growth marketing|customer marketing)\b/i],
  ["BUSINESS_SYSTEMS", /\b(business systems|systems analyst|business analyst)\b/i],
  ["SALES_CUSTOMER_SUCCESS", /\b(sales|customer success|account executive|enablement)\b/i],
  ["GOVERNANCE_COMPLIANCE", /\b(governance|compliance|risk|audit)\b/i],
];

function text(value) { return typeof value === "string" ? value.trim() : ""; }
function normalized(value) { return text(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim(); }
function isBoilerplate(value) { const candidate = text(value); return !candidate || candidate.length < 28 || BOILERPLATE.some((pattern) => pattern.test(candidate)); }
function familyFor(title, requirements = []) { const titleText = text(title); const titleFamily = ROLE_FAMILIES.find(([, pattern]) => pattern.test(titleText))?.[0]; if (titleFamily) return titleFamily; const haystack = `${titleText} ${requirements.map((r) => text(r.requirement || r.requirementText || r.text)).join(" ")}`; return ROLE_FAMILIES.find(([, pattern]) => pattern.test(haystack))?.[0] || "OTHER"; }
function stateConclusion(state) { return { [STATES.DIRECT]: "PROVEN_CAPABILITY", [STATES.TRANSFERABLE]: "TRANSFERABLE_CAPABILITY", [STATES.PARTIAL]: "PARTIAL_SUPPORT", [STATES.NONE]: "UNRESOLVED_CAPABILITY", [STATES.UNKNOWN]: "UNRESOLVED_CAPABILITY" }[state] || "UNRESOLVED_CAPABILITY"; }
function repairedState(comparison, family) {
  const requirement = text(comparison.requirement);
  if (isBoilerplate(requirement) || !RESPONSIBILITY_VERBS.test(requirement)) return { state: STATES.UNKNOWN, reason: "Structural or generic language is not treated as responsibility evidence." };
  if (["FINANCE", "TAX", "PAYROLL", "LEGAL", "AV_MEDIA_PRODUCTION", "SOFTWARE_ENGINEERING", "DATA_SCIENCE"].includes(family) && comparison.evidenceState === STATES.TRANSFERABLE && !RESPONSIBILITY_VERBS.test(requirement)) return { state: STATES.UNKNOWN, reason: "Specialist-domain context without an actionable responsibility is unresolved." };
  return { state: comparison.evidenceState, reason: comparison.comparisonReason };
}

export function classifyRoleFunction({ title = "", requirements = [] } = {}) {
  const roleFamily = familyFor(title, requirements);
  const specialist = ["FINANCE", "TAX", "PAYROLL", "LEGAL", "AV_MEDIA_PRODUCTION", "SOFTWARE_ENGINEERING", "DATA_SCIENCE"].includes(roleFamily);
  return { roleFamily, specialist, state: specialist ? "SPECIALIST_DOMAIN" : "SEMANTIC_ROLE_FAMILY", reason: specialist ? `Role family is ${roleFamily}; generic operations/strategy/AI wording is not treated as function equivalence.` : `Role family is ${roleFamily}; shared vocabulary alone does not establish function equivalence.` };
}

export function normalizeRequirements(requirements = []) {
  return requirements.map((requirement) => {
    const requirementText = text(requirement.requirementText || requirement.requirement || requirement.text);
    const category = text(requirement.requirementCategory || requirement.category || requirement.requirementLevel).toUpperCase();
    const structural = isBoilerplate(requirementText);
    const responsibility = !structural && (category.includes("RESPONS") || category.includes("LEAD") || category.includes("PROGRAM") || RESPONSIBILITY_VERBS.test(requirementText));
    const specialist = /\b(finance|tax|payroll|legal|counsel|software engineer|data scientist|av production)\b/i.test(requirementText);
    return { id: requirement.id || requirement.requirementId || null, text: requirementText, normalizedText: normalized(requirementText), originalCategory: category || "UNKNOWN", taxonomy: structural ? "STRUCTURAL_OR_BOILERPLATE" : specialist ? "SPECIALIST_DOMAIN_REQUIREMENT" : responsibility ? "RESPONSIBILITY" : "CAPABILITY_OR_CONTEXT", structural, responsibility, specialist, sourcePreserved: true };
  });
}

export function repairAuthorityDiagnostics({ title = "", authorityDiagnostics = {} } = {}) {
  const original = authorityDiagnostics.responsibilitySimilarity?.comparisons || [];
  const roleFunction = classifyRoleFunction({ title, requirements: original });
  const comparisons = original.map((comparison) => {
    const repaired = repairedState(comparison, roleFunction.roleFamily);
    return { ...comparison, originalEvidenceState: comparison.evidenceState, evidenceState: repaired.state, capabilityConclusion: stateConclusion(repaired.state), semanticRoleFamily: roleFunction.roleFamily, structuralNoiseSuppressed: repaired.state === STATES.UNKNOWN && comparison.evidenceState !== STATES.UNKNOWN, comparisonReason: repaired.reason };
  });
  const counts = Object.fromEntries(Object.values(STATES).map((state) => [state, comparisons.filter((item) => item.evidenceState === state).length]));
  const substantive = comparisons.filter((item) => !isBoilerplate(item.requirement) && RESPONSIBILITY_VERBS.test(item.requirement));
  const resolved = comparisons.filter((item) => item.evidenceState !== STATES.UNKNOWN).length;
  const originalSeniority = authorityDiagnostics.seniorityCompatibility || { state: "UNRESOLVED", capabilityConclusion: "UNRESOLVED_CAPABILITY", reason: "No seniority authority." };
  const originalDomain = authorityDiagnostics.domainCompatibility || { state: "UNRESOLVED_DOMAIN", capabilityConclusion: "UNRESOLVED_CAPABILITY", reason: "No domain authority." };
  return { roleFunction, responsibilitySimilarity: { state: substantive.length && !substantive.some((item) => item.evidenceState === STATES.UNKNOWN) ? "CALCULATED" : substantive.length ? "PARTIAL" : "UNKNOWN", counts, comparisons, substantiveCount: substantive.length, suppressedStructuralCount: comparisons.filter((item) => item.structuralNoiseSuppressed).length, coverage: { total: substantive.length, resolved: substantive.filter((item) => item.evidenceState !== STATES.UNKNOWN).length, transferable: counts[STATES.TRANSFERABLE], direct: counts[STATES.DIRECT], missingEvidence: counts[STATES.NONE] } }, seniorityCompatibility: originalSeniority, domainCompatibility: originalDomain, evidenceCoverage: { total: substantive.length, resolved, transferable: counts[STATES.TRANSFERABLE], direct: counts[STATES.DIRECT], missingEvidence: counts[STATES.NONE] }, capabilityConclusion: { responsibility: comparisons.map((item) => item.capabilityConclusion), seniority: originalSeniority.capabilityConclusion, domain: originalDomain.capabilityConclusion }, evidenceGapReason: comparisons.filter((item) => [STATES.NONE, STATES.UNKNOWN].includes(item.evidenceState)).map((item) => ({ requirementId: item.requirementId, state: item.evidenceState, reason: item.comparisonReason })) };
}

export const REPAIR_RULES = Object.freeze({ unknownIsNotNegative: true, missingIsNotCapabilityGap: true, titleIsNotBlocker: true, selfConfidenceConsumed: false, workflowConsumed: false, interestConsumed: false });
