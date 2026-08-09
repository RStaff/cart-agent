import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import * as path from "node:path";
import { extractDocxTextSections } from "./privateCareerEvidenceIntake";
import {
  loadPrivateApplicationPipelineStore,
  type PrivateApplicationPipelineStore,
} from "./privateApplicationPipelineReview";
import type { PrivateApplicationRecord } from "./manualApplicationEventTracking";

export const RESUME_VERSION_APPLICATION_LINKAGE_VERSION = "J001.06";
export const RESUME_VERSION_SCHEMA_VERSION = "staffordos.job_search.private_resume_version.v1";
export const APPLICATION_RESUME_LINK_SCHEMA_VERSION = "staffordos.job_search.private_application_resume_link.v1";
export const COVER_LETTER_REFERENCE_SCHEMA_VERSION = "staffordos.job_search.private_cover_letter_reference.v1";
export const RESUME_LINK_APPLICATION_EVENT_SCHEMA_VERSION =
  "staffordos.job_search.private_resume_link_application_event.v1";
export const RESUME_LINKAGE_AUDIT_SCHEMA_VERSION =
  "staffordos.job_search.private_resume_version_application_linkage_audit.v1";

export const SUPPORTED_RESUME_SOURCE_EXTENSIONS = [".pdf", ".docx", ".txt", ".md", ".markdown"] as const;
export const APPLICATION_RESUME_LINK_TYPES = [
  "USED_FOR_SUBMISSION",
  "PREPARED_FOR_APPLICATION",
  "CONSIDERED",
  "SUPERSEDED",
  "UNKNOWN",
] as const;
export const RESUME_FACT_SAFETY_STATUSES = [
  "SUPPORTED_VERIFIED",
  "SUPPORTED_TRANSFERABLE",
  "PARTIALLY_SUPPORTED",
  "NEEDS_EVIDENCE",
  "CONFLICTING",
  "STALE",
  "UNSUPPORTED",
  "UNKNOWN",
] as const;

export type SupportedResumeSourceExtension = (typeof SUPPORTED_RESUME_SOURCE_EXTENSIONS)[number];
export type SupportedResumeDocumentFormat = "PDF" | "DOCX" | "TXT" | "MD";
export type ApplicationResumeLinkType = (typeof APPLICATION_RESUME_LINK_TYPES)[number];
export type ResumeFactSafetyStatus = (typeof RESUME_FACT_SAFETY_STATUSES)[number];
export type ResumeDocumentClassification =
  | "RESUME"
  | "COVER_LETTER"
  | "CAREER_SOURCE"
  | "UNKNOWN_DOCUMENT"
  | "NON_CAREER_DOCUMENT";
export type DuplicateVersionClassification =
  | "EXACT_DUPLICATE"
  | "FORMAT_DERIVATIVE"
  | "LIKELY_VERSION"
  | "UNRELATED"
  | "NEEDS_OPERATOR_REVIEW";
export type ResumeLinkDecisionOutcome = "CONFIRM_USED" | "CONFIRM_NOT_USED" | "DEFER" | "UNKNOWN";

export type PrivateResumeSourceRecord = {
  privateSourceId: string;
  workspaceId: "professional";
  originalFilename: string;
  extension: SupportedResumeSourceExtension | "UNSUPPORTED";
  documentFormat: SupportedResumeDocumentFormat | "UNSUPPORTED";
  sourceRootAuthority: "APPROVED_PRIVATE_CAREER_SOURCE_ROOT";
  sourcePath: string;
  sourcePathRedacted: string;
  sizeBytes: number;
  modifiedAtObserved: string;
  contentDigest: string;
  contentInspected: boolean;
  extractionStatus: "EXTRACTED" | "LIMITED" | "FAILED" | "NOT_ATTEMPTED";
  documentTextDigest: string | null;
  documentClassification: ResumeDocumentClassification;
  limitations: string[];
  privacy: "Professional owner-private";
};

export type PrivateResumeClaimSafetyRecord = {
  claimId: string;
  resumeVersionId: string;
  claimType:
    | "PMP_CREDENTIAL"
    | "EDUCATION"
    | "EMPLOYMENT"
    | "METRIC"
    | "YEARS_EXPERIENCE"
    | "PROJECT_OR_PRODUCT"
    | "TECHNICAL_SKILL"
    | "OTHER";
  safeClaimSummary: string;
  classification: ResumeFactSafetyStatus;
  supportingCareerFactIds: string[];
  supportingEvidenceIds: string[];
  limitations: string[];
};

export type PrivateResumeVersionRecord = {
  schemaVersion: typeof RESUME_VERSION_SCHEMA_VERSION;
  resumeVersionId: string;
  workspaceId: "professional";
  assetReferenceId: string;
  sourceDocumentReference: {
    privateSourceId: string;
    sourceRootAuthority: "APPROVED_PRIVATE_CAREER_SOURCE_ROOT";
    sourcePath: string;
    sourcePathRedacted: string;
  };
  originalFilename: string;
  contentDigest: string;
  documentFormat: SupportedResumeDocumentFormat;
  observedAt: string;
  createdAt: string | null;
  modifiedAtObserved: string;
  purpose: "GENERAL_RESUME" | "ROLE_TARGETED_RESUME" | "UNKNOWN_RESUME";
  targetRoleFamily: string | null;
  targetCompanyReference: string | null;
  targetRoleReference: string | null;
  sourceAuthority: "PRIVATE_CAREER_SOURCE_DOCUMENT";
  privacy: "Professional owner-private";
  reviewStatus: "NEEDS_OPERATOR_REVIEW" | "OPERATOR_CONFIRMED" | "DEFERRED";
  factSafetyStatus: ResumeFactSafetyStatus;
  supersedesResumeVersionId: string | null;
  derivedFromResumeVersionId: string | null;
  claimSafety: PrivateResumeClaimSafetyRecord[];
  limitations: string[];
  resumeIsCareerTruth: false;
};

export type PrivateApplicationResumeLink = {
  schemaVersion: typeof APPLICATION_RESUME_LINK_SCHEMA_VERSION;
  linkId: string;
  applicationId: string;
  resumeVersionId: string | null;
  linkType: ApplicationResumeLinkType;
  operatorConfirmed: boolean;
  usedForSubmission: boolean;
  confirmedAt: string | null;
  sourceAuthority: "ROSS_OPERATOR_CONFIRMATION" | "UNCONFIRMED_PRIVATE_CANDIDATE" | "UNKNOWN";
  limitations: string[];
};

export type PrivateCoverLetterReferenceRecord = {
  schemaVersion: typeof COVER_LETTER_REFERENCE_SCHEMA_VERSION;
  coverLetterReferenceId: string;
  workspaceId: "professional";
  applicationId: string | null;
  sourceDocumentId: string;
  originalFilename: string;
  contentDigest: string;
  documentFormat: "PDF" | "DOCX" | "TXT" | "MD";
  sourceAuthority: "PRIVATE_CAREER_SOURCE_DOCUMENT";
  privacy: "Professional owner-private";
  reviewStatus: "NEEDS_OPERATOR_REVIEW";
  coverLetterIsCareerTruth: false;
  limitations: string[];
};

export type PrivateResumeLinkApplicationEvent = {
  schemaVersion: typeof RESUME_LINK_APPLICATION_EVENT_SCHEMA_VERSION;
  eventId: string;
  applicationId: string;
  eventType: "RESUME_LINK_CONFIRMED";
  resumeVersionId: string;
  occurredAt: string;
  sourceAuthority: "ROSS_OPERATOR_CONFIRMATION";
  operatorConfirmed: true;
  limitations: string[];
  submittedByStaffordOS: false;
  externalActionPerformedByStaffordOS: false;
};

export type PrivateResumeDuplicateVersionRecord = {
  groupId: string;
  classification: DuplicateVersionClassification;
  resumeVersionIds: string[];
  contentDigest: string | null;
  reason: string;
  automaticMergeAllowed: false;
  limitations: string[];
};

export type PrivateApplicationResumeCandidate = {
  applicationId: string;
  resumeVersionId: string;
  safeLabel: string;
  confidence: "HIGH_REQUIRES_OPERATOR_CONFIRMATION" | "POSSIBLE_REQUIRES_OPERATOR_CONFIRMATION" | "LOW";
  reasons: string[];
  limitations: string[];
};

export type PrivateResumeFutureReadModelRecord = {
  resumeVersionId: string;
  label: string;
  version: string;
  purpose: PrivateResumeVersionRecord["purpose"];
  usedForApplication: boolean;
  factSafetyStatus: ResumeFactSafetyStatus;
  reviewStatus: PrivateResumeVersionRecord["reviewStatus"];
  capturedAsOf: string;
  limitations: string[];
  privatePathVisible: false;
  rawResumeTextVisible: false;
  documentInternalsVisible: false;
  credentialsVisible: false;
};

export type ResumeLinkageDecision = {
  applicationId: string;
  resumeVersionId: string | null;
  outcome: ResumeLinkDecisionOutcome;
  operatorConfirmed: boolean;
  createdAt: string;
};

export type ResumeVersionApplicationLinkageResult = {
  schemaVersion: typeof RESUME_LINKAGE_AUDIT_SCHEMA_VERSION;
  workflowVersion: typeof RESUME_VERSION_APPLICATION_LINKAGE_VERSION;
  generatedAt: string;
  sourceInventory: PrivateResumeSourceRecord[];
  resumeVersions: PrivateResumeVersionRecord[];
  duplicateVersionAnalysis: PrivateResumeDuplicateVersionRecord[];
  factSafetyReports: Array<{
    resumeVersionId: string;
    factSafetyStatus: ResumeFactSafetyStatus;
    claims: PrivateResumeClaimSafetyRecord[];
    safeReuseRequiresReview: true;
  }>;
  applicationResumeLinks: PrivateApplicationResumeLink[];
  applicationCandidates: PrivateApplicationResumeCandidate[];
  coverLetterReferences: PrivateCoverLetterReferenceRecord[];
  resumeLinkApplicationEvents: PrivateResumeLinkApplicationEvent[];
  futureReadModel: PrivateResumeFutureReadModelRecord[];
  auditSummary: {
    applicationsLoaded: number;
    confirmationNeededCandidates: number;
    resumeSourcesInventoried: number;
    resumeVersionsCreated: number;
    coverLettersFound: number;
    exactDuplicateGroups: number;
    likelyVersionGroups: number;
    confirmedUsedForSubmissionLinks: number;
    unknownApplicationLinks: number;
    bitsightLikeUnconfirmedCandidateBlocked: boolean;
    noResumeGenerated: true;
    noResumeMutated: true;
    noApplicationSubmitted: true;
    noMessageSent: true;
    noLinkedInMutated: true;
    noExternalProviderCall: true;
    noExternalAi: true;
    noOllama: true;
    noOsConnection: true;
    noOperatorRouteCreated: true;
    privatePathVisibleInReadModel: false;
  };
};

type AnyRecord = Record<string, unknown>;
type CareerAuthorityStore = {
  verifiedPmpFactIds: string[];
  verifiedEducationFactIds: string[];
  conflictingEmploymentFactIds: string[];
  nonCanonicalConflictingEmploymentFactCount: number;
  evidenceIds: string[];
};

function sha256Buffer(value: Buffer | string) {
  return createHash("sha256").update(value).digest("hex");
}

function sha256Text(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function opaqueId(prefix: string, parts: readonly unknown[]) {
  return `${prefix}_${sha256Text(parts.map((part) => String(part ?? "")).join("|")).slice(0, 18)}`;
}

function compactDate(value: string) {
  return value.replace(/[^0-9]/g, "").slice(0, 14) || sha256Text(value).slice(0, 12);
}

function isInsideDirectory(candidatePath: string, parentPath: string) {
  const resolvedCandidate = path.resolve(candidatePath);
  const resolvedParent = path.resolve(parentPath);
  return resolvedCandidate === resolvedParent || resolvedCandidate.startsWith(`${resolvedParent}${path.sep}`);
}

function assertOutsideRepository(directory: string, repositoryRoot: string, label: string) {
  if (!directory || isInsideDirectory(directory, repositoryRoot)) {
    throw new Error(`${label} must be outside the repository.`);
  }
}

function ensurePrivateDirectory(directory: string) {
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  chmodSync(directory, 0o700);
}

function writeJson(filePath: string, value: unknown) {
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  chmodSync(filePath, 0o600);
}

function readJson(filePath: string): unknown {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function walkJsonFiles(directory: string): string[] {
  if (!existsSync(directory)) return [];
  const files: string[] = [];
  for (const entry of readdirSync(directory)) {
    const filePath = path.join(directory, entry);
    const stat = statSync(filePath);
    if (stat.isDirectory()) files.push(...walkJsonFiles(filePath));
    if (stat.isFile() && entry.endsWith(".json")) files.push(filePath);
  }
  return files;
}

function arrayRecords(value: unknown): AnyRecord[] {
  if (Array.isArray(value)) return value.filter((entry): entry is AnyRecord => Boolean(entry && typeof entry === "object"));
  if (value && typeof value === "object") {
    const record = value as AnyRecord;
    for (const key of ["records", "facts", "evidence", "promotedFacts"]) {
      if (Array.isArray(record[key])) {
        return (record[key] as unknown[]).filter((entry): entry is AnyRecord => Boolean(entry && typeof entry === "object"));
      }
    }
    return [record];
  }
  return [];
}

function redactPathForPrivateReport(filePath: string) {
  return filePath.replace(/^\/Users\/[^/]+/, "~");
}

function extensionFor(filePath: string): SupportedResumeSourceExtension | "UNSUPPORTED" {
  const extension = path.extname(filePath).toLowerCase();
  return (SUPPORTED_RESUME_SOURCE_EXTENSIONS as readonly string[]).includes(extension)
    ? (extension as SupportedResumeSourceExtension)
    : "UNSUPPORTED";
}

function formatFor(extension: SupportedResumeSourceExtension): SupportedResumeDocumentFormat;
function formatFor(extension: "UNSUPPORTED"): "UNSUPPORTED";
function formatFor(extension: SupportedResumeSourceExtension | "UNSUPPORTED"): SupportedResumeDocumentFormat | "UNSUPPORTED" {
  if (extension === ".pdf") return "PDF" as const;
  if (extension === ".docx") return "DOCX" as const;
  if (extension === ".txt") return "TXT" as const;
  if (extension === ".md" || extension === ".markdown") return "MD" as const;
  return "UNSUPPORTED" as const;
}

function sourceEntryExcluded(relativePath: string) {
  const normalized = normalizeText(relativePath).replace(/[^a-z0-9]+/g, " ");
  return /\b(secret|secrets|credential|credentials|recovery|recovery code|recovery codes|password|passphrase|token|api key|apikey|private key)\b/.test(
    normalized,
  );
}

function walkSupportedSourceFiles(sourceRoot: string) {
  const output: string[] = [];
  const visit = (directory: string) => {
    for (const entry of readdirSync(directory, { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name))) {
      const filePath = path.join(directory, entry.name);
      const relativePath = path.relative(sourceRoot, filePath);
      if (sourceEntryExcluded(relativePath)) continue;
      if (entry.isDirectory()) {
        if (entry.name.startsWith(".")) continue;
        visit(filePath);
        continue;
      }
      if (!entry.isFile()) continue;
      if (extensionFor(filePath) === "UNSUPPORTED") continue;
      output.push(filePath);
    }
  };
  visit(sourceRoot);
  return output;
}

function normalizeText(value: string | null | undefined) {
  return (value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function textDigest(text: string | null) {
  return text ? sha256Text(normalizeText(text)) : null;
}

function maybeUtf8Text(filePath: string) {
  return readFileSync(filePath, "utf8");
}

function extractPdfText(filePath: string, cacheDirectory: string, sourceId: string) {
  ensurePrivateDirectory(cacheDirectory);
  const outputPath = path.join(cacheDirectory, `${sourceId}.txt`);
  const result = spawnSync("/usr/bin/textutil", ["-convert", "txt", "-output", outputPath, filePath], {
    encoding: "utf8",
    timeout: 30000,
  });
  if (result.status !== 0 || !existsSync(outputPath)) {
    return null;
  }
  chmodSync(outputPath, 0o600);
  const text = readFileSync(outputPath, "utf8");
  return text.trim() ? text : null;
}

function extractDocumentText(input: {
  filePath: string;
  format: PrivateResumeSourceRecord["documentFormat"];
  cacheDirectory: string | null;
  sourceId: string;
}) {
  try {
    if (input.format === "TXT" || input.format === "MD") return maybeUtf8Text(input.filePath);
    if (input.format === "DOCX") return extractDocxTextSections(input.filePath).map((section) => section.text).join("\n");
    if (input.format === "PDF" && input.cacheDirectory) {
      return extractPdfText(input.filePath, input.cacheDirectory, input.sourceId);
    }
  } catch {
    return null;
  }
  return null;
}

function classifyDocument(text: string | null, filename: string): ResumeDocumentClassification {
  const normalized = normalizeText(`${filename}\n${text || ""}`);
  const hasContent = Boolean(text && normalizeText(text).length > 40);
  if (!hasContent) return "UNKNOWN_DOCUMENT";
  if (/\b(dear hiring|cover letter|please accept my application|sincerely)\b/i.test(normalized)) return "COVER_LETTER";
  if (
    /\b(professional summary|experience|work history|employment|education|skills|certifications)\b/i.test(normalized) &&
    /\b(resume|curriculum vitae|cv|experience|skills)\b/i.test(normalized)
  ) {
    return "RESUME";
  }
  if (/\b(certificate|certification|diploma|transcript|project evidence|portfolio|case study)\b/i.test(normalized)) {
    return "CAREER_SOURCE";
  }
  return "UNKNOWN_DOCUMENT";
}

function purposeForResume(text: string | null, filename: string): PrivateResumeVersionRecord["purpose"] {
  const normalized = normalizeText(`${filename}\n${text || ""}`);
  if (/\b(product owner|product manager|program manager|governance|analytics|automation|ai)\b/i.test(normalized)) {
    return "ROLE_TARGETED_RESUME";
  }
  return "GENERAL_RESUME";
}

function targetRoleFamilyFor(text: string | null, filename: string) {
  const normalized = normalizeText(`${filename}\n${text || ""}`);
  if (/\bgovernance\b/.test(normalized)) return "AI Governance";
  if (/\bautomation|agent\b/.test(normalized)) return "AI Automation";
  if (/\bprogram manager|project manager|pmp\b/.test(normalized)) return "Technical Program Management";
  if (/\bproduct owner|product manager\b/.test(normalized)) return "AI Product";
  return null;
}

function loadCareerAuthorityStore(careerRoots: readonly string[], repositoryRoot: string): CareerAuthorityStore {
  const verifiedPmpFactIds: string[] = [];
  const verifiedEducationFactIds: string[] = [];
  const conflictingEmploymentFactIds: string[] = [];
  let nonCanonicalConflictingEmploymentFactCount = 0;
  const evidenceIds: string[] = [];
  for (const careerRoot of careerRoots) {
    if (!careerRoot || !existsSync(careerRoot)) continue;
    assertOutsideRepository(careerRoot, repositoryRoot, "Private Career authority root");
    for (const filePath of walkJsonFiles(careerRoot)) {
      let parsed: unknown;
      try {
        parsed = readJson(filePath);
      } catch {
        continue;
      }
      for (const record of arrayRecords(parsed)) {
        const id = typeof record.id === "string" ? record.id : null;
        const statement = typeof record.statement === "string" ? record.statement : "";
        const verificationStatus = typeof record.verificationStatus === "string" ? record.verificationStatus : "";
        if (id && verificationStatus === "VERIFIED" && /\b(project management professional|pmp)\b/i.test(statement)) {
          verifiedPmpFactIds.push(id);
        }
        if (id && verificationStatus === "VERIFIED" && /\b(master|degree|university|college|education)\b/i.test(statement)) {
          verifiedEducationFactIds.push(id);
        }
        if (id && verificationStatus === "CONFLICTING" && /\b(employer|employment|title|role|date)\b/i.test(statement)) {
          if (record.canonical === true) {
            conflictingEmploymentFactIds.push(id);
          } else {
            nonCanonicalConflictingEmploymentFactCount += 1;
          }
        }
        if (id && typeof record.evidenceType === "string") {
          evidenceIds.push(id);
        }
      }
    }
  }
  return {
    verifiedPmpFactIds: [...new Set(verifiedPmpFactIds)],
    verifiedEducationFactIds: [...new Set(verifiedEducationFactIds)],
    conflictingEmploymentFactIds: [...new Set(conflictingEmploymentFactIds)],
    nonCanonicalConflictingEmploymentFactCount,
    evidenceIds: [...new Set(evidenceIds)],
  };
}

function buildClaimSafety(input: {
  resumeVersionId: string;
  text: string | null;
  careerAuthority: CareerAuthorityStore;
  generatedAt: string;
  modifiedAtObserved: string;
}): PrivateResumeClaimSafetyRecord[] {
  const text = normalizeText(input.text || "");
  const claims: PrivateResumeClaimSafetyRecord[] = [];
  const add = (
    claimType: PrivateResumeClaimSafetyRecord["claimType"],
    summary: string,
    classification: ResumeFactSafetyStatus,
    supportingCareerFactIds: string[] = [],
    supportingEvidenceIds: string[] = [],
    limitations: string[] = [],
  ) => {
    claims.push({
      claimId: opaqueId("privresumeclaim", [input.resumeVersionId, claimType, summary]),
      resumeVersionId: input.resumeVersionId,
      claimType,
      safeClaimSummary: summary,
      classification,
      supportingCareerFactIds,
      supportingEvidenceIds,
      limitations,
    });
  };

  if (/\b(project management professional|pmp)\b/i.test(text)) {
    add(
      "PMP_CREDENTIAL",
      "Resume includes PMP credential wording.",
      input.careerAuthority.verifiedPmpFactIds.length ? "SUPPORTED_VERIFIED" : "NEEDS_EVIDENCE",
      input.careerAuthority.verifiedPmpFactIds,
      [],
      [
        "Verified PMP authority supports only the credential wording.",
        "Do not infer years, scale, employer responsibility, financial impact, or program outcomes from PMP alone.",
      ],
    );
  }
  if (/\b(master|degree|university|college|education)\b/i.test(text)) {
    add(
      "EDUCATION",
      "Resume includes education wording.",
      input.careerAuthority.verifiedEducationFactIds.length ? "SUPPORTED_VERIFIED" : "UNKNOWN",
      input.careerAuthority.verifiedEducationFactIds,
      [],
      ["Education wording requires official education authority before reuse as verified fact."],
    );
  }
  if (/\b(\d+%|\$[0-9]|revenue|cost savings|saved|increased|decreased|users|customers)\b/i.test(text)) {
    add("METRIC", "Resume includes metric or scale wording.", "NEEDS_EVIDENCE", [], [], [
      "Numeric outcomes require direct supporting evidence before reuse.",
    ]);
  }
  if (/\b\d+\+?\s+years?\b/i.test(text)) {
    add("YEARS_EXPERIENCE", "Resume includes years-of-experience wording.", "NEEDS_EVIDENCE", [], [], [
      "Years of experience cannot be inferred without supporting authority.",
    ]);
  }
  if (/\b(experience|employment|work history|manager|director|consultant|founder)\b/i.test(text)) {
    add(
      "EMPLOYMENT",
      "Resume includes employment or title wording.",
      input.careerAuthority.conflictingEmploymentFactIds.length ? "CONFLICTING" : "UNKNOWN",
      input.careerAuthority.conflictingEmploymentFactIds,
      [],
      [
        "Employment, title, and date claims require canonical Career authority.",
        input.careerAuthority.nonCanonicalConflictingEmploymentFactCount
          ? "Non-canonical conflicting candidate facts exist in private Career authority; they require review but do not by themselves make this resume claim conflicting."
          : "No non-canonical conflict context was found for this claim.",
      ],
    );
  }
  if (/\b(staffordos|shopifixer|abando|automation|agent|platform|governance|architecture)\b/i.test(text)) {
    add("PROJECT_OR_PRODUCT", "Resume includes project, product, AI, automation, governance, or architecture wording.", "UNKNOWN", [], [], [
      "Project maturity, deployment, production use, customer use, and revenue impact require separate evidence.",
    ]);
  }
  if (/\b(python|sql|kubernetes|argocd|terraform|docker|github actions|gcp|aws|ci\/cd)\b/i.test(text)) {
    add("TECHNICAL_SKILL", "Resume includes technical skill wording.", "UNKNOWN", [], [], [
      "Technology appearances do not establish proficiency, years, production use, or professional use.",
    ]);
  }

  const modifiedDate = input.modifiedAtObserved.slice(0, 10);
  const generatedDate = input.generatedAt.slice(0, 10);
  const modified = new Date(`${modifiedDate}T12:00:00Z`);
  const generated = new Date(`${generatedDate}T12:00:00Z`);
  if (!Number.isNaN(modified.getTime()) && generated.getTime() - modified.getTime() > 365 * 86400000) {
    add("OTHER", "Resume source appears older than one year at capture time.", "STALE", [], [], [
      "Stale status does not mean inaccurate; it blocks blind reuse until reviewed.",
    ]);
  }

  if (!claims.length) {
    add("OTHER", "No supported resume claim categories were safely classified.", "UNKNOWN", [], [], [
      "No claim should be reused blindly.",
    ]);
  }
  return claims;
}

function aggregateSafety(claims: readonly PrivateResumeClaimSafetyRecord[]): ResumeFactSafetyStatus {
  const order: ResumeFactSafetyStatus[] = [
    "CONFLICTING",
    "UNSUPPORTED",
    "NEEDS_EVIDENCE",
    "STALE",
    "UNKNOWN",
    "PARTIALLY_SUPPORTED",
    "SUPPORTED_TRANSFERABLE",
    "SUPPORTED_VERIFIED",
  ];
  return order.find((status) => claims.some((claim) => claim.classification === status)) || "UNKNOWN";
}

function inventorySourceRoot(input: {
  sourceRoot: string;
  repositoryRoot: string;
  generatedAt: string;
  cacheDirectory: string | null;
  careerAuthority: CareerAuthorityStore;
}) {
  if (!existsSync(input.sourceRoot)) return { sources: [] as PrivateResumeSourceRecord[], resumeVersions: [] as PrivateResumeVersionRecord[], coverLetters: [] as PrivateCoverLetterReferenceRecord[] };
  assertOutsideRepository(input.sourceRoot, input.repositoryRoot, "Private resume source root");
  const sources: PrivateResumeSourceRecord[] = [];
  const resumeVersions: PrivateResumeVersionRecord[] = [];
  const coverLetters: PrivateCoverLetterReferenceRecord[] = [];

  for (const filePath of walkSupportedSourceFiles(input.sourceRoot)) {
    const originalFilename = path.basename(filePath);
    const extension = extensionFor(filePath);
    if (extension === "UNSUPPORTED") continue;
    const format = formatFor(extension);
    const bytes = readFileSync(filePath);
    const contentDigest = sha256Buffer(bytes);
    const stats = statSync(filePath);
    const sourceId = opaqueId("privresumesource", [contentDigest, originalFilename, stats.size]);
    const text = extractDocumentText({ filePath, format, cacheDirectory: input.cacheDirectory, sourceId });
    const classification = classifyDocument(text, originalFilename);
    const source: PrivateResumeSourceRecord = {
      privateSourceId: sourceId,
      workspaceId: "professional",
      originalFilename,
      extension,
      documentFormat: format,
      sourceRootAuthority: "APPROVED_PRIVATE_CAREER_SOURCE_ROOT",
      sourcePath: filePath,
      sourcePathRedacted: redactPathForPrivateReport(filePath),
      sizeBytes: stats.size,
      modifiedAtObserved: stats.mtime.toISOString(),
      contentDigest,
      contentInspected: Boolean(text),
      extractionStatus: text ? "EXTRACTED" : "LIMITED",
      documentTextDigest: textDigest(text),
      documentClassification: classification,
      limitations: [
        "Private source metadata only; source file is not moved, copied into Git, renamed, or modified.",
        classification === "UNKNOWN_DOCUMENT" ? "Document was not classified as a resume from content authority." : "Classification uses local source content signals.",
      ],
      privacy: "Professional owner-private",
    };
    sources.push(source);

    if (classification === "RESUME") {
      const resumeVersionId = opaqueId("privresumeversion", [contentDigest, source.privateSourceId]);
      const claims = buildClaimSafety({
        resumeVersionId,
        text,
        careerAuthority: input.careerAuthority,
        generatedAt: input.generatedAt,
        modifiedAtObserved: source.modifiedAtObserved,
      });
      resumeVersions.push({
        schemaVersion: RESUME_VERSION_SCHEMA_VERSION,
        resumeVersionId,
        workspaceId: "professional",
        assetReferenceId: opaqueId("privasset", [contentDigest]),
        sourceDocumentReference: {
          privateSourceId: source.privateSourceId,
          sourceRootAuthority: "APPROVED_PRIVATE_CAREER_SOURCE_ROOT",
          sourcePath: filePath,
          sourcePathRedacted: source.sourcePathRedacted,
        },
        originalFilename,
        contentDigest,
        documentFormat: format,
        observedAt: input.generatedAt,
        createdAt: null,
        modifiedAtObserved: source.modifiedAtObserved,
        purpose: purposeForResume(text, originalFilename),
        targetRoleFamily: targetRoleFamilyFor(text, originalFilename),
        targetCompanyReference: null,
        targetRoleReference: null,
        sourceAuthority: "PRIVATE_CAREER_SOURCE_DOCUMENT",
        privacy: "Professional owner-private",
        reviewStatus: "NEEDS_OPERATOR_REVIEW",
        factSafetyStatus: aggregateSafety(claims),
        supersedesResumeVersionId: null,
        derivedFromResumeVersionId: null,
        claimSafety: claims,
        limitations: [
          "ResumeVersion is downstream positioning and is not Career truth.",
          "Do not reuse blindly without checking fact safety and application context.",
        ],
        resumeIsCareerTruth: false,
      });
    }

    if (classification === "COVER_LETTER") {
      coverLetters.push({
        schemaVersion: COVER_LETTER_REFERENCE_SCHEMA_VERSION,
        coverLetterReferenceId: opaqueId("privcoverletterdoc", [contentDigest, source.privateSourceId]),
        workspaceId: "professional",
        applicationId: null,
        sourceDocumentId: source.privateSourceId,
        originalFilename,
        contentDigest,
        documentFormat: format,
        sourceAuthority: "PRIVATE_CAREER_SOURCE_DOCUMENT",
        privacy: "Professional owner-private",
        reviewStatus: "NEEDS_OPERATOR_REVIEW",
        coverLetterIsCareerTruth: false,
        limitations: [
          "Cover-letter content remains separate from Application and Career truth.",
          "No cover-letter content is copied into Application records.",
        ],
      });
    }
  }

  return { sources, resumeVersions, coverLetters };
}

function normalizedVersionKey(filename: string) {
  return normalizeText(path.basename(filename, path.extname(filename)))
    .replace(/\b(copy|final|v\d+|version|resume|cv)\b/g, "")
    .replace(/\b20\d{2}[-_ ]?\d{0,2}[-_ ]?\d{0,2}\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function buildDuplicateVersionAnalysis(resumeVersions: readonly PrivateResumeVersionRecord[]) {
  const records: PrivateResumeDuplicateVersionRecord[] = [];
  const byDigest = new Map<string, PrivateResumeVersionRecord[]>();
  const byVersionKey = new Map<string, PrivateResumeVersionRecord[]>();
  for (const version of resumeVersions) {
    byDigest.set(version.contentDigest, [...(byDigest.get(version.contentDigest) || []), version]);
    const key = normalizedVersionKey(version.originalFilename);
    if (key) byVersionKey.set(key, [...(byVersionKey.get(key) || []), version]);
  }
  for (const [digest, versions] of byDigest.entries()) {
    if (versions.length > 1) {
      records.push({
        groupId: opaqueId("privresumegroup", ["exact", digest]),
        classification: "EXACT_DUPLICATE",
        resumeVersionIds: versions.map((version) => version.resumeVersionId),
        contentDigest: digest,
        reason: "Content digests match exactly.",
        automaticMergeAllowed: false,
        limitations: ["Exact duplicates are recorded; source files are not deleted or merged."],
      });
    }
  }
  for (const [key, versions] of byVersionKey.entries()) {
    const uniqueIds = [...new Set(versions.map((version) => version.resumeVersionId))];
    if (uniqueIds.length > 1) {
      records.push({
        groupId: opaqueId("privresumegroup", ["likely-version", key]),
        classification: "LIKELY_VERSION",
        resumeVersionIds: uniqueIds,
        contentDigest: null,
        reason: "Normalized filenames suggest a possible version relationship; operator review is required.",
        automaticMergeAllowed: false,
        limitations: ["Likely versions are not silently merged or superseded."],
      });
    }
  }
  return records;
}

function safeResumeLabel(version: PrivateResumeVersionRecord) {
  return `${version.purpose} / ${version.documentFormat} / ${version.factSafetyStatus} / ${version.contentDigest.slice(0, 10)}`;
}

function candidateConfidence(score: number): PrivateApplicationResumeCandidate["confidence"] {
  if (score >= 4) return "HIGH_REQUIRES_OPERATOR_CONFIRMATION";
  if (score >= 2) return "POSSIBLE_REQUIRES_OPERATOR_CONFIRMATION";
  return "LOW";
}

function candidatesForApplication(application: PrivateApplicationRecord, versions: readonly PrivateResumeVersionRecord[]) {
  const appText = normalizeText(`${application.companyReference.label} ${application.roleReference.title}`);
  return versions
    .map((version) => {
      const versionText = normalizeText(`${version.originalFilename} ${version.targetRoleFamily || ""} ${version.purpose}`);
      const reasons: string[] = [];
      let score = 0;
      if (application.resumeReference.status !== "UNKNOWN" && application.resumeReference.filename === version.originalFilename) {
        score += 4;
        reasons.push("Application has a legacy filename reference that matches this private ResumeVersion.");
      }
      for (const token of appText.split(/\s+/).filter((token) => token.length >= 5)) {
        if (versionText.includes(token)) {
          score += 1;
          reasons.push("Resume metadata shares role or company wording with the Application.");
          break;
        }
      }
      if (version.purpose === "ROLE_TARGETED_RESUME") {
        score += 1;
        reasons.push("Resume appears role-targeted.");
      }
      if (!reasons.length) reasons.push("No strong metadata match; include only for operator review fallback.");
      return {
        applicationId: application.applicationId,
        resumeVersionId: version.resumeVersionId,
        safeLabel: safeResumeLabel(version),
        confidence: candidateConfidence(score),
        reasons,
        limitations: [
          "Candidate matching never confirms submission.",
          "Ross must confirm the exact resume before USED_FOR_SUBMISSION is recorded.",
        ],
      } satisfies PrivateApplicationResumeCandidate;
    })
    .sort((left, right) => {
      const rank = { HIGH_REQUIRES_OPERATOR_CONFIRMATION: 0, POSSIBLE_REQUIRES_OPERATOR_CONFIRMATION: 1, LOW: 2 };
      return rank[left.confidence] - rank[right.confidence] || left.safeLabel.localeCompare(right.safeLabel);
    })
    .slice(0, 5);
}

function linkFromDecision(applicationId: string, decision: ResumeLinkageDecision | null): PrivateApplicationResumeLink {
  if (decision && decision.operatorConfirmed && decision.outcome === "CONFIRM_USED" && decision.resumeVersionId) {
    return {
      schemaVersion: APPLICATION_RESUME_LINK_SCHEMA_VERSION,
      linkId: opaqueId("privapplinkresume", [applicationId, decision.resumeVersionId, "USED_FOR_SUBMISSION"]),
      applicationId,
      resumeVersionId: decision.resumeVersionId,
      linkType: "USED_FOR_SUBMISSION",
      operatorConfirmed: true,
      usedForSubmission: true,
      confirmedAt: decision.createdAt,
      sourceAuthority: "ROSS_OPERATOR_CONFIRMATION",
      limitations: [
        "Ross confirmed this exact ResumeVersion was used for submission.",
        "The resume remains downstream positioning and does not verify Career facts.",
      ],
    };
  }
  return {
    schemaVersion: APPLICATION_RESUME_LINK_SCHEMA_VERSION,
    linkId: opaqueId("privapplinkresume", [applicationId, "UNKNOWN"]),
    applicationId,
    resumeVersionId: null,
    linkType: "UNKNOWN",
    operatorConfirmed: false,
    usedForSubmission: false,
    confirmedAt: null,
    sourceAuthority: "UNKNOWN",
    limitations: [
      "Resume used for this Application is unknown until Ross confirms the exact version.",
      "Do not infer from filename similarity or positioning language.",
    ],
  };
}

function eventFromLink(link: PrivateApplicationResumeLink): PrivateResumeLinkApplicationEvent | null {
  if (!link.usedForSubmission || !link.operatorConfirmed || !link.resumeVersionId || !link.confirmedAt) return null;
  return {
    schemaVersion: RESUME_LINK_APPLICATION_EVENT_SCHEMA_VERSION,
    eventId: opaqueId("privappevent", [link.applicationId, link.resumeVersionId, "RESUME_LINK_CONFIRMED"]),
    applicationId: link.applicationId,
    eventType: "RESUME_LINK_CONFIRMED",
    resumeVersionId: link.resumeVersionId,
    occurredAt: link.confirmedAt,
    sourceAuthority: "ROSS_OPERATOR_CONFIRMATION",
    operatorConfirmed: true,
    limitations: [
      "Append-only resume link event.",
      "No submission history was rewritten.",
      "No resume was generated or modified.",
    ],
    submittedByStaffordOS: false,
    externalActionPerformedByStaffordOS: false,
  };
}

function futureReadModelFor(version: PrivateResumeVersionRecord, links: readonly PrivateApplicationResumeLink[], generatedAt: string) {
  return {
    resumeVersionId: version.resumeVersionId,
    label: safeResumeLabel(version),
    version: version.contentDigest.slice(0, 12),
    purpose: version.purpose,
    usedForApplication: links.some((link) => link.resumeVersionId === version.resumeVersionId && link.usedForSubmission),
    factSafetyStatus: version.factSafetyStatus,
    reviewStatus: version.reviewStatus,
    capturedAsOf: generatedAt,
    limitations: [
      "Prepared for future authorized Professional UI only.",
      "Private paths, raw resume text, document internals, credentials, and source details are excluded.",
    ],
    privatePathVisible: false,
    rawResumeTextVisible: false,
    documentInternalsVisible: false,
    credentialsVisible: false,
  } satisfies PrivateResumeFutureReadModelRecord;
}

export function buildResumeVersionApplicationLinkage(input: {
  sourceRoots: readonly string[];
  careerRoots: readonly string[];
  applicationStore: PrivateApplicationPipelineStore;
  repositoryRoot: string;
  generatedAt: string;
  outputRoot?: string | null;
  decisions?: readonly ResumeLinkageDecision[];
}): ResumeVersionApplicationLinkageResult {
  const careerAuthority = loadCareerAuthorityStore(input.careerRoots, input.repositoryRoot);
  const cacheDirectory = input.outputRoot ? path.join(input.outputRoot, "resume_text_cache") : null;
  const sourceInventory: PrivateResumeSourceRecord[] = [];
  const resumeVersions: PrivateResumeVersionRecord[] = [];
  const coverLetterReferences: PrivateCoverLetterReferenceRecord[] = [];

  for (const sourceRoot of input.sourceRoots) {
    const inventory = inventorySourceRoot({
      sourceRoot,
      repositoryRoot: input.repositoryRoot,
      generatedAt: input.generatedAt,
      cacheDirectory,
      careerAuthority,
    });
    sourceInventory.push(...inventory.sources);
    resumeVersions.push(...inventory.resumeVersions);
    coverLetterReferences.push(...inventory.coverLetters);
  }

  const uniqueVersions = [...new Map(resumeVersions.map((version) => [version.resumeVersionId, version])).values()];
  const duplicateVersionAnalysis = buildDuplicateVersionAnalysis(uniqueVersions);
  const decisionsByApplication = new Map((input.decisions || []).map((decision) => [decision.applicationId, decision]));
  const applicationCandidates = input.applicationStore.applications.flatMap((application) =>
    candidatesForApplication(application, uniqueVersions),
  );
  const applicationResumeLinks = input.applicationStore.applications.map((application) =>
    linkFromDecision(application.applicationId, decisionsByApplication.get(application.applicationId) || null),
  );
  const resumeLinkApplicationEvents = applicationResumeLinks
    .map(eventFromLink)
    .filter((event): event is PrivateResumeLinkApplicationEvent => event !== null);
  const factSafetyReports = uniqueVersions.map((version) => ({
    resumeVersionId: version.resumeVersionId,
    factSafetyStatus: version.factSafetyStatus,
    claims: version.claimSafety,
    safeReuseRequiresReview: true as const,
  }));

  return {
    schemaVersion: RESUME_LINKAGE_AUDIT_SCHEMA_VERSION,
    workflowVersion: RESUME_VERSION_APPLICATION_LINKAGE_VERSION,
    generatedAt: input.generatedAt,
    sourceInventory,
    resumeVersions: uniqueVersions,
    duplicateVersionAnalysis,
    factSafetyReports,
    applicationResumeLinks,
    applicationCandidates,
    coverLetterReferences,
    resumeLinkApplicationEvents,
    futureReadModel: uniqueVersions.map((version) => futureReadModelFor(version, applicationResumeLinks, input.generatedAt)),
    auditSummary: {
      applicationsLoaded: input.applicationStore.applications.length,
      confirmationNeededCandidates: input.applicationStore.confirmationNeeded.length,
      resumeSourcesInventoried: sourceInventory.length,
      resumeVersionsCreated: uniqueVersions.length,
      coverLettersFound: coverLetterReferences.length,
      exactDuplicateGroups: duplicateVersionAnalysis.filter((group) => group.classification === "EXACT_DUPLICATE").length,
      likelyVersionGroups: duplicateVersionAnalysis.filter((group) => group.classification === "LIKELY_VERSION").length,
      confirmedUsedForSubmissionLinks: applicationResumeLinks.filter((link) => link.usedForSubmission).length,
      unknownApplicationLinks: applicationResumeLinks.filter((link) => link.linkType === "UNKNOWN").length,
      bitsightLikeUnconfirmedCandidateBlocked: input.applicationStore.confirmationNeeded.length > 0,
      noResumeGenerated: true,
      noResumeMutated: true,
      noApplicationSubmitted: true,
      noMessageSent: true,
      noLinkedInMutated: true,
      noExternalProviderCall: true,
      noExternalAi: true,
      noOllama: true,
      noOsConnection: true,
      noOperatorRouteCreated: true,
      privatePathVisibleInReadModel: false,
    },
  };
}

export function loadResumeLinkageApplicationStore(options: {
  applicationRoot: string;
  repositoryRoot: string;
}) {
  return loadPrivateApplicationPipelineStore(options);
}

export function writeResumeVersionApplicationLinkageOutputs(input: {
  outputRoot: string;
  repositoryRoot: string;
  result: ResumeVersionApplicationLinkageResult;
}) {
  assertOutsideRepository(input.outputRoot, input.repositoryRoot, "Private resume linkage output root");
  const runDirectory = path.join(input.outputRoot, `j001_06_${compactDate(input.result.generatedAt)}`);
  ensurePrivateDirectory(runDirectory);
  const artifacts = {
    "resume_inventory.json": input.result.sourceInventory,
    "resume_versions.json": input.result.resumeVersions,
    "duplicate_version_analysis.json": input.result.duplicateVersionAnalysis,
    "resume_fact_safety_reports.json": input.result.factSafetyReports,
    "application_resume_links.json": input.result.applicationResumeLinks,
    "cover_letter_references.json": input.result.coverLetterReferences,
    "resume_link_application_events.json": input.result.resumeLinkApplicationEvents,
    "future_ui_read_model.json": input.result.futureReadModel,
    "processing_audit_summary.json": input.result.auditSummary,
  };
  for (const [name, value] of Object.entries(artifacts)) {
    writeJson(path.join(runDirectory, name), value);
  }
  return {
    runDirectory,
    artifactNames: Object.keys(artifacts),
    privatePathVisible: false as const,
  };
}

export function buildResumeLinkageCliSummary(result: ResumeVersionApplicationLinkageResult) {
  return {
    workflowVersion: result.workflowVersion,
    applicationsLoaded: result.auditSummary.applicationsLoaded,
    confirmationNeededCandidates: result.auditSummary.confirmationNeededCandidates,
    resumeSourcesInventoried: result.auditSummary.resumeSourcesInventoried,
    resumeVersionsCreated: result.auditSummary.resumeVersionsCreated,
    coverLettersFound: result.auditSummary.coverLettersFound,
    exactDuplicateGroups: result.auditSummary.exactDuplicateGroups,
    likelyVersionGroups: result.auditSummary.likelyVersionGroups,
    confirmedUsedForSubmissionLinks: result.auditSummary.confirmedUsedForSubmissionLinks,
    unknownApplicationLinks: result.auditSummary.unknownApplicationLinks,
    privatePathVisible: false,
    noResumeGenerated: result.auditSummary.noResumeGenerated,
    noResumeMutated: result.auditSummary.noResumeMutated,
    noApplicationSubmitted: result.auditSummary.noApplicationSubmitted,
    noMessageSent: result.auditSummary.noMessageSent,
    noExternalProviderCall: result.auditSummary.noExternalProviderCall,
    noExternalAi: result.auditSummary.noExternalAi,
    noOllama: result.auditSummary.noOllama,
  };
}
