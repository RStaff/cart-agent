export function buildRequirementCoverageDiagnostics({ sourceType, description, parsedRequirementCount, evaluationRequirementCount }) {
  const text = String(description || "").trim();
  return {
    sourceType: String(sourceType || "UNKNOWN"),
    descriptionPresent: Boolean(text),
    descriptionCharacterCount: text.length,
    parsedRequirementCount: Number(parsedRequirementCount) || 0,
    evaluationRequirementCount: Number(evaluationRequirementCount) || 0,
  };
}
