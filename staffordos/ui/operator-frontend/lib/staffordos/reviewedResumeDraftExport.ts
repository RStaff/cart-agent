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
import { homedir } from "node:os";
import * as path from "node:path";
import {
  APPLICATION_ARTIFACT_VERSION_SCHEMA_VERSION,
  type ApplicationArtifactVersion,
  type ApplicationArtifactOperatorApprovalState,
  type ResumeDraftSafetyState,
  applyApplicationArtifactReviewDecision,
  loadLatestApplicationArtifactVersions,
  type TruthBoundStructuredResumeDraft,
} from "./truthBoundResumeDraft";

export const REVIEWED_RESUME_DRAFT_EXPORT_VERSION =
  "CAREEROS_APPLICATION_INTELLIGENCE_V1_03B";
export const REVIEWED_RESUME_DRAFT_EXPORT_RESULT_SCHEMA_VERSION =
  "staffordos.careeros.reviewed_resume_draft_export_result.v1";
export const REVIEWED_RESUME_DRAFT_EXPORT_READ_MODEL_SCHEMA_VERSION =
  "staffordos.careeros.reviewed_resume_draft_export_read_model.v1";

export const RESUME_DRAFT_EXPORT_REVIEW_DECISIONS = [
  "APPROVE_FOR_EXPORT",
  "REQUEST_CHANGES",
  "REJECT",
] as const;

export const RESUME_DRAFT_EXPORT_STATES = [
  "DOCX_READY",
  "PDF_NOT_SUPPORTED",
  "EXPORT_BLOCKED",
] as const;

export type ResumeDraftExportReviewDecision =
  (typeof RESUME_DRAFT_EXPORT_REVIEW_DECISIONS)[number];
export type ResumeDraftExportState =
  (typeof RESUME_DRAFT_EXPORT_STATES)[number];

export type ReviewedResumeDraftExportValidationIssue = {
  issueId: string;
  code:
    | "OPERATOR_APPROVAL_REQUIRED"
    | "DRAFT_NOT_READY_FOR_EXPORT"
    | "DRAFT_VALIDATION_ISSUES_REMAIN"
    | "NO_TRACEABLE_CLAIMS"
    | "CLAIM_TRACEABILITY_MISSING"
    | "INTERNAL_ID_RENDERED"
    | "UNSUPPORTED_PLACEHOLDER_RENDERED"
    | "EMPTY_EXPORT_CONTENT";
  severity: "BLOCKING";
  message: string;
  limitations: string[];
};

export type ReviewedResumeExportFileReference = {
  fileReferenceId: string;
  fileKind: "DOCX" | "PDF";
  filename: string;
  mimeType: string;
  created: boolean;
  byteLength: number;
  contentDigest: string | null;
  privatePathVisible: false;
  limitations: string[];
};

export type ReviewedResumeExportArtifactVersion = {
  schemaVersion: typeof APPLICATION_ARTIFACT_VERSION_SCHEMA_VERSION;
  workflowVersion: typeof REVIEWED_RESUME_DRAFT_EXPORT_VERSION;
  artifactVersionId: string;
  artifactType: "RESUME";
  version: number;
  createdAt: string;
  workspaceId: "professional";
  applicationIntelligencePacketId: string;
  jobOpportunityId: string;
  company: string;
  role: string;
  sourceDraftArtifactVersionId: string;
  sourceDraftSafetyState: ResumeDraftSafetyState;
  sourceDraftDigest: string;
  sourceCareerAuthorityDigest: string;
  exportedContentDigest: string | null;
  operatorApprovalState: ApplicationArtifactOperatorApprovalState;
  operatorApprovalTimestamp: string | null;
  exportState: ResumeDraftExportState;
  validationIssues: ReviewedResumeDraftExportValidationIssue[];
  fileReferences: ReviewedResumeExportFileReference[];
  supersedesArtifactVersionId: string | null;
  supersededByArtifactVersionId: string | null;
  privacy: "Professional owner-private";
  submissionStatus: "NOT_SUBMITTED";
  applicationCreated: false;
  applicationSubmitted: false;
  resumeVersionCreated: false;
  resumeVersionMutated: false;
  resumeUploaded: false;
  coverLetterGenerated: false;
  messageSent: false;
  browserAutomationUsed: false;
  externalProviderCall: false;
  externalAiUsed: false;
  ollamaUsed: false;
  privatePathVisible: false;
  rawCareerEvidenceVisibleInReadModel: false;
  claimTraceabilityPreservedPrivately: true;
  limitations: string[];
};

export type ReviewedResumeDraftExportReadModelRecord = {
  schemaVersion: typeof REVIEWED_RESUME_DRAFT_EXPORT_READ_MODEL_SCHEMA_VERSION;
  artifactVersionId: string;
  sourceDraftArtifactVersionId: string;
  packetId: string;
  jobOpportunityId: string;
  company: string;
  role: string;
  version: number;
  sourceDraftSafetyState: ResumeDraftSafetyState;
  operatorApprovalState: ApplicationArtifactOperatorApprovalState;
  operatorApprovalTimestamp: string | null;
  exportState: ResumeDraftExportState;
  docxCreated: boolean;
  pdfCreated: false;
  docxFilename: string | null;
  downloadPath: string | null;
  submissionStatus: "NOT_SUBMITTED";
  validationIssueCount: number;
  privatePathVisible: false;
  draftContentVisible: false;
  sourceAuthorityIdsVisible: false;
  nextAction: "DOWNLOAD_DOCX" | "REVIEW_EVIDENCE";
  limitations: string[];
};

export type ReviewedResumeDraftExportResult = {
  schemaVersion: typeof REVIEWED_RESUME_DRAFT_EXPORT_RESULT_SCHEMA_VERSION;
  workflowVersion: typeof REVIEWED_RESUME_DRAFT_EXPORT_VERSION;
  generatedAt: string;
  workspaceId: "professional";
  capabilityFamily: "Career Operations";
  sourceAuthority: {
    applicationArtifactVersionReused: true;
    structuredDraftIsContentAuthority: true;
    careerFactsRemainAuthority: true;
    careerEvidenceRemainsAuthority: true;
    resumeVersionCreated: false;
    applicationCreated: false;
  };
  documentAuthority: {
    existingDocxWriterFound: false;
    docxWriter: "MINIMAL_DETERMINISTIC_OOXML_WRITER";
    pdfWriterFound: false;
    pdfGenerated: false;
  };
  exportArtifacts: ReviewedResumeExportArtifactVersion[];
  readModel: ReviewedResumeDraftExportReadModelRecord[];
  summary: {
    sourceDraftsReviewed: number;
    docxExportsCreated: number;
    blockedExports: number;
    pdfExportsCreated: 0;
    applicationsCreated: 0;
    applicationsSubmitted: 0;
    externalActions: 0;
  };
  auditSummary: {
    noResumeRewrite: true;
    noUnsupportedClaimAdded: true;
    noResumeVersionCreated: true;
    noResumeVersionMutated: true;
    noApplicationCreated: true;
    noApplicationSubmitted: true;
    noMessageSent: true;
    noBrowserAutomation: true;
    noProviderCall: true;
    noExternalAi: true;
    noOllama: true;
    noPdfGenerated: true;
    privatePathVisible: false;
    rawCareerEvidenceVisibleInReadModel: false;
  };
};

export type ReviewedResumeDraftExportWriteResult = {
  runDirectory: string;
  jsonArtifactNames: string[];
  docxFilenames: string[];
  writtenFiles: string[];
  privatePathVisible: false;
};

const DEFAULT_JOB_SEARCH_PRIVATE_ROOT = path.join(
  homedir(),
  ".staffordos/private/professional/job-search",
);
const DOCX_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const OWNER_DISPLAY_NAME = "Ross Stafford";

function sha256Buffer(value: Buffer | string) {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableJson(entry)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function opaqueId(prefix: string, parts: readonly unknown[]) {
  return `${prefix}_${createHash("sha256")
    .update(parts.map((part) => String(part ?? "")).join("|"))
    .digest("hex")
    .slice(0, 18)}`;
}

function compactTimestamp(value: string) {
  return value.replace(/[^0-9]/g, "").slice(0, 14) || createHash("sha256").update(value).digest("hex").slice(0, 14);
}

function uniqueSorted(values: readonly (string | null | undefined)[]) {
  return [...new Set(values.map((value) => (typeof value === "string" ? value.trim() : "")).filter(Boolean))]
    .sort((left, right) => left.localeCompare(right));
}

function latestDirectory(root: string): string | null {
  if (!existsSync(root)) return null;
  const directories = readdirSync(root)
    .map((entry) => path.join(root, entry))
    .filter((entryPath) => {
      try {
        return statSync(entryPath).isDirectory();
      } catch (_error) {
        return false;
      }
    })
    .sort((left, right) => left.localeCompare(right));
  return directories[directories.length - 1] || null;
}

function latestJson<T>(root: string, filename: string): T | null {
  const directory = latestDirectory(root);
  if (!directory) return null;
  const filePath = path.join(directory, filename);
  if (!existsSync(filePath)) return null;
  return JSON.parse(readFileSync(filePath, "utf8")) as T;
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

function assertInsideDirectory(candidatePath: string, parentPath: string, label: string) {
  if (!isInsideDirectory(candidatePath, parentPath)) {
    throw new Error(`${label} must remain inside the private export root.`);
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

function writePrivateBuffer(filePath: string, value: Buffer) {
  writeFileSync(filePath, value);
  chmodSync(filePath, 0o600);
}

function sanitizeFilenamePart(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 72) || "Opportunity";
}

export function buildResumeDocxFilename(input: {
  company: string;
  role: string;
  version: number;
}) {
  return `Ross_Stafford_${sanitizeFilenamePart(input.company)}_${sanitizeFilenamePart(input.role)}_Resume_v${input.version}.docx`;
}

function textLinesFromDraft(draft: TruthBoundStructuredResumeDraft) {
  const lines: string[] = [OWNER_DISPLAY_NAME];
  if (draft.summary.length) {
    lines.push("PROFESSIONAL SUMMARY", ...draft.summary);
  }
  if (draft.skills.length) {
    lines.push("CORE SKILLS / TECHNOLOGIES", draft.skills.join(", "));
  }
  if (draft.experience.length) {
    lines.push("PROFESSIONAL EXPERIENCE");
    for (const entry of draft.experience) {
      const heading = [
        entry.title,
        entry.employer,
        [entry.startDate, entry.endDate].filter(Boolean).join(" - "),
      ].filter(Boolean).join(" | ");
      if (heading) lines.push(heading);
      lines.push(...entry.bullets.map((bullet) => `- ${bullet}`));
    }
  }
  if (draft.projects.length) {
    lines.push("SELECTED PROJECTS / PRODUCTS");
    for (const project of draft.projects) {
      lines.push(project.label);
      lines.push(...project.bullets.map((bullet) => `- ${bullet}`));
    }
  }
  if (draft.education.length) {
    lines.push("EDUCATION", ...draft.education);
  }
  if (draft.certifications.length) {
    lines.push("CERTIFICATIONS", ...draft.certifications);
  }
  return lines.filter((line) => line.trim().length > 0);
}

export function renderResumeDraftPlainText(artifact: ApplicationArtifactVersion) {
  return textLinesFromDraft(artifact.draft).join("\n");
}

function xmlEscape(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function paragraphXml(text: string, style: "Title" | "Heading1" | "Normal" = "Normal") {
  const styleXml = style === "Normal" ? "" : `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>`;
  return `<w:p>${styleXml}<w:r><w:t xml:space="preserve">${xmlEscape(text)}</w:t></w:r></w:p>`;
}

function documentXml(lines: readonly string[]) {
  const headingLabels = new Set([
    "PROFESSIONAL SUMMARY",
    "CORE SKILLS / TECHNOLOGIES",
    "PROFESSIONAL EXPERIENCE",
    "SELECTED PROJECTS / PRODUCTS",
    "EDUCATION",
    "CERTIFICATIONS",
  ]);
  const paragraphs = lines.map((line, index) => {
    if (index === 0) return paragraphXml(line, "Title");
    if (headingLabels.has(line)) return paragraphXml(line, "Heading1");
    return paragraphXml(line, "Normal");
  });
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${paragraphs.join("\n    ")}
    <w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="720" w:right="900" w:bottom="720" w:left="900"/></w:sectPr>
  </w:body>
</w:document>`;
}

function stylesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:styleId="Normal"><w:name w:val="Normal"/><w:rPr><w:sz w:val="21"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:rPr><w:b/><w:sz w:val="32"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:rPr><w:b/><w:sz w:val="23"/></w:rPr></w:style>
</w:styles>`;
}

function contentTypesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`;
}

function relationshipsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;
}

const CRC_TABLE = new Uint32Array(256).map((_value, index) => {
  let crc = index;
  for (let bit = 0; bit < 8; bit += 1) {
    crc = (crc & 1) ? (0xedb88320 ^ (crc >>> 1)) : (crc >>> 1);
  }
  return crc >>> 0;
});

function crc32(buffer: Buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function localFileHeader(input: { name: Buffer; content: Buffer; crc: number }) {
  const header = Buffer.alloc(30);
  header.writeUInt32LE(0x04034b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(0, 6);
  header.writeUInt16LE(0, 8);
  header.writeUInt16LE(0, 10);
  header.writeUInt16LE(0, 12);
  header.writeUInt32LE(input.crc, 14);
  header.writeUInt32LE(input.content.length, 18);
  header.writeUInt32LE(input.content.length, 22);
  header.writeUInt16LE(input.name.length, 26);
  header.writeUInt16LE(0, 28);
  return header;
}

function centralDirectoryHeader(input: {
  name: Buffer;
  content: Buffer;
  crc: number;
  offset: number;
}) {
  const header = Buffer.alloc(46);
  header.writeUInt32LE(0x02014b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(20, 6);
  header.writeUInt16LE(0, 8);
  header.writeUInt16LE(0, 10);
  header.writeUInt16LE(0, 12);
  header.writeUInt16LE(0, 14);
  header.writeUInt32LE(input.crc, 16);
  header.writeUInt32LE(input.content.length, 20);
  header.writeUInt32LE(input.content.length, 24);
  header.writeUInt16LE(input.name.length, 28);
  header.writeUInt16LE(0, 30);
  header.writeUInt16LE(0, 32);
  header.writeUInt16LE(0, 34);
  header.writeUInt16LE(0, 36);
  header.writeUInt32LE(0, 38);
  header.writeUInt32LE(input.offset, 42);
  return header;
}

function endCentralDirectory(input: { centralSize: number; centralOffset: number; fileCount: number }) {
  const header = Buffer.alloc(22);
  header.writeUInt32LE(0x06054b50, 0);
  header.writeUInt16LE(0, 4);
  header.writeUInt16LE(0, 6);
  header.writeUInt16LE(input.fileCount, 8);
  header.writeUInt16LE(input.fileCount, 10);
  header.writeUInt32LE(input.centralSize, 12);
  header.writeUInt32LE(input.centralOffset, 16);
  header.writeUInt16LE(0, 20);
  return header;
}

function zipStore(files: Array<{ name: string; content: Buffer }>) {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;
  for (const file of files) {
    const name = Buffer.from(file.name, "utf8");
    const crc = crc32(file.content);
    const local = localFileHeader({ name, content: file.content, crc });
    localParts.push(local, name, file.content);
    centralParts.push(centralDirectoryHeader({ name, content: file.content, crc, offset }), name);
    offset += local.length + name.length + file.content.length;
  }
  const centralOffset = offset;
  const central = Buffer.concat(centralParts);
  const end = endCentralDirectory({
    centralSize: central.length,
    centralOffset,
    fileCount: files.length,
  });
  return Buffer.concat([...localParts, central, end]);
}

export function buildDocxForReviewedResumeDraft(artifact: ApplicationArtifactVersion) {
  const lines = textLinesFromDraft(artifact.draft);
  return zipStore([
    { name: "[Content_Types].xml", content: Buffer.from(contentTypesXml(), "utf8") },
    { name: "_rels/.rels", content: Buffer.from(relationshipsXml(), "utf8") },
    { name: "word/document.xml", content: Buffer.from(documentXml(lines), "utf8") },
    { name: "word/styles.xml", content: Buffer.from(stylesXml(), "utf8") },
  ]);
}

function exportContentDigest(artifact: ApplicationArtifactVersion) {
  return sha256Buffer(renderResumeDraftPlainText(artifact));
}

function blockingIssue(code: ReviewedResumeDraftExportValidationIssue["code"], message: string, limitations: string[]) {
  return {
    issueId: opaqueId("privresumeexportissue", [code, message, limitations.join("|")]),
    code,
    severity: "BLOCKING" as const,
    message,
    limitations,
  };
}

const INTERNAL_ID_PATTERN = /\b(priv[a-z0-9_]*|career[_-]?fact|career[_-]?evidence|packet_|source_|sha256:)/i;
const PLACEHOLDER_PATTERN = /\b(TBD|TODO|UNKNOWN|N\/A)\b|\{\{|\[\[/i;

export function validateReviewedResumeDraftForExport(artifact: ApplicationArtifactVersion) {
  const issues: ReviewedResumeDraftExportValidationIssue[] = [];
  const text = renderResumeDraftPlainText(artifact);
  const traceByClaimId = new Map(artifact.claimTraceability.map((claim) => [claim.claimId, claim]));
  if (artifact.safetyState !== "APPROVED_FOR_EXPORT" || artifact.operatorApprovalState !== "APPROVED") {
    issues.push(blockingIssue(
      "OPERATOR_APPROVAL_REQUIRED",
      "Resume draft export requires explicit operator approval.",
      ["Only APPROVED_FOR_EXPORT drafts may produce submission-ready DOCX files."],
    ));
  }
  if (artifact.validationIssues.length > 0) {
    issues.push(blockingIssue(
      "DRAFT_VALIDATION_ISSUES_REMAIN",
      "The source draft still has V1.03 validation issues.",
      ["Human approval cannot override unresolved evidence, metric, or claim-safety issues."],
    ));
  }
  if (!artifact.claimTraceability.length) {
    issues.push(blockingIssue(
      "NO_TRACEABLE_CLAIMS",
      "The source draft contains no traceable claims.",
      ["DOCX export requires at least one substantive claim with CareerFact and CareerEvidence references."],
    ));
  }
  for (const claimId of artifact.draft.claimRefs) {
    const claim = traceByClaimId.get(claimId);
    if (!claim || !claim.careerFactIds.length || !claim.careerEvidenceIds.length) {
      issues.push(blockingIssue(
        "CLAIM_TRACEABILITY_MISSING",
        "A draft claim reference is missing private CareerFact or CareerEvidence traceability.",
        ["Every substantive exported claim must remain traceable privately."],
      ));
    }
  }
  if (!text.trim()) {
    issues.push(blockingIssue(
      "EMPTY_EXPORT_CONTENT",
      "The source draft rendered no resume content.",
      ["Empty DOCX files are not useful submission artifacts."],
    ));
  }
  if (INTERNAL_ID_PATTERN.test(text)) {
    issues.push(blockingIssue(
      "INTERNAL_ID_RENDERED",
      "The rendered resume text contains an internal identifier.",
      ["Claim IDs, provenance IDs, digests, packet IDs, source IDs, and Career authority IDs must remain private."],
    ));
  }
  if (PLACEHOLDER_PATTERN.test(text)) {
    issues.push(blockingIssue(
      "UNSUPPORTED_PLACEHOLDER_RENDERED",
      "The rendered resume text contains placeholder wording.",
      ["Unsupported, unknown, or placeholder content must be resolved before export."],
    ));
  }
  return issues;
}

function nextExportVersion(input: {
  sourceDraftArtifactVersionId: string;
  previousExportVersions: readonly Partial<ReviewedResumeExportArtifactVersion>[];
}) {
  const previous = input.previousExportVersions
    .filter((artifact) =>
      artifact.artifactType === "RESUME" &&
      artifact.sourceDraftArtifactVersionId === input.sourceDraftArtifactVersionId &&
      typeof artifact.version === "number",
    )
    .sort((left, right) => (left.version || 0) - (right.version || 0));
  const latest = previous[previous.length - 1] || null;
  return {
    version: (latest?.version || 0) + 1,
    supersedesArtifactVersionId: typeof latest?.artifactVersionId === "string" ? latest.artifactVersionId : null,
  };
}

function exportArtifactFor(input: {
  artifact: ApplicationArtifactVersion;
  generatedAt: string;
  operatorApprovalTimestamp: string;
  previousExportVersions: readonly Partial<ReviewedResumeExportArtifactVersion>[];
}): ReviewedResumeExportArtifactVersion {
  const issues = validateReviewedResumeDraftForExport(input.artifact);
  const docx = buildDocxForReviewedResumeDraft(input.artifact);
  const version = nextExportVersion({
    sourceDraftArtifactVersionId: input.artifact.artifactVersionId,
    previousExportVersions: input.previousExportVersions,
  });
  const exportedDigest = issues.length ? null : exportContentDigest(input.artifact);
  const artifactVersionId = opaqueId("privresumeexport", [
    input.artifact.artifactVersionId,
    input.artifact.draftContentDigest,
    exportedDigest,
    version.version,
  ]);
  const filename = buildResumeDocxFilename({
    company: input.artifact.company,
    role: input.artifact.role,
    version: version.version,
  });
  return {
    schemaVersion: APPLICATION_ARTIFACT_VERSION_SCHEMA_VERSION,
    workflowVersion: REVIEWED_RESUME_DRAFT_EXPORT_VERSION,
    artifactVersionId,
    artifactType: "RESUME",
    version: version.version,
    createdAt: input.generatedAt,
    workspaceId: "professional",
    applicationIntelligencePacketId: input.artifact.applicationIntelligencePacketId,
    jobOpportunityId: input.artifact.jobOpportunityId,
    company: input.artifact.company,
    role: input.artifact.role,
    sourceDraftArtifactVersionId: input.artifact.artifactVersionId,
    sourceDraftSafetyState: input.artifact.safetyState,
    sourceDraftDigest: input.artifact.draftContentDigest,
    sourceCareerAuthorityDigest: input.artifact.sourceCareerAuthorityDigest,
    exportedContentDigest: exportedDigest,
    operatorApprovalState: input.artifact.operatorApprovalState,
    operatorApprovalTimestamp:
      input.artifact.operatorApprovalState === "APPROVED" ? input.operatorApprovalTimestamp : null,
    exportState: issues.length ? "EXPORT_BLOCKED" : "DOCX_READY",
    validationIssues: issues,
    fileReferences: [
      {
        fileReferenceId: opaqueId("privresumeexportfile", [artifactVersionId, "docx"]),
        fileKind: "DOCX",
        filename,
        mimeType: DOCX_MIME_TYPE,
        created: issues.length === 0,
        byteLength: issues.length === 0 ? docx.length : 0,
        contentDigest: issues.length === 0 ? sha256Buffer(docx) : null,
        privatePathVisible: false,
        limitations: ["DOCX is rendered from the approved structured draft without new resume wording."],
      },
      {
        fileReferenceId: opaqueId("privresumeexportfile", [artifactVersionId, "pdf"]),
        fileKind: "PDF",
        filename: filename.replace(/\.docx$/i, ".pdf"),
        mimeType: "application/pdf",
        created: false,
        byteLength: 0,
        contentDigest: null,
        privatePathVisible: false,
        limitations: ["PDF export is not implemented in V1.03B because no safe existing PDF conversion path was found."],
      },
    ],
    supersedesArtifactVersionId: version.supersedesArtifactVersionId,
    supersededByArtifactVersionId: null,
    privacy: "Professional owner-private",
    submissionStatus: "NOT_SUBMITTED",
    applicationCreated: false,
    applicationSubmitted: false,
    resumeVersionCreated: false,
    resumeVersionMutated: false,
    resumeUploaded: false,
    coverLetterGenerated: false,
    messageSent: false,
    browserAutomationUsed: false,
    externalProviderCall: false,
    externalAiUsed: false,
    ollamaUsed: false,
    privatePathVisible: false,
    rawCareerEvidenceVisibleInReadModel: false,
    claimTraceabilityPreservedPrivately: true,
    limitations: uniqueSorted([
      issues.length ? "DOCX export failed closed; no submission artifact was written." : "DOCX export is ready for operator download and manual use.",
      "Job-specific resume exports are ApplicationArtifactVersion records, not canonical ResumeVersions.",
      "Submission status remains NOT_SUBMITTED.",
    ]),
  };
}

function readModelFor(artifact: ReviewedResumeExportArtifactVersion): ReviewedResumeDraftExportReadModelRecord {
  const docx = artifact.fileReferences.find((file) => file.fileKind === "DOCX" && file.created);
  return {
    schemaVersion: REVIEWED_RESUME_DRAFT_EXPORT_READ_MODEL_SCHEMA_VERSION,
    artifactVersionId: artifact.artifactVersionId,
    sourceDraftArtifactVersionId: artifact.sourceDraftArtifactVersionId,
    packetId: artifact.applicationIntelligencePacketId,
    jobOpportunityId: artifact.jobOpportunityId,
    company: artifact.company,
    role: artifact.role,
    version: artifact.version,
    sourceDraftSafetyState: artifact.sourceDraftSafetyState,
    operatorApprovalState: artifact.operatorApprovalState,
    operatorApprovalTimestamp: artifact.operatorApprovalTimestamp,
    exportState: artifact.exportState,
    docxCreated: Boolean(docx),
    pdfCreated: false,
    docxFilename: docx?.filename || null,
    downloadPath: docx ? `/os/professional/jobs/artifacts/${artifact.artifactVersionId}/docx` : null,
    submissionStatus: "NOT_SUBMITTED",
    validationIssueCount: artifact.validationIssues.length,
    privatePathVisible: false,
    draftContentVisible: false,
    sourceAuthorityIdsVisible: false,
    nextAction: docx ? "DOWNLOAD_DOCX" : "REVIEW_EVIDENCE",
    limitations: [
      "Read model excludes generated resume text, private filesystem paths, claim IDs, CareerFact IDs, and CareerEvidence IDs.",
      ...artifact.limitations,
    ],
  };
}

export function recordResumeDraftExportReviewDecision(input: {
  artifact: ApplicationArtifactVersion;
  decision: ResumeDraftExportReviewDecision;
  decidedAt: string;
}) {
  const decision =
    input.decision === "APPROVE_FOR_EXPORT"
      ? "APPROVED"
      : input.decision === "REQUEST_CHANGES"
        ? "REQUEST_CHANGES"
        : "REJECTED";
  return {
    artifact: applyApplicationArtifactReviewDecision({
      artifact: input.artifact,
      decision,
      decidedAt: input.decidedAt,
    }),
    review: {
      schemaVersion: "staffordos.careeros.resume_draft_export_review_decision.v1",
      sourceDraftArtifactVersionId: input.artifact.artifactVersionId,
      decision: input.decision,
      decidedAt: input.decidedAt,
      resultingOperatorApprovalState: decision,
      resultingSafetyState:
        input.decision === "APPROVE_FOR_EXPORT" && input.artifact.safetyState === "DRAFT_READY_FOR_REVIEW"
          ? "APPROVED_FOR_EXPORT"
          : input.artifact.safetyState,
      applicationCreated: false,
      applicationSubmitted: false,
      resumeUploaded: false,
      messageSent: false,
      limitations: [
        "Approval means the existing truth-bound draft may be exported; it does not authorize unsupported claims or submission.",
      ],
    },
  };
}

export function buildReviewedResumeDraftExport(input: {
  generatedAt: string;
  artifacts: readonly ApplicationArtifactVersion[];
  operatorApprovalTimestamp?: string;
  previousExportVersions?: readonly Partial<ReviewedResumeExportArtifactVersion>[];
}) {
  const operatorApprovalTimestamp = input.operatorApprovalTimestamp || input.generatedAt;
  const exportArtifacts = input.artifacts.map((artifact) =>
    exportArtifactFor({
      artifact,
      generatedAt: input.generatedAt,
      operatorApprovalTimestamp,
      previousExportVersions: input.previousExportVersions || [],
    }),
  );
  return {
    schemaVersion: REVIEWED_RESUME_DRAFT_EXPORT_RESULT_SCHEMA_VERSION,
    workflowVersion: REVIEWED_RESUME_DRAFT_EXPORT_VERSION,
    generatedAt: input.generatedAt,
    workspaceId: "professional" as const,
    capabilityFamily: "Career Operations" as const,
    sourceAuthority: {
      applicationArtifactVersionReused: true as const,
      structuredDraftIsContentAuthority: true as const,
      careerFactsRemainAuthority: true as const,
      careerEvidenceRemainsAuthority: true as const,
      resumeVersionCreated: false as const,
      applicationCreated: false as const,
    },
    documentAuthority: {
      existingDocxWriterFound: false as const,
      docxWriter: "MINIMAL_DETERMINISTIC_OOXML_WRITER" as const,
      pdfWriterFound: false as const,
      pdfGenerated: false as const,
    },
    exportArtifacts,
    readModel: exportArtifacts.map(readModelFor),
    summary: {
      sourceDraftsReviewed: input.artifacts.length,
      docxExportsCreated: exportArtifacts.filter((artifact) => artifact.exportState === "DOCX_READY").length,
      blockedExports: exportArtifacts.filter((artifact) => artifact.exportState === "EXPORT_BLOCKED").length,
      pdfExportsCreated: 0 as const,
      applicationsCreated: 0 as const,
      applicationsSubmitted: 0 as const,
      externalActions: 0 as const,
    },
    auditSummary: {
      noResumeRewrite: true as const,
      noUnsupportedClaimAdded: true as const,
      noResumeVersionCreated: true as const,
      noResumeVersionMutated: true as const,
      noApplicationCreated: true as const,
      noApplicationSubmitted: true as const,
      noMessageSent: true as const,
      noBrowserAutomation: true as const,
      noProviderCall: true as const,
      noExternalAi: true as const,
      noOllama: true as const,
      noPdfGenerated: true as const,
      privatePathVisible: false as const,
      rawCareerEvidenceVisibleInReadModel: false as const,
    },
  } satisfies ReviewedResumeDraftExportResult;
}

export function writeReviewedResumeDraftExportOutputs(input: {
  outputRoot?: string;
  jobSearchRoot?: string;
  repositoryRoot: string;
  result: ReviewedResumeDraftExportResult;
  sourceArtifacts: readonly ApplicationArtifactVersion[];
}): ReviewedResumeDraftExportWriteResult {
  const outputRoot = input.outputRoot || path.join(
    input.jobSearchRoot || DEFAULT_JOB_SEARCH_PRIVATE_ROOT,
    "application-artifact-exports",
  );
  assertOutsideRepository(outputRoot, input.repositoryRoot, "Private reviewed resume export output root");
  const runDirectory = path.join(outputRoot, `${REVIEWED_RESUME_DRAFT_EXPORT_VERSION}_${compactTimestamp(input.result.generatedAt)}`);
  const fileDirectory = path.join(runDirectory, "files");
  ensurePrivateDirectory(runDirectory);
  ensurePrivateDirectory(fileDirectory);
  const sourceById = new Map(input.sourceArtifacts.map((artifact) => [artifact.artifactVersionId, artifact]));
  const docxFilenames: string[] = [];
  const writtenFiles: string[] = [];
  const jsonArtifacts = {
    "reviewed_resume_draft_export_result.json": input.result,
    "application_artifact_export_versions.json": input.result.exportArtifacts,
    "resume_export_read_model.json": input.result.readModel,
    "resume_export_validation.private.json": input.result.exportArtifacts.flatMap((artifact) =>
      artifact.validationIssues.map((issue) => ({
        artifactVersionId: artifact.artifactVersionId,
        sourceDraftArtifactVersionId: artifact.sourceDraftArtifactVersionId,
        ...issue,
      })),
    ),
    "resume_export_audit.json": input.result.auditSummary,
  };
  for (const [filename, value] of Object.entries(jsonArtifacts)) {
    const filePath = path.join(runDirectory, filename);
    writeJson(filePath, value);
    writtenFiles.push(filePath);
  }
  for (const exportArtifact of input.result.exportArtifacts) {
    const docxReference = exportArtifact.fileReferences.find((file) => file.fileKind === "DOCX" && file.created);
    const source = sourceById.get(exportArtifact.sourceDraftArtifactVersionId);
    if (!docxReference || !source) continue;
    const docxPath = path.join(fileDirectory, docxReference.filename);
    assertInsideDirectory(docxPath, fileDirectory, "DOCX export file");
    writePrivateBuffer(docxPath, buildDocxForReviewedResumeDraft(source));
    writtenFiles.push(docxPath);
    docxFilenames.push(docxReference.filename);
  }
  return {
    runDirectory,
    jsonArtifactNames: Object.keys(jsonArtifacts),
    docxFilenames,
    writtenFiles,
    privatePathVisible: false,
  };
}

export function loadLatestReviewedResumeDraftExportResult(jobSearchRoot = DEFAULT_JOB_SEARCH_PRIVATE_ROOT) {
  return latestJson<ReviewedResumeDraftExportResult>(
    path.join(jobSearchRoot, "application-artifact-exports"),
    "reviewed_resume_draft_export_result.json",
  );
}

export function loadLatestReviewedResumeDraftExportReadModel(jobSearchRoot = DEFAULT_JOB_SEARCH_PRIVATE_ROOT) {
  return latestJson<ReviewedResumeDraftExportReadModelRecord[]>(
    path.join(jobSearchRoot, "application-artifact-exports"),
    "resume_export_read_model.json",
  ) || [];
}

export function loadLatestReviewedResumeDraftExportVersions(jobSearchRoot = DEFAULT_JOB_SEARCH_PRIVATE_ROOT) {
  return latestJson<ReviewedResumeExportArtifactVersion[]>(
    path.join(jobSearchRoot, "application-artifact-exports"),
    "application_artifact_export_versions.json",
  ) || [];
}

export function readLatestDocxExport(input: {
  artifactVersionId: string;
  jobSearchRoot?: string;
}) {
  const jobSearchRoot = input.jobSearchRoot || DEFAULT_JOB_SEARCH_PRIVATE_ROOT;
  const outputRoot = path.join(jobSearchRoot, "application-artifact-exports");
  const directory = latestDirectory(outputRoot);
  if (!directory) return null;
  const result = loadLatestReviewedResumeDraftExportResult(jobSearchRoot);
  const record = result?.exportArtifacts.find((artifact) => artifact.artifactVersionId === input.artifactVersionId);
  const docx = record?.fileReferences.find((file) => file.fileKind === "DOCX" && file.created);
  if (!record || !docx) return null;
  const fileDirectory = path.join(directory, "files");
  const filePath = path.join(fileDirectory, docx.filename);
  assertInsideDirectory(filePath, fileDirectory, "DOCX download file");
  if (!existsSync(filePath)) return null;
  return {
    filename: docx.filename,
    mimeType: docx.mimeType,
    buffer: readFileSync(filePath),
  };
}

export function buildReviewedResumeDraftExportCliSummary(
  result: ReviewedResumeDraftExportResult,
  writtenCount = 0,
) {
  return {
    workflowVersion: result.workflowVersion,
    generatedAt: result.generatedAt,
    sourceDraftsReviewed: result.summary.sourceDraftsReviewed,
    docxExportsCreated: result.summary.docxExportsCreated,
    blockedExports: result.summary.blockedExports,
    pdfExportsCreated: result.summary.pdfExportsCreated,
    privateArtifactsWritten: writtenCount,
    noResumeRewrite: result.auditSummary.noResumeRewrite,
    noUnsupportedClaimAdded: result.auditSummary.noUnsupportedClaimAdded,
    noResumeVersionCreated: result.auditSummary.noResumeVersionCreated,
    noApplicationCreated: result.auditSummary.noApplicationCreated,
    noApplicationSubmitted: result.auditSummary.noApplicationSubmitted,
    noMessageSent: result.auditSummary.noMessageSent,
    noExternalAi: result.auditSummary.noExternalAi,
    noOllama: result.auditSummary.noOllama,
    privatePathVisible: false,
  };
}

export function runReviewedResumeDraftExportFromPrivateArtifacts(input: {
  generatedAt?: string;
  jobSearchRoot?: string;
  repositoryRoot?: string;
  writeOutputs?: boolean;
  artifactIds?: readonly string[];
  approveForExport?: boolean;
  reviewDecision?: ResumeDraftExportReviewDecision;
  limit?: number;
}) {
  const generatedAt = input.generatedAt || new Date().toISOString();
  const jobSearchRoot = input.jobSearchRoot || DEFAULT_JOB_SEARCH_PRIVATE_ROOT;
  const repositoryRoot = input.repositoryRoot || process.cwd();
  const latestDraftArtifacts = loadLatestApplicationArtifactVersions(jobSearchRoot);
  const filterIds = input.artifactIds?.length ? new Set(input.artifactIds) : null;
  const selected = latestDraftArtifacts
    .filter((artifact) =>
      !filterIds ||
      filterIds.has(artifact.artifactVersionId) ||
      filterIds.has(artifact.applicationIntelligencePacketId) ||
      filterIds.has(artifact.jobOpportunityId),
    )
    .slice(0, typeof input.limit === "number" && input.limit > 0 ? input.limit : 1);
  const reviewDecision = input.reviewDecision || (input.approveForExport ? "APPROVE_FOR_EXPORT" : null);
  const reviewed = reviewDecision
    ? selected.map((artifact) =>
        recordResumeDraftExportReviewDecision({
          artifact,
          decision: reviewDecision,
          decidedAt: generatedAt,
        }).artifact,
      )
    : selected;
  const result = buildReviewedResumeDraftExport({
    generatedAt,
    artifacts: reviewed,
    operatorApprovalTimestamp: generatedAt,
    previousExportVersions: loadLatestReviewedResumeDraftExportVersions(jobSearchRoot),
  });
  const writeResult = input.writeOutputs
    ? writeReviewedResumeDraftExportOutputs({
        jobSearchRoot,
        repositoryRoot,
        result,
        sourceArtifacts: reviewed,
      })
    : null;
  return { result, writeResult };
}
