import { parseJobDescription } from "./jobProduct.mjs";
import { inferRoleFamiliesFromRequirementConcept, inferRoleFamiliesFromText } from "./discoveryRoleFamilies.mjs";
import { isDiscoveryProviderAuthorized } from "./discoveryProviderAuthorization.mjs";
import { classifyRoleCompatibility } from "./roleIntent.mjs";

const DIRECT_STATES = new Set(["VERIFIED_DIRECT"]);
const TRANSFERABLE_STATES = new Set(["VERIFIED_TRANSFERABLE"]);
const PARTIAL_STATES = new Set(["PARTIALLY_SUPPORTED"]);

function clean(value, limit = 50000) { return String(value || "").replace(/\s+/g, " ").trim().slice(0, limit); }
function cleanDescription(value) { return String(value || "").replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ").trim().slice(0, 50000); }
function dateOrNull(value) { const date = value ? new Date(value) : null; return date && Number.isFinite(date.getTime()) ? date : null; }
function daysBetween(a, b) { return Math.floor((a.getTime() - b.getTime()) / 86400000); }
function providerKey(value) { return clean(value, 120).toUpperCase().replace(/[^A-Z0-9]+/g, "_"); }
function resultKey(item) { return item.providerJobId || item.externalOpportunityId || item.sourceUrl || `${item.title}:${item.company}`; }

export function normalizeDiscoveryResult(input = {}) {
  const provider = clean(input.provider || input.sourceProvider || input.sourceName || "UNKNOWN", 120) || "UNKNOWN";
  const providerJobId = clean(input.providerJobId || input.externalOpportunityId, 300) || null;
  const title = clean(input.title, 240) || null;
  const company = clean(input.company, 240) || null;
  const location = clean(input.location, 240) || null;
  const description = cleanDescription(input.description) || null;
  const workMode = clean(input.workMode || (/remote/i.test([title, location, description].filter(Boolean).join(" ")) ? "remote" : ""), 80) || null;
  return {
    provider,
    providerKey: providerKey(provider),
    providerJobId,
    sourceProvider: provider,
    externalOpportunityId: providerJobId,
    title,
    company,
    location,
    workMode,
    employmentType: clean(input.employmentType, 120) || null,
    salaryMin: Number.isFinite(Number(input.salaryMin)) ? Number(input.salaryMin) : null,
    salaryMax: Number.isFinite(Number(input.salaryMax)) ? Number(input.salaryMax) : null,
    postedAt: input.postedAt || null,
    closingAt: input.closingAt || null,
    description,
    sourceUrl: clean(input.sourceUrl, 1000) || null,
    providerMetadata: input.providerMetadata || {},
    retrievedAt: input.retrievedAt || new Date().toISOString(),
    persisted: false,
  };
}

function parseRequirements(item) {
  if (!item.description) return [];
  try {
    return parseJobDescription({ title: item.title, company: item.company, location: item.location, description: item.description, sourceUrl: item.sourceUrl, sourceType: item.provider }).requirements;
  } catch {
    return [];
  }
}

function capabilityState(capability) {
  return String(capability?.authorityState || "").toUpperCase();
}

function relationshipFor(requirement, capabilitiesByKey) {
  if (requirement.specialist) return { ...requirement, state: "SPECIALIST_BLOCKED", capabilityLabel: null };
  const capability = capabilitiesByKey.get(requirement.conceptKey);
  if (!capability) return { ...requirement, state: "UNKNOWN", capabilityLabel: null };
  const state = capabilityState(capability);
  if (DIRECT_STATES.has(state)) return { ...requirement, state: "DIRECT", capabilityLabel: clean(capability.label || capability.capabilityKey, 160) };
  if (TRANSFERABLE_STATES.has(state)) return { ...requirement, state: "TRANSFERABLE", capabilityLabel: clean(capability.label || capability.capabilityKey, 160) };
  if (PARTIAL_STATES.has(state)) return { ...requirement, state: "PARTIAL", capabilityLabel: clean(capability.label || capability.capabilityKey, 160) };
  return { ...requirement, state: "UNKNOWN", capabilityLabel: null };
}

function uniqueLabels(items) {
  return [...new Set(items.map((item) => item.capabilityLabel || item.text).map((item) => clean(item, 120)).filter(Boolean))].slice(0, 4);
}

function roleFamiliesForResult(item, requirements) {
  const fromText = inferRoleFamiliesFromText([item.title, item.description].filter(Boolean).join(" "));
  const fromRequirements = requirements.flatMap((requirement) => inferRoleFamiliesFromRequirementConcept(requirement.conceptKey));
  return [...new Map([...fromText, ...fromRequirements].map((family) => [family.key, family])).values()];
}

function qualityFor({ item, intent, requirements, relationships, existingStatus, now, roleCompatibility }) {
  const posted = dateOrNull(item.postedAt);
  const closing = dateOrNull(item.closingAt);
  const text = [item.title, item.location, item.employmentType, item.description].filter(Boolean).join(" ");
  const preferenceLocation = clean(intent.criteria?.location, 120).toLowerCase();
  const remotePreference = intent.criteria?.remotePreference || "any";
  const sourceIdentity = Boolean(item.sourceUrl || item.providerJobId || item.provider);
  const isRemote = /remote|anywhere/i.test([item.workMode, item.location, item.description].filter(Boolean).join(" "));
  const expired = closing ? closing < now : false;
  const stale = posted ? daysBetween(now, posted) > 90 : false;
  const lowInformation = !item.description || item.description.length < 80 || requirements.length === 0;
  const wrongWorkMode = remotePreference === "remote" ? !isRemote && Boolean(item.location) : remotePreference === "nonRemote" ? isRemote : false;
  const wrongLocation = Boolean(preferenceLocation && !isRemote && item.location && !item.location.toLowerCase().includes(preferenceLocation.split(",")[0]));
  const internship = /\bintern(ship)?\b|co-?op|student trainee|new grad/i.test(text);
  const commissionOnly = /commission[- ]only|1099 only|independent contractor/i.test(text);
  const specialist = relationships.some((item) => item.state === "SPECIALIST_BLOCKED" && item.importance === "REQUIRED");
  const roleFamilies = roleFamiliesForResult(item, requirements);
  const intentFamilies = new Set((intent.themes || []).map((theme) => theme.roleFamily).filter((family) => family !== "CUSTOM_TARGET"));
  const roleFamilyMatch = !intentFamilies.size || roleFamilies.some((family) => intentFamilies.has(family.key));
  const evidenceBacked = relationships.some((relationship) => ["DIRECT", "TRANSFERABLE", "PARTIAL"].includes(relationship.state));
  const gates = {
    authorizedSource: isDiscoveryProviderAuthorized(item.providerKey || item.provider),
    sourceIdentity,
    usefulDescription: !lowInformation,
    duplicateFree: !existingStatus,
    freshOpen: !expired && !stale,
    locationFit: !wrongLocation,
    workModeFit: !wrongWorkMode,
    plausibleRoleFamily: roleFamilyMatch,
    plausibleSeniority: !internship,
    employmentTypeCompatible: !commissionOnly,
    noUnsupportedSpecialistHardBlocker: !specialist,
    evidenceBackedAlignment: evidenceBacked,
    roleCompatible: roleCompatibility.classification !== "INCOMPATIBLE",
    primaryRoleMatch: roleCompatibility.classification === "EXACT_OR_NEAR_TITLE" || roleCompatibility.classification === "COMPATIBLE_ADJACENT",
  };
  const penalties = [];
  if (!gates.authorizedSource) penalties.push("Source is not authorized for beta discovery");
  if (!gates.usefulDescription) penalties.push("Low-information posting");
  if (!gates.duplicateFree) penalties.push("Already saved or reviewed");
  if (!gates.freshOpen) penalties.push(expired ? "Posting appears closed" : "Posting appears stale");
  if (!gates.locationFit) penalties.push("Location does not match current preference");
  if (!gates.workModeFit) penalties.push("Work mode does not match current preference");
  if (!gates.plausibleRoleFamily) penalties.push("Role family is weakly related to current search intent");
  if (!gates.plausibleSeniority) penalties.push("Seniority appears below current target");
  if (!gates.employmentTypeCompatible) penalties.push("Employment type appears incompatible");
  if (!gates.noUnsupportedSpecialistHardBlocker) penalties.push("Unsupported specialist hard requirement");
  if (!gates.evidenceBackedAlignment) penalties.push("No reviewed evidence alignment yet");
  if (roleCompatibility.classification === "COMPATIBLE_ADJACENT") penalties.push("Adjacent to the requested role");
  if (roleCompatibility.classification === "ROLE_FAMILY_ONLY") penalties.push("Only the role family matches the requested role");
  if (roleCompatibility.classification === "INCOMPATIBLE") penalties.push("Title does not match the requested role");
  return { gates, penalties, roleFamilies: roleFamilies.map((family) => family.key) };
}

function scoreResult({ item, intent, relationships, quality, now }) {
  const required = relationships.filter((item) => item.importance === "REQUIRED");
  const preferred = relationships.filter((item) => item.importance !== "REQUIRED");
  const count = (items, state) => items.filter((item) => item.state === state).length;
  const directEvidence = count(relationships, "DIRECT");
  const transferableEvidence = count(relationships, "TRANSFERABLE");
  const partialEvidence = count(relationships, "PARTIAL");
  const unsupportedHardRequirement = required.filter((item) => ["UNKNOWN", "PARTIAL", "SPECIALIST_BLOCKED", "SCOPE_BLOCKED"].includes(item.state)).length;
  const qualificationScore = Math.max(0, Math.min(100,
    count(required, "DIRECT") * 18 +
    count(preferred, "DIRECT") * 12 +
    count(required, "TRANSFERABLE") * 10 +
    count(preferred, "TRANSFERABLE") * 6 +
    partialEvidence * 3 -
    count(required, "SPECIALIST_BLOCKED") * 30 -
    count(required, "UNKNOWN") * 6
  ));
  const intentFamilies = new Set((intent.themes || []).map((theme) => theme.roleFamily));
  const roleCompatibility = quality.roleCompatibility;
  const roleFit = roleCompatibility === "EXACT_OR_NEAR_TITLE" ? 45 : roleCompatibility === "COMPATIBLE_ADJACENT" ? 22 : roleCompatibility === "ROLE_FAMILY_ONLY" ? 5 : 0;
  const explicitTarget = (intent.themes || []).some((theme) => theme.source === "EXPLICIT_TARGET" && (quality.roleFamilies.includes(theme.roleFamily) || theme.roleFamily === "CUSTOM_TARGET")) ? 15 : 0;
  const salaryFit = !intent.criteria?.salaryMin || !item.salaryMin || item.salaryMin >= intent.criteria.salaryMin ? 10 : 0;
  const posted = dateOrNull(item.postedAt);
  const freshness = posted ? Math.max(0, 10 - Math.min(10, Math.floor(daysBetween(now, posted) / 14))) : 5;
  const personalScore = Math.max(0, Math.min(100,
    roleFit +
    explicitTarget +
    (quality.gates.locationFit ? 15 : 0) +
    (quality.gates.workModeFit ? 15 : 0) +
    salaryFit +
    freshness +
    (quality.gates.employmentTypeCompatible ? 5 : 0)
  ));
  const hardPenalty = quality.penalties.length * 8;
  const score = Math.max(0, Math.min(100, Math.round(qualificationScore * 0.62 + personalScore * 0.38 - hardPenalty)));
  return { qualificationScore, personalScore, score, directEvidence, transferableEvidence, partialEvidence, unsupportedHardRequirement, requirementCount: relationships.length };
}

function recommendationFor(scoring, quality) {
  if (!quality.gates.authorizedSource || !quality.gates.usefulDescription || !quality.gates.duplicateFree || !quality.gates.noUnsupportedSpecialistHardBlocker || !quality.gates.roleCompatible || !quality.gates.primaryRoleMatch) return "LOWER_PRIORITY";
  if (scoring.directEvidence >= 2 && scoring.unsupportedHardRequirement === 0 && scoring.personalScore >= 45) return "STRONG_CANDIDATE";
  if (scoring.directEvidence + scoring.transferableEvidence >= 2 && scoring.unsupportedHardRequirement <= 1) return "CONSIDER";
  return "LOWER_PRIORITY";
}

function explanationFor({ item, relationships, scoring, quality, recommendation, roleCompatibility, intent }) {
  const direct = uniqueLabels(relationships.filter((relationship) => relationship.state === "DIRECT"));
  const transferable = uniqueLabels(relationships.filter((relationship) => relationship.state === "TRANSFERABLE"));
  const gaps = uniqueLabels(relationships.filter((relationship) => ["UNKNOWN", "PARTIAL", "SPECIALIST_BLOCKED", "SCOPE_BLOCKED"].includes(relationship.state)));
  return {
    whyFound: direct.length || transferable.length ? "CareerOS found reviewed evidence that may align with this role." : "CareerOS found this through the current search criteria, but reviewed evidence alignment is limited.",
    strongEvidence: direct,
    transferableEvidence: transferable,
    importantGaps: gaps,
    lowerPriorityBecause: quality.penalties,
    recommendation,
    requestedRole: intent.roleIntent?.requestedTitle || "",
    roleAlignment: roleCompatibility.classification,
    seniorityAligned: roleCompatibility.seniorityMatch,
    specializationAligned: roleCompatibility.specializationMatch,
    summary: `${item.title || "This opportunity"}: ${recommendation.replace(/_/g, " ").toLowerCase()}.`,
  };
}

export function rankDiscoveryResults({ intent = {}, capabilities = [], results = [], existingStatuses = {}, now = new Date() } = {}) {
  const capabilitiesByKey = new Map((capabilities || []).map((capability) => [clean(capability.capabilityKey || capability.key, 120), capability]));
  const normalized = results.map(normalizeDiscoveryResult);
  const ranked = normalized.map((item) => {
    const requirements = parseRequirements(item);
    const relationships = requirements.map((requirement) => relationshipFor(requirement, capabilitiesByKey));
    const existingStatus = existingStatuses[item.providerJobId] || existingStatuses[item.externalOpportunityId] || existingStatuses[item.sourceUrl] || existingStatuses[resultKey(item)] || null;
    const roleCompatibility = classifyRoleCompatibility(intent.roleIntent || intent.criteria || {}, item.title);
    const quality = qualityFor({ item, intent, requirements, relationships, existingStatus, now, roleCompatibility });
    quality.roleCompatibility = roleCompatibility.classification;
    const scoring = scoreResult({ item, intent, relationships, quality, now });
    const recommendation = recommendationFor(scoring, quality);
    return {
      ...item,
      existingState: existingStatus,
      requirements,
      relationships,
      quality,
      qualification: {
        score: scoring.qualificationScore,
        directEvidence: scoring.directEvidence,
        transferableEvidence: scoring.transferableEvidence,
        partialEvidence: scoring.partialEvidence,
        unsupportedHardRequirement: scoring.unsupportedHardRequirement,
        requirementCount: scoring.requirementCount,
      },
      personalRelevance: { score: scoring.personalScore },
      rankScore: scoring.score,
      recommendation,
      negativeSignals: quality.penalties,
      roleCompatibility,
      discoveryExplanation: explanationFor({ item, relationships, scoring, quality, recommendation, roleCompatibility, intent }),
    };
  }).sort((a, b) => {
    const priority = { EXACT_OR_NEAR_TITLE: 3, COMPATIBLE_ADJACENT: 2, ROLE_FAMILY_ONLY: 1, INCOMPATIBLE: 0 };
    return (priority[b.roleCompatibility.classification] || 0) - (priority[a.roleCompatibility.classification] || 0) || b.rankScore - a.rankScore || Number(Boolean(b.qualification.directEvidence)) - Number(Boolean(a.qualification.directEvidence));
  });
  return { results: ranked };
}

const DIAGNOSTIC_GATE_CODES = [
  "authorizedSource",
  "sourceIdentity",
  "usefulDescription",
  "duplicateFree",
  "freshOpen",
  "locationFit",
  "workModeFit",
  "plausibleRoleFamily",
  "plausibleSeniority",
  "employmentTypeCompatible",
  "noUnsupportedSpecialistHardBlocker",
  "evidenceBackedAlignment",
];

/** @param {{providerCount?: number, rankedResults?: Array<any>, explicitTarget?: string}} input */
export function buildDiscoveryDiagnostics({ providerCount = 0, rankedResults = [], explicitTarget = "" } = {}) {
  const compatibilityCounts = { EXACT_OR_NEAR_TITLE: 0, COMPATIBLE_ADJACENT: 0, ROLE_FAMILY_ONLY: 0, INCOMPATIBLE: 0 };
  const rejectionCounts = Object.fromEntries(DIAGNOSTIC_GATE_CODES.map((code) => [code, 0]));
  let baselineEligibleCount = 0;
  for (const result of rankedResults) {
    const classification = result.roleCompatibility?.classification || "INCOMPATIBLE";
    if (Object.hasOwn(compatibilityCounts, classification)) compatibilityCounts[classification] += 1;
    const gates = result.quality?.gates || {};
    const baselineEligible = DIAGNOSTIC_GATE_CODES.every((code) => gates[code] !== false);
    if (baselineEligible) baselineEligibleCount += 1;
    for (const code of DIAGNOSTIC_GATE_CODES) if (gates[code] === false) rejectionCounts[code] += 1;
  }
  const p0RoleGateSurvivors = explicitTarget
    ? rankedResults.filter((result) => !["INCOMPATIBLE", "ROLE_FAMILY_ONLY"].includes(result.roleCompatibility?.classification)).length
    : rankedResults.length;
  return {
    providerResults: providerCount,
    normalizedResults: rankedResults.length,
    baselineEligibleResults: baselineEligibleCount,
    compatibilityCounts,
    rejectionCounts,
    p0RoleGateSurvivors,
    finalRankedResults: p0RoleGateSurvivors,
  };
}
