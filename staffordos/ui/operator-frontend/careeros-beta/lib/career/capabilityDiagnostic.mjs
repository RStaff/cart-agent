import { deriveCapabilityCandidates, refreshCapabilityAuthorityState } from "./capabilityCatalog.mjs";
import { capabilityNeedsReview } from "./capabilityReview.mjs";

function statusCount(rows, statuses) {
  return rows.filter((row) => statuses.includes(String(row.status || "").toUpperCase())).length;
}

function activeDecisions(rows) {
  return new Map(rows.filter((row) => !row.supersededAt).map((row) => [row.capabilityId, row]));
}

export function buildCapabilityDiagnostic({ profile, sources, candidates, careerFacts, authorities, decisions }) {
  const profileId = profile?.id || null;
  const profileFacts = careerFacts.filter((fact) => fact.profileId === profileId);
  const profileSources = sources.filter((source) => source.profileId === profileId);
  const confirmedFacts = profileFacts.filter((fact) => fact.authorityState === "CUSTOMER_CONFIRMED_SOURCE_BACKED");
  const derivedCandidates = deriveCapabilityCandidates(confirmedFacts);
  const authorityByKey = new Map(authorities.filter((row) => row.profileId === profileId).map((row) => [row.capabilityKey, row]));
  const decisionsByCapability = activeDecisions(decisions);
  const capabilityRows = derivedCandidates.map((candidate) => {
    const authority = authorityByKey.get(candidate.capabilityKey) || null;
    const decision = authority ? decisionsByCapability.get(authority.id) || null : null;
    const expectedState = refreshCapabilityAuthorityState(authority, candidate);
    const actionable = !decision?.answer || expectedState === "NEEDS_MORE_EVIDENCE";
    return {
      capabilityKey: candidate.capabilityKey,
      label: candidate.label,
      matched: true,
      authorityExists: Boolean(authority),
      authorityState: authority?.authorityState || null,
      expectedAuthorityState: expectedState,
      newEvidencePresent: Boolean(authority && expectedState === "NEEDS_MORE_EVIDENCE" && authority.authorityState !== "NEEDS_MORE_EVIDENCE"),
      decisionExists: Boolean(decision),
      decision: decision?.answer || null,
      actionable,
      confirmedEvidenceCount: candidate.factIds.length,
    };
  });
  const storedCapabilityRows = authorities.filter((row) => row.profileId === profileId).map((authority) => {
    const decision = decisionsByCapability.get(authority.id) || null;
    return {
      capabilityKey: authority.capabilityKey,
      label: authority.label,
      matched: false,
      authorityExists: true,
      authorityState: authority.authorityState,
      expectedAuthorityState: authority.authorityState,
      newEvidencePresent: false,
      decisionExists: Boolean(decision),
      decision: decision?.answer || null,
      actionable: capabilityNeedsReview({ authorityState: authority.authorityState, decision: decision ? { answer: decision.answer } : null }),
      confirmedEvidenceCount: Array.isArray(authority.provenance?.factIds) ? authority.provenance.factIds.length : 0,
    };
  });
  const capabilities = [...new Map([...storedCapabilityRows, ...capabilityRows].map((row) => [row.capabilityKey, row])).values()];
  const actionableCapabilityCount = capabilities.filter((row) => row.actionable).length;
  return {
    profileResolved: Boolean(profile),
    careerSources: { count: profileSources.length, recentRelevantSourceExists: profileSources.length > 0 },
    candidates: {
      totalRelevant: candidates.filter((candidate) => candidate.profileId === profileId).length,
      confirmed: statusCount(candidates, ["CONFIRMED", "CORRECTED"]),
      corrected: statusCount(candidates, ["CORRECTED"]),
      rejected: statusCount(candidates, ["REJECTED"]),
      laterOrDeferred: statusCount(candidates, ["LATER", "DEFERRED"]),
      pending: statusCount(candidates, ["PROPOSED", "NEEDS_REVIEW", "PENDING"]),
    },
    careerFacts: {
      total: profileFacts.length,
      relevantConfirmedFactExists: confirmedFacts.length > 0,
      confirmedCount: confirmedFacts.length,
      confirmationLevels: Object.fromEntries([...new Set(profileFacts.map((fact) => fact.authorityState).filter(Boolean))].map((state) => [state, profileFacts.filter((fact) => fact.authorityState === state).length])),
      sameProfile: Boolean(profile) && profileFacts.every((fact) => fact.profileId === profileId),
    },
    capabilityDerivation: capabilities,
    capabilityPage: {
      derivedCandidateCount: derivedCandidates.length,
      storedAuthorityCount: authorities.filter((row) => row.profileId === profileId).length,
      returnedCapabilityCount: capabilities.length,
      actionableCapabilityCount,
      completionShouldRender: capabilities.length > 0 && actionableCapabilityCount === 0,
    },
  };
}
