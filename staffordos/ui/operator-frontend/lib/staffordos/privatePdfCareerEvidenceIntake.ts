import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import * as path from "node:path";
import {
  digestPrivateCareerFile,
  extractDocxTextSections,
  type PrivateExtractedSection,
} from "./privateCareerEvidenceIntake";

export const PRIVATE_PDF_CAREER_INTAKE_VERSION = "S010.02C2";
export const PRIVATE_PDF_CAREER_WORKSPACE_ID = "professional";

export const PRIVATE_PDF_CAREER_OUTPUT_FILENAMES = [
  "combined_source_inventory.private.json",
  "combined_document_classification.private.json",
  "combined_document_version_review.private.json",
  "combined_candidate_career_facts.private.json",
  "combined_career_evidence.private.json",
  "combined_conflicts.private.json",
  "combined_contact_review.private.json",
  "combined_skill_context.private.json",
  "combined_project_product_review.private.json",
  "combined_metric_review.private.json",
  "combined_cross_workspace_evidence.private.json",
  "combined_operator_review_queue.private.json",
] as const;

type SupportedExtension = ".pdf" | ".docx" | ".txt" | ".md" | ".markdown";
type SourceKind = "PDF" | "DOCX" | "TEXT" | "MARKDOWN";
type SourceInventoryStatus =
  | "SUPPORTED_SOURCE"
  | "DEFERRED_PAGES_SOURCE"
  | "IGNORED_SYSTEM_FILE"
  | "UNSUPPORTED_SOURCE";

type DocumentPurpose =
  | "GENERAL_RESUME"
  | "ROLE_TARGETED_RESUME"
  | "LINKEDIN_OR_PROFILE_EXPORT"
  | "COVER_LETTER"
  | "INTERVIEW_PREPARATION"
  | "PROJECT_OR_PRODUCT_EVIDENCE"
  | "TERMINAL_OR_RUNTIME_EVIDENCE"
  | "CERTIFICATION_OR_EDUCATION_RECORD"
  | "CAREER_NOTE"
  | "DUPLICATE_OR_VARIANT"
  | "NON_CAREER_DOCUMENT"
  | "EXTRACTION_FAILED"
  | "NEEDS_OPERATOR_REVIEW";

type VersionClassification =
  | "EXACT_DUPLICATE"
  | "NEAR_DUPLICATE"
  | "FORMAT_DERIVATIVE"
  | "GENERAL_VARIANT"
  | "ROLE_TARGETED_VARIANT"
  | "COVER_LETTER_VARIANT"
  | "HISTORICAL_VERSION"
  | "POSSIBLE_CURRENT_CANDIDATE"
  | "UNIQUE_EVIDENCE_SOURCE"
  | "NON_CAREER_SOURCE"
  | "UNKNOWN_PURPOSE";

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
  | "PRESENTATION"
  | "PUBLICATION"
  | "INTERVIEW_STORY"
  | "REFERENCE"
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
  | "POSITIONING_VARIANT"
  | "OTHER";

type MetricClassification =
  | "VERIFIED_METRIC"
  | "OPERATOR_ESTIMATE"
  | "DERIVED_ESTIMATE"
  | "THIRD_PARTY_REPORTED"
  | "UNSUPPORTED"
  | "NEEDS_REVIEW"
  | "REJECTED"
  | "NOT_APPLICABLE";

type SkillContext =
  | "USED_IN_PRODUCTION"
  | "USED_IN_CONTROLLED_PROJECT"
  | "USED_IN_CLIENT_DELIVERY"
  | "USED_IN_TRAINING"
  | "STUDIED"
  | "FAMILIAR"
  | "TRANSFERABLE"
  | "NEEDS_VERIFICATION";

export type CombinedCareerSourceRecord = {
  privateSourceId: string;
  filename: string;
  extension: string;
  sourceKind: SourceKind | "PAGES" | "SYSTEM" | "UNSUPPORTED";
  inventoryStatus: SourceInventoryStatus;
  sizeBytes: number;
  modifiedAt: string;
  contentDigest: string | null;
  privacyClassification: "Professional owner-private";
  sourcePath: string | null;
  contentInspected: boolean;
  extractionStatus: "NOT_ATTEMPTED" | "EXTRACTED" | "LIMITED" | "FAILED";
  extractionMethod: "TEXTUTIL_LOCAL_PDF" | "DOCX_LOCAL_XML" | "TEXT_LOCAL_READ" | "NOT_APPLICABLE";
  documentTextDigest: string | null;
  documentPurpose: DocumentPurpose;
  versionClassification: VersionClassification;
  duplicateGroupId: string | null;
  usedForFactExtraction: boolean;
  limitations: string[];
};

export type CombinedCareerEvidenceRecord = {
  id: string;
  workspaceId: typeof PRIVATE_PDF_CAREER_WORKSPACE_ID;
  evidenceType: "RESUME" | "COVER_LETTER" | "PROFILE_EXPORT" | "PROJECT_ARTIFACT" | "CAREER_NOTE" | "OTHER";
  sourceDocumentId: string;
  sourceKind: SourceKind;
  sourceReference: string;
  authorityClassification: "GENERATED_DOCUMENT" | "SELF_AUTHORED_DOCUMENT" | "REPOSITORY_BACKED" | "NEEDS_VERIFICATION";
  privacyClassification: "Professional owner-private";
  freshness: "Historical" | "Unknown";
  supportsFactIds: string[];
  challengesFactIds: string[];
  limitations: string[];
  canonical: false;
};

export type CombinedCandidateCareerFact = {
  id: string;
  workspaceId: typeof PRIVATE_PDF_CAREER_WORKSPACE_ID;
  factType: FactType;
  statement: string;
  normalizedStatement: string;
  sourceDocumentId: string;
  sourceEvidenceId: string;
  sourceType: SourceKind;
  sourceReference: string;
  sourcePageOrSectionReference: string;
  authorityClassification: "GENERATED_DOCUMENT" | "SELF_AUTHORED_DOCUMENT" | "REPOSITORY_BACKED" | "NEEDS_VERIFICATION";
  privacyClassification: "Professional owner-private";
  verificationStatus:
    | "PROPOSED"
    | "NEEDS_EVIDENCE"
    | "PARTIALLY_SUPPORTED"
    | "CONFLICTING"
    | "HISTORICAL_ONLY";
  operatorReviewStatus: "Needs Ross's review";
  metricClassification: MetricClassification;
  skillContext: SkillContext | null;
  positioningOnly: boolean;
  conflictTypes: ConflictType[];
  limitations: string[];
  canonical: false;
};

export type CombinedCareerConflictRecord = {
  id: string;
  conflictType: ConflictType;
  category: string;
  candidateFactIds: string[];
  sourceDocumentIds: string[];
  differingValueCount: number;
  sourceAuthorities: string[];
  reviewQuestion: string;
  selectedWinner: null;
  canonical: false;
};

export type CombinedCareerReviewItem = {
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

export type CombinedDocumentClassificationRecord = {
  sourceDocumentId: string;
  documentPurpose: DocumentPurpose;
  extractionStatus: CombinedCareerSourceRecord["extractionStatus"];
  sourceKind: SourceKind | "PAGES" | "SYSTEM" | "UNSUPPORTED";
  usedForFactExtraction: boolean;
  limitations: string[];
};

export type CombinedDocumentVersionReviewRecord = {
  sourceDocumentId: string;
  sourceKind: SourceKind | "PAGES" | "SYSTEM" | "UNSUPPORTED";
  documentPurpose: DocumentPurpose;
  versionClassification: VersionClassification;
  duplicateGroupId: string | null;
  contentDoubleCounted: false;
  canonicalResumeSelected: false;
  modificationTimeUsedAsAuthority: false;
  repeatedWordingVerifiesClaim: false;
  reviewRequired: boolean;
};

export type CombinedContactReviewRecord = {
  sourceDocumentIds: string[];
  contactType: "identity" | "email" | "phone" | "url" | "location";
  count: number;
  valuesRedacted: true;
  reviewRequired: boolean;
};

export type CombinedProjectProductReviewRecord = {
  candidateFactId: string;
  sourceDocumentId: string;
  productOrProjectClassification:
    | "StaffordOS"
    | "ShopiFixer"
    | "Abando"
    | "Lineapple"
    | "AI automation"
    | "CI/CD or DevOps"
    | "Cloud systems"
    | "Analytics platforms"
    | "Marketing technology"
    | "Other";
  maturityReviewRequired: true;
  modelUseAuthorized: false;
  canonical: false;
};

export type CombinedCrossWorkspaceEvidenceRecord = {
  candidateFactId: string;
  referencedScope: string;
  status: "CROSS_WORKSPACE_CANDIDATE_REQUIRES_APPROVAL";
  businessDataCopiedToProfessional: false;
  modelUseAuthorized: false;
  canonical: false;
};

export type SupportedSourceMutationRecord = {
  sourceDocumentId: string;
  mutationDetected: boolean;
};

export type PdfExtractionExecutorInput = {
  sourcePath: string;
  outputPath: string;
};

export type PdfExtractionExecutorResult = {
  ok: boolean;
  text?: string;
  failureCode?: string;
  limitation?: string;
};

export type PdfExtractionExecutor = (input: PdfExtractionExecutorInput) => PdfExtractionExecutorResult;

type CombinedIntakeOptions = {
  intakeDirectory: string;
  outputDirectory?: string | null;
  repositoryRoot: string;
  generatedAt: string;
  previousReviewQueuePath?: string | null;
  writePrivateArtifacts?: boolean;
  pdfExtractor?: PdfExtractionExecutor;
};

export type CombinedPdfCareerIntakeResult = {
  metadata: {
    schemaVersion: typeof PRIVATE_PDF_CAREER_INTAKE_VERSION;
    sourceMission: "S010_02C2_PRIVATE_PDF_CAREER_SOURCE_INTAKE_AND_COMBINED_REVIEW_REBUILD";
    canonical: false;
    verified: false;
    generatedAt: string;
    sourceDirectoryRedacted: string;
    outputDirectoryRedacted: string | null;
    noExternalUpload: true;
    noModelInvocation: true;
    pagesInspected: false;
    uncertifiedPagesExportsUsed: false;
  };
  status: "completed" | "partially_complete" | "failed";
  failureCode: string | null;
  sourceInventory: CombinedCareerSourceRecord[];
  documentClassifications: CombinedDocumentClassificationRecord[];
  documentVersionReview: CombinedDocumentVersionReviewRecord[];
  evidence: CombinedCareerEvidenceRecord[];
  candidateFacts: CombinedCandidateCareerFact[];
  conflicts: CombinedCareerConflictRecord[];
  contactReview: CombinedContactReviewRecord[];
  skillContextReview: CombinedCandidateCareerFact[];
  projectProductReview: CombinedProjectProductReviewRecord[];
  metricReview: CombinedCareerReviewItem[];
  crossWorkspaceEvidence: CombinedCrossWorkspaceEvidenceRecord[];
  reviewQueue: CombinedCareerReviewItem[];
  sourceMutations: SupportedSourceMutationRecord[];
  priorQueueSupersession: {
    previousReviewItemCount: number;
    newReviewItemCount: number;
    status: "SUPERSEDED_BY_S010_02C2_COMBINED_REVIEW" | "NOT_SUPERSEDED";
    limitation: string;
  } | null;
  privateArtifacts: string[];
  summary: {
    supportedSourceCount: number;
    pdfCount: number;
    docxCount: number;
    textMarkdownCount: number;
    deferredPagesCount: number;
    ignoredFileCount: number;
    unsupportedCount: number;
    extractionSuccessCount: number;
    extractionFailureCount: number;
    candidateFactCount: number;
    evidenceCount: number;
    conflictCount: number;
    metricReviewCount: number;
    reviewItemCount: number;
    exactDuplicateCount: number;
    nearDuplicateCount: number;
    formatDerivativeCount: number;
    nonCareerCount: number;
  };
};

type ExtractedSource = {
  source: CombinedCareerSourceRecord;
  sections: PrivateExtractedSection[];
};

type SourceState = {
  sourceDocumentId: string;
  path: string;
  sizeBytes: number;
  modifiedMs: number;
  contentDigest: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function sha256Text(value: string) {
  return createHash("sha256").update(value).digest("hex");
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

function isInsideDirectory(candidatePath: string, parentPath: string) {
  const resolvedCandidate = path.resolve(candidatePath);
  const resolvedParent = path.resolve(parentPath);
  return resolvedCandidate === resolvedParent || resolvedCandidate.startsWith(`${resolvedParent}${path.sep}`);
}

function isRepositoryPath(candidatePath: string, repositoryRoot: string) {
  return isInsideDirectory(candidatePath, repositoryRoot);
}

function sourceReference(sourceId: string) {
  return `private-career-source://${sourceId}`;
}

function redactContactValues(value: string) {
  return value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[redacted-email]")
    .replace(/\b(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}\b/g, "[redacted-phone]")
    .replace(/\bhttps?:\/\/\S+/gi, "[redacted-url]")
    .replace(/\b(?:linkedin\.com|github\.com|portfolio)\S*/gi, "[redacted-url]");
}

function countMatches(text: string, pattern: RegExp) {
  return [...text.matchAll(pattern)].length;
}

function ownerPrivateDirectory(directoryPath: string) {
  mkdirSync(directoryPath, { recursive: true, mode: 0o700 });
  chmodSync(directoryPath, 0o700);
}

function ownerPrivateFile(filePath: string) {
  chmodSync(filePath, 0o600);
}

function getExtension(filename: string) {
  return path.extname(filename).toLowerCase();
}

function sourceKindForExtension(extension: string): SourceKind | null {
  if (extension === ".pdf") {
    return "PDF";
  }
  if (extension === ".docx") {
    return "DOCX";
  }
  if (extension === ".txt") {
    return "TEXT";
  }
  if (extension === ".md" || extension === ".markdown") {
    return "MARKDOWN";
  }
  return null;
}

function contentDigestForPath(filePath: string) {
  return digestPrivateCareerFile(filePath);
}

function createPrivateSourceId(filename: string, sizeBytes: number, contentDigest: string | null) {
  return `privcareer_${shortHash(`${filename}:${sizeBytes}:${contentDigest || "no-digest"}`)}`;
}

function createSourceRecord(filePath: string, status: SourceInventoryStatus): CombinedCareerSourceRecord {
  const stats = statSync(filePath);
  const filename = path.basename(filePath);
  const extension = getExtension(filename);
  const sourceKind = status === "SUPPORTED_SOURCE" ? sourceKindForExtension(extension) : null;
  const contentDigest = status === "SUPPORTED_SOURCE" ? contentDigestForPath(filePath) : null;

  return {
    privateSourceId: createPrivateSourceId(filename, stats.size, contentDigest),
    filename,
    extension,
    sourceKind: sourceKind || (extension === ".pages" ? "PAGES" : filename === ".DS_Store" ? "SYSTEM" : "UNSUPPORTED"),
    inventoryStatus: status,
    sizeBytes: stats.size,
    modifiedAt: stats.mtime.toISOString(),
    contentDigest,
    privacyClassification: "Professional owner-private",
    sourcePath: status === "SUPPORTED_SOURCE" ? filePath : null,
    contentInspected: false,
    extractionStatus: "NOT_ATTEMPTED",
    extractionMethod: "NOT_APPLICABLE",
    documentTextDigest: null,
    documentPurpose: status === "SUPPORTED_SOURCE" ? "NEEDS_OPERATOR_REVIEW" : "NON_CAREER_DOCUMENT",
    versionClassification: "UNKNOWN_PURPOSE",
    duplicateGroupId: null,
    usedForFactExtraction: false,
    limitations: [
      status === "SUPPORTED_SOURCE"
        ? "Private supported career source. Extracted facts are candidate claims, not verified truth."
        : "Source was not inspected for career evidence in S010.02C2.",
    ],
  };
}

export function inventoryCombinedCareerSources(intakeDirectory: string, repositoryRoot: string) {
  const resolvedIntakeDirectory = path.resolve(intakeDirectory);
  const resolvedRepositoryRoot = path.resolve(repositoryRoot);

  if (!intakeDirectory || !existsSync(resolvedIntakeDirectory) || isRepositoryPath(resolvedIntakeDirectory, resolvedRepositoryRoot)) {
    return [];
  }

  return readdirSync(resolvedIntakeDirectory, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((entry) => {
      const filePath = path.join(resolvedIntakeDirectory, entry.name);
      const extension = getExtension(entry.name);
      if (entry.name === ".DS_Store") {
        return createSourceRecord(filePath, "IGNORED_SYSTEM_FILE");
      }
      if (extension === ".pages") {
        return createSourceRecord(filePath, "DEFERRED_PAGES_SOURCE");
      }
      return sourceKindForExtension(extension)
        ? createSourceRecord(filePath, "SUPPORTED_SOURCE")
        : createSourceRecord(filePath, "UNSUPPORTED_SOURCE");
    });
}

function getSupportedSourceStates(sources: readonly CombinedCareerSourceRecord[]): SourceState[] {
  return sources
    .filter((source) => source.inventoryStatus === "SUPPORTED_SOURCE" && source.sourcePath)
    .map((source) => {
      const sourcePath = source.sourcePath as string;
      const stats = statSync(sourcePath);
      return {
        sourceDocumentId: source.privateSourceId,
        path: sourcePath,
        sizeBytes: stats.size,
        modifiedMs: stats.mtimeMs,
        contentDigest: contentDigestForPath(sourcePath),
      };
    });
}

function compareSourceStates(before: readonly SourceState[], after: readonly SourceState[]) {
  return before.map((beforeState): SupportedSourceMutationRecord => {
    const afterState = after.find((state) => state.sourceDocumentId === beforeState.sourceDocumentId);
    return {
      sourceDocumentId: beforeState.sourceDocumentId,
      mutationDetected:
        !afterState ||
        afterState.sizeBytes !== beforeState.sizeBytes ||
        afterState.modifiedMs !== beforeState.modifiedMs ||
        afterState.contentDigest !== beforeState.contentDigest,
    };
  });
}

export function createTextutilPdfExtractor(timeoutMs = 30000): PdfExtractionExecutor {
  return ({ sourcePath, outputPath }) => {
    const result = spawnSync("/usr/bin/textutil", ["-convert", "txt", "-output", outputPath, sourcePath], {
      encoding: "utf8",
      timeout: timeoutMs,
    });

    if (result.error) {
      return {
        ok: false,
        failureCode: result.error.name === "ETIMEDOUT" ? "PDF_TEXTUTIL_TIMEOUT" : "PDF_TEXTUTIL_ERROR",
      };
    }

    if (result.status !== 0 || !existsSync(outputPath)) {
      return { ok: false, failureCode: "PDF_TEXTUTIL_EXTRACTION_FAILED" };
    }

    ownerPrivateFile(outputPath);
    const text = readFileSync(outputPath, "utf8");
    if (!normalizeWhitespace(text)) {
      return { ok: false, failureCode: "PDF_TEXT_EMPTY", limitation: "PDF text extraction returned no readable text." };
    }

    return { ok: true, text };
  };
}

function sectionsFromPlainText(text: string, prefix: "page" | "section"): PrivateExtractedSection[] {
  const normalizedPages = text.includes("\f") ? text.split(/\f+/) : [text];
  const sections: PrivateExtractedSection[] = [];

  for (let pageIndex = 0; pageIndex < normalizedPages.length; pageIndex += 1) {
    const page = normalizedPages[pageIndex];
    const lines = page
      .split(/\n+/)
      .map(normalizeWhitespace)
      .filter(isLikelyHumanReadableLine)
      .filter(Boolean);

    for (const line of lines) {
      sections.push({
        sectionId: `${prefix}-${String(pageIndex + 1).padStart(4, "0")}-line-${String(sections.length + 1).padStart(4, "0")}`,
        sectionHeading: null,
        text: line,
      });
    }
  }

  return sections;
}

function isLikelyHumanReadableLine(text: string) {
  if (text.length < 8 || text.length > 360) {
    return false;
  }
  const letters = (text.match(/[A-Za-z]/g) || []).length;
  const digits = (text.match(/\d/g) || []).length;
  const symbols = (text.match(/[^A-Za-z0-9\s.,;:|/()&%$+\-–—']/g) || []).length;
  if (letters < 5) {
    return false;
  }
  if (symbols > letters) {
    return false;
  }
  if (digits > letters * 2) {
    return false;
  }
  if (/^(cid:|obj|endobj|stream|endstream|xref|trailer)\b/i.test(text)) {
    return false;
  }
  return true;
}

function extractSupportedSource(
  source: CombinedCareerSourceRecord,
  textCacheDirectory: string,
  pdfExtractor: PdfExtractionExecutor,
): { sections: PrivateExtractedSection[]; failureCode: string | null } {
  if (!source.sourcePath) {
    return { sections: [], failureCode: "SOURCE_PATH_MISSING" };
  }

  try {
    if (source.sourceKind === "DOCX") {
      source.extractionMethod = "DOCX_LOCAL_XML";
      return { sections: extractDocxTextSections(source.sourcePath), failureCode: null };
    }

    if (source.sourceKind === "PDF") {
      ownerPrivateDirectory(textCacheDirectory);
      source.extractionMethod = "TEXTUTIL_LOCAL_PDF";
      const outputPath = path.join(textCacheDirectory, `${source.privateSourceId}.txt`);
      const extracted = pdfExtractor({ sourcePath: source.sourcePath, outputPath });
      if (!extracted.ok || !extracted.text) {
        return { sections: [], failureCode: extracted.failureCode || "PDF_TEXT_EXTRACTION_FAILED" };
      }
      return { sections: sectionsFromPlainText(extracted.text, "page"), failureCode: null };
    }

    if (source.sourceKind === "TEXT" || source.sourceKind === "MARKDOWN") {
      source.extractionMethod = "TEXT_LOCAL_READ";
      return { sections: sectionsFromPlainText(readFileSync(source.sourcePath, "utf8"), "section"), failureCode: null };
    }
  } catch (_error) {
    return { sections: [], failureCode: "SUPPORTED_TEXT_EXTRACTION_FAILED" };
  }

  return { sections: [], failureCode: "UNSUPPORTED_SOURCE_KIND" };
}

function documentTextDigest(sections: readonly PrivateExtractedSection[]) {
  return `sha256:${sha256Text(sections.map((section) => normalizeForComparison(section.text)).join("\n"))}`;
}

function containsContactValue(text: string) {
  return (
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(text) ||
    /\b(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}\b/.test(text) ||
    /\b(?:https?:\/\/|linkedin\.com|github\.com)\S*/i.test(text)
  );
}

function hasDateExpression(text: string) {
  return /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+\d{4}\b/i.test(text) || /\b(?:19|20)\d{2}\s*(?:-|to|–|—)\s*(?:present|current|(?:19|20)\d{2})\b/i.test(text);
}

function hasMetric(text: string) {
  return (
    /\b\d+(?:\.\d+)?%\b/.test(text) ||
    /\$\s?\d/.test(text) ||
    /\b\d+\s*(?:customers?|users?|projects?|teams?|employees?|accounts?|stores?|merchants?|hours?|x)\b/i.test(text) ||
    /\b(?:revenue|savings|growth|workload|accuracy|conversion|funnel|efficiency|reduction|improvement|improved|increase|decrease|reduced|saved)\b.*\b\d/i.test(
      text,
    )
  );
}

function hasMaterialMetric(text: string) {
  return /\b(?:\d{4,}%|million|multimillion|\$\s?\d|revenue|savings|accuracy|workload|conversion|growth|funnel)\b/i.test(text);
}

function classifyFact(section: PrivateExtractedSection): FactType | null {
  const text = section.text;
  const heading = section.sectionHeading || "";

  if (containsContactValue(text) || /\bross\s+stafford\b/i.test(text)) {
    return null;
  }
  if (/\b(reference|referee)\b/i.test(heading)) {
    return "REFERENCE";
  }
  if (/\b(presentation|speaker|webinar|talk)\b/i.test(text)) {
    return "PRESENTATION";
  }
  if (/\b(publication|published|article|whitepaper)\b/i.test(text)) {
    return "PUBLICATION";
  }
  if (/\b(interview|story|tell me about)\b/i.test(heading) || /\binterview preparation\b/i.test(text)) {
    return "INTERVIEW_STORY";
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
  if (/\b(staffordos|shopifixer|abando|lineapple|architecture|architected|platform|system design|automation|ai automation|ci\/cd|devops|kubernetes|cloud systems?)\b/i.test(text)) {
    if (/\barchitecture|architected|system design\b/i.test(text)) {
      return "ARCHITECTURE";
    }
    if (/\bproduct|platform|shopifixer|abando|lineapple|staffordos\b/i.test(text)) {
      return "PRODUCT";
    }
    return "PROJECT";
  }
  if (hasDateExpression(text)) {
    return "EMPLOYMENT";
  }
  if (/\b(skills?|technolog(?:y|ies)|tools?|platforms?)\b/i.test(heading) || /\b(javascript|typescript|python|sql|react|node|aws|gcp|azure|salesforce|shopify|analytics|tableau|looker|kubernetes|docker)\b/i.test(text)) {
    return "TECHNOLOGY";
  }
  if (/\b(led|managed|owned|coordinated|directed|mentored|stakeholders?|program|project manager|product operations|solutions architect)\b/i.test(text)) {
    return "LEADERSHIP";
  }
  return null;
}

function classifyPurpose(source: CombinedCareerSourceRecord, sections: readonly PrivateExtractedSection[], factCount: number): DocumentPurpose {
  if (source.extractionStatus === "FAILED") {
    return "EXTRACTION_FAILED";
  }
  const text = sections.map((section) => section.text).join("\n");
  if (factCount === 0) {
    return "NON_CAREER_DOCUMENT";
  }
  if (/cover/i.test(source.filename) || /\bcover letter\b/i.test(text)) {
    return "COVER_LETTER";
  }
  if (/linkedin|profile/i.test(source.filename) || /\blinkedin\b/i.test(text)) {
    return "LINKEDIN_OR_PROFILE_EXPORT";
  }
  if (
    (/resume/i.test(source.filename) &&
      /(?:_|-|\s)(?:ai|devops|gtm|technical|category|manager|analyst|engineer|consultant|targeted)/i.test(source.filename)) ||
    /\btargeted\s+resume\b/i.test(text)
  ) {
    return "ROLE_TARGETED_RESUME";
  }
  if (/interview/i.test(source.filename) || /\binterview preparation\b/i.test(text)) {
    return "INTERVIEW_PREPARATION";
  }
  if (/project|portfolio|product/i.test(source.filename) || /\b(staffordos|shopifixer|abando|lineapple|project|portfolio)\b/i.test(text)) {
    return "PROJECT_OR_PRODUCT_EVIDENCE";
  }
  if (/\b(certification|education|degree|university|college)\b/i.test(text)) {
    return "CERTIFICATION_OR_EDUCATION_RECORD";
  }
  if (/resume/i.test(source.filename) || /\bprofessional experience\b/i.test(text)) {
    return "GENERAL_RESUME";
  }
  return "NEEDS_OPERATOR_REVIEW";
}

function evidenceTypeForPurpose(purpose: DocumentPurpose): CombinedCareerEvidenceRecord["evidenceType"] {
  if (purpose === "COVER_LETTER") {
    return "COVER_LETTER";
  }
  if (purpose === "LINKEDIN_OR_PROFILE_EXPORT") {
    return "PROFILE_EXPORT";
  }
  if (purpose === "PROJECT_OR_PRODUCT_EVIDENCE" || purpose === "TERMINAL_OR_RUNTIME_EVIDENCE") {
    return "PROJECT_ARTIFACT";
  }
  if (purpose === "CAREER_NOTE" || purpose === "INTERVIEW_PREPARATION") {
    return "CAREER_NOTE";
  }
  return "RESUME";
}

function authorityForPurpose(purpose: DocumentPurpose): CombinedCareerEvidenceRecord["authorityClassification"] {
  if (purpose === "PROJECT_OR_PRODUCT_EVIDENCE" || purpose === "TERMINAL_OR_RUNTIME_EVIDENCE") {
    return "REPOSITORY_BACKED";
  }
  if (purpose === "LINKEDIN_OR_PROFILE_EXPORT" || purpose === "COVER_LETTER") {
    return "SELF_AUTHORED_DOCUMENT";
  }
  return "GENERATED_DOCUMENT";
}

function createEvidence(source: CombinedCareerSourceRecord): CombinedCareerEvidenceRecord {
  const authorityClassification = authorityForPurpose(source.documentPurpose);
  return {
    id: `combcarev_${shortHash(source.privateSourceId)}`,
    workspaceId: PRIVATE_PDF_CAREER_WORKSPACE_ID,
    evidenceType: evidenceTypeForPurpose(source.documentPurpose),
    sourceDocumentId: source.privateSourceId,
    sourceKind: source.sourceKind as SourceKind,
    sourceReference: sourceReference(source.privateSourceId),
    authorityClassification,
    privacyClassification: "Professional owner-private",
    freshness: "Historical",
    supportsFactIds: [],
    challengesFactIds: [],
    limitations: [
      "Source wording is evidence of a candidate claim, not automatic career truth.",
      "Facts from this source require Ross's review before verification.",
      source.documentPurpose === "COVER_LETTER"
        ? "Cover-letter wording is positioning evidence and does not independently prove career facts."
        : "Document purpose does not select canonical career authority.",
    ],
    canonical: false,
  };
}

function skillContextForStatement(statement: string): SkillContext | null {
  if (/\bproduction\b/i.test(statement)) {
    return "USED_IN_PRODUCTION";
  }
  if (/\bclient|consulting|delivery\b/i.test(statement)) {
    return "USED_IN_CLIENT_DELIVERY";
  }
  if (/\bcontrolled|prototype|local\b/i.test(statement)) {
    return "USED_IN_CONTROLLED_PROJECT";
  }
  if (/\btraining|course|bootcamp\b/i.test(statement)) {
    return "USED_IN_TRAINING";
  }
  if (/\bstudied|learning\b/i.test(statement)) {
    return "STUDIED";
  }
  if (/\bfamiliar|exposure|concepts?\b/i.test(statement)) {
    return "FAMILIAR";
  }
  if (/\btransferable\b/i.test(statement)) {
    return "TRANSFERABLE";
  }
  return "NEEDS_VERIFICATION";
}

function createCandidateFact(
  section: PrivateExtractedSection,
  source: CombinedCareerSourceRecord,
  evidenceId: string,
  authorityClassification: CombinedCandidateCareerFact["authorityClassification"],
): CombinedCandidateCareerFact | null {
  const factType = classifyFact(section);
  if (!factType) {
    return null;
  }

  const statement = redactContactValues(section.text);
  const normalizedStatement = normalizeForComparison(statement);
  const metric = hasMetric(statement);
  const productReference = /\b(staffordos|shopifixer|abando|lineapple|ai automation|ci\/cd|devops|kubernetes)\b/i.test(statement);
  const positioningOnly =
    source.documentPurpose === "COVER_LETTER" ||
    /\b(product operations leader|technology consultant|solutions architect|marketing systems leader|digital transformation leader|ai and automation operations leader|technical program leader)\b/i.test(
      statement,
    );

  return {
    id: `combfact_${shortHash(`${source.privateSourceId}:${section.sectionId}:${normalizedStatement}`)}`,
    workspaceId: PRIVATE_PDF_CAREER_WORKSPACE_ID,
    factType,
    statement,
    normalizedStatement,
    sourceDocumentId: source.privateSourceId,
    sourceEvidenceId: evidenceId,
    sourceType: source.sourceKind as SourceKind,
    sourceReference: sourceReference(source.privateSourceId),
    sourcePageOrSectionReference: `${sourceReference(source.privateSourceId)}#${section.sectionId}`,
    authorityClassification,
    privacyClassification: "Professional owner-private",
    verificationStatus: positioningOnly ? "HISTORICAL_ONLY" : productReference ? "PARTIALLY_SUPPORTED" : metric ? "NEEDS_EVIDENCE" : "PROPOSED",
    operatorReviewStatus: "Needs Ross's review",
    metricClassification: metric ? "NEEDS_REVIEW" : "NOT_APPLICABLE",
    skillContext: factType === "TECHNOLOGY" || factType === "SKILL" ? skillContextForStatement(statement) : null,
    positioningOnly,
    conflictTypes: [],
    limitations: [
      "Candidate fact extracted from a private career source.",
      "This is not verified career truth.",
      positioningOnly ? "This wording may be positioning and cannot replace the underlying career fact." : "Operator review is required.",
    ],
    canonical: false,
  };
}

function findContactReview(sources: readonly ExtractedSource[]): CombinedContactReviewRecord[] {
  const byType = new Map<CombinedContactReviewRecord["contactType"], Set<string>>();
  const counts = new Map<CombinedContactReviewRecord["contactType"], number>();

  for (const source of sources) {
    const text = source.sections.map((section) => section.text).join("\n");
    const matches: Array<[CombinedContactReviewRecord["contactType"], number]> = [
      ["email", countMatches(text, /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)],
      ["phone", countMatches(text, /\b(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}\b/g)],
      ["url", countMatches(text, /\b(?:https?:\/\/|linkedin\.com|github\.com)\S*/gi)],
      ["identity", countMatches(text, /\bross\s+stafford\b/gi)],
    ];

    for (const [type, count] of matches) {
      if (count === 0) {
        continue;
      }
      if (!byType.has(type)) {
        byType.set(type, new Set());
      }
      byType.get(type)?.add(source.source.privateSourceId);
      counts.set(type, (counts.get(type) || 0) + count);
    }
  }

  return Array.from(byType.entries()).map(([contactType, sourceIds]) => {
    return {
      sourceDocumentIds: Array.from(sourceIds).sort(),
      contactType,
      count: counts.get(contactType) || 0,
      valuesRedacted: true,
      reviewRequired: true,
    };
  });
}

function extractDateTokens(value: string) {
  return [
    ...value.matchAll(/\b(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+)?(?:19|20)\d{2}\b/gi),
  ].map((match) => normalizeWhitespace(match[0]).toLowerCase());
}

function detectConflictType(facts: readonly CombinedCandidateCareerFact[]): ConflictType | null {
  if (facts.length < 2) {
    return null;
  }

  const uniqueStatements = Array.from(new Set(facts.map((fact) => fact.normalizedStatement)));
  if (uniqueStatements.length < 2) {
    return null;
  }

  const factType = facts[0].factType;
  if (factType === "EMPLOYMENT") {
    const dateSets = Array.from(new Set(facts.map((fact) => extractDateTokens(fact.statement).join("|")).filter(Boolean)));
    return dateSets.length > 1 ? "START_DATE_CONFLICT" : "TITLE_CONFLICT";
  }
  if (facts.some((fact) => fact.positioningOnly)) {
    return "POSITIONING_VARIANT";
  }
  if (factType === "EDUCATION") {
    return "EDUCATION_CONFLICT";
  }
  if (factType === "CERTIFICATION") {
    return "CERTIFICATION_CONFLICT";
  }
  if (factType === "ACHIEVEMENT") {
    return "METRIC_CONFLICT";
  }
  if (factType === "TECHNOLOGY" || factType === "SKILL") {
    return "SKILL_CONTEXT_CONFLICT";
  }
  if (factType === "PROJECT" || factType === "PRODUCT" || factType === "ARCHITECTURE") {
    return "PROJECT_STATUS_CONFLICT";
  }
  return "OTHER";
}

function identifyConflicts(facts: readonly CombinedCandidateCareerFact[]) {
  const byType = new Map<FactType, CombinedCandidateCareerFact[]>();
  for (const fact of facts) {
    if (fact.factType === "LEADERSHIP" || fact.factType === "OTHER") {
      continue;
    }
    const existing = byType.get(fact.factType) || [];
    existing.push(fact);
    byType.set(fact.factType, existing);
  }

  const conflicts: CombinedCareerConflictRecord[] = [];
  for (const [factType, groupedFacts] of byType.entries()) {
    const conflictType = detectConflictType(groupedFacts);
    if (!conflictType) {
      continue;
    }
    conflicts.push({
      id: `combconf_${shortHash(`${conflictType}:${groupedFacts.map((fact) => fact.id).sort().join(":")}`)}`,
      conflictType,
      category: factType,
      candidateFactIds: groupedFacts.map((fact) => fact.id).sort(),
      sourceDocumentIds: Array.from(new Set(groupedFacts.map((fact) => fact.sourceDocumentId))).sort(),
      differingValueCount: Array.from(new Set(groupedFacts.map((fact) => fact.normalizedStatement))).length,
      sourceAuthorities: Array.from(new Set(groupedFacts.map((fact) => fact.authorityClassification))).sort(),
      reviewQuestion: `Which ${factType.toLowerCase()} wording, if any, is accurate enough for career authority?`,
      selectedWinner: null,
      canonical: false,
    });
  }

  return conflicts.sort((a, b) => a.id.localeCompare(b.id));
}

function conflictPriority(conflict: CombinedCareerConflictRecord) {
  if (conflict.conflictType === "EMPLOYER_CONFLICT" || conflict.conflictType === "TITLE_CONFLICT") {
    return 200;
  }
  if (conflict.conflictType === "START_DATE_CONFLICT" || conflict.conflictType === "END_DATE_CONFLICT") {
    return 300;
  }
  if (conflict.conflictType === "EDUCATION_CONFLICT") {
    return 500;
  }
  if (conflict.conflictType === "CERTIFICATION_CONFLICT") {
    return 600;
  }
  if (conflict.conflictType === "PROJECT_STATUS_CONFLICT") {
    return 700;
  }
  if (conflict.conflictType === "SKILL_CONTEXT_CONFLICT") {
    return 800;
  }
  if (conflict.conflictType === "METRIC_CONFLICT") {
    return 900;
  }
  if (conflict.conflictType === "POSITIONING_VARIANT") {
    return 1000;
  }
  return 1200;
}

function buildReviewQueue(
  contactReview: readonly CombinedContactReviewRecord[],
  conflicts: readonly CombinedCareerConflictRecord[],
  facts: readonly CombinedCandidateCareerFact[],
) {
  const reviewItems: CombinedCareerReviewItem[] = [];

  if (contactReview.length > 0) {
    reviewItems.push({
      reviewId: `combreview_contact_${shortHash(contactReview.map((record) => `${record.contactType}:${record.count}`).join(":"))}`,
      category: "Contact and identity consistency",
      question: "Which contact and identity details should be approved for future career materials?",
      candidateFactIds: [],
      supportingSourceIds: Array.from(new Set(contactReview.flatMap((record) => record.sourceDocumentIds))).sort(),
      sourceAuthority: "PRIVATE_SOURCE_DOCUMENTS",
      recommendedReviewOrder: 100,
      impactIfUnresolved: "Contact and identity values remain isolated from generated materials.",
      permittedOperatorDecisions: ["approve value", "reject value", "mark stale", "needs stronger source"],
      automaticSelection: false,
      canonical: false,
    });
  }

  for (const conflict of conflicts) {
    reviewItems.push({
      reviewId: `combreview_conflict_${shortHash(conflict.id)}`,
      category: conflict.category,
      question: conflict.reviewQuestion,
      candidateFactIds: [...conflict.candidateFactIds],
      supportingSourceIds: [...conflict.sourceDocumentIds],
      sourceAuthority: conflict.sourceAuthorities.join(", "),
      recommendedReviewOrder: conflictPriority(conflict),
      impactIfUnresolved: "StaffordOS cannot treat conflicting source wording as verified career truth.",
      permittedOperatorDecisions: ["choose after evidence review", "mark all unverified", "request stronger evidence", "reject unsupported wording"],
      automaticSelection: false,
      canonical: false,
    });
  }

  facts
    .filter((fact) => fact.metricClassification === "NEEDS_REVIEW")
    .forEach((fact, index) => {
      reviewItems.push({
        reviewId: `combreview_metric_${String(index + 1).padStart(3, "0")}_${shortHash(fact.id)}`,
        category: hasMaterialMetric(fact.statement) ? "Material metrics" : "Accomplishments and metrics",
        question: "What source proves this metric, baseline, and scope?",
        candidateFactIds: [fact.id],
        supportingSourceIds: [fact.sourceDocumentId],
        sourceAuthority: fact.authorityClassification,
        recommendedReviewOrder: hasMaterialMetric(fact.statement) ? 850 + index : 950 + index,
        impactIfUnresolved: "Unsupported metrics cannot be used in resume or application positioning.",
        permittedOperatorDecisions: ["confirm metric source", "mark estimate", "remove metric", "reject claim"],
        automaticSelection: false,
        canonical: false,
      });
    });

  facts
    .filter((fact) => fact.positioningOnly)
    .forEach((fact, index) => {
      reviewItems.push({
        reviewId: `combreview_positioning_${String(index + 1).padStart(3, "0")}_${shortHash(fact.id)}`,
        category: "Positioning variants",
        question: "Is this positioning accurate without changing the underlying career fact?",
        candidateFactIds: [fact.id],
        supportingSourceIds: [fact.sourceDocumentId],
        sourceAuthority: fact.authorityClassification,
        recommendedReviewOrder: 1100 + index,
        impactIfUnresolved: "Positioning wording cannot become canonical resume language.",
        permittedOperatorDecisions: ["approve as positioning", "revise wording", "reject as unsupported", "needs evidence"],
        automaticSelection: false,
        canonical: false,
      });
    });

  return reviewItems
    .map((item, index) => ({ ...item, recommendedReviewOrder: item.recommendedReviewOrder + index }))
    .sort((a, b) => a.recommendedReviewOrder - b.recommendedReviewOrder || a.reviewId.localeCompare(b.reviewId));
}

function applyVersionClassifications(sources: CombinedCareerSourceRecord[]) {
  const supported = sources.filter((source) => source.inventoryStatus === "SUPPORTED_SOURCE" && source.documentTextDigest);
  const byDigest = new Map<string, CombinedCareerSourceRecord[]>();

  for (const source of supported) {
    const digest = source.documentTextDigest as string;
    const existing = byDigest.get(digest) || [];
    existing.push(source);
    byDigest.set(digest, existing);
  }

  for (const group of byDigest.values()) {
    const representative = [...group].sort((a, b) => a.privateSourceId.localeCompare(b.privateSourceId))[0];
    const groupId = group.length > 1 ? `combdocgrp_${shortHash(group.map((source) => source.privateSourceId).sort().join(":"))}` : null;

    for (const source of group) {
      source.duplicateGroupId = groupId;
      source.usedForFactExtraction = source.privateSourceId === representative.privateSourceId && source.documentPurpose !== "NON_CAREER_DOCUMENT";
      if (group.length > 1) {
        source.versionClassification = "EXACT_DUPLICATE";
      } else if (source.documentPurpose === "COVER_LETTER") {
        source.versionClassification = "COVER_LETTER_VARIANT";
      } else if (source.documentPurpose === "ROLE_TARGETED_RESUME") {
        source.versionClassification = "ROLE_TARGETED_VARIANT";
      } else if (source.documentPurpose === "GENERAL_RESUME") {
        source.versionClassification = "GENERAL_VARIANT";
      } else if (source.documentPurpose === "NON_CAREER_DOCUMENT") {
        source.versionClassification = "NON_CAREER_SOURCE";
      } else {
        source.versionClassification = "UNIQUE_EVIDENCE_SOURCE";
      }
    }
  }

  const fingerprints = supported.map((source) => ({
    source,
    tokens: new Set((source.documentTextDigest || "").split(/\W+/).filter(Boolean)),
  }));

  for (const item of fingerprints) {
    if (item.source.versionClassification === "EXACT_DUPLICATE" || item.source.versionClassification === "NON_CAREER_SOURCE") {
      continue;
    }
    const comparable = fingerprints.find((other) => {
      if (other.source.privateSourceId === item.source.privateSourceId || other.source.versionClassification === "EXACT_DUPLICATE") {
        return false;
      }
      return item.source.documentPurpose === other.source.documentPurpose && item.source.extension !== other.source.extension;
    });
    if (comparable && item.source.documentPurpose !== "COVER_LETTER") {
      item.source.versionClassification = "FORMAT_DERIVATIVE";
    }
  }
}

function createDocumentRecords(sources: readonly CombinedCareerSourceRecord[]) {
  const documentClassifications = sources.map((source): CombinedDocumentClassificationRecord => ({
    sourceDocumentId: source.privateSourceId,
    documentPurpose: source.documentPurpose,
    extractionStatus: source.extractionStatus,
    sourceKind: source.sourceKind,
    usedForFactExtraction: source.usedForFactExtraction,
    limitations: [...source.limitations],
  }));

  const documentVersionReview = sources.map((source): CombinedDocumentVersionReviewRecord => ({
    sourceDocumentId: source.privateSourceId,
    sourceKind: source.sourceKind,
    documentPurpose: source.documentPurpose,
    versionClassification: source.versionClassification,
    duplicateGroupId: source.duplicateGroupId,
    contentDoubleCounted: false,
    canonicalResumeSelected: false,
    modificationTimeUsedAsAuthority: false,
    repeatedWordingVerifiesClaim: false,
    reviewRequired:
      source.inventoryStatus === "SUPPORTED_SOURCE" &&
      source.documentPurpose !== "NON_CAREER_DOCUMENT" &&
      source.extractionStatus !== "FAILED",
  }));

  return { documentClassifications, documentVersionReview };
}

function createProjectProductReview(facts: readonly CombinedCandidateCareerFact[]) {
  const records: CombinedProjectProductReviewRecord[] = [];

  for (const fact of facts) {
    const text = fact.statement;
    const classifications: CombinedProjectProductReviewRecord["productOrProjectClassification"][] = [];
    if (/\bstaffordos\b/i.test(text)) classifications.push("StaffordOS");
    if (/\bshopifixer\b/i.test(text)) classifications.push("ShopiFixer");
    if (/\babando\b/i.test(text)) classifications.push("Abando");
    if (/\blineapple\b/i.test(text)) classifications.push("Lineapple");
    if (/\bai automation\b/i.test(text)) classifications.push("AI automation");
    if (/\bci\/cd|devops\b/i.test(text)) classifications.push("CI/CD or DevOps");
    if (/\bkubernetes|cloud\b/i.test(text)) classifications.push("Cloud systems");
    if (/\banalytics|tableau|looker\b/i.test(text)) classifications.push("Analytics platforms");
    if (/\bmarketing technology|martech|crm\b/i.test(text)) classifications.push("Marketing technology");

    for (const classification of classifications) {
      records.push({
        candidateFactId: fact.id,
        sourceDocumentId: fact.sourceDocumentId,
        productOrProjectClassification: classification,
        maturityReviewRequired: true,
        modelUseAuthorized: false,
        canonical: false,
      });
    }
  }

  return records;
}

function createCrossWorkspaceEvidence(projectReview: readonly CombinedProjectProductReviewRecord[]) {
  return projectReview.map((record): CombinedCrossWorkspaceEvidenceRecord => ({
    candidateFactId: record.candidateFactId,
    referencedScope: record.productOrProjectClassification,
    status: "CROSS_WORKSPACE_CANDIDATE_REQUIRES_APPROVAL",
    businessDataCopiedToProfessional: false,
    modelUseAuthorized: false,
    canonical: false,
  }));
}

function buildPrivatePayload<T>(generatedAt: string, records: T[]) {
  return {
    metadata: {
      schemaVersion: PRIVATE_PDF_CAREER_INTAKE_VERSION,
      sourceMission: "S010_02C2_PRIVATE_PDF_CAREER_SOURCE_INTAKE_AND_COMBINED_REVIEW_REBUILD",
      canonical: false,
      verified: false,
      generatedAt,
      privacyClassification: "Professional owner-private",
      limitation: "Private local artifact. Not committed to Git and not canonical career truth.",
    },
    records,
  };
}

function writePrivateOutput(outputDirectory: string, filename: string, payload: unknown) {
  ownerPrivateDirectory(outputDirectory);
  const outputPath = path.join(outputDirectory, filename);
  writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, { mode: 0o600 });
  ownerPrivateFile(outputPath);
  return outputPath;
}

function countPreviousQueue(previousReviewQueuePath?: string | null) {
  if (!previousReviewQueuePath || !existsSync(previousReviewQueuePath)) {
    return 0;
  }
  try {
    const parsed = JSON.parse(readFileSync(previousReviewQueuePath, "utf8"));
    return Array.isArray(parsed.records) ? parsed.records.length : 0;
  } catch (_error) {
    return 0;
  }
}

function createFailureResult(options: CombinedIntakeOptions, failureCode: string): CombinedPdfCareerIntakeResult {
  return {
    metadata: {
      schemaVersion: PRIVATE_PDF_CAREER_INTAKE_VERSION,
      sourceMission: "S010_02C2_PRIVATE_PDF_CAREER_SOURCE_INTAKE_AND_COMBINED_REVIEW_REBUILD",
      canonical: false,
      verified: false,
      generatedAt: options.generatedAt,
      sourceDirectoryRedacted: options.intakeDirectory ? redactPathForReport(options.intakeDirectory) : "",
      outputDirectoryRedacted: options.outputDirectory ? redactPathForReport(options.outputDirectory) : null,
      noExternalUpload: true,
      noModelInvocation: true,
      pagesInspected: false,
      uncertifiedPagesExportsUsed: false,
    },
    status: "failed",
    failureCode,
    sourceInventory: [],
    documentClassifications: [],
    documentVersionReview: [],
    evidence: [],
    candidateFacts: [],
    conflicts: [],
    contactReview: [],
    skillContextReview: [],
    projectProductReview: [],
    metricReview: [],
    crossWorkspaceEvidence: [],
    reviewQueue: [],
    sourceMutations: [],
    priorQueueSupersession: null,
    privateArtifacts: [],
    summary: {
      supportedSourceCount: 0,
      pdfCount: 0,
      docxCount: 0,
      textMarkdownCount: 0,
      deferredPagesCount: 0,
      ignoredFileCount: 0,
      unsupportedCount: 0,
      extractionSuccessCount: 0,
      extractionFailureCount: 0,
      candidateFactCount: 0,
      evidenceCount: 0,
      conflictCount: 0,
      metricReviewCount: 0,
      reviewItemCount: 0,
      exactDuplicateCount: 0,
      nearDuplicateCount: 0,
      formatDerivativeCount: 0,
      nonCareerCount: 0,
    },
  };
}

function writePrivateArtifacts(outputDirectory: string, result: CombinedPdfCareerIntakeResult) {
  const generatedAt = result.metadata.generatedAt;
  return [
    writePrivateOutput(outputDirectory, "combined_source_inventory.private.json", buildPrivatePayload(generatedAt, result.sourceInventory)),
    writePrivateOutput(outputDirectory, "combined_document_classification.private.json", buildPrivatePayload(generatedAt, result.documentClassifications)),
    writePrivateOutput(outputDirectory, "combined_document_version_review.private.json", buildPrivatePayload(generatedAt, result.documentVersionReview)),
    writePrivateOutput(outputDirectory, "combined_candidate_career_facts.private.json", buildPrivatePayload(generatedAt, result.candidateFacts)),
    writePrivateOutput(outputDirectory, "combined_career_evidence.private.json", buildPrivatePayload(generatedAt, result.evidence)),
    writePrivateOutput(outputDirectory, "combined_conflicts.private.json", buildPrivatePayload(generatedAt, result.conflicts)),
    writePrivateOutput(outputDirectory, "combined_contact_review.private.json", buildPrivatePayload(generatedAt, result.contactReview)),
    writePrivateOutput(outputDirectory, "combined_skill_context.private.json", buildPrivatePayload(generatedAt, result.skillContextReview)),
    writePrivateOutput(outputDirectory, "combined_project_product_review.private.json", buildPrivatePayload(generatedAt, result.projectProductReview)),
    writePrivateOutput(outputDirectory, "combined_metric_review.private.json", buildPrivatePayload(generatedAt, result.metricReview)),
    writePrivateOutput(outputDirectory, "combined_cross_workspace_evidence.private.json", buildPrivatePayload(generatedAt, result.crossWorkspaceEvidence)),
    writePrivateOutput(
      outputDirectory,
      "combined_operator_review_queue.private.json",
      {
        metadata: {
          schemaVersion: PRIVATE_PDF_CAREER_INTAKE_VERSION,
          sourceMission: "S010_02C2_PRIVATE_PDF_CAREER_SOURCE_INTAKE_AND_COMBINED_REVIEW_REBUILD",
          canonical: false,
          verified: false,
          generatedAt,
          privacyClassification: "Professional owner-private",
          limitation: "Private local artifact. Not committed to Git and not canonical career truth.",
          priorQueueSupersession: result.priorQueueSupersession,
        },
        records: result.reviewQueue,
      },
    ),
  ];
}

export function runCombinedPdfCareerEvidenceIntake(options: CombinedIntakeOptions): CombinedPdfCareerIntakeResult {
  if (!options.intakeDirectory) {
    return createFailureResult(options, "EXPLICIT_INTAKE_DIRECTORY_REQUIRED");
  }
  if (!options.repositoryRoot) {
    return createFailureResult(options, "REPOSITORY_ROOT_REQUIRED");
  }

  const intakeDirectory = path.resolve(options.intakeDirectory);
  const repositoryRoot = path.resolve(options.repositoryRoot);
  const outputDirectory = options.outputDirectory ? path.resolve(options.outputDirectory) : null;

  if (!existsSync(intakeDirectory)) {
    return createFailureResult(options, "PRIVATE_INTAKE_DIRECTORY_NOT_FOUND");
  }
  if (isRepositoryPath(intakeDirectory, repositoryRoot)) {
    return createFailureResult(options, "PRIVATE_SOURCE_DIRECTORY_INSIDE_REPOSITORY");
  }
  if (outputDirectory && isRepositoryPath(outputDirectory, repositoryRoot)) {
    return createFailureResult(options, "PRIVATE_OUTPUT_DIRECTORY_INSIDE_REPOSITORY");
  }

  const sourceInventory = inventoryCombinedCareerSources(intakeDirectory, repositoryRoot);
  const beforeStates = getSupportedSourceStates(sourceInventory);
  const textCacheDirectory = outputDirectory ? path.join(outputDirectory, "pdf_text_cache") : path.join(intakeDirectory, ".blocked-output");
  const pdfExtractor = options.pdfExtractor || createTextutilPdfExtractor();
  const extractedSources: ExtractedSource[] = [];

  for (const source of sourceInventory.filter((item) => item.inventoryStatus === "SUPPORTED_SOURCE")) {
    const { sections, failureCode } = extractSupportedSource(source, textCacheDirectory, pdfExtractor);
    if (failureCode) {
      source.extractionStatus = "FAILED";
      source.documentPurpose = "EXTRACTION_FAILED";
      source.limitations.push(failureCode);
      continue;
    }
    source.contentInspected = true;
    source.extractionStatus = sections.length > 0 ? "EXTRACTED" : "LIMITED";
    source.documentTextDigest = documentTextDigest(sections);
    extractedSources.push({ source, sections });
  }

  for (const extracted of extractedSources) {
    const temporaryFacts = extracted.sections
      .map((section) => classifyFact(section))
      .filter(Boolean);
    extracted.source.documentPurpose = classifyPurpose(extracted.source, extracted.sections, temporaryFacts.length);
  }

  applyVersionClassifications(sourceInventory);

  const evidence: CombinedCareerEvidenceRecord[] = [];
  const candidateFacts: CombinedCandidateCareerFact[] = [];

  for (const extracted of extractedSources) {
    const source = extracted.source;
    if (!source.usedForFactExtraction || source.documentPurpose === "NON_CAREER_DOCUMENT") {
      continue;
    }
    const evidenceRecord = createEvidence(source);
    evidence.push(evidenceRecord);

    for (const section of extracted.sections) {
      const fact = createCandidateFact(section, source, evidenceRecord.id, evidenceRecord.authorityClassification);
      if (!fact) {
        continue;
      }
      evidenceRecord.supportsFactIds.push(fact.id);
      candidateFacts.push(fact);
    }
  }

  const conflicts = identifyConflicts(candidateFacts);
  const conflictByFact = new Map<string, ConflictType[]>();
  for (const conflict of conflicts) {
    for (const factId of conflict.candidateFactIds) {
      const current = conflictByFact.get(factId) || [];
      current.push(conflict.conflictType);
      conflictByFact.set(factId, current);
    }
  }
  for (const fact of candidateFacts) {
    const conflictTypes = conflictByFact.get(fact.id);
    if (conflictTypes && conflictTypes.length > 0) {
      fact.conflictTypes = Array.from(new Set(conflictTypes));
      fact.verificationStatus = "CONFLICTING";
    }
  }

  const contactReview = findContactReview(extractedSources);
  const skillContextReview = candidateFacts.filter((fact) => fact.skillContext);
  const projectProductReview = createProjectProductReview(candidateFacts);
  const crossWorkspaceEvidence = createCrossWorkspaceEvidence(projectProductReview);
  const reviewQueue = buildReviewQueue(contactReview, conflicts, candidateFacts);
  const metricReview = reviewQueue.filter((item) => item.category === "Material metrics" || item.category === "Accomplishments and metrics");
  const { documentClassifications, documentVersionReview } = createDocumentRecords(sourceInventory);
  const afterStates = getSupportedSourceStates(sourceInventory);
  const sourceMutations = compareSourceStates(beforeStates, afterStates);
  const mutationDetected = sourceMutations.some((record) => record.mutationDetected);

  if (mutationDetected) {
    const failed = createFailureResult(options, "SUPPORTED_CAREER_SOURCE_MUTATION_DETECTED");
    failed.sourceInventory = sourceInventory;
    failed.sourceMutations = sourceMutations;
    return failed;
  }

  const previousReviewItemCount = countPreviousQueue(options.previousReviewQueuePath);
  const status = sourceInventory.some((source) => source.extractionStatus === "FAILED") ? "partially_complete" : "completed";
  const result: CombinedPdfCareerIntakeResult = {
    metadata: {
      schemaVersion: PRIVATE_PDF_CAREER_INTAKE_VERSION,
      sourceMission: "S010_02C2_PRIVATE_PDF_CAREER_SOURCE_INTAKE_AND_COMBINED_REVIEW_REBUILD",
      canonical: false,
      verified: false,
      generatedAt: options.generatedAt,
      sourceDirectoryRedacted: redactPathForReport(intakeDirectory),
      outputDirectoryRedacted: outputDirectory ? redactPathForReport(outputDirectory) : null,
      noExternalUpload: true,
      noModelInvocation: true,
      pagesInspected: false,
      uncertifiedPagesExportsUsed: false,
    },
    status,
    failureCode: null,
    sourceInventory,
    documentClassifications,
    documentVersionReview,
    evidence,
    candidateFacts,
    conflicts,
    contactReview,
    skillContextReview,
    projectProductReview,
    metricReview,
    crossWorkspaceEvidence,
    reviewQueue,
    sourceMutations,
    priorQueueSupersession:
      previousReviewItemCount > 0
        ? {
            previousReviewItemCount,
            newReviewItemCount: reviewQueue.length,
            status: reviewQueue.length > 0 ? "SUPERSEDED_BY_S010_02C2_COMBINED_REVIEW" : "NOT_SUPERSEDED",
            limitation:
              reviewQueue.length > 0
                ? "The prior DOCX-only queue is preserved but no longer primary."
                : "The prior DOCX-only queue remains primary because combined review did not complete.",
          }
        : null,
    privateArtifacts: [],
    summary: {
      supportedSourceCount: sourceInventory.filter((source) => source.inventoryStatus === "SUPPORTED_SOURCE").length,
      pdfCount: sourceInventory.filter((source) => source.sourceKind === "PDF").length,
      docxCount: sourceInventory.filter((source) => source.sourceKind === "DOCX").length,
      textMarkdownCount: sourceInventory.filter((source) => source.sourceKind === "TEXT" || source.sourceKind === "MARKDOWN").length,
      deferredPagesCount: sourceInventory.filter((source) => source.inventoryStatus === "DEFERRED_PAGES_SOURCE").length,
      ignoredFileCount: sourceInventory.filter((source) => source.inventoryStatus === "IGNORED_SYSTEM_FILE").length,
      unsupportedCount: sourceInventory.filter((source) => source.inventoryStatus === "UNSUPPORTED_SOURCE").length,
      extractionSuccessCount: sourceInventory.filter((source) => source.extractionStatus === "EXTRACTED").length,
      extractionFailureCount: sourceInventory.filter((source) => source.extractionStatus === "FAILED").length,
      candidateFactCount: candidateFacts.length,
      evidenceCount: evidence.length,
      conflictCount: conflicts.length,
      metricReviewCount: metricReview.length,
      reviewItemCount: reviewQueue.length,
      exactDuplicateCount: documentVersionReview.filter((record) => record.versionClassification === "EXACT_DUPLICATE").length,
      nearDuplicateCount: documentVersionReview.filter((record) => record.versionClassification === "NEAR_DUPLICATE").length,
      formatDerivativeCount: documentVersionReview.filter((record) => record.versionClassification === "FORMAT_DERIVATIVE").length,
      nonCareerCount: documentVersionReview.filter((record) => record.versionClassification === "NON_CAREER_SOURCE").length,
    },
  };

  if (options.writePrivateArtifacts === true && outputDirectory) {
    result.privateArtifacts = writePrivateArtifacts(outputDirectory, result);
  }

  return result;
}

export function getCombinedPdfCareerIntakeRedactedSummary(result: CombinedPdfCareerIntakeResult) {
  return {
    schemaVersion: result.metadata.schemaVersion,
    canonical: result.metadata.canonical,
    verified: result.metadata.verified,
    status: result.status,
    failureCode: result.failureCode,
    sourceDirectory: result.metadata.sourceDirectoryRedacted,
    outputDirectory: result.metadata.outputDirectoryRedacted,
    supportedSources: result.summary.supportedSourceCount,
    pdfSources: result.summary.pdfCount,
    docxSources: result.summary.docxCount,
    textMarkdownSources: result.summary.textMarkdownCount,
    deferredPages: result.summary.deferredPagesCount,
    ignoredFiles: result.summary.ignoredFileCount,
    unsupportedFiles: result.summary.unsupportedCount,
    extractionSuccesses: result.summary.extractionSuccessCount,
    extractionFailures: result.summary.extractionFailureCount,
    candidateFacts: result.summary.candidateFactCount,
    evidenceRecords: result.summary.evidenceCount,
    conflicts: result.summary.conflictCount,
    metricReviewItems: result.summary.metricReviewCount,
    reviewItems: result.summary.reviewItemCount,
    exactDuplicates: result.summary.exactDuplicateCount,
    nearDuplicates: result.summary.nearDuplicateCount,
    formatDerivatives: result.summary.formatDerivativeCount,
    nonCareerSources: result.summary.nonCareerCount,
    priorQueueSupersession: result.priorQueueSupersession?.status || "NOT_APPLICABLE",
    pagesInspected: result.metadata.pagesInspected,
    uncertifiedPagesExportsUsed: result.metadata.uncertifiedPagesExportsUsed,
    sourceMutationsDetected: result.sourceMutations.some((record) => record.mutationDetected),
    noExternalUpload: result.metadata.noExternalUpload,
    noModelInvocation: result.metadata.noModelInvocation,
  };
}

export function assertCombinedPdfCareerIntakeResultShape(value: unknown) {
  return (
    isRecord(value) &&
    isRecord(value.metadata) &&
    value.metadata.schemaVersion === PRIVATE_PDF_CAREER_INTAKE_VERSION &&
    value.metadata.canonical === false &&
    value.metadata.verified === false &&
    isRecord(value.summary) &&
    Array.isArray(value.sourceInventory) &&
    Array.isArray(value.candidateFacts) &&
    Array.isArray(value.reviewQueue)
  );
}
