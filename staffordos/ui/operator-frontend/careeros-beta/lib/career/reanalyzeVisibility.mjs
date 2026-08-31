export function shouldShowReanalyze({ opportunityId } = {}) {
  return Boolean(String(opportunityId || "").trim());
}
