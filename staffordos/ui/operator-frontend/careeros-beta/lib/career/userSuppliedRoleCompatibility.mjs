import { classifyRoleCompatibility, normalizeRoleIntent } from "./roleIntent.mjs";

const EXPLANATIONS = {
  EXACT_OR_NEAR_TITLE: "The opportunity title matches or closely matches your requested role.",
  COMPATIBLE_ADJACENT: "The opportunity is adjacent to your requested role, but is not an exact title match.",
  ROLE_FAMILY_ONLY: "The opportunity is in the same broad role family but does not closely match your requested role.",
  INCOMPATIBLE: "The opportunity title differs from your requested role.",
};

export function classifyUserSuppliedRole({ preference = {}, opportunityTitle = "" } = {}) {
  const intent = normalizeRoleIntent({
    requestedTitle: preference.requestedTitle,
    keywords: preference.keywords,
    location: preference.location,
    remotePreference: preference.remotePreference,
    excludedTitles: preference.excludedTitles,
  });
  if (!intent.requestedTitle) return { status: "ROLE_TARGET_NOT_CONFIGURED", requestedRole: null, compatibility: null, explanation: "Set a target role to compare this opportunity with your job search intent.", specializationAligned: null, seniorityAligned: null };
  const result = classifyRoleCompatibility(intent, opportunityTitle);
  return { status: "ROLE_TARGET_CONFIGURED", requestedRole: intent.requestedTitle, compatibility: result.classification, explanation: EXPLANATIONS[result.classification], specializationAligned: result.specializationMatch, seniorityAligned: result.seniorityMatch };
}
