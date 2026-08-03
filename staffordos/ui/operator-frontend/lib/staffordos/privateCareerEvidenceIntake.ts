import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync, chmodSync } from "node:fs";
import * as path from "node:path";
import { inflateRawSync } from "node:zlib";

export const PRIVATE_CAREER_INTAKE_VERSION = "S010.02C";
export const PRIVATE_CAREER_WORKSPACE_ID = "professional";

export const SUPPORTED_PRIVATE_CAREER_SOURCE_EXTENSIONS = [".docx"] as const;
export const DEFERRED_PRIVATE_CAREER_SOURCE_EXTENSIONS = [".pages"] as const;
export const IGNORED_PRIVATE_CAREER_SOURCE_FILENAMES = [".DS_Store"] as const;

export const PRIVATE_CAREER_OUTPUT_FILENAMES = [
  "career_source_inventory.private.json",
  "deferred_sources.private.json",
  "candidate_career_facts.private.json",
  "career_evidence.private.json",
  "career_conflicts.private.json",
  "career_review_queue.private.json",
] as const;

type SourceStatus =
  | "SUPPORTED_DOCX_SOURCE"
  | "DEFERRED_UNSUPPORTED_SOURCE_FILE"
  | "UNSUPPORTED_SOURCE_FILE";

type FactType =
  | "EMPLOYMENT"
  | "EDUCATION"
  | "CERTIFICATION"
  | "SKILL"
  | "TECHNOLOGY"
  | "PROJECT"
  | "PRODUCT"
  | "ARCHITECTURE"
  | "ACHIEVEMENT"
  | "LEADERSHIP"
  | "OTHER";

type ConflictType =
  | "EMPLOYER_CONFLICT"
  | "TITLE_CONFLICT"
  | "START_DATE_CONFLICT"
  | "END_DATE_CONFLICT"
  | "EDUCATION_CONFLICT"
  | "CERTIFICATION_CONFLICT"
  | "METRIC_CONFLICT"
  | "PROJECT_STATUS_CONFLICT"
  | "SKILL_CONTEXT_CONFLICT"
  | "OTHER";

export type PrivateCareerSourceInventoryRecord = {
  privateSourceId: string;
  filename: string;
  extension: string;
  sizeBytes: number;
  modifiedAt: string;
  contentDigest: string | null;
  sourceClassification: "Resume DOCX" | "Deferred Pages document" | "Unsupported file";
  likelyDocumentPurpose: "resume" | "unknown";
  extractionSupportStatus: SourceStatus;
  privacyClassification: "Professional owner-private";
  duplicateDocumentStatus:
    | "NOT_EVALUATED"
    | "EXACT_DUPLICATE"
    | "CONTENT_VARIANT"
    | "ROLE_SPECIFIC_VARIANT"
    | "UNKNOWN_PURPOSE";
  limitations: string[];
  contentInspected: boolean;
};

export type PrivateExtractedSection = {
  sectionId: string;
  sectionHeading: string | null;
  text: string;
};

export type PrivateCareerEvidenceRecord = {
  id: string;
  workspaceId: typeof PRIVATE_CAREER_WORKSPACE_ID;
  evidenceType: "RESUME";
  sourceDocumentId: string;
  sourceReference: string;
  authorityClassification: "GENERATED_DOCUMENT";
  privacyClassification: "Professional owner-private";
  freshness: "Historical" | "Unknown";
  supportsFactIds: string[];
  challengesFactIds: string[];
  limitations: string[];
  canonical: false;
};

export type CandidateCareerFactRecord = {
  id: string;
  workspaceId: typeof PRIVATE_CAREER_WORKSPACE_ID;
  factType: FactType;
  statement: string;
  normalizedStatement: string;
  sourceDocumentId: string;
  sourceEvidenceId: string;
  sourceSectionReference: string;
  sourceExcerpt: string;
  authorityClassification: "GENERATED_DOCUMENT" | "REPOSITORY_BACKED";
  privacyClassification: "Professional owner-private";
  verificationStatus:
    | "PROPOSED"
    | "NEEDS_EVIDENCE"
    | "PARTIALLY_SUPPORTED"
    | "CONFLICTING"
    | "HISTORICAL_ONLY";
  operatorReviewStatus: "Needs Ross's review";
  metricClassification: "UNSUPPORTED" | "NOT_APPLICABLE";
  metricReviewClassification: "UNSUPPORTED" | "NEEDS_REVIEW" | "NOT_APPLICABLE";
  experienceClassification:
    | "USED_IN_PRODUCTION"
    | "USED_IN_CONTROLLED_PROJECT"
    | "USED_IN_TRAINING"
    | "STUDIED"
    | "FAMILIAR"
    | "TRANSFERABLE"
    | "NEEDS_VERIFICATION"
    | null;
  conflictTypes: ConflictType[];
  limitations: string[];
  canonical: false;
};

export type PrivateCareerConflictRecord = {
  id: string;
  conflictType: ConflictType;
  category: string;
  candidateFactIds: string[];
  sourceDocumentIds: string[];
  differingValueCount: number;
  differingValues: string[];
  sourceAuthorities: string[];
  reviewQuestion: string;
  selectedWinner: null;
  canonical: false;
};

export type PrivateCareerReviewItem = {
  reviewId: string;
  category: string;
  question: string;
  candidateFactIds: string[];
  supportingSourceIds: string[];
  sourceAuthority: string;
  recommendedReviewOrder: number;
  impactIfUnresolved: string;
  permittedOperatorDecisions: string[];
  automaticSelection: false;
  canonical: false;
};

export type PrivateContactBoundaryRecord = {
  sourceDocumentId: string;
  contactType: "email" | "phone" | "url" | "address_or_location" | "identity";
  count: number;
  valuesRedacted: true;
};

export type PrivateBusinessEvidenceReference = {
  id: string;
  candidateFactId: string;
  referencedProduct: "StaffordOS" | "ShopiFixer" | "Abando" | "AI automation" | "CI/CD or DevOps";
  status: "CROSS_WORKSPACE_CANDIDATE_REQUIRES_APPROVAL";
  modelUseAuthorized: false;
  canonical: false;
};

export type PrivateExtractionFailure = {
  sourceDocumentId: string;
  filename: string;
  failureCode: string;
  operatorSafeMessage: string;
};

export type PrivateCareerIntakeResult = {
  metadata: {
    schemaVersion: typeof PRIVATE_CAREER_INTAKE_VERSION;
    canonical: false;
    generatedAt: string;
    sourceDirectoryRedacted: string;
    outputDirectoryRedacted: string | null;
    noExternalUpload: true;
    noModelInvocation: true;
  };
  status: "completed" | "failed";
  failureCode: string | null;
  sourceInventory: PrivateCareerSourceInventoryRecord[];
  deferredSources: PrivateCareerSourceInventoryRecord[];
  evidence: PrivateCareerEvidenceRecord[];
  candidateFacts: CandidateCareerFactRecord[];
  conflicts: PrivateCareerConflictRecord[];
  reviewQueue: PrivateCareerReviewItem[];
  contactBoundary: PrivateContactBoundaryRecord[];
  businessEvidenceReferences: PrivateBusinessEvidenceReference[];
  extractionFailures: PrivateExtractionFailure[];
  privateArtifacts: string[];
  sourceFilesModified: boolean;
  summary: {
    supportedDocxCount: number;
    deferredPagesCount: number;
    ignoredFileCount: number;
    unsupportedFileCount: number;
    extractedDocumentCount: number;
    extractionFailureCount: number;
    candidateFactCount: number;
    evidenceCount: number;
    conflictCount: number;
    reviewItemCount: number;
    contactBoundaryCount: number;
    businessEvidenceReferenceCount: number;
  };
};

type IntakeOptions = {
  intakeDirectory: string;
  outputDirectory?: string | null;
  repositoryRoot: string;
  generatedAt: string;
  writePrivateArtifacts?: boolean;
};

type ZipEntry = {
  name: string;
  compressionMethod: number;
  compressedSize: number;
  uncompressedSize: number;
  localHeaderOffset: number;
};

type SourceState = {
  filePath: string;
  sizeBytes: number;
  modifiedMs: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function sha256Text(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function sha256Buffer(value: Buffer) {
  return createHash("sha256").update(value).digest("hex");
}

export function digestPrivateCareerFile(filePath: string) {
  return `sha256:${sha256Buffer(readFileSync(filePath))}`;
}

function shortHash(value: string) {
  return sha256Text(value).slice(0, 16);
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeForComparison(value: string) {
  return normalizeWhitespace(value)
    .toLowerCase()
    .replace(/[^\w\s%$.-]/g, "")
    .replace(/\b(inc|llc|ltd|corp|corporation|company)\b/g, "")
    .trim();
}

function redactPathForReport(filePath: string) {
  return filePath.replace(/^\/Users\/[^/]+/, "~");
}

function redactContactValues(value: string) {
  return value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[redacted-email]")
    .replace(/\b(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}\b/g, "[redacted-phone]")
    .replace(/\bhttps?:\/\/\S+/gi, "[redacted-url]")
    .replace(/\b(?:linkedin\.com|github\.com|portfolio)\S*/gi, "[redacted-url]");
}

function isInsideDirectory(candidatePath: string, parentPath: string) {
  const resolvedCandidate = path.resolve(candidatePath);
  const resolvedParent = path.resolve(parentPath);
  return resolvedCandidate === resolvedParent || resolvedCandidate.startsWith(`${resolvedParent}${path.sep}`);
}

function isRepositoryPath(candidatePath: string, repositoryRoot: string) {
  return isInsideDirectory(candidatePath, repositoryRoot);
}

function readUInt16LE(buffer: Buffer, offset: number) {
  return buffer.readUInt16LE(offset);
}

function readUInt32LE(buffer: Buffer, offset: number) {
  return buffer.readUInt32LE(offset);
}

function findEndOfCentralDirectory(buffer: Buffer) {
  for (let offset = buffer.length - 22; offset >= 0; offset -= 1) {
    if (buffer.readUInt32LE(offset) === 0x06054b50) {
      return offset;
    }
  }
  return -1;
}

function listZipEntries(buffer: Buffer): ZipEntry[] {
  const endOffset = findEndOfCentralDirectory(buffer);
  if (endOffset < 0) {
    throw new Error("DOCX ZIP directory was not found.");
  }

  const entryCount = readUInt16LE(buffer, endOffset + 10);
  const centralDirectoryOffset = readUInt32LE(buffer, endOffset + 16);
  const entries: ZipEntry[] = [];
  let offset = centralDirectoryOffset;

  for (let index = 0; index < entryCount; index += 1) {
    if (readUInt32LE(buffer, offset) !== 0x02014b50) {
      throw new Error("DOCX ZIP central directory is malformed.");
    }

    const compressionMethod = readUInt16LE(buffer, offset + 10);
    const compressedSize = readUInt32LE(buffer, offset + 20);
    const uncompressedSize = readUInt32LE(buffer, offset + 24);
    const fileNameLength = readUInt16LE(buffer, offset + 28);
    const extraLength = readUInt16LE(buffer, offset + 30);
    const commentLength = readUInt16LE(buffer, offset + 32);
    const localHeaderOffset = readUInt32LE(buffer, offset + 42);
    const nameStart = offset + 46;
    const name = buffer.toString("utf8", nameStart, nameStart + fileNameLength);

    entries.push({
      name,
      compressionMethod,
      compressedSize,
      uncompressedSize,
      localHeaderOffset,
    });

    offset = nameStart + fileNameLength + extraLength + commentLength;
  }

  return entries;
}

function readZipEntry(buffer: Buffer, entry: ZipEntry) {
  const localOffset = entry.localHeaderOffset;
  if (readUInt32LE(buffer, localOffset) !== 0x04034b50) {
    throw new Error("DOCX ZIP local header is malformed.");
  }

  const fileNameLength = readUInt16LE(buffer, localOffset + 26);
  const extraLength = readUInt16LE(buffer, localOffset + 28);
  const dataStart = localOffset + 30 + fileNameLength + extraLength;
  const data = buffer.subarray(dataStart, dataStart + entry.compressedSize);

  if (entry.compressionMethod === 0) {
    return data;
  }

  if (entry.compressionMethod === 8) {
    return inflateRawSync(data, { finishFlush: 2 });
  }

  throw new Error(`Unsupported DOCX ZIP compression method ${entry.compressionMethod}.`);
}

function decodeXml(value: string) {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

export function extractDocxTextSections(filePath: string): PrivateExtractedSection[] {
  const buffer = readFileSync(filePath);
  const entries = listZipEntries(buffer);
  const documentEntry = entries.find((entry) => entry.name === "word/document.xml");

  if (!documentEntry) {
    throw new Error("DOCX document.xml was not found.");
  }

  const xml = readZipEntry(buffer, documentEntry).toString("utf8");
  const paragraphMatches = xml.match(/<w:p[\s\S]*?<\/w:p>/g) || [];
  const sections: PrivateExtractedSection[] = [];
  let currentHeading: string | null = null;

  for (const paragraph of paragraphMatches) {
    const withBreaks = paragraph
      .replace(/<w:tab\s*\/>/g, " ")
      .replace(/<w:br\s*\/>/g, "\n")
      .replace(/<w:cr\s*\/>/g, "\n");
    const textMatches = [...withBreaks.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g)];
    const text = normalizeWhitespace(textMatches.map((match) => decodeXml(match[1])).join(""));

    if (!text) {
      continue;
    }

    if (isLikelyHeading(text)) {
      currentHeading = text;
    }

    sections.push({
      sectionId: `paragraph-${String(sections.length + 1).padStart(4, "0")}`,
      sectionHeading: currentHeading,
      text,
    });
  }

  return sections;
}

function isLikelyHeading(text: string) {
  const normalized = normalizeWhitespace(text);
  if (normalized.length > 64) {
    return false;
  }
  return /^(experience|professional experience|work experience|education|skills|technical skills|certifications|projects|selected projects|leadership|summary|profile|accomplishments)$/i.test(
    normalized,
  );
}

function containsContactValue(text: string) {
  return (
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(text) ||
    /\b(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}\b/.test(text) ||
    /\b(?:https?:\/\/|linkedin\.com|github\.com)\S*/i.test(text)
  );
}

function countMatches(text: string, pattern: RegExp) {
  return [...text.matchAll(pattern)].length;
}

function findContactBoundary(sourceDocumentId: string, sections: PrivateExtractedSection[]) {
  const text = sections.map((section) => section.text).join("\n");
  const records: PrivateContactBoundaryRecord[] = [];
  const emailCount = countMatches(text, /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi);
  const phoneCount = countMatches(text, /\b(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}\b/g);
  const urlCount = countMatches(text, /\b(?:https?:\/\/|linkedin\.com|github\.com)\S*/gi);
  const identityCount = countMatches(text, /\bross\s+stafford\b/gi);

  if (emailCount > 0) {
    records.push({ sourceDocumentId, contactType: "email", count: emailCount, valuesRedacted: true });
  }
  if (phoneCount > 0) {
    records.push({ sourceDocumentId, contactType: "phone", count: phoneCount, valuesRedacted: true });
  }
  if (urlCount > 0) {
    records.push({ sourceDocumentId, contactType: "url", count: urlCount, valuesRedacted: true });
  }
  if (identityCount > 0) {
    records.push({ sourceDocumentId, contactType: "identity", count: identityCount, valuesRedacted: true });
  }

  return records;
}

function hasDateExpression(text: string) {
  return /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+\d{4}\b/i.test(text) || /\b(?:19|20)\d{2}\s*(?:-|to|–|—)\s*(?:present|current|(?:19|20)\d{2})\b/i.test(text);
}

function hasMetric(text: string) {
  return /\b(?:\d+%|\$\s?\d|\d+\s*(?:customers?|users?|projects?|teams?|employees?|stores?|merchants?|hours?|days?|weeks?|months?|years?|x)\b)/i.test(
    text,
  );
}

function classifySectionFact(section: PrivateExtractedSection): FactType | null {
  const text = section.text;
  const heading = section.sectionHeading || "";

  if (containsContactValue(text) || /\bross\s+stafford\b/i.test(text)) {
    return null;
  }

  if (/\b(certification|certificate|certified|credential|pmp|scrum|aws|azure|google analytics)\b/i.test(text)) {
    return "CERTIFICATION";
  }

  if (/\b(university|college|degree|bachelor|master|mba|school|education)\b/i.test(text)) {
    return "EDUCATION";
  }

  if (hasMetric(text)) {
    return "ACHIEVEMENT";
  }

  if (/\b(staffordos|shopifixer|abando|architecture|architected|platform|system design|automation|ai automation|ci\/cd|devops)\b/i.test(text)) {
    return /\barchitecture|architected|system design\b/i.test(text) ? "ARCHITECTURE" : "PROJECT";
  }

  if (hasDateExpression(text)) {
    return "EMPLOYMENT";
  }

  if (/\b(skills?|technolog(?:y|ies)|tools?|platforms?)\b/i.test(heading) || /\b(javascript|typescript|python|sql|react|node|aws|gcp|azure|salesforce|shopify|analytics|tableau|looker)\b/i.test(text)) {
    return "TECHNOLOGY";
  }

  if (/\b(led|managed|owned|coordinated|directed|mentored|stakeholders?)\b/i.test(text)) {
    return "LEADERSHIP";
  }

  return null;
}

function sourceReference(sourceId: string) {
  return `private-career-source://${sourceId}`;
}

function createEvidenceForSource(source: PrivateCareerSourceInventoryRecord): PrivateCareerEvidenceRecord {
  return {
    id: `privev_${shortHash(source.privateSourceId)}`,
    workspaceId: PRIVATE_CAREER_WORKSPACE_ID,
    evidenceType: "RESUME",
    sourceDocumentId: source.privateSourceId,
    sourceReference: sourceReference(source.privateSourceId),
    authorityClassification: "GENERATED_DOCUMENT",
    privacyClassification: "Professional owner-private",
    freshness: "Historical",
    supportsFactIds: [],
    challengesFactIds: [],
    limitations: [
      "Resume wording is evidence of a claim, not automatic career truth.",
      "Facts from this source require Ross's review before verification.",
    ],
    canonical: false,
  };
}

function createCandidateFact(
  section: PrivateExtractedSection,
  source: PrivateCareerSourceInventoryRecord,
  evidenceId: string,
): CandidateCareerFactRecord | null {
  const factType = classifySectionFact(section);
  if (!factType) {
    return null;
  }

  const statement = redactContactValues(section.text);
  const normalizedStatement = normalizeForComparison(statement);
  const metric = hasMetric(statement);
  const businessReference = /\b(staffordos|shopifixer|abando|ai automation|ci\/cd|devops)\b/i.test(statement);
  const verificationStatus = businessReference ? "PARTIALLY_SUPPORTED" : metric ? "NEEDS_EVIDENCE" : "PROPOSED";

  return {
    id: `privfact_${shortHash(`${source.privateSourceId}:${section.sectionId}:${normalizedStatement}`)}`,
    workspaceId: PRIVATE_CAREER_WORKSPACE_ID,
    factType,
    statement,
    normalizedStatement,
    sourceDocumentId: source.privateSourceId,
    sourceEvidenceId: evidenceId,
    sourceSectionReference: `${sourceReference(source.privateSourceId)}#${section.sectionId}`,
    sourceExcerpt: statement,
    authorityClassification: businessReference ? "REPOSITORY_BACKED" : "GENERATED_DOCUMENT",
    privacyClassification: "Professional owner-private",
    verificationStatus,
    operatorReviewStatus: "Needs Ross's review",
    metricClassification: metric ? "UNSUPPORTED" : "NOT_APPLICABLE",
    metricReviewClassification: metric ? "NEEDS_REVIEW" : "NOT_APPLICABLE",
    experienceClassification: factType === "TECHNOLOGY" ? "NEEDS_VERIFICATION" : null,
    conflictTypes: [],
    limitations: [
      "Candidate fact extracted from a private resume source.",
      "This is not verified career truth.",
    ],
    canonical: false,
  };
}

function extractPossibleDateTokens(value: string) {
  return [
    ...value.matchAll(/\b(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+)?(?:19|20)\d{2}\b/gi),
  ].map((match) => normalizeWhitespace(match[0]).toLowerCase());
}

function detectConflictType(facts: CandidateCareerFactRecord[]): ConflictType | null {
  if (facts.length < 2) {
    return null;
  }

  const type = facts[0].factType;
  const statements = Array.from(new Set(facts.map((fact) => fact.normalizedStatement)));
  if (statements.length < 2) {
    return null;
  }

  if (type === "EMPLOYMENT") {
    const dateSets = facts.map((fact) => extractPossibleDateTokens(fact.statement).join("|"));
    const uniqueDates = Array.from(new Set(dateSets.filter(Boolean)));
    if (uniqueDates.length > 1) {
      return "START_DATE_CONFLICT";
    }
    return "TITLE_CONFLICT";
  }

  if (type === "EDUCATION") {
    return "EDUCATION_CONFLICT";
  }

  if (type === "CERTIFICATION") {
    return "CERTIFICATION_CONFLICT";
  }

  if (type === "ACHIEVEMENT") {
    return "METRIC_CONFLICT";
  }

  if (type === "TECHNOLOGY") {
    return "SKILL_CONTEXT_CONFLICT";
  }

  if (type === "PROJECT" || type === "ARCHITECTURE" || type === "PRODUCT") {
    return "PROJECT_STATUS_CONFLICT";
  }

  return "OTHER";
}

export function identifyPrivateCareerConflicts(
  facts: readonly CandidateCareerFactRecord[],
): PrivateCareerConflictRecord[] {
  const byType = new Map<FactType, CandidateCareerFactRecord[]>();

  for (const fact of facts) {
    if (fact.factType === "SKILL" || fact.factType === "LEADERSHIP" || fact.factType === "OTHER") {
      continue;
    }
    const existing = byType.get(fact.factType) || [];
    existing.push(fact);
    byType.set(fact.factType, existing);
  }

  const conflicts: PrivateCareerConflictRecord[] = [];

  for (const [factType, groupedFacts] of byType) {
    const conflictType = detectConflictType(groupedFacts);
    if (!conflictType) {
      continue;
    }

    conflicts.push({
      id: `privconf_${shortHash(`${conflictType}:${groupedFacts.map((fact) => fact.id).join(":")}`)}`,
      conflictType,
      category: factType,
      candidateFactIds: groupedFacts.map((fact) => fact.id).sort(),
      sourceDocumentIds: Array.from(new Set(groupedFacts.map((fact) => fact.sourceDocumentId))).sort(),
      differingValueCount: Array.from(new Set(groupedFacts.map((fact) => fact.normalizedStatement))).length,
      differingValues: Array.from(new Set(groupedFacts.map((fact) => fact.statement))).sort(),
      sourceAuthorities: ["GENERATED_DOCUMENT"],
      reviewQuestion: `Which ${factType.toLowerCase()} wording, if any, is accurate enough for career authority?`,
      selectedWinner: null,
      canonical: false,
    });
  }

  return conflicts.sort((a, b) => a.id.localeCompare(b.id));
}

function createMetricReviewItems(facts: readonly CandidateCareerFactRecord[]) {
  return facts
    .filter((fact) => fact.metricReviewClassification === "NEEDS_REVIEW")
    .map((fact, index): PrivateCareerReviewItem => ({
      reviewId: `privreview_metric_${String(index + 1).padStart(3, "0")}_${shortHash(fact.id)}`,
      category: "Accomplishments and metrics",
      question: "What source proves this metric, baseline, and scope?",
      candidateFactIds: [fact.id],
      supportingSourceIds: [fact.sourceDocumentId],
      sourceAuthority: fact.authorityClassification,
      recommendedReviewOrder: 700 + index,
      impactIfUnresolved: "Unsupported metrics cannot be used in resume or application positioning.",
      permittedOperatorDecisions: ["confirm metric source", "mark estimate", "remove metric", "reject claim"],
      automaticSelection: false,
      canonical: false,
    }));
}

function reviewPriorityForConflict(conflict: PrivateCareerConflictRecord) {
  if (conflict.conflictType === "EMPLOYER_CONFLICT" || conflict.conflictType === "TITLE_CONFLICT") {
    return 200;
  }
  if (conflict.conflictType === "START_DATE_CONFLICT" || conflict.conflictType === "END_DATE_CONFLICT") {
    return 300;
  }
  if (conflict.conflictType === "EDUCATION_CONFLICT") {
    return 400;
  }
  if (conflict.conflictType === "CERTIFICATION_CONFLICT") {
    return 500;
  }
  if (conflict.conflictType === "PROJECT_STATUS_CONFLICT") {
    return 600;
  }
  if (conflict.conflictType === "METRIC_CONFLICT") {
    return 700;
  }
  return 900;
}

export function buildPrivateCareerReviewQueue(
  conflicts: readonly PrivateCareerConflictRecord[],
  facts: readonly CandidateCareerFactRecord[],
  contactBoundary: readonly PrivateContactBoundaryRecord[],
): PrivateCareerReviewItem[] {
  const reviewItems: PrivateCareerReviewItem[] = [];

  if (contactBoundary.length > 0) {
    reviewItems.push({
      reviewId: `privreview_identity_${shortHash(contactBoundary.map((item) => `${item.sourceDocumentId}:${item.contactType}`).join(":"))}`,
      category: "Identity and contact details",
      question: "Which contact details should be approved for future resume use?",
      candidateFactIds: [],
      supportingSourceIds: Array.from(new Set(contactBoundary.map((item) => item.sourceDocumentId))).sort(),
      sourceAuthority: "GENERATED_DOCUMENT",
      recommendedReviewOrder: 100,
      impactIfUnresolved: "Contact information remains isolated and cannot be used in generated materials.",
      permittedOperatorDecisions: ["approve contact value", "reject contact value", "mark stale", "needs source"],
      automaticSelection: false,
      canonical: false,
    });
  }

  for (const conflict of conflicts) {
    reviewItems.push({
      reviewId: `privreview_conflict_${shortHash(conflict.id)}`,
      category: conflict.category,
      question: conflict.reviewQuestion,
      candidateFactIds: [...conflict.candidateFactIds],
      supportingSourceIds: [...conflict.sourceDocumentIds],
      sourceAuthority: conflict.sourceAuthorities.join(", "),
      recommendedReviewOrder: reviewPriorityForConflict(conflict),
      impactIfUnresolved: "StaffordOS cannot treat conflicting resume wording as verified career truth.",
      permittedOperatorDecisions: ["choose after evidence review", "mark all unverified", "request stronger evidence", "reject unsupported wording"],
      automaticSelection: false,
      canonical: false,
    });
  }

  reviewItems.push(...createMetricReviewItems(facts));

  return reviewItems
    .map((item, index) => ({ ...item, recommendedReviewOrder: item.recommendedReviewOrder + index }))
    .sort((a, b) => a.recommendedReviewOrder - b.recommendedReviewOrder || a.reviewId.localeCompare(b.reviewId));
}

function createBusinessEvidenceReferences(facts: readonly CandidateCareerFactRecord[]): PrivateBusinessEvidenceReference[] {
  const references: PrivateBusinessEvidenceReference[] = [];

  for (const fact of facts) {
    const text = fact.statement;
    const products: PrivateBusinessEvidenceReference["referencedProduct"][] = [];
    if (/\bstaffordos\b/i.test(text)) {
      products.push("StaffordOS");
    }
    if (/\bshopifixer\b/i.test(text)) {
      products.push("ShopiFixer");
    }
    if (/\babando\b/i.test(text)) {
      products.push("Abando");
    }
    if (/\bai automation\b/i.test(text)) {
      products.push("AI automation");
    }
    if (/\b(ci\/cd|devops)\b/i.test(text)) {
      products.push("CI/CD or DevOps");
    }

    for (const product of products) {
      references.push({
        id: `privbizref_${shortHash(`${fact.id}:${product}`)}`,
        candidateFactId: fact.id,
        referencedProduct: product,
        status: "CROSS_WORKSPACE_CANDIDATE_REQUIRES_APPROVAL",
        modelUseAuthorized: false,
        canonical: false,
      });
    }
  }

  return references;
}

function inventorySourceFile(filePath: string, supportStatus: SourceStatus): PrivateCareerSourceInventoryRecord {
  const stats = statSync(filePath);
  const filename = path.basename(filePath);
  const extension = path.extname(filename).toLowerCase();
  const isDocx = supportStatus === "SUPPORTED_DOCX_SOURCE";
  const isPages = supportStatus === "DEFERRED_UNSUPPORTED_SOURCE_FILE";
  const contentDigest = isDocx ? digestPrivateCareerFile(filePath) : null;
  const idBasis = contentDigest ? `${filename}:${stats.size}:${contentDigest}` : `${filename}:${stats.size}`;

  return {
    privateSourceId: `privsrc_${shortHash(idBasis)}`,
    filename,
    extension,
    sizeBytes: stats.size,
    modifiedAt: stats.mtime.toISOString(),
    contentDigest,
    sourceClassification: isDocx ? "Resume DOCX" : isPages ? "Deferred Pages document" : "Unsupported file",
    likelyDocumentPurpose: /resume/i.test(filename) ? "resume" : "unknown",
    extractionSupportStatus: supportStatus,
    privacyClassification: "Professional owner-private",
    duplicateDocumentStatus: "NOT_EVALUATED",
    limitations: isDocx
      ? ["DOCX content is treated as untrusted resume wording, not career truth."]
      : isPages
        ? ["Pages file was not opened, parsed, converted, moved, renamed, or modified."]
        : ["This extension is not supported by the S010.02C DOCX intake."],
    contentInspected: false,
  };
}

function applyDuplicateStatuses(sources: PrivateCareerSourceInventoryRecord[]) {
  const byDigest = new Map<string, PrivateCareerSourceInventoryRecord[]>();

  for (const source of sources) {
    if (!source.contentDigest) {
      continue;
    }
    const existing = byDigest.get(source.contentDigest) || [];
    existing.push(source);
    byDigest.set(source.contentDigest, existing);
  }

  const supported = sources.filter((source) => source.extractionSupportStatus === "SUPPORTED_DOCX_SOURCE");
  const hasVariants = supported.length > 1;

  for (const source of supported) {
    const matching = source.contentDigest ? byDigest.get(source.contentDigest) || [] : [];
    if (matching.length > 1) {
      source.duplicateDocumentStatus = "EXACT_DUPLICATE";
    } else if (hasVariants && source.likelyDocumentPurpose === "resume") {
      source.duplicateDocumentStatus = "CONTENT_VARIANT";
    } else {
      source.duplicateDocumentStatus = "NOT_EVALUATED";
    }
  }
}

function getSourceStates(filePaths: string[]): SourceState[] {
  return filePaths.map((filePath) => {
    const stats = statSync(filePath);
    return {
      filePath,
      sizeBytes: stats.size,
      modifiedMs: stats.mtimeMs,
    };
  });
}

function sourceStatesChanged(before: SourceState[], after: SourceState[]) {
  return before.some((beforeState) => {
    const afterState = after.find((state) => state.filePath === beforeState.filePath);
    return !afterState || afterState.sizeBytes !== beforeState.sizeBytes || afterState.modifiedMs !== beforeState.modifiedMs;
  });
}

function failureResult(options: IntakeOptions, failureCode: string): PrivateCareerIntakeResult {
  return {
    metadata: {
      schemaVersion: PRIVATE_CAREER_INTAKE_VERSION,
      canonical: false,
      generatedAt: options.generatedAt,
      sourceDirectoryRedacted: options.intakeDirectory ? redactPathForReport(options.intakeDirectory) : "",
      outputDirectoryRedacted: options.outputDirectory ? redactPathForReport(options.outputDirectory) : null,
      noExternalUpload: true,
      noModelInvocation: true,
    },
    status: "failed",
    failureCode,
    sourceInventory: [],
    deferredSources: [],
    evidence: [],
    candidateFacts: [],
    conflicts: [],
    reviewQueue: [],
    contactBoundary: [],
    businessEvidenceReferences: [],
    extractionFailures: [],
    privateArtifacts: [],
    sourceFilesModified: false,
    summary: {
      supportedDocxCount: 0,
      deferredPagesCount: 0,
      ignoredFileCount: 0,
      unsupportedFileCount: 0,
      extractedDocumentCount: 0,
      extractionFailureCount: 0,
      candidateFactCount: 0,
      evidenceCount: 0,
      conflictCount: 0,
      reviewItemCount: 0,
      contactBoundaryCount: 0,
      businessEvidenceReferenceCount: 0,
    },
  };
}

function writePrivateOutput(outputDirectory: string, filename: string, payload: unknown) {
  mkdirSync(outputDirectory, { recursive: true, mode: 0o700 });
  chmodSync(outputDirectory, 0o700);
  const outputPath = path.join(outputDirectory, filename);
  writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, { mode: 0o600 });
  chmodSync(outputPath, 0o600);
  return outputPath;
}

function buildPrivatePayload<T>(generatedAt: string, records: T[]) {
  return {
    metadata: {
      schemaVersion: PRIVATE_CAREER_INTAKE_VERSION,
      canonical: false,
      generatedAt,
      privacyClassification: "Professional owner-private",
      limitation: "Private local artifact. Not committed to Git and not canonical truth.",
    },
    records,
  };
}

export function runPrivateCareerEvidenceIntake(options: IntakeOptions): PrivateCareerIntakeResult {
  if (!options.intakeDirectory) {
    return failureResult(options, "EXPLICIT_INTAKE_DIRECTORY_REQUIRED");
  }

  if (!options.repositoryRoot) {
    return failureResult(options, "REPOSITORY_ROOT_REQUIRED");
  }

  const intakeDirectory = path.resolve(options.intakeDirectory);
  const repositoryRoot = path.resolve(options.repositoryRoot);
  const outputDirectory = options.outputDirectory ? path.resolve(options.outputDirectory) : null;

  if (!existsSync(intakeDirectory)) {
    return failureResult(options, "PRIVATE_INTAKE_DIRECTORY_NOT_FOUND");
  }

  if (isRepositoryPath(intakeDirectory, repositoryRoot)) {
    return failureResult(options, "PRIVATE_DIRECTORY_INSIDE_REPOSITORY");
  }

  if (outputDirectory && isRepositoryPath(outputDirectory, repositoryRoot)) {
    return failureResult(options, "PRIVATE_OUTPUT_DIRECTORY_INSIDE_REPOSITORY");
  }

  const directoryEntries = readdirSync(intakeDirectory, { withFileTypes: true }).filter((entry) => entry.isFile());
  const sourceFilePaths = directoryEntries.map((entry) => path.join(intakeDirectory, entry.name));
  const beforeStates = getSourceStates(sourceFilePaths);
  const ignoredCount = directoryEntries.filter((entry) => IGNORED_PRIVATE_CAREER_SOURCE_FILENAMES.includes(entry.name as ".DS_Store")).length;
  const sourceInventory: PrivateCareerSourceInventoryRecord[] = [];

  for (const entry of directoryEntries) {
    if (IGNORED_PRIVATE_CAREER_SOURCE_FILENAMES.includes(entry.name as ".DS_Store")) {
      continue;
    }

    const filePath = path.join(intakeDirectory, entry.name);
    const extension = path.extname(entry.name).toLowerCase();
    if (SUPPORTED_PRIVATE_CAREER_SOURCE_EXTENSIONS.includes(extension as ".docx")) {
      sourceInventory.push(inventorySourceFile(filePath, "SUPPORTED_DOCX_SOURCE"));
    } else if (DEFERRED_PRIVATE_CAREER_SOURCE_EXTENSIONS.includes(extension as ".pages")) {
      sourceInventory.push(inventorySourceFile(filePath, "DEFERRED_UNSUPPORTED_SOURCE_FILE"));
    } else {
      sourceInventory.push(inventorySourceFile(filePath, "UNSUPPORTED_SOURCE_FILE"));
    }
  }

  applyDuplicateStatuses(sourceInventory);

  const evidence: PrivateCareerEvidenceRecord[] = [];
  const candidateFacts: CandidateCareerFactRecord[] = [];
  const contactBoundary: PrivateContactBoundaryRecord[] = [];
  const extractionFailures: PrivateExtractionFailure[] = [];

  for (const source of sourceInventory.filter((item) => item.extractionSupportStatus === "SUPPORTED_DOCX_SOURCE")) {
    const filePath = path.join(intakeDirectory, source.filename);
    try {
      const sections = extractDocxTextSections(filePath);
      source.contentInspected = true;
      const evidenceRecord = createEvidenceForSource(source);
      evidence.push(evidenceRecord);
      contactBoundary.push(...findContactBoundary(source.privateSourceId, sections));

      for (const section of sections) {
        const fact = createCandidateFact(section, source, evidenceRecord.id);
        if (fact) {
          evidenceRecord.supportsFactIds.push(fact.id);
          candidateFacts.push(fact);
        }
      }
    } catch (error) {
      extractionFailures.push({
        sourceDocumentId: source.privateSourceId,
        filename: source.filename,
        failureCode: "DOCX_TEXT_EXTRACTION_FAILED",
        operatorSafeMessage: "This DOCX could not be safely extracted with the local DOCX reader.",
      });
    }
  }

  const conflicts = identifyPrivateCareerConflicts(candidateFacts);
  const conflictFactIds = new Map<string, ConflictType[]>();
  for (const conflict of conflicts) {
    for (const factId of conflict.candidateFactIds) {
      const existing = conflictFactIds.get(factId) || [];
      existing.push(conflict.conflictType);
      conflictFactIds.set(factId, existing);
    }
  }

  for (const fact of candidateFacts) {
    const conflictTypes = conflictFactIds.get(fact.id);
    if (conflictTypes && conflictTypes.length > 0) {
      fact.conflictTypes = Array.from(new Set(conflictTypes));
      fact.verificationStatus = "CONFLICTING";
    }
  }

  const businessEvidenceReferences = createBusinessEvidenceReferences(candidateFacts);
  const reviewQueue = buildPrivateCareerReviewQueue(conflicts, candidateFacts, contactBoundary);
  const afterStates = getSourceStates(sourceFilePaths);
  const privateArtifacts: string[] = [];

  if (options.writePrivateArtifacts === true && outputDirectory) {
    privateArtifacts.push(
      writePrivateOutput(outputDirectory, "career_source_inventory.private.json", buildPrivatePayload(options.generatedAt, sourceInventory)),
      writePrivateOutput(
        outputDirectory,
        "deferred_sources.private.json",
        buildPrivatePayload(options.generatedAt, sourceInventory.filter((source) => source.extractionSupportStatus === "DEFERRED_UNSUPPORTED_SOURCE_FILE")),
      ),
      writePrivateOutput(outputDirectory, "candidate_career_facts.private.json", buildPrivatePayload(options.generatedAt, candidateFacts)),
      writePrivateOutput(outputDirectory, "career_evidence.private.json", buildPrivatePayload(options.generatedAt, evidence)),
      writePrivateOutput(outputDirectory, "career_conflicts.private.json", buildPrivatePayload(options.generatedAt, conflicts)),
      writePrivateOutput(outputDirectory, "career_review_queue.private.json", buildPrivatePayload(options.generatedAt, reviewQueue)),
    );
  }

  const result: PrivateCareerIntakeResult = {
    metadata: {
      schemaVersion: PRIVATE_CAREER_INTAKE_VERSION,
      canonical: false,
      generatedAt: options.generatedAt,
      sourceDirectoryRedacted: redactPathForReport(intakeDirectory),
      outputDirectoryRedacted: outputDirectory ? redactPathForReport(outputDirectory) : null,
      noExternalUpload: true,
      noModelInvocation: true,
    },
    status: "completed",
    failureCode: null,
    sourceInventory,
    deferredSources: sourceInventory.filter((source) => source.extractionSupportStatus === "DEFERRED_UNSUPPORTED_SOURCE_FILE"),
    evidence,
    candidateFacts,
    conflicts,
    reviewQueue,
    contactBoundary,
    businessEvidenceReferences,
    extractionFailures,
    privateArtifacts,
    sourceFilesModified: sourceStatesChanged(beforeStates, afterStates),
    summary: {
      supportedDocxCount: sourceInventory.filter((source) => source.extractionSupportStatus === "SUPPORTED_DOCX_SOURCE").length,
      deferredPagesCount: sourceInventory.filter((source) => source.extractionSupportStatus === "DEFERRED_UNSUPPORTED_SOURCE_FILE").length,
      ignoredFileCount: ignoredCount,
      unsupportedFileCount: sourceInventory.filter((source) => source.extractionSupportStatus === "UNSUPPORTED_SOURCE_FILE").length,
      extractedDocumentCount: evidence.length,
      extractionFailureCount: extractionFailures.length,
      candidateFactCount: candidateFacts.length,
      evidenceCount: evidence.length,
      conflictCount: conflicts.length,
      reviewItemCount: reviewQueue.length,
      contactBoundaryCount: contactBoundary.length,
      businessEvidenceReferenceCount: businessEvidenceReferences.length,
    },
  };

  return result;
}

export function getPrivateCareerIntakeRedactedSummary(result: PrivateCareerIntakeResult) {
  return {
    schemaVersion: result.metadata.schemaVersion,
    canonical: result.metadata.canonical,
    status: result.status,
    failureCode: result.failureCode,
    sourceDirectory: result.metadata.sourceDirectoryRedacted,
    outputDirectory: result.metadata.outputDirectoryRedacted,
    supportedDocxSourcesProcessed: result.summary.extractedDocumentCount,
    deferredPagesSources: result.summary.deferredPagesCount,
    ignoredFiles: result.summary.ignoredFileCount,
    unsupportedFiles: result.summary.unsupportedFileCount,
    docxExtractionFailures: result.summary.extractionFailureCount,
    candidateFacts: result.summary.candidateFactCount,
    evidenceRecords: result.summary.evidenceCount,
    conflicts: result.summary.conflictCount,
    reviewItems: result.summary.reviewItemCount,
    contactBoundaryRecords: result.summary.contactBoundaryCount,
    businessEvidenceReferences: result.summary.businessEvidenceReferenceCount,
    sourceFilesModified: result.sourceFilesModified,
    noExternalUpload: result.metadata.noExternalUpload,
    noModelInvocation: result.metadata.noModelInvocation,
  };
}

export function hasPrivateDataLeakInText(text: string, privatePatterns: readonly RegExp[]) {
  return privatePatterns.some((pattern) => pattern.test(text));
}

export function assertPrivateIntakeResultShape(value: unknown) {
  return (
    isRecord(value) &&
    isRecord(value.metadata) &&
    value.metadata.schemaVersion === PRIVATE_CAREER_INTAKE_VERSION &&
    value.metadata.canonical === false &&
    isRecord(value.summary) &&
    Array.isArray(value.sourceInventory) &&
    Array.isArray(value.candidateFacts) &&
    Array.isArray(value.reviewQueue)
  );
}
