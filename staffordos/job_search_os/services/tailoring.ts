import type {
  CandidateProfileRecord,
  CandidateSeniority,
} from "../db/candidate_profile_repo";
import {
  filterActiveResumeBlocks,
  type ResumeBlockRecord,
} from "../db/resume_blocks_repo";

type CanonicalResumeLine = {
  section: string;
  text: string;
};

export type SelectedResumeBlock = {
  block_key: string;
  title: string;
  section: ResumeBlockRecord["section"];
  canonical_text: string;
  score: number;
  reasoning: string[];
  source_ref: string;
};

export type TailoringInput = {
  canonicalResumeMarkdown: string;
  resumeBlocks: ResumeBlockRecord[];
  candidateProfile: CandidateProfileRecord;
  jobDescription: string;
};

export type TailoringResult = {
  tailoredResumeMarkdown: string;
  selectedBlocks: SelectedResumeBlock[];
  selectionReasoning: string[];
  safety: {
    ok: boolean;
    rejectedLines: string[];
  };
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
  "is",
  "of",
  "on",
  "or",
  "that",
  "the",
  "to",
  "with",
  "will",
  "your",
  "you",
  "our",
  "we",
  "this",
  "their",
  "they",
  "role",
  "team",
  "work",
  "experience",
]);

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeForComparison(value: string) {
  return cleanText(value)
    .toLowerCase()
    .replace(/[`*_>#-]+/g, " ")
    .replace(/[^a-z0-9\s/&+-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value: string) {
  return normalizeForComparison(value)
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

function uniqueTokens(value: string) {
  return Array.from(new Set(tokenize(value)));
}

function headingToSection(line: string) {
  return cleanText(line).replace(/^#+\s*/, "").toLowerCase();
}

function parseCanonicalResumeLines(markdown: string) {
  const lines = cleanText(markdown).split(/\r?\n/);
  const parsed: CanonicalResumeLine[] = [];
  let currentSection = "general";

  for (const rawLine of lines) {
    const line = cleanText(rawLine);
    if (!line) {
      continue;
    }

    if (line.startsWith("#")) {
      currentSection = headingToSection(line);
      continue;
    }

    const content = line.replace(/^[-*]\s+/, "").trim();

    if (!content) {
      continue;
    }

    parsed.push({
      section: currentSection,
      text: content,
    });
  }

  return parsed;
}

function chooseSummaryLines(
  canonicalLines: CanonicalResumeLine[],
  jobKeywords: string[],
  candidateProfile: CandidateProfileRecord,
) {
  const roleTerms = candidateProfile.target_roles.join(" ");
  const roleKeywords = uniqueTokens(roleTerms);

  const scored = canonicalLines.map((line) => {
    const haystack = normalizeForComparison(line.text);
    let score = 0;

    for (const keyword of jobKeywords) {
      if (haystack.includes(keyword)) {
        score += 2;
      }
    }

    for (const keyword of roleKeywords) {
      if (haystack.includes(keyword)) {
        score += 1;
      }
    }

    if (line.section.includes("summary") || line.section.includes("profile")) {
      score += 3;
    }

    return {
      ...line,
      score,
    };
  });

  return scored
    .filter((line) => line.score > 0)
    .sort((left, right) => right.score - left.score || left.text.localeCompare(right.text))
    .slice(0, 3)
    .map((line) => line.text)
    .concat(
      scored
        .filter((line) => line.section.includes("summary") || line.section.includes("profile"))
        .map((line) => line.text),
    )
    .filter((line, index, list) => list.indexOf(line) === index)
    .slice(0, 3);
}

function seniorityKeywords(level: CandidateSeniority) {
  const map: Record<CandidateSeniority, string[]> = {
    senior: ["senior", "lead", "ownership"],
    staff: ["staff", "cross-functional", "strategy"],
    principal: ["principal", "architecture", "systems"],
    director: ["director", "leadership", "management"],
    executive: ["executive", "gm", "p&l"],
  };

  return map[level];
}

function selectRelevantResumeBlocks(
  blocks: ResumeBlockRecord[],
  candidateProfile: CandidateProfileRecord,
  jobDescription: string,
) {
  const activeBlocks = filterActiveResumeBlocks(blocks);
  const jobKeywords = uniqueTokens(jobDescription);
  const descriptionHaystack = normalizeForComparison(jobDescription);
  const profileKeywords = uniqueTokens(candidateProfile.target_roles.join(" "));
  const seniorityTerms = seniorityKeywords(candidateProfile.seniority_level);

  const selected = activeBlocks
    .map((block) => {
      const blockHaystack = normalizeForComparison(
        `${block.title} ${block.canonical_text} ${block.tags.join(" ")}`,
      );
      const reasoning: string[] = [];
      let score = block.seniority_weight;

      const matchingTags = block.tags.filter((tag) => descriptionHaystack.includes(tag));
      if (matchingTags.length) {
        score += matchingTags.length * 4;
        reasoning.push(`matched tags: ${matchingTags.join(", ")}`);
      }

      const keywordMatches = jobKeywords.filter((keyword) => blockHaystack.includes(keyword));
      if (keywordMatches.length) {
        score += keywordMatches.length * 2;
        reasoning.push(`matched job keywords: ${keywordMatches.slice(0, 5).join(", ")}`);
      }

      const profileMatches = profileKeywords.filter((keyword) => blockHaystack.includes(keyword));
      if (profileMatches.length) {
        score += profileMatches.length;
        reasoning.push(`aligned to target roles: ${profileMatches.slice(0, 4).join(", ")}`);
      }

      const seniorityMatches = seniorityTerms.filter((term) => blockHaystack.includes(term));
      if (seniorityMatches.length) {
        score += 2;
        reasoning.push(`aligned to seniority: ${seniorityMatches.join(", ")}`);
      }

      return {
        block_key: block.block_key,
        title: block.title,
        section: block.section,
        canonical_text: block.canonical_text,
        source_ref: block.source_ref,
        score,
        reasoning: reasoning.length ? reasoning : ["selected as fallback canonical block"],
      };
    })
    .filter((block) => block.score > 0)
    .sort((left, right) => right.score - left.score || left.block_key.localeCompare(right.block_key));

  return {
    allSelected: selected,
    experienceHighlights: selected.filter((block) => block.section === "experience_highlight").slice(0, 4),
    achievements: selected.filter((block) => block.section === "achievement").slice(0, 4),
  };
}

function buildTailoredResumeMarkdown(
  summaryLines: string[],
  experienceHighlights: SelectedResumeBlock[],
  achievements: SelectedResumeBlock[],
) {
  const lines: string[] = ["# Tailored Resume", ""];

  if (summaryLines.length) {
    lines.push("## Summary", "");
    for (const line of summaryLines) {
      lines.push(`- ${line}`);
    }
    lines.push("");
  }

  if (experienceHighlights.length) {
    lines.push("## Experience Highlights", "");
    for (const block of experienceHighlights) {
      lines.push(`- ${block.canonical_text}`);
    }
    lines.push("");
  }

  if (achievements.length) {
    lines.push("## Achievements", "");
    for (const block of achievements) {
      lines.push(`- ${block.canonical_text}`);
    }
    lines.push("");
  }

  return lines.join("\n").trim();
}

function collectAllowedSourceLines(
  canonicalResumeMarkdown: string,
  resumeBlocks: ResumeBlockRecord[],
) {
  const allowed = new Set<string>();

  for (const line of parseCanonicalResumeLines(canonicalResumeMarkdown)) {
    allowed.add(normalizeForComparison(line.text));
  }

  for (const block of resumeBlocks) {
    allowed.add(normalizeForComparison(block.canonical_text));
  }

  return allowed;
}

export function validateTailoredResumeSafety(
  tailoredResumeMarkdown: string,
  canonicalResumeMarkdown: string,
  resumeBlocks: ResumeBlockRecord[],
) {
  const allowedLines = collectAllowedSourceLines(canonicalResumeMarkdown, resumeBlocks);
  const rejectedLines: string[] = [];

  for (const rawLine of tailoredResumeMarkdown.split(/\r?\n/)) {
    const line = cleanText(rawLine);

    if (!line || line.startsWith("#")) {
      continue;
    }

    const content = line.replace(/^[-*]\s+/, "").trim();
    const normalized = normalizeForComparison(content);

    if (!normalized) {
      continue;
    }

    if (!allowedLines.has(normalized)) {
      rejectedLines.push(content);
    }
  }

  return {
    ok: rejectedLines.length === 0,
    rejectedLines,
  };
}

export function tailorResume(input: TailoringInput): TailoringResult {
  const canonicalResumeMarkdown = cleanText(input.canonicalResumeMarkdown);
  const jobDescription = cleanText(input.jobDescription);

  if (!canonicalResumeMarkdown) {
    throw new Error("canonical_resume_required");
  }

  if (!jobDescription) {
    throw new Error("job_description_required");
  }

  const canonicalLines = parseCanonicalResumeLines(canonicalResumeMarkdown);
  const jobKeywords = uniqueTokens(jobDescription);
  const summaryLines = chooseSummaryLines(
    canonicalLines,
    jobKeywords,
    input.candidateProfile,
  );
  const selection = selectRelevantResumeBlocks(
    input.resumeBlocks,
    input.candidateProfile,
    jobDescription,
  );
  const tailoredResumeMarkdown = buildTailoredResumeMarkdown(
    summaryLines,
    selection.experienceHighlights,
    selection.achievements,
  );
  const safety = validateTailoredResumeSafety(
    tailoredResumeMarkdown,
    canonicalResumeMarkdown,
    input.resumeBlocks,
  );

  if (!safety.ok) {
    throw new Error(`tailored_resume_failed_safety_check:${safety.rejectedLines.join("|")}`);
  }

  const selectionReasoning = [
    `summary lines selected from canonical resume using job and target-role keyword overlap`,
    `experience highlights selected from active resume blocks using tags, keywords, and seniority weighting`,
    `achievements selected from active resume blocks using the same deterministic scoring rules`,
  ];

  return {
    tailoredResumeMarkdown,
    selectedBlocks: [
      ...selection.experienceHighlights,
      ...selection.achievements,
    ],
    selectionReasoning,
    safety,
  };
}
