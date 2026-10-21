import { listAvailableAutomaticDiscoverySources } from "./sourceAuthorityRegistry.mjs";

const PROVIDERS = Object.freeze({
  USAJOBS: {
    classification: "WRITTEN_APPROVAL_REQUIRED",
    evidence: "Repository authority does not prove written OPM/USAJOBS approval for multi-user CareerOS private-beta automatic discovery.",
    requiredAuthority: ["written OPM/USAJOBS approval for multi-user CareerOS use", "retention rights", "display and attribution rights", "derived analysis rights"],
  },
  USER_SUPPLIED: {
    classification: "AUTHORIZED_FOR_BETA",
    evidence: "User-provided pasted/imported opportunity content is authorized by the existing CareerOS opportunity inbox boundary.",
    requiredAuthority: [],
  },
  GREENHOUSE: {
    classification: "TECHNICALLY_AVAILABLE_BUT_AUTHORIZATION_UNPROVEN",
    evidence: "Public board APIs are technically documented, but project authority does not establish cross-employer CareerOS private-beta commercial indexing rights.",
    requiredAuthority: ["written Greenhouse or participating-employer permission", "retention rights", "display and attribution rights", "derived analysis rights"],
  },
  ASHBY: {
    classification: "TECHNICALLY_AVAILABLE_BUT_AUTHORIZATION_UNPROVEN",
    evidence: "Project authority records PARTNER_PERMISSION_REQUIRED for cross-employer CareerOS use.",
    requiredAuthority: ["written Ashby or participating-employer permission", "retention rights", "display and attribution rights", "derived analysis rights"],
  },
  LEVER: {
    classification: "TECHNICALLY_AVAILABLE_BUT_AUTHORIZATION_UNPROVEN",
    evidence: "Project authority records LEVER_PARTNER_PERMISSION_REQUIRED for commercial use.",
    requiredAuthority: ["Lever partner or employer permission", "retention rights", "display and attribution rights", "derived analysis rights"],
  },
  JOOBLE: {
    classification: "TECHNICALLY_AVAILABLE_BUT_AUTHORIZATION_UNPROVEN",
    evidence: "Technical authentication has been proven historically, but partner/commercial multi-user authorization remains unresolved.",
    requiredAuthority: ["Jooble partner agreement", "multi-user private-beta use", "retention rights", "derived analysis rights"],
  },
  ADZUNA: {
    classification: "TECHNICALLY_AVAILABLE_BUT_AUTHORIZATION_UNPROVEN",
    evidence: "Project authority identifies a commercial API path but requires written consent/license beyond validation-trial use.",
    requiredAuthority: ["Adzuna commercial license or written consent", "private-beta use", "retention rights", "attribution/removal requirements", "derived analysis rights"],
  },
  THEIRSTACK: {
    classification: "TECHNICALLY_AVAILABLE_BUT_AUTHORIZATION_UNPROVEN",
    evidence: "Commercial API/datasets exist, but project authority requires contract review for retention and display.",
    requiredAuthority: ["TheirStack contract", "multi-user private-beta use", "retention rights", "display rights", "derived analysis rights"],
  },
  LIGHTCAST: {
    classification: "TECHNICALLY_AVAILABLE_BUT_AUTHORIZATION_UNPROVEN",
    evidence: "Licensed labor-market APIs exist, but no CareerOS license scope is recorded for raw posting discovery and explanations.",
    requiredAuthority: ["Lightcast license", "raw posting or enrichment scope", "retention rights", "derived analysis rights"],
  },
  THE_MUSE: {
    classification: "TECHNICALLY_AVAILABLE_BUT_AUTHORIZATION_UNPROVEN",
    evidence: "API terms support app display with link-back, but derived commercial analysis needs written confirmation.",
    requiredAuthority: ["The Muse written confirmation", "private-beta use", "retention rights", "derived analysis rights"],
  },
  SMARTRECRUITERS: {
    classification: "TECHNICALLY_AVAILABLE_BUT_AUTHORIZATION_UNPROVEN",
    evidence: "Project authority records PARTNER_PROGRAM_REQUIRED for cross-employer commercial discovery.",
    requiredAuthority: ["SmartRecruiters partner or employer permission", "retention rights", "display rights", "derived analysis rights"],
  },
});

export function classifyDiscoveryProviders({ registry } = {}) {
  const authorizedEmployerSources = listAvailableAutomaticDiscoverySources(registry);
  const sourceSpecificProviders = new Set(authorizedEmployerSources.map((source) => source.provider));
  const providers = Object.fromEntries(Object.entries(PROVIDERS).map(([key, value]) => [key, { ...value, requiredAuthority: [...value.requiredAuthority] }]));
  if (sourceSpecificProviders.has("LEVER")) {
    const leverSources = authorizedEmployerSources.filter((source) => source.provider === "LEVER");
    providers.LEVER = {
      ...providers.LEVER,
      classification: "SOURCE_SPECIFIC_AUTHORITY_AVAILABLE",
      evidence: "CareerOS has source-specific authority for enabled Lever employer source(s). This does not authorize unregistered Lever employers.",
      requiredAuthority: ["each additional Lever employer source still requires source-specific authority review and explicit registry enablement"],
      authorizedSources: leverSources.map((source) => ({
        sourceId: source.sourceId,
        employerName: source.employerName,
        interfaceType: source.interfaceType,
        authorityStatus: source.authorityStatus,
      })),
    };
  }

  const entries = Object.entries(providers);
  const authorizedForBeta = entries.filter(([, value]) => value.classification === "AUTHORIZED_FOR_BETA").map(([key]) => key);
  const sourceSpecificAuthorized = entries.filter(([, value]) => value.classification === "SOURCE_SPECIFIC_AUTHORITY_AVAILABLE").map(([key]) => key);
  const activeClassifications = new Set(["AUTHORIZED_FOR_BETA", "SOURCE_SPECIFIC_AUTHORITY_AVAILABLE"]);
  const blockedByAuthorization = entries.filter(([, value]) => !activeClassifications.has(value.classification)).map(([key]) => key);
  const privateSectorAuthorized = [...authorizedForBeta.filter((provider) => !["USAJOBS", "USER_SUPPLIED"].includes(provider)), ...sourceSpecificAuthorized];
  return {
    providers,
    authorizedForBeta,
    sourceSpecificAuthorized,
    authorizedEmployerSources,
    blockedByAuthorization,
    privateSectorAuthorized,
    newProviderActivation: privateSectorAuthorized.length ? "AUTHORIZED" : "BLOCKED_PENDING_AUTHORIZATION",
  };
}

export function selectedAuthorizedPrivateSectorProvider(gate = classifyDiscoveryProviders()) {
  return gate.privateSectorAuthorized?.[0] || null;
}

export function isDiscoveryProviderAuthorized(provider) {
  const key = String(provider || "").trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_");
  return PROVIDERS[key]?.classification === "AUTHORIZED_FOR_BETA";
}
