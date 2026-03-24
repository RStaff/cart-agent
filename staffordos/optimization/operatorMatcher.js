const TASK_SKILL_MAP = {
  CHECKOUT_DECISION_OPTIMIZATION_V1: ["email", "shopify"],
  EMAIL_FLOW_UPGRADE_V1: ["email"],
  CHECKOUT_FIX_V1: ["shopify"],
};

function normalizeSkills(skills) {
  if (!Array.isArray(skills)) return [];
  return Array.from(
    new Set(
      skills
        .map((skill) => String(skill || "").trim().toLowerCase())
        .filter(Boolean),
    ),
  );
}

function normalizeMetric(value, fallback = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(0, Math.min(5, numeric));
}

function completionRateValue(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  if (numeric <= 1) return Math.max(0, Math.min(1, numeric));
  return Math.max(0, Math.min(1, numeric / 100));
}

export function tierForOperator(operator = {}) {
  const completionRate = completionRateValue(operator?.completionRate);
  const qualityScore = normalizeMetric(operator?.qualityScore);
  const speedScore = normalizeMetric(operator?.speedScore);

  if (completionRate >= 0.95 && qualityScore >= 4.5 && speedScore >= 4.0) {
    return "TIER_3";
  }
  if (completionRate >= 0.85 && qualityScore >= 3.8 && speedScore >= 3.5) {
    return "TIER_2";
  }
  return "TIER_1";
}

function taskProfile(taskType) {
  if (typeof taskType === "string") {
    return {
      type: taskType,
      requiredSkills: TASK_SKILL_MAP[taskType] || [],
    };
  }

  return {
    type: taskType?.type || "UNKNOWN_TASK",
    requiredSkills: Array.isArray(taskType?.requiredSkills)
      ? taskType.requiredSkills
      : TASK_SKILL_MAP[taskType?.type] || [],
  };
}

function scoreOperator(operator, requiredSkills) {
  const operatorSkills = normalizeSkills(operator?.skills);
  const required = normalizeSkills(requiredSkills);
  const skillMatches = required.filter((skill) => operatorSkills.includes(skill)).length;
  const skillScore = required.length > 0 ? (skillMatches / required.length) * 5 : 0;
  const completionScore = completionRateValue(operator?.completionRate) * 5;
  const speedScore = normalizeMetric(operator?.speedScore);
  const qualityScore = normalizeMetric(operator?.qualityScore);
  const tier = tierForOperator(operator);
  const rankingScore = Number(
    (skillScore * 0.4 + completionScore * 0.25 + speedScore * 0.15 + qualityScore * 0.2).toFixed(2),
  );

  return {
    operatorId: operator?.operatorId || operator?.id || null,
    name: operator?.name || "Unknown operator",
    tier,
    rankingScore,
    skillMatch: Number(skillScore.toFixed(2)),
    completionRate: completionRateValue(operator?.completionRate),
    speedScore: Number(speedScore.toFixed(2)),
    qualityScore: Number(qualityScore.toFixed(2)),
    matchedSkills: required.filter((skill) => operatorSkills.includes(skill)),
  };
}

export function rankOperators(operators = [], taskType) {
  const profile = taskProfile(taskType);
  return operators
    .map((operator) => scoreOperator(operator, profile.requiredSkills))
    .sort((a, b) => {
      if (b.rankingScore !== a.rankingScore) return b.rankingScore - a.rankingScore;
      return a.name.localeCompare(b.name);
    })
    .slice(0, 3);
}
