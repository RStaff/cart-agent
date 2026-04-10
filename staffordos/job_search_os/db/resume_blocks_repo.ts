export const RESUME_BLOCK_SECTIONS = [
  "summary",
  "experience_highlight",
  "achievement",
  "skills",
] as const;

export type ResumeBlockSection = typeof RESUME_BLOCK_SECTIONS[number];

export type ResumeBlockRecord = {
  id: string;
  block_key: string;
  section: ResumeBlockSection;
  title: string;
  canonical_text: string;
  tags: string[];
  seniority_weight: number;
  source_ref: string;
  active: boolean;
};

export type CreateResumeBlockInput = {
  id?: string;
  block_key: string;
  section: ResumeBlockSection;
  title?: string;
  canonical_text: string;
  tags?: string[];
  seniority_weight?: number;
  source_ref?: string;
  active?: boolean;
};

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

function cleanTags(tags: unknown) {
  if (!Array.isArray(tags)) {
    return [];
  }

  return tags
    .map((tag) => cleanText(tag).toLowerCase())
    .filter(Boolean);
}

function cleanSection(section: unknown): ResumeBlockSection {
  const normalized = cleanText(section);
  return RESUME_BLOCK_SECTIONS.includes(normalized as ResumeBlockSection)
    ? (normalized as ResumeBlockSection)
    : "achievement";
}

function cleanWeight(value: unknown) {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return 1;
  }

  return Math.max(1, Math.min(5, Math.round(numeric)));
}

export function normalizeResumeBlock(input: CreateResumeBlockInput): ResumeBlockRecord {
  const canonicalText = cleanText(input.canonical_text);

  if (!canonicalText) {
    throw new Error("resume_block_canonical_text_required");
  }

  const blockKey = cleanText(input.block_key);

  if (!blockKey) {
    throw new Error("resume_block_key_required");
  }

  return {
    id: cleanText(input.id) || blockKey,
    block_key: blockKey,
    section: cleanSection(input.section),
    title: cleanText(input.title) || blockKey,
    canonical_text: canonicalText,
    tags: cleanTags(input.tags),
    seniority_weight: cleanWeight(input.seniority_weight),
    source_ref: cleanText(input.source_ref) || "canonical_resume",
    active: input.active !== false,
  };
}

export function normalizeResumeBlocks(inputs: CreateResumeBlockInput[]) {
  return inputs.map((input) => normalizeResumeBlock(input));
}

export function filterActiveResumeBlocks(blocks: ResumeBlockRecord[]) {
  return blocks.filter((block) => block.active);
}

export function indexResumeBlocksByKey(blocks: ResumeBlockRecord[]) {
  return new Map(blocks.map((block) => [block.block_key, block]));
}
