import { boundUsajobsSearch } from "./usajobsDiscovery.mjs";
import { inferRoleFamiliesFromText, roleFamiliesForCapability, roleFamilyForKey } from "./discoveryRoleFamilies.mjs";
import { normalizeRoleIntent, publicRoleIntent } from "./roleIntent.mjs";

const SAFE_CAPABILITY_STATES = new Set(["VERIFIED_DIRECT", "VERIFIED_TRANSFERABLE", "PARTIALLY_SUPPORTED"]);
const CONFIRMED_FACT_STATE = "CUSTOMER_CONFIRMED_SOURCE_BACKED";
const SAFE_CONTEXT_STATES = new Set(["CUSTOMER_CONFIRMED", "CUSTOMER_CORRECTED"]);

function clean(value, limit = 500) { return String(value || "").replace(/\s+/g, " ").trim().slice(0, limit); }
function keyFor(theme) { return `${theme.source}:${theme.roleFamily}`; }
function safeFact(fact = {}) {
  const statement = clean(fact.statement, 1000);
  return String(fact.authorityState || "").toUpperCase() === CONFIRMED_FACT_STATE && statement && !/[?]\s*$/.test(statement) && !/^(what|how|why|have you|tell me|describe)\b/i.test(statement);
}
function safeCapability(capability = {}) {
  const authorityState = String(capability.authorityState || "").toUpperCase();
  return SAFE_CAPABILITY_STATES.has(authorityState);
}
function sourceForCapability(capability = {}) {
  return String(capability.authorityState || "").toUpperCase() === "VERIFIED_DIRECT" ? "DIRECT_EVIDENCE" : "TRANSFERABLE_EVIDENCE";
}

function theme(roleFamily, source, reason, evidence = {}) {
  const family = typeof roleFamily === "string" ? roleFamilyForKey(roleFamily) : roleFamily;
  if (!family) return null;
  return {
    roleFamily: family.key,
    label: family.label,
    query: family.query,
    source,
    reason,
    evidence: {
      capabilityKeys: [...new Set(evidence.capabilityKeys || [])],
      factCount: evidence.factCount || 0,
      contextClaimCount: evidence.contextClaimCount || 0,
    },
  };
}

function explicitTargetThemes(preferences) {
  const target = clean(preferences.requestedTitle, 240);
  const keywords = clean(preferences.keywords, 240);
  const explicit = target || keywords;
  if (!explicit) return [];
  const families = inferRoleFamiliesFromText(explicit);
  if (!families.length) return [theme("PROJECT_MANAGEMENT", "EXPLICIT_TARGET", "Customer-entered target role is preserved.", { factCount: 0 })].map((item) => ({ ...item, roleFamily: "CUSTOM_TARGET", label: "Customer target", query: explicit }));
  return families.map((family) => theme(family, "EXPLICIT_TARGET", "Customer-entered target role is preserved."));
}

function evidenceThemes(facts, capabilities) {
  const confirmedFacts = (facts || []).filter(safeFact);
  const result = [];
  for (const capability of (capabilities || []).filter(safeCapability)) {
    const capabilityFamilies = roleFamiliesForCapability(capability);
    const source = sourceForCapability(capability);
    for (const family of capabilityFamilies) {
      result.push(theme(family, source, `${family.label} is supported by reviewed capability authority.`, {
        capabilityKeys: [clean(capability.capabilityKey || capability.key, 120)],
        factCount: Array.isArray(capability.provenance?.factIds) ? capability.provenance.factIds.length : confirmedFacts.length ? 1 : 0,
      }));
    }
  }
  if (!result.length) {
    for (const fact of confirmedFacts) {
      for (const family of inferRoleFamiliesFromText(fact.statement)) {
        result.push(theme(family, "DIRECT_EVIDENCE", `${family.label} is supported by confirmed career evidence.`, { factCount: 1 }));
      }
    }
  }
  return result;
}

function contextThemes(contextClaims) {
  const claims = (contextClaims || []).filter((claim) => SAFE_CONTEXT_STATES.has(String(claim.authorityState || "").toUpperCase()) && String(claim.status || "").toUpperCase() === "ACTIVE");
  return claims.flatMap((claim) => {
    const value = clean(claim.displayValue, 240).toLowerCase();
    if (claim.dimension === "DOMAIN" && /marketing technology|martech/.test(value)) return [theme("MARKETING_TECHNOLOGY", "REVIEWED_CONTEXT", "Reviewed context identifies marketing technology domain experience.", { contextClaimCount: 1 })];
    if (claim.dimension === "DOMAIN" && /ecommerce|business systems|financial services/.test(value)) return [theme("BUSINESS_TECHNOLOGY", "REVIEWED_CONTEXT", "Reviewed context identifies business technology domain experience.", { contextClaimCount: 1 })];
    return [];
  });
}

export function buildPersonalizedSearchIntent({ preferences = {}, facts = [], capabilities = [], contextClaims = [] } = {}) {
  const criteria = boundUsajobsSearch(preferences);
  const roleIntent = normalizeRoleIntent({ ...preferences, keywords: criteria.keywords, location: criteria.location, remotePreference: criteria.remotePreference });
  const rawThemes = [...explicitTargetThemes(preferences), ...evidenceThemes(facts, capabilities), ...contextThemes(contextClaims)].filter(Boolean);
  const themes = [];
  const seen = new Set();
  for (const item of rawThemes) {
    const key = keyFor(item);
    if (seen.has(key)) continue;
    seen.add(key);
    themes.push(item);
  }
  return {
    version: "CAREEROS_DISCOVERY_SEARCH_INTENT_V1",
    criteria,
    roleIntent,
    themes: themes.slice(0, 8),
    authority: {
      factsConsidered: (facts || []).filter(safeFact).length,
      capabilities: (capabilities || []).filter(safeCapability).map((item) => ({
        capabilityKey: clean(item.capabilityKey || item.key, 120),
        label: clean(item.label, 160),
        authorityState: String(item.authorityState || "").toUpperCase(),
        provenance: { factIds: Array.isArray(item.provenance?.factIds) ? [...item.provenance.factIds] : [] },
      })),
      contextClaimsConsidered: (contextClaims || []).filter((claim) => SAFE_CONTEXT_STATES.has(String(claim.authorityState || "").toUpperCase()) && String(claim.status || "").toUpperCase() === "ACTIVE").length,
    },
    providerRequestBoundary: "GENERIC_DERIVED_TERMS_ONLY_NO_PRIVATE_EVIDENCE",
  };
}

export function buildProviderCriteriaForIntent(intent = {}) {
  const criteria = boundUsajobsSearch(intent.criteria || {});
  const explicit = clean(criteria.keywords, 240);
  const derived = (intent.themes || []).filter((theme) => theme.source !== "EXPLICIT_TARGET").map((theme) => clean(theme.query, 120)).filter(Boolean);
  const target = clean(intent.roleIntent?.requestedTitle, 240);
  const keywords = target ? target === explicit ? target : [target, explicit].filter(Boolean).join(" ") : explicit || [...new Set(derived)].slice(0, 3).join(" ");
  return { ...criteria, keywords: clean(keywords, 240) };
}

export function publicSearchIntent(intent = {}) {
  return {
    version: intent.version,
    providerRequestBoundary: intent.providerRequestBoundary,
    roleIntent: publicRoleIntent(intent.roleIntent || {}),
    themes: (intent.themes || []).map(({ roleFamily, label, query, source, reason }) => ({ roleFamily, label, query, source, reason })),
  };
}
