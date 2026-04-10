import type { CandidateProfileRecord } from "../db/candidate_profile_repo";
import {
  buildJobScoreUpdate,
  type JobScoreRecord,
  type JobSearchRecommendation,
  type JobSearchRiskFlag,
  type NormalizedJobRecord,
} from "../db/jobs_repo";
import {
  filterActiveResumeBlocks,
  type ResumeBlockRecord,
} from "../db/resume_blocks_repo";

export const DEFAULT_SCORING_WEIGHTS = {
  fit: 0.4,
  compensation: 0.2,
  narrative: 0.4,
} as const;

export type JobScoringInput = {
  job: NormalizedJobRecord;
  candidateProfile: CandidateProfileRecord;
  resumeBlocks: ResumeBlockRecord[];
};

export type JobScoringResult = JobScoreRecord & {
  job_id: string;
};

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "in",
  "into",
  "is",
  "of",
  "on",
  "or",
  "the",
  "to",
  "with",
  "you",
  "your",
  "our",
  "role",
  "team",
  "work",
  "will",
]);

const TITLE_FAMILY_KEYWORDS: Record<string, string[]> = {
  product: ["product", "pm", "platform", "roadmap"],
  growth: ["growth", "retention", "lifecycle", "acquisition", "engagement"],
  marketing: ["marketing", "brand", "demand", "campaign", "crm"],
  operations: ["operations", "ops", "program", "business operations"],
  strategy: ["strategy", "strategic", "planning"],
  revenue: ["revenue", "monetization", "pricing", "sales"],
  partnerships: ["partnerships", "partner"],
  data: ["data", "analytics", "insights"],
  engineering: ["engineering", "developer", "software", "technical"],
};

const HUMAN_ANGLE_LABELS: Record<string, string> = {
  leadership: "cross-functional leadership",
  retention: "lifecycle and retention strength",
  lifecycle: "lifecycle and retention strength",
  martech: "martech systems ownership",
  ai: "AI-enabled product and systems fluency",
  product: "product strategy and execution",
  operations: "product + operations bridge",
  cross-functional: "program execution in ambiguous environments",
  program: "program execution in ambiguous environments",
  systems: "systems thinking and operating rigor",
  transformation: "transformation and change leadership",
  growth: "growth ownership",
};

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function normalizeText(value: string) {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s/&+-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value: string) {
  return normalizeText(value)
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

function uniqueTokens(value: string) {
  return Array.from(new Set(tokenize(value)));
}

function includesAny(haystack: string, needles: string[]) {
  return needles.some((needle) => haystack.includes(needle));
}

function inferRoleFamiliesFromText(text: string) {
  const normalized = normalizeText(text);
  const families = Object.entries(TITLE_FAMILY_KEYWORDS)
    .filter(([, keywords]) => includesAny(normalized, keywords))
    .map(([family]) => family);

  return Array.from(new Set(families));
}

function inferCandidateFamilies(
  candidateProfile: CandidateProfileRecord,
  resumeBlocks: ResumeBlockRecord[],
) {
  const fromRoles = inferRoleFamiliesFromText(candidateProfile.target_roles.join(" "));
  const fromBlocks = filterActiveResumeBlocks(resumeBlocks)
    .flatMap((block) => block.tags)
    .filter((tag) => TITLE_FAMILY_KEYWORDS[tag]);

  return Array.from(new Set([...fromRoles, ...fromBlocks]));
}

function inferJobFamilies(job: NormalizedJobRecord) {
  return Array.from(new Set([
    ...inferRoleFamiliesFromText(job.title),
    ...inferRoleFamiliesFromText(job.description_normalized),
    ...((job.role_family && [job.role_family]) || []),
    ...(job.function_tags || []),
    ...(job.domain_tags || []),
  ].map((value) => cleanText(value).toLowerCase()).filter(Boolean)));
}

function seniorityRank(level: string) {
  const normalized = cleanText(level).toLowerCase();

  if (includesAny(normalized, ["chief", "vp", "vice president", "head", "executive"])) return 6;
  if (includesAny(normalized, ["director"])) return 5;
  if (includesAny(normalized, ["principal"])) return 4;
  if (includesAny(normalized, ["staff"])) return 3;
  if (includesAny(normalized, ["senior", "lead"])) return 2;
  if (includesAny(normalized, ["mid", "manager", "ii", "iii"])) return 1;
  if (includesAny(normalized, ["associate", "junior", "entry", "coordinator"])) return 0;

  return 2;
}

function inferJobSeniority(job: NormalizedJobRecord) {
  return seniorityRank(`${job.seniority_hint || job.seniority || ""} ${job.title}`);
}

function inferCandidateSeniority(candidateProfile: CandidateProfileRecord) {
  return seniorityRank(candidateProfile.seniority_level);
}

function scoreTitleAlignment(
  job: NormalizedJobRecord,
  candidateProfile: CandidateProfileRecord,
) {
  const normalizedTitle = normalizeText(job.title);
  const targetRoles = candidateProfile.target_roles.map((role) => normalizeText(role));
  const exactMatch = targetRoles.some((role) => role && normalizedTitle.includes(role));

  if (exactMatch) {
    return {
      score: 25,
      reason: "title aligns directly with target role language",
      titleMismatch: false,
    };
  }

  const titleTokens = uniqueTokens(job.title);
  let bestOverlap = 0;

  for (const role of targetRoles) {
    const overlap = titleTokens.filter((token) => role.includes(token)).length;
    bestOverlap = Math.max(bestOverlap, overlap);
  }

  if (bestOverlap >= 2) {
    return {
      score: 19,
      reason: "title is adjacent to target role language",
      titleMismatch: false,
    };
  }

  if (bestOverlap === 1) {
    return {
      score: 12,
      reason: "title has limited adjacency to target roles",
      titleMismatch: true,
    };
  }

  return {
    score: 4,
    reason: "title sits outside stated target role language",
    titleMismatch: true,
  };
}

function scoreRoleFamilyAlignment(
  job: NormalizedJobRecord,
  candidateProfile: CandidateProfileRecord,
  resumeBlocks: ResumeBlockRecord[],
) {
  const candidateFamilies = inferCandidateFamilies(candidateProfile, resumeBlocks);
  const jobFamilies = inferJobFamilies(job);
  const overlap = jobFamilies.filter((family) => candidateFamilies.includes(family));

  if (overlap.length >= 2) {
    return {
      score: 20,
      reason: `role family overlap is strong: ${overlap.slice(0, 3).join(", ")}`,
    };
  }

  if (overlap.length === 1) {
    return {
      score: 12,
      reason: `role family overlap is credible but narrow: ${overlap[0]}`,
    };
  }

  return {
    score: 3,
    reason: "role family is outside the strongest candidate lanes",
  };
}

function scoreSeniorityAlignment(job: NormalizedJobRecord, candidateProfile: CandidateProfileRecord) {
  const candidateRank = inferCandidateSeniority(candidateProfile);
  const jobRank = inferJobSeniority(job);

  if (jobRank === candidateRank || jobRank === candidateRank + 1) {
    return {
      score: 20,
      reason: "seniority level is aligned or a credible step-up",
      tooJunior: false,
    };
  }

  if (jobRank === candidateRank + 2) {
    return {
      score: 13,
      reason: "seniority represents a stretch but remains plausible",
      tooJunior: false,
    };
  }

  if (jobRank < candidateRank) {
    return {
      score: 5,
      reason: "role appears materially too junior for target seniority",
      tooJunior: true,
    };
  }

  return {
    score: 6,
    reason: "role seniority is above current target and may be hard to support",
    tooJunior: false,
  };
}

function scoreLocationAlignment(job: NormalizedJobRecord, candidateProfile: CandidateProfileRecord) {
  const preferences = candidateProfile.preferred_locations.map((value) => normalizeText(value));
  const location = normalizeText(job.location_text || "");
  const workMode = normalizeText(job.work_mode || "");
  const constraints = candidateProfile.constraints.map((value) => normalizeText(value));
  const remotePreferred = preferences.some((value) => value.includes("remote"));
  const remoteOnly = constraints.some((value) => value.includes("remote only"));
  const onsiteRestricted = remoteOnly || constraints.some((value) => value.includes("no onsite"));

  if (!location && !workMode) {
    return {
      score: 10,
      reason: "location details are limited, so location is treated as neutral",
      locationMismatch: false,
      onsiteConstraint: false,
    };
  }

  if (workMode.includes("remote")) {
    return {
      score: 15,
      reason: "remote work mode aligns well with stated flexibility",
      locationMismatch: false,
      onsiteConstraint: false,
    };
  }

  if (preferences.some((value) => value && location.includes(value))) {
    return {
      score: 14,
      reason: "location aligns directly with preferred locations",
      locationMismatch: false,
      onsiteConstraint: false,
    };
  }

  if (workMode.includes("hybrid")) {
    return {
      score: remotePreferred ? 10 : 12,
      reason: "hybrid arrangement is potentially workable but not ideal",
      locationMismatch: false,
      onsiteConstraint: false,
    };
  }

  if (workMode.includes("onsite")) {
    return {
      score: onsiteRestricted ? 0 : 5,
      reason: onsiteRestricted ? "onsite requirement conflicts with stated constraints" : "onsite work lowers attractiveness",
      locationMismatch: true,
      onsiteConstraint: onsiteRestricted,
    };
  }

  return {
    score: 6,
    reason: "location appears outside preferred targets",
    locationMismatch: true,
    onsiteConstraint: false,
  };
}

function scoreFunctionalAlignment(job: NormalizedJobRecord, resumeBlocks: ResumeBlockRecord[]) {
  const jobFamilies = inferJobFamilies(job);
  const activeBlocks = filterActiveResumeBlocks(resumeBlocks);
  const matchingBlocks = activeBlocks.filter((block) =>
    block.tags.some((tag) => jobFamilies.includes(tag) || normalizeText(job.description_normalized).includes(tag))
  );

  if (matchingBlocks.length >= 4) {
    return {
      score: 20,
      reason: "resume evidence covers multiple core functional themes in the role",
    };
  }

  if (matchingBlocks.length >= 2) {
    return {
      score: 14,
      reason: "resume evidence covers core role themes with believable depth",
    };
  }

  if (matchingBlocks.length === 1) {
    return {
      score: 8,
      reason: "functional alignment exists but evidence depth is thin",
    };
  }

  return {
    score: 2,
    reason: "job themes are mostly outside existing resume evidence",
  };
}

function scoreFit(
  job: NormalizedJobRecord,
  candidateProfile: CandidateProfileRecord,
  resumeBlocks: ResumeBlockRecord[],
) {
  const title = scoreTitleAlignment(job, candidateProfile);
  const families = scoreRoleFamilyAlignment(job, candidateProfile, resumeBlocks);
  const seniority = scoreSeniorityAlignment(job, candidateProfile);
  const location = scoreLocationAlignment(job, candidateProfile);
  const functional = scoreFunctionalAlignment(job, resumeBlocks);
  const fitScore = clampScore(
    title.score + families.score + seniority.score + location.score + functional.score,
  );

  return {
    fitScore,
    reasoning: [
      title.reason,
      families.reason,
      seniority.reason,
      location.reason,
      functional.reason,
    ],
    flags: {
      titleMismatch: title.titleMismatch,
      tooJunior: seniority.tooJunior,
      locationMismatch: location.locationMismatch,
      onsiteConstraint: location.onsiteConstraint,
    },
  };
}

function titleStrengthProxy(title: string) {
  const normalized = normalizeText(title);

  if (includesAny(normalized, ["director", "head", "principal", "staff", "lead"])) return 72;
  if (includesAny(normalized, ["senior", "manager"])) return 62;
  if (includesAny(normalized, ["associate", "coordinator", "junior"])) return 30;

  return 50;
}

function seniorityCompProxy(job: NormalizedJobRecord) {
  const rank = inferJobSeniority(job);
  const map = [25, 42, 58, 70, 80, 86, 92];
  return map[Math.max(0, Math.min(map.length - 1, rank))];
}

function qualityProxy(job: NormalizedJobRecord) {
  const quality = normalizeText(`${job.company_quality || ""} ${job.strategic_upside || ""}`);
  if (includesAny(quality, ["high", "strong", "excellent"])) return 8;
  if (includesAny(quality, ["medium", "solid"])) return 4;
  if (includesAny(quality, ["low", "weak"])) return -6;
  return 0;
}

function scoreCompensation(job: NormalizedJobRecord, candidateProfile: CandidateProfileRecord) {
  const salaryFloor = candidateProfile.salary_floor;
  const salaryMin = job.salary_min ?? null;
  const salaryMax = job.salary_max ?? null;
  const flags: JobSearchRiskFlag[] = [];
  let score = 0;
  let reason = "";

  if (salaryFloor && (salaryMin !== null || salaryMax !== null)) {
    const comparable = salaryMax ?? salaryMin ?? 0;

    if (comparable >= salaryFloor * 1.2) {
      score = 92;
      reason = "posted compensation is well above the stated floor";
    } else if (comparable >= salaryFloor) {
      score = 76;
      reason = "posted compensation clears the stated floor";
    } else if ((salaryMax ?? salaryMin ?? 0) >= salaryFloor * 0.9) {
      score = 48;
      reason = "posted compensation is near the floor but not clearly above it";
    } else {
      score = 14;
      reason = "posted compensation appears below the stated floor";
      flags.push("compensation_below_floor");
    }

    return {
      compensationScore: clampScore(score + qualityProxy(job)),
      reasoning: [reason],
      flags,
    };
  }

  if (salaryMin !== null || salaryMax !== null) {
    const comparable = salaryMax ?? salaryMin ?? 0;

    if (comparable >= 300000) {
      score = 88;
      reason = "posted compensation signals strong upside even without a stored salary floor";
    } else if (comparable >= 220000) {
      score = 74;
      reason = "posted compensation signals solid senior-level upside";
    } else if (comparable >= 160000) {
      score = 58;
      reason = "posted compensation appears respectable but not especially high-upside";
    } else {
      score = 36;
      reason = "posted compensation appears modest relative to senior-level opportunity cost";
    }

    return {
      compensationScore: clampScore(score + qualityProxy(job)),
      reasoning: [reason],
      flags,
    };
  }

  score = Math.round((titleStrengthProxy(job.title) + seniorityCompProxy(job)) / 2) + qualityProxy(job);
  reason = "salary is missing, so compensation uses seniority and title strength as upside proxies";
  flags.push("missing_salary");

  return {
    compensationScore: clampScore(score),
    reasoning: [reason],
    flags,
  };
}

function blockEvidenceStrength(job: NormalizedJobRecord, block: ResumeBlockRecord) {
  const jobText = normalizeText(
    `${job.title} ${job.description_normalized} ${(job.domain_tags || []).join(" ")} ${(job.function_tags || []).join(" ")}`,
  );
  const blockText = normalizeText(`${block.title} ${block.canonical_text} ${block.tags.join(" ")}`);
  const jobKeywords = uniqueTokens(jobText);
  const matchingKeywords = jobKeywords.filter((keyword) => blockText.includes(keyword));
  const directTagMatches = block.tags.filter((tag) => jobText.includes(tag));
  const leadershipTerms = ["leadership", "ownership", "systems", "transformation", "cross-functional"];
  const leadershipMatches = leadershipTerms.filter((term) => blockText.includes(term) && jobText.includes(term));

  const score = (
    (directTagMatches.length * 5) +
    (matchingKeywords.length * 2) +
    (leadershipMatches.length * 3) +
    block.seniority_weight
  );

  return {
    score,
    directTagMatches,
    matchingKeywords,
    leadershipMatches,
  };
}

function detectToolSpecificGap(job: NormalizedJobRecord, resumeBlocks: ResumeBlockRecord[]) {
  const tools = (job.tools || []).map((tool) => normalizeText(tool));

  if (!tools.length) {
    return false;
  }

  const blockText = normalizeText(
    filterActiveResumeBlocks(resumeBlocks)
      .map((block) => `${block.title} ${block.canonical_text} ${block.tags.join(" ")}`)
      .join(" "),
  );

  return tools.some((tool) => tool && !blockText.includes(tool));
}

function scoreNarrative(
  job: NormalizedJobRecord,
  candidateProfile: CandidateProfileRecord,
  resumeBlocks: ResumeBlockRecord[],
) {
  const activeBlocks = filterActiveResumeBlocks(resumeBlocks);
  const scoredBlocks = activeBlocks
    .map((block) => ({
      block,
      evidence: blockEvidenceStrength(job, block),
    }))
    .filter((entry) => entry.evidence.score > 0)
    .sort((left, right) => right.evidence.score - left.evidence.score || left.block.block_key.localeCompare(right.block.block_key));

  const directEvidenceBlocks = scoredBlocks.filter((entry) => entry.evidence.directTagMatches.length > 0 || entry.evidence.matchingKeywords.length >= 3);
  const adjacentEvidenceBlocks = scoredBlocks.filter((entry) => !directEvidenceBlocks.includes(entry));
  const targetRoleAlignment = inferRoleFamiliesFromText(candidateProfile.target_roles.join(" "));
  const jobFamilies = inferJobFamilies(job);
  const familyOverlap = jobFamilies.filter((family) => targetRoleAlignment.includes(family)).length;
  const leadershipCoverage = scoredBlocks.filter((entry) => entry.evidence.leadershipMatches.length > 0).length;

  let score = 0;
  const reasoning: string[] = [];
  const flags: JobSearchRiskFlag[] = [];

  score += Math.min(45, directEvidenceBlocks.length * 12);
  score += Math.min(20, adjacentEvidenceBlocks.length * 4);
  score += Math.min(15, leadershipCoverage * 5);
  score += Math.min(10, familyOverlap * 5);
  score += Math.min(10, scoredBlocks.slice(0, 3).reduce((sum, entry) => sum + entry.block.seniority_weight, 0));

  if (directEvidenceBlocks.length >= 3) {
    reasoning.push("multiple resume blocks provide direct evidence for the role's core themes");
  } else if (directEvidenceBlocks.length >= 1) {
    reasoning.push("there is direct evidence for some role themes, but the story is not fully saturated");
  } else {
    reasoning.push("direct evidence is thin, so the narrative relies on adjacent experience");
    flags.push("weak_direct_evidence");
  }

  if (job.requires_people_management) {
    const managementEvidence = scoredBlocks.some((entry) =>
      includesAny(normalizeText(`${entry.block.canonical_text} ${entry.block.tags.join(" ")}`), ["manager", "management", "leadership", "team"])
    );

    if (!managementEvidence) {
      flags.push("people_management_gap");
      reasoning.push("people-management expectations are not strongly supported by current evidence");
      score -= 8;
    }
  }

  if (detectToolSpecificGap(job, resumeBlocks)) {
    flags.push("tool_specific_gap");
    reasoning.push("named tools appear in the role without clear supporting evidence in resume blocks");
    score -= 6;
  }

  return {
    narrativeScore: clampScore(score),
    reasoning,
    flags,
    scoredBlocks,
  };
}

function deriveStrongestAngles(
  job: NormalizedJobRecord,
  candidateProfile: CandidateProfileRecord,
  scoredBlocks: Array<{ block: ResumeBlockRecord; evidence: { score: number } }>,
) {
  const angleCounts = new Map<string, number>();
  const jobText = normalizeText(`${job.title} ${job.description_normalized}`);

  for (const entry of scoredBlocks.slice(0, 6)) {
    for (const tag of entry.block.tags) {
      const label = HUMAN_ANGLE_LABELS[tag];

      if (!label) {
        continue;
      }

      angleCounts.set(label, (angleCounts.get(label) || 0) + entry.evidence.score);
    }
  }

  for (const role of candidateProfile.target_roles) {
    const normalizedRole = normalizeText(role);
    if (normalizedRole.includes("product") && jobText.includes("product")) {
      angleCounts.set("product strategy and execution", (angleCounts.get("product strategy and execution") || 0) + 4);
    }
    if (normalizedRole.includes("growth") && includesAny(jobText, ["growth", "retention", "lifecycle"])) {
      angleCounts.set("growth ownership", (angleCounts.get("growth ownership") || 0) + 4);
    }
  }

  return Array.from(angleCounts.entries())
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 5)
    .map(([label]) => label);
}

function dedupeFlags(flags: JobSearchRiskFlag[]) {
  return Array.from(new Set(flags));
}

function buildRecommendation(
  fitScore: number,
  compensationScore: number,
  narrativeScore: number,
  riskFlags: JobSearchRiskFlag[],
) {
  const severeRisk = riskFlags.includes("too_junior") || riskFlags.includes("compensation_below_floor");

  if (!severeRisk && fitScore >= 72 && narrativeScore >= 68 && compensationScore >= 45) {
    return "pursue" as JobSearchRecommendation;
  }

  if (!severeRisk && fitScore >= 52 && narrativeScore >= 50 && compensationScore >= 30) {
    return "stretch_pursue" as JobSearchRecommendation;
  }

  if (
    !riskFlags.includes("too_junior") &&
    !riskFlags.includes("people_management_gap") &&
    fitScore >= 45 &&
    narrativeScore >= 58 &&
    compensationScore >= 55
  ) {
    return "stretch_pursue" as JobSearchRecommendation;
  }

  return "skip" as JobSearchRecommendation;
}

function buildReasoning(
  fitReasoning: string[],
  compensationReasoning: string[],
  narrativeReasoning: string[],
  strongestAngles: string[],
  riskFlags: JobSearchRiskFlag[],
  recommendation: JobSearchRecommendation,
) {
  const parts = [
    `Fit: ${fitReasoning.join("; ")}.`,
    `Compensation: ${compensationReasoning.join("; ")}.`,
    `Narrative: ${narrativeReasoning.join("; ")}.`,
  ];

  if (strongestAngles.length) {
    parts.push(`Strongest angles: ${strongestAngles.join(", ")}.`);
  }

  if (riskFlags.length) {
    parts.push(`Major risks: ${riskFlags.join(", ")}.`);
  }

  parts.push(`Recommendation: ${recommendation}.`);

  return parts.join(" ");
}

export function scoreJob(input: JobScoringInput): JobScoringResult {
  const fit = scoreFit(input.job, input.candidateProfile, input.resumeBlocks);
  const compensation = scoreCompensation(input.job, input.candidateProfile);
  const narrative = scoreNarrative(input.job, input.candidateProfile, input.resumeBlocks);

  const totalScore = clampScore(
    (fit.fitScore * DEFAULT_SCORING_WEIGHTS.fit) +
    (compensation.compensationScore * DEFAULT_SCORING_WEIGHTS.compensation) +
    (narrative.narrativeScore * DEFAULT_SCORING_WEIGHTS.narrative),
  );

  const riskFlags = dedupeFlags([
    ...(fit.flags.titleMismatch ? ["title_mismatch" as JobSearchRiskFlag] : []),
    ...(fit.flags.tooJunior ? ["too_junior" as JobSearchRiskFlag] : []),
    ...(fit.flags.locationMismatch ? ["location_mismatch" as JobSearchRiskFlag] : []),
    ...(fit.flags.onsiteConstraint ? ["onsite_constraint" as JobSearchRiskFlag] : []),
    ...compensation.flags,
    ...narrative.flags,
  ]);

  const strongestAngles = deriveStrongestAngles(
    input.job,
    input.candidateProfile,
    narrative.scoredBlocks,
  );
  const recommendation = buildRecommendation(
    fit.fitScore,
    compensation.compensationScore,
    narrative.narrativeScore,
    riskFlags,
  );
  const scoreReasoning = buildReasoning(
    fit.reasoning,
    compensation.reasoning,
    narrative.reasoning,
    strongestAngles,
    riskFlags,
    recommendation,
  );

  return {
    job_id: input.job.id,
    fit_score: fit.fitScore,
    compensation_score: compensation.compensationScore,
    narrative_score: narrative.narrativeScore,
    total_score: totalScore,
    recommendation,
    score_reasoning: scoreReasoning,
    risk_flags: riskFlags,
    strongest_angles: strongestAngles,
  };
}

export function buildStoredJobScore(input: JobScoringInput) {
  const result = scoreJob(input);
  return buildJobScoreUpdate(result.job_id, result);
}
