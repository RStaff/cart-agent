const ATTENTION_STATUS_PATTERN = /\b(?:MISSING|FAILED|FAIL|ERROR|BLOCKED|PARTIAL|UNAVAILABLE)\b/i;
const NOT_YET_IMPLEMENTED_PATTERN = /\bNOT\s+YET\s+IMPLEMENTED\b/i;

export function validationEntries(value) {
  return value.split(" / ").map((entry) => entry.trim()).filter(Boolean);
}

export function validationAttentionCount(value) {
  return validationEntries(value).filter((entry) => ATTENTION_STATUS_PATTERN.test(entry) || NOT_YET_IMPLEMENTED_PATTERN.test(entry)).length;
}

export function validationSummary(value) {
  const entries = validationEntries(value);
  const attentionCount = validationAttentionCount(value);
  if (attentionCount > 0) {
    return `${attentionCount} system check${attentionCount === 1 ? " needs" : "s need"} attention`;
  }
  return entries.length > 0 ? "System checks available" : "System checks unavailable";
}

export function validationExplanation(value) {
  const attentionCount = validationAttentionCount(value);
  return attentionCount > 0
    ? "One or more system checks require attention."
    : validationEntries(value).length > 0
      ? "Current system checks are available."
      : "System checks are unavailable.";
}
