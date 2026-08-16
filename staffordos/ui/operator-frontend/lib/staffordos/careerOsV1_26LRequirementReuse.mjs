import { createHash } from "node:crypto";

const POSITIVE = new Set(["DIRECT", "TRANSFERABLE", "PARTIAL"]);
const SPECIALIST = /finance|accounting|tax|payroll|legal|av[_ -]?media|software[_ -]?engineering|software engineer|data[_ -]?science|data scientist|machine learning|specialist ai|security/i;
const BOILERPLATE = /benefits?|compensation|equal opportunity|visa sponsorship|privacy|about (the )?company|nice to haves?/i;
const text = (value) => typeof value === "string" ? value.trim() : "";
export function normalizeRequirement(requirement) { return text(requirement?.normalizedRequirement || requirement?.requirementText).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }
export function isSpecialist(requirement) { return Boolean(requirement?.specialist === true) || SPECIALIST.test([requirement?.requirementCategory, requirement?.requirementLevel, requirement?.requirementText, requirement?.technologyOrSkill].filter(Boolean).join(" ")); }
export function capabilityFamily(requirement) { const value = normalizeRequirement(requirement); if (/technical program|program manager|project manager|cross functional|operating model|transformation/.test(value)) return "PROGRAM_DELIVERY"; if (/product|backlog|roadmap|priorit/.test(value)) return "PRODUCT"; if (/automation|artificial intelligence|ai assisted|workflow/.test(value)) return "AI_AUTOMATION"; if (/marketing technology|martech|marketing operations/.test(value)) return "MARKETING_TECHNOLOGY"; if (/business systems|systems analyst|requirements translation/.test(value)) return "BUSINESS_SYSTEMS"; if (/governance|compliance|risk|audit/.test(value)) return "GOVERNANCE"; return "GENERAL_RESPONSIBILITY"; }
export function isCapabilityBearing(requirement) { const value = text(requirement?.requirementText); return value.length >= 28 && !BOILERPLATE.test(value); }
function scopeKey(requirement) { return [text(requirement?.requirementCategory), text(requirement?.requirementLevel), text(requirement?.importanceClassification), isSpecialist(requirement) ? "SPECIALIST" : "NON_SPECIALIST", capabilityFamily(requirement)].join("|"); }
function stableId(value) { return createHash("sha256").update(value).digest("hex").slice(0, 16); }

export function buildRequirementReuseAudit({ requirements = [], mappings = [], decisions = [] } = {}) {
  const byId = new Map(requirements.map((item) => [item.id || item.requirementId, item]));
  const currentById = new Map(mappings.map((item) => [item.requirementId, item]));
  const latest = new Map(); for (const decision of decisions) { const previous = latest.get(decision.requirementId); if (!previous || String(decision.createdAt || "") > String(previous.createdAt || "")) latest.set(decision.requirementId, decision); }
  const classes = new Map(); for (const requirement of requirements) { const normalized = normalizeRequirement(requirement); if (!normalized) continue; if (!classes.has(normalized)) classes.set(normalized, []); classes.get(normalized).push(requirement); }
  const reuse = []; const blocked = []; const sourceStats = { total: latest.size, positive: 0, sourceRequirementAvailable: 0, exactNormalizedDuplicate: 0, accepted: 0, rejectedSpecialist: 0, rejectedScope: 0, semanticOnly: 0, sourceUnavailable: 0 };
  for (const decision of latest.values()) {
    if (!POSITIVE.has(decision.state)) continue;
    sourceStats.positive += 1;
    const source = byId.get(decision.requirementId); if (!source) { sourceStats.sourceUnavailable += 1; blocked.push({ state: decision.state, classification: "SOURCE_REQUIREMENT_UNAVAILABLE" }); continue; }
    sourceStats.sourceRequirementAvailable += 1;
    const normalized = normalizeRequirement(source); const targets = (classes.get(normalized) || []).filter((item) => item.id !== source.id);
    if (!targets.length) { blocked.push({ state: decision.state, classification: "NO_EXACT_NORMALIZED_DUPLICATE" }); continue; }
    sourceStats.exactNormalizedDuplicate += targets.length;
    for (const target of targets) {
      const sameScope = scopeKey(source) === scopeKey(target); const sameSpecialist = isSpecialist(source) === isSpecialist(target);
      const accepted = sameScope && sameSpecialist;
      if (accepted) { sourceStats.accepted += 1; reuse.push({ reuseClass: "A_EXACT_NORMALIZED_DUPLICATE", state: decision.state, sourceRequirementId: source.id, targetRequirementId: target.id, sourceScope: scopeKey(source), targetScope: scopeKey(target), targetOpportunity: target.jobOpportunityId, sourceDecision: decision.decisionId }); }
      else { if (!sameSpecialist) sourceStats.rejectedSpecialist += 1; else sourceStats.rejectedScope += 1; blocked.push({ state: decision.state, classification: !sameSpecialist ? "SPECIALIST_CLASS_MISMATCH" : "SCOPE_OR_TYPE_MISMATCH" }); }
    }
  }
  const counts = { totalRequirements: requirements.length, capabilityBearing: requirements.filter(isCapabilityBearing).length, positiveMappedRequirements: 0, unmappedCapabilityBearing: 0, specialistUnmapped: 0, coreResponsibilityUnmapped: 0, preferredUnmapped: 0, hardRequirementUnmapped: 0 };
  const covered = new Set(); for (const requirement of requirements) { const mapping = currentById.get(requirement.id); if (mapping && !["UNKNOWN", "MISSING"].includes(mapping.classification)) covered.add(requirement.id); } for (const decision of latest.values()) if (POSITIVE.has(decision.state) && byId.has(decision.requirementId)) covered.add(decision.requirementId); for (const item of reuse) covered.add(item.targetRequirementId);
  counts.positiveMappedRequirements = [...covered].filter((id) => byId.has(id)).length; counts.unmappedCapabilityBearing = requirements.filter((r) => isCapabilityBearing(r) && !covered.has(r.id)).length;
  const familyCounts = {}; const questionCandidates = requirements.filter((r) => isCapabilityBearing(r) && !covered.has(r.id)); for (const requirement of questionCandidates) { const family = capabilityFamily(requirement); const key = `${family}|${isSpecialist(requirement) ? "SPECIALIST" : "GENERAL"}|${text(requirement.importanceClassification) || "UNKNOWN"}`; familyCounts[key] = (familyCounts[key] || 0) + 1; if (isSpecialist(requirement)) counts.specialistUnmapped += 1; if (/required|responsibility/i.test(text(requirement.requirementLevel))) counts.coreResponsibilityUnmapped += 1; if (/preferred|nice/i.test(`${requirement.importanceClassification} ${requirement.requirementLevel}`)) counts.preferredUnmapped += 1; if (/mandatory|required/i.test(`${requirement.importanceClassification} ${requirement.requirementLevel}`)) counts.hardRequirementUnmapped += 1; }
  const queue = Object.entries(familyCounts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 30).map(([key, count], index) => { const [family, specialist, importance] = key.split("|"); return { questionId: `review_gap_${String(index + 1).padStart(2, "0")}`, capabilityFamily: family, specialistClass: specialist, importance, candidateRequirementCount: count, question: `Which bounded ${family.toLowerCase().replaceAll("_", " ")} capability, responsibility, and scope does your existing authority support for this requirement family?`, allowedOutcomes: ["DIRECT", "TRANSFERABLE", "PARTIAL", "NO_SUPPORTED_EQUIVALENT", "NEEDS_MORE_EVIDENCE", "KEEP_UNRESOLVED"], selectionReason: "Deterministic recurrence and authority-family coverage; no human labels used." }; });
  return { sourceStats, counts, reuse, blocked, equivalenceClasses: { exactNormalizedDuplicate: reuse.filter((item) => item.reuseClass === "A_EXACT_NORMALIZED_DUPLICATE").length, canonicalTemplate: 0, boundedStructuralVariant: 0, semanticCandidateOnly: Math.max(0, counts.unmappedCapabilityBearing - reuse.length) }, familyCounts, queue, stableDigest: stableId(JSON.stringify({ sourceStats, counts, reuse, queue })) };
}
