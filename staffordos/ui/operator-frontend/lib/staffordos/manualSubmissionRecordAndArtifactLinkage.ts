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
  type ApplicationIntelligencePacket,
  loadLatestApplicationIntelligencePacketResult,
} from "./applicationIntelligencePacket";
import {
  APPLICATION_ARTIFACT_VERSION_SCHEMA_VERSION,
} from "./truthBoundResumeDraft";
import {
  type ReviewedResumeExportArtifactVersion,
  loadLatestReviewedResumeDraftExportVersions,
} from "./reviewedResumeDraftExport";
import {
  buildManualApplicationTrackingResult,
  type ManualApplicationTrackingResult,
  type PrivateApplicationEventRecord,
  type PrivateApplicationRecord,
  type PrivateFollowUpReviewTask,
  type SubmittedAtPrecision,
} from "./manualApplicationEventTracking";
import {
  buildApplicationEngagementQueue,
  writeApplicationEngagementQueueOutputs,
  type ApplicationEngagementQueueResult,
} from "./applicationFollowUpResponseTracking";
import {
  loadPrivateApplicationPipelineStore,
  type PrivateApplicationPipelineStore,
} from "./privateApplicationPipelineReview";

export const MANUAL_SUBMISSION_RECORD_LINKAGE_VERSION =
  "CAREEROS_APPLICATION_INTELLIGENCE_V1_04";
export const MANUAL_SUBMISSION_RECORD_LINKAGE_RESULT_SCHEMA_VERSION =
  "staffordos.careeros.manual_submission_record_and_artifact_linkage_result.v1";
export const APPLICATION_ARTIFACT_SUBMISSION_LINK_SCHEMA_VERSION =
  "staffordos.careeros.application_artifact_submission_link.v1";
export const SUBMITTED_APPLICATION_ARTIFACT_STATE_SCHEMA_VERSION =
  "staffordos.careeros.submitted_application_artifact_state.v1";
export const MANUAL_SUBMISSION_READ_MODEL_SCHEMA_VERSION =
  "staffordos.careeros.manual_submission_read_model.v1";

export type ManualSubmissionValidationIssue = {
  issueId: string;
  code:
    | "OPERATOR_CONFIRMATION_REQUIRED"
    | "SUBMISSION_DATE_REQUIRED"
    | "APPROVED_RESUME_ARTIFACT_REQUIRED"
    | "ARTIFACT_ALREADY_SUBMITTED"
    | "APPLICATION_PACKET_REQUIRED"
    | "SOURCE_URL_REQUIRED"
    | "APPLICATION_DUPLICATE_BLOCKED";
  severity: "BLOCKING";
  message: string;
  limitations: string[];
};

export type ManualSubmissionInput = {
  artifactVersionId: string;
  submittedAt: string | null;
  submittedAtPrecision?: SubmittedAtPrecision;
  submissionChannel?: string | null;
  operatorConfirmed: boolean;
};

export type ApplicationArtifactSubmissionLink = {
  schemaVersion: typeof APPLICATION_ARTIFACT_SUBMISSION_LINK_SCHEMA_VERSION;
  workflowVersion: typeof MANUAL_SUBMISSION_RECORD_LINKAGE_VERSION;
  linkId: string;
  applicationId: string;
  applicationEventId: string;
  jobOpportunityId: string;
  applicationIntelligencePacketId: string;
  sourceRecordId: string;
  sourceUrl: string;
  company: string;
  role: string;
  artifactVersionId: string;
  artifactType: "RESUME";
  artifactVersion: number;
  sourceDraftArtifactVersionId: string;
  sourceDraftDigest: string;
  sourceCareerAuthorityDigest: string;
  exportedContentDigest: string;
  fileReference: {
    fileKind: "DOCX";
    filename: string;
    contentDigest: string;
    privatePathVisible: false;
  };
  submissionMethod: "MANUAL";
  submittedAt: string;
  submittedAtPrecision: SubmittedAtPrecision;
  operatorConfirmed: true;
  exactArtifactLinked: true;
  noFilenameGuessing: true;
  privacy: "Professional owner-private";
  limitations: string[];
};

export type SubmittedApplicationArtifactState = {
  schemaVersion: typeof SUBMITTED_APPLICATION_ARTIFACT_STATE_SCHEMA_VERSION;
  workflowVersion: typeof MANUAL_SUBMISSION_RECORD_LINKAGE_VERSION;
  artifactSchemaVersion: typeof APPLICATION_ARTIFACT_VERSION_SCHEMA_VERSION;
  artifactVersionId: string;
  artifactType: "RESUME";
  sourceArtifactWorkflowVersion: string;
  sourceArtifactSubmissionStatus: "NOT_SUBMITTED";
  submissionStatus: "SUBMITTED";
  applicationId: string;
  applicationEventId: string;
  submittedAt: string;
  submittedAtPrecision: SubmittedAtPrecision;
  exportedContentDigest: string;
  fileContentDigest: string;
  artifactContentMutated: false;
  artifactVersionCreated: false;
  resumeVersionCreated: false;
  resumeVersionMutated: false;
  submissionPerformedByStaffordOS: false;
  privacy: "Professional owner-private";
  limitations: string[];
};

export type ManualSubmissionReadModelRecord = {
  schemaVersion: typeof MANUAL_SUBMISSION_READ_MODEL_SCHEMA_VERSION;
  applicationId: string;
  jobOpportunityId: string;
  applicationIntelligencePacketId: string;
  artifactVersionId: string;
  company: string;
  role: string;
  submittedDate: string;
  currentStage: "SUBMITTED_MANUAL_EXTERNAL";
  resumeArtifactFilename: string;
  resumeArtifactVersion: number;
  exactResumeArtifactKnown: true;
  sourceUrlKnown: true;
  followUpState: string | null;
  followUpDueDateKnown: boolean;
  nextAction: "FOLLOW_UP" | "NO_ACTION" | "REVIEW_RESPONSE" | "PREPARE_FOR_INTERVIEW" | "CLOSE_OUT";
  submissionStatus: "SUBMITTED";
  privatePathVisible: false;
  rawResumeVisible: false;
  rawJobTextVisible: false;
  sourceUrlVisible: false;
  limitations: string[];
};

export type ManualSubmissionRecordAndArtifactLinkageResult = {
  schemaVersion: typeof MANUAL_SUBMISSION_RECORD_LINKAGE_RESULT_SCHEMA_VERSION;
  workflowVersion: typeof MANUAL_SUBMISSION_RECORD_LINKAGE_VERSION;
  generatedAt: string;
  workspaceId: "professional";
  capabilityFamily: "Career Operations";
  sourceAuthority: {
    applicationAuthorityReused: true;
    applicationEventAuthorityReused: true;
    applicationArtifactVersionReused: true;
    applicationIntelligencePacketReused: true;
    followUpAuthorityReused: true;
    newApplicationModelCreated: false;
    newResumeVersionCreated: false;
  };
  manualApplicationResult: ManualApplicationTrackingResult | null;
  createdApplications: PrivateApplicationRecord[];
  createdApplicationEvents: PrivateApplicationEventRecord[];
  createdFollowUpReviews: PrivateFollowUpReviewTask[];
  artifactSubmissionLinks: ApplicationArtifactSubmissionLink[];
  submittedArtifactStates: SubmittedApplicationArtifactState[];
  engagementResult: ApplicationEngagementQueueResult | null;
  readModel: ManualSubmissionReadModelRecord[];
  blockedSubmissions: Array<{
    artifactVersionId: string | null;
    validationIssues: ManualSubmissionValidationIssue[];
    duplicateApplicationIds: string[];
    applicationCreated: false;
    limitations: string[];
  }>;
  historicalUnknownResumeLinkages: Array<{
    applicationId: string;
    company: string;
    role: string;
    resumeReferenceStatus: string;
    remainsUnknown: true;
    limitations: string[];
  }>;
  summary: {
    submissionsRequested: number;
    applicationsCreated: number;
    applicationEventsCreated: number;
    artifactLinksCreated: number;
    artifactStatesSubmitted: number;
    followUpReviewsCreated: number;
    blockedSubmissions: number;
    historicalUnknownResumeLinkages: number;
    externalActions: 0;
  };
  auditSummary: {
    manualSubmissionRecordedOnly: true;
    noApplicationSubmittedByStaffordOS: true;
    noBrowserAutomation: true;
    noEmployerUpload: true;
    noExternalProviderCall: true;
    noResumeGenerated: true;
    noResumeMutated: true;
    noResumeVersionCreated: true;
    noMessageSent: true;
    noExternalAi: true;
    noOllama: true;
    applicationHistoryAppendOnly: true;
    exactArtifactLinkRequired: true;
    noFilenameGuessing: true;
    privatePathVisible: false;
  };
};

export type ManualSubmissionRecordAndArtifactLinkageWriteResult = {
  applicationRunDirectory: string | null;
  submissionRunDirectory: string;
  engagementRunDirectory: string | null;
  artifactNames: string[];
  writtenFiles: string[];
  privatePathVisible: false;
};

const DEFAULT_JOB_SEARCH_PRIVATE_ROOT = path.join(
  homedir(),
  ".staffordos/private/professional/job-search",
);

function sha256Text(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function opaqueId(prefix: string, parts: readonly unknown[]) {
  return `${prefix}_${sha256Text(parts.map((part) => String(part ?? "")).join("|")).slice(0, 18)}`;
}

function compactTimestamp(value: string) {
  return value.replace(/[^0-9]/g, "").slice(0, 14) || sha256Text(value).slice(0, 14);
}

function uniqueSorted(values: readonly (string | null | undefined)[]) {
  return [...new Set(values.map((value) => (typeof value === "string" ? value.trim() : "")).filter(Boolean))]
    .sort((left, right) => left.localeCompare(right));
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

function latestDirectory(root: string): string | null {
  if (!existsSync(root)) return null;
  const directories = readdirSync(root)
    .map((entry) => path.join(root, entry))
    .filter((entryPath) => {
      try {
        return statSync(entryPath).isDirectory();
      } catch {
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

function datePart(value: string | null | undefined) {
  if (!value) return null;
  const candidate = value.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(candidate) ? candidate : null;
}

function submittedPrecision(value: string | null, explicit?: SubmittedAtPrecision): SubmittedAtPrecision {
  if (explicit) return explicit;
  if (!value) return "UNKNOWN";
  return /t|\d{2}:\d{2}/i.test(value) ? "DATE_TIME" : "DATE";
}

function docxReference(artifact: ReviewedResumeExportArtifactVersion) {
  return artifact.fileReferences.find((file) => file.fileKind === "DOCX" && file.created) || null;
}

function blockingIssue(
  code: ManualSubmissionValidationIssue["code"],
  message: string,
  limitations: string[],
): ManualSubmissionValidationIssue {
  return {
    issueId: opaqueId("privmanualsubmitissue", [code, message, limitations.join("|")]),
    code,
    severity: "BLOCKING",
    message,
    limitations,
  };
}

function packetForArtifact(
  artifact: ReviewedResumeExportArtifactVersion,
  packets: readonly ApplicationIntelligencePacket[],
) {
  return packets.find((packet) => packet.packetId === artifact.applicationIntelligencePacketId) || null;
}

function validatePreconditions(input: {
  submission: ManualSubmissionInput;
  artifact: ReviewedResumeExportArtifactVersion | null;
  packet: ApplicationIntelligencePacket | null;
}) {
  const issues: ManualSubmissionValidationIssue[] = [];
  if (!input.submission.operatorConfirmed) {
    issues.push(blockingIssue(
      "OPERATOR_CONFIRMATION_REQUIRED",
      "Manual submission recording requires explicit operator confirmation.",
      ["CareerOS cannot infer that Ross submitted the application."],
    ));
  }
  if (!datePart(input.submission.submittedAt)) {
    issues.push(blockingIssue(
      "SUBMISSION_DATE_REQUIRED",
      "Submission date is required before creating an Application record.",
      ["Follow-up timing and application history require a dated manual submission fact."],
    ));
  }
  if (!input.artifact) {
    issues.push(blockingIssue(
      "APPROVED_RESUME_ARTIFACT_REQUIRED",
      "No matching reviewed resume export artifact was found.",
      ["Exact artifact linkage is required; filename guessing is prohibited."],
    ));
  } else {
    const docx = docxReference(input.artifact);
    if (
      input.artifact.artifactType !== "RESUME" ||
      input.artifact.operatorApprovalState !== "APPROVED" ||
      input.artifact.exportState !== "DOCX_READY" ||
      !docx
    ) {
      issues.push(blockingIssue(
        "APPROVED_RESUME_ARTIFACT_REQUIRED",
        "The resume artifact is not an approved DOCX export.",
        ["Only V1.03B DOCX_READY resume artifacts may be linked as submitted artifacts."],
      ));
    }
    if (input.artifact.submissionStatus !== "NOT_SUBMITTED") {
      issues.push(blockingIssue(
        "ARTIFACT_ALREADY_SUBMITTED",
        "The selected resume artifact is already marked submitted.",
        ["Create a new artifact version if Ross used a corrected resume."],
      ));
    }
  }
  if (!input.packet) {
    issues.push(blockingIssue(
      "APPLICATION_PACKET_REQUIRED",
      "No Application Intelligence Packet authority was found for the selected artifact.",
      ["The Application must link back to the JobOpportunity and packet that produced the artifact."],
    ));
  } else if (!input.packet.identity.canonicalSourceUrl) {
    issues.push(blockingIssue(
      "SOURCE_URL_REQUIRED",
      "The Application Intelligence Packet lacks an authoritative source URL.",
      ["Manual submission recording requires the job source used for the application."],
    ));
  }
  return issues;
}

function historicalUnknownLinkages(store: PrivateApplicationPipelineStore) {
  return store.applications
    .filter((application) => application.resumeReference.status === "UNKNOWN")
    .map((application) => ({
      applicationId: application.applicationId,
      company: application.companyReference.label,
      role: application.roleReference.title,
      resumeReferenceStatus: application.resumeReference.status,
      remainsUnknown: true as const,
      limitations: [
        "Historical Application resume linkage remains UNKNOWN until Ross explicitly confirms the exact artifact or resume used.",
        "V1.04 does not infer historical submitted resumes from filenames, recency, or recommendation state.",
      ],
    }));
}

function withExactResumeReference(input: {
  application: PrivateApplicationRecord;
  artifact: ReviewedResumeExportArtifactVersion;
  docxFilename: string;
}) {
  return {
    ...input.application,
    resumeReference: {
      resumeReferenceId: opaqueId("privresume", [
        input.application.applicationId,
        input.artifact.artifactVersionId,
      ]),
      applicationId: input.application.applicationId,
      status: "APPLICATION_ARTIFACT_VERSION" as const,
      filename: input.docxFilename,
      assetReferenceId: input.artifact.artifactVersionId,
      version: String(input.artifact.version),
      createdAt: input.artifact.createdAt,
      purpose: "Exact reviewed CareerOS resume ApplicationArtifactVersion submitted manually by Ross.",
      authority: "ROSS_CONFIRMED" as const,
      privacy: "Professional owner-private" as const,
      limitations: [
        "Exact job-specific ApplicationArtifactVersion linkage; not a canonical ResumeVersion.",
        "Resume content is not copied into this Application record.",
        "Resume wording remains downstream positioning and cannot verify canonical Career facts.",
      ],
      resumeIsCanonicalCareerTruth: false as const,
    },
    limitations: uniqueSorted([
      ...input.application.limitations,
      "Exact submitted resume artifact linkage is recorded in V1.04.",
    ]),
  };
}

function eventWithArtifactEvidence(input: {
  event: PrivateApplicationEventRecord;
  linkId: string;
  artifactVersionId: string;
}) {
  if (input.event.eventType !== "SUBMITTED_MANUAL_EXTERNAL") return input.event;
  return {
    ...input.event,
    evidenceReferences: uniqueSorted([
      ...input.event.evidenceReferences,
      input.linkId,
      input.artifactVersionId,
    ]),
    limitations: uniqueSorted([
      ...input.event.limitations,
      "Submission event references the exact reviewed resume artifact linkage.",
    ]),
  };
}

function artifactLinkFor(input: {
  application: PrivateApplicationRecord;
  event: PrivateApplicationEventRecord;
  artifact: ReviewedResumeExportArtifactVersion;
  packet: ApplicationIntelligencePacket;
  submittedAt: string;
  submittedAtPrecision: SubmittedAtPrecision;
}): ApplicationArtifactSubmissionLink {
  const docx = docxReference(input.artifact);
  if (!docx || !docx.contentDigest || !input.artifact.exportedContentDigest || !input.packet.identity.canonicalSourceUrl) {
    throw new Error("Cannot create artifact link without DOCX digest and packet source URL.");
  }
  const linkId = opaqueId("privappartifactlink", [
    input.application.applicationId,
    input.event.eventId,
    input.artifact.artifactVersionId,
  ]);
  return {
    schemaVersion: APPLICATION_ARTIFACT_SUBMISSION_LINK_SCHEMA_VERSION,
    workflowVersion: MANUAL_SUBMISSION_RECORD_LINKAGE_VERSION,
    linkId,
    applicationId: input.application.applicationId,
    applicationEventId: input.event.eventId,
    jobOpportunityId: input.packet.identity.jobOpportunityId,
    applicationIntelligencePacketId: input.packet.packetId,
    sourceRecordId: input.packet.identity.sourceRecordId,
    sourceUrl: input.packet.identity.canonicalSourceUrl,
    company: input.packet.identity.company,
    role: input.packet.identity.role,
    artifactVersionId: input.artifact.artifactVersionId,
    artifactType: "RESUME",
    artifactVersion: input.artifact.version,
    sourceDraftArtifactVersionId: input.artifact.sourceDraftArtifactVersionId,
    sourceDraftDigest: input.artifact.sourceDraftDigest,
    sourceCareerAuthorityDigest: input.artifact.sourceCareerAuthorityDigest,
    exportedContentDigest: input.artifact.exportedContentDigest,
    fileReference: {
      fileKind: "DOCX",
      filename: docx.filename,
      contentDigest: docx.contentDigest,
      privatePathVisible: false,
    },
    submissionMethod: "MANUAL",
    submittedAt: input.submittedAt,
    submittedAtPrecision: input.submittedAtPrecision,
    operatorConfirmed: true,
    exactArtifactLinked: true,
    noFilenameGuessing: true,
    privacy: "Professional owner-private",
    limitations: [
      "Ross confirmed he manually submitted this exact resume artifact outside CareerOS.",
      "CareerOS did not submit, upload, message, or contact an external system.",
    ],
  };
}

function submittedArtifactStateFor(input: {
  artifact: ReviewedResumeExportArtifactVersion;
  application: PrivateApplicationRecord;
  event: PrivateApplicationEventRecord;
  submittedAt: string;
  submittedAtPrecision: SubmittedAtPrecision;
}): SubmittedApplicationArtifactState {
  const docx = docxReference(input.artifact);
  if (!docx?.contentDigest || !input.artifact.exportedContentDigest) {
    throw new Error("Cannot record submitted artifact state without DOCX and exported content digests.");
  }
  return {
    schemaVersion: SUBMITTED_APPLICATION_ARTIFACT_STATE_SCHEMA_VERSION,
    workflowVersion: MANUAL_SUBMISSION_RECORD_LINKAGE_VERSION,
    artifactSchemaVersion: APPLICATION_ARTIFACT_VERSION_SCHEMA_VERSION,
    artifactVersionId: input.artifact.artifactVersionId,
    artifactType: "RESUME",
    sourceArtifactWorkflowVersion: input.artifact.workflowVersion,
    sourceArtifactSubmissionStatus: "NOT_SUBMITTED",
    submissionStatus: "SUBMITTED",
    applicationId: input.application.applicationId,
    applicationEventId: input.event.eventId,
    submittedAt: input.submittedAt,
    submittedAtPrecision: input.submittedAtPrecision,
    exportedContentDigest: input.artifact.exportedContentDigest,
    fileContentDigest: docx.contentDigest,
    artifactContentMutated: false,
    artifactVersionCreated: false,
    resumeVersionCreated: false,
    resumeVersionMutated: false,
    submissionPerformedByStaffordOS: false,
    privacy: "Professional owner-private",
    limitations: [
      "Append-only submission-state record for the exact ApplicationArtifactVersion.",
      "The source artifact content and DOCX file are not modified by this transition.",
    ],
  };
}

function buildReadModel(input: {
  links: readonly ApplicationArtifactSubmissionLink[];
  engagementResult: ApplicationEngagementQueueResult | null;
}): ManualSubmissionReadModelRecord[] {
  const engagementByApplication = new Map(
    (input.engagementResult?.engagementItems || []).map((item) => [item.applicationId, item]),
  );
  return input.links.map((link) => {
    const engagement = engagementByApplication.get(link.applicationId);
    return {
      schemaVersion: MANUAL_SUBMISSION_READ_MODEL_SCHEMA_VERSION,
      applicationId: link.applicationId,
      jobOpportunityId: link.jobOpportunityId,
      applicationIntelligencePacketId: link.applicationIntelligencePacketId,
      artifactVersionId: link.artifactVersionId,
      company: link.company,
      role: link.role,
      submittedDate: link.submittedAt.slice(0, 10),
      currentStage: "SUBMITTED_MANUAL_EXTERNAL",
      resumeArtifactFilename: link.fileReference.filename,
      resumeArtifactVersion: link.artifactVersion,
      exactResumeArtifactKnown: true,
      sourceUrlKnown: true,
      followUpState: engagement?.followUpState || null,
      followUpDueDateKnown: Boolean(engagement?.followUpDueDate),
      nextAction: engagement?.recommendedNextEngagementAction || "NO_ACTION",
      submissionStatus: "SUBMITTED",
      privatePathVisible: false,
      rawResumeVisible: false,
      rawJobTextVisible: false,
      sourceUrlVisible: false,
      limitations: [
        "Read model excludes private path, raw resume content, raw job description, and source URL.",
        "Application was recorded after Ross confirmed manual external submission.",
      ],
    };
  });
}

function augmentStore(input: {
  store: PrivateApplicationPipelineStore;
  applications: readonly PrivateApplicationRecord[];
  events: readonly PrivateApplicationEventRecord[];
  followUps: readonly PrivateFollowUpReviewTask[];
}): PrivateApplicationPipelineStore {
  return {
    applications: [...input.store.applications, ...input.applications],
    applicationEvents: [...input.store.applicationEvents, ...input.events],
    followUpReviews: [...input.store.followUpReviews, ...input.followUps],
    confirmationNeeded: [...input.store.confirmationNeeded],
  };
}

export function buildManualSubmissionRecordAndArtifactLinkage(input: {
  generatedAt: string;
  submissions: readonly ManualSubmissionInput[];
  exportArtifacts: readonly ReviewedResumeExportArtifactVersion[];
  packets: readonly ApplicationIntelligencePacket[];
  existingStore?: PrivateApplicationPipelineStore;
  existingLinks?: readonly ApplicationArtifactSubmissionLink[];
}): ManualSubmissionRecordAndArtifactLinkageResult {
  const store = input.existingStore || {
    applications: [],
    applicationEvents: [],
    followUpReviews: [],
    confirmationNeeded: [],
  };
  const existingLinks = [...(input.existingLinks || [])];
  const createdApplications: PrivateApplicationRecord[] = [];
  const createdApplicationEvents: PrivateApplicationEventRecord[] = [];
  const createdFollowUpReviews: PrivateFollowUpReviewTask[] = [];
  const artifactSubmissionLinks: ApplicationArtifactSubmissionLink[] = [];
  const submittedArtifactStates: SubmittedApplicationArtifactState[] = [];
  const blockedSubmissions: ManualSubmissionRecordAndArtifactLinkageResult["blockedSubmissions"] = [];
  let manualApplicationResult: ManualApplicationTrackingResult | null = null;

  for (const submission of input.submissions) {
    const artifact =
      input.exportArtifacts.find((candidate) => candidate.artifactVersionId === submission.artifactVersionId) || null;
    const packet = artifact ? packetForArtifact(artifact, input.packets) : null;
    const validationIssues = validatePreconditions({ submission, artifact, packet });
    const alreadyLinked = existingLinks
      .concat(artifactSubmissionLinks)
      .filter((link) => link.artifactVersionId === submission.artifactVersionId);
    if (alreadyLinked.length > 0) {
      validationIssues.push(blockingIssue(
        "ARTIFACT_ALREADY_SUBMITTED",
        "The selected artifact already has an explicit Application submission link.",
        ["One exported resume artifact cannot be silently reused for another submitted Application."],
      ));
    }
    if (validationIssues.length || !artifact || !packet) {
      blockedSubmissions.push({
        artifactVersionId: submission.artifactVersionId || null,
        validationIssues,
        duplicateApplicationIds: [],
        applicationCreated: false,
        limitations: ["Submission was not recorded because required authority is missing."],
      });
      continue;
    }

    const docx = docxReference(artifact);
    const submittedAt = datePart(submission.submittedAt);
    if (!docx?.filename || !submittedAt) {
      blockedSubmissions.push({
        artifactVersionId: submission.artifactVersionId,
        validationIssues: validatePreconditions({ submission, artifact, packet }),
        duplicateApplicationIds: [],
        applicationCreated: false,
        limitations: ["Submission was not recorded because DOCX or submission date authority is unavailable."],
      });
      continue;
    }

    const manualResult = buildManualApplicationTrackingResult({
      generatedAt: input.generatedAt,
      existingApplications: [...store.applications, ...createdApplications],
      applications: [
        {
          sourceRecordId: packet.identity.sourceRecordId,
          opportunityId: packet.identity.jobOpportunityId,
          analysisRunId: packet.packetId,
          companyName: packet.identity.company,
          roleTitle: packet.identity.role,
          requisitionAlias: packet.identity.sourceRecordId,
          submissionOccurred: true,
          submissionMethod: "MANUAL_EXTERNAL",
          submissionChannel: submission.submissionChannel || "Manual external application",
          submittedAt,
          submittedAtPrecision: submittedPrecision(submission.submittedAt, submission.submittedAtPrecision),
          resumeFilename: docx.filename,
          coverLetterStatus: "UNKNOWN",
          employerResponseStatus: "NONE_RECORDED",
          operatorConfirmed: true,
          limitations: [
            "Created by V1.04 after Ross confirmed manual external submission.",
            "Exact resume artifact linkage is recorded separately and by artifact ID.",
          ],
        },
      ],
    });
    manualApplicationResult = manualResult;
    if (!manualResult.applications.length) {
      const duplicateIds = manualResult.duplicateReview.flatMap((review) => review.matchingApplicationIds);
      blockedSubmissions.push({
        artifactVersionId: artifact.artifactVersionId,
        validationIssues: [
          blockingIssue(
            "APPLICATION_DUPLICATE_BLOCKED",
            "Existing Application authority blocked duplicate Application creation.",
            ["No new Application was created; operator review is required before changing historical records."],
          ),
        ],
        duplicateApplicationIds: duplicateIds,
        applicationCreated: false,
        limitations: manualResult.duplicateReview.map((review) => review.disposition),
      });
      continue;
    }

    const application = withExactResumeReference({
      application: manualResult.applications[0],
      artifact,
      docxFilename: docx.filename,
    });
    const submissionEvent =
      manualResult.applicationEvents.find((event) => event.eventType === "SUBMITTED_MANUAL_EXTERNAL") ||
      manualResult.applicationEvents[0];
    const link = artifactLinkFor({
      application,
      event: submissionEvent,
      artifact,
      packet,
      submittedAt,
      submittedAtPrecision: submittedPrecision(submission.submittedAt, submission.submittedAtPrecision),
    });
    const events = manualResult.applicationEvents.map((event) =>
      eventWithArtifactEvidence({
        event,
        linkId: link.linkId,
        artifactVersionId: artifact.artifactVersionId,
      }),
    );
    const submittedState = submittedArtifactStateFor({
      artifact,
      application,
      event: submissionEvent,
      submittedAt,
      submittedAtPrecision: submittedPrecision(submission.submittedAt, submission.submittedAtPrecision),
    });

    createdApplications.push(application);
    createdApplicationEvents.push(...events);
    createdFollowUpReviews.push(...manualResult.followUpReviews);
    artifactSubmissionLinks.push(link);
    submittedArtifactStates.push(submittedState);
  }

  const augmented = augmentStore({
    store,
    applications: createdApplications,
    events: createdApplicationEvents,
    followUps: createdFollowUpReviews,
  });
  const engagementResult = augmented.applications.length
    ? buildApplicationEngagementQueue({ store: augmented, generatedAt: input.generatedAt })
    : null;
  const readModel = buildReadModel({ links: artifactSubmissionLinks, engagementResult });

  return {
    schemaVersion: MANUAL_SUBMISSION_RECORD_LINKAGE_RESULT_SCHEMA_VERSION,
    workflowVersion: MANUAL_SUBMISSION_RECORD_LINKAGE_VERSION,
    generatedAt: input.generatedAt,
    workspaceId: "professional",
    capabilityFamily: "Career Operations",
    sourceAuthority: {
      applicationAuthorityReused: true,
      applicationEventAuthorityReused: true,
      applicationArtifactVersionReused: true,
      applicationIntelligencePacketReused: true,
      followUpAuthorityReused: true,
      newApplicationModelCreated: false,
      newResumeVersionCreated: false,
    },
    manualApplicationResult,
    createdApplications,
    createdApplicationEvents,
    createdFollowUpReviews,
    artifactSubmissionLinks,
    submittedArtifactStates,
    engagementResult,
    readModel,
    blockedSubmissions,
    historicalUnknownResumeLinkages: historicalUnknownLinkages(store),
    summary: {
      submissionsRequested: input.submissions.length,
      applicationsCreated: createdApplications.length,
      applicationEventsCreated: createdApplicationEvents.length,
      artifactLinksCreated: artifactSubmissionLinks.length,
      artifactStatesSubmitted: submittedArtifactStates.length,
      followUpReviewsCreated: createdFollowUpReviews.length,
      blockedSubmissions: blockedSubmissions.length,
      historicalUnknownResumeLinkages: historicalUnknownLinkages(store).length,
      externalActions: 0,
    },
    auditSummary: {
      manualSubmissionRecordedOnly: true,
      noApplicationSubmittedByStaffordOS: true,
      noBrowserAutomation: true,
      noEmployerUpload: true,
      noExternalProviderCall: true,
      noResumeGenerated: true,
      noResumeMutated: true,
      noResumeVersionCreated: true,
      noMessageSent: true,
      noExternalAi: true,
      noOllama: true,
      applicationHistoryAppendOnly: true,
      exactArtifactLinkRequired: true,
      noFilenameGuessing: true,
      privatePathVisible: false,
    },
  };
}

export function writeManualSubmissionRecordAndArtifactLinkageOutputs(input: {
  jobSearchRoot?: string;
  outputRoot?: string;
  repositoryRoot: string;
  result: ManualSubmissionRecordAndArtifactLinkageResult;
}): ManualSubmissionRecordAndArtifactLinkageWriteResult {
  const jobSearchRoot = input.jobSearchRoot || DEFAULT_JOB_SEARCH_PRIVATE_ROOT;
  const applicationRoot = path.join(jobSearchRoot, "applications");
  const outputRoot = input.outputRoot || path.join(applicationRoot, "careeros-v1-04-submissions");
  assertOutsideRepository(applicationRoot, input.repositoryRoot, "Private application root");
  assertOutsideRepository(outputRoot, input.repositoryRoot, "Private manual submission output root");
  const runDirectory = path.join(outputRoot, `${MANUAL_SUBMISSION_RECORD_LINKAGE_VERSION}_${compactTimestamp(input.result.generatedAt)}`);
  ensurePrivateDirectory(applicationRoot);
  ensurePrivateDirectory(outputRoot);
  ensurePrivateDirectory(runDirectory);

  const artifacts = {
    "manual_submission_record_and_artifact_linkage_result.json": input.result,
    "applications.json": input.result.createdApplications,
    "application_events.json": input.result.createdApplicationEvents,
    "follow_up_reviews.json": input.result.createdFollowUpReviews,
    "application_artifact_submission_links.json": input.result.artifactSubmissionLinks,
    "submitted_application_artifact_states.json": input.result.submittedArtifactStates,
    "manual_submission_read_model.json": input.result.readModel,
    "manual_submission_validation.private.json": input.result.blockedSubmissions,
    "historical_unknown_resume_linkages.private.json": input.result.historicalUnknownResumeLinkages,
    "manual_submission_audit.json": input.result.auditSummary,
  };
  const writtenFiles: string[] = [];
  for (const [name, value] of Object.entries(artifacts)) {
    const filePath = path.join(runDirectory, name);
    writeJson(filePath, value);
    writtenFiles.push(filePath);
  }
  let engagementRunDirectory: string | null = null;
  if (input.result.engagementResult) {
    const written = writeApplicationEngagementQueueOutputs({
      outputRoot: path.join(jobSearchRoot, "career-engagement"),
      repositoryRoot: input.repositoryRoot,
      result: input.result.engagementResult,
    });
    engagementRunDirectory = written.runDirectory;
    writtenFiles.push(...written.writtenFiles);
  }
  return {
    applicationRunDirectory: runDirectory,
    submissionRunDirectory: runDirectory,
    engagementRunDirectory,
    artifactNames: Object.keys(artifacts),
    writtenFiles,
    privatePathVisible: false,
  };
}

export function loadLatestManualSubmissionReadModel(jobSearchRoot = DEFAULT_JOB_SEARCH_PRIVATE_ROOT) {
  return latestJson<ManualSubmissionReadModelRecord[]>(
    path.join(jobSearchRoot, "applications", "careeros-v1-04-submissions"),
    "manual_submission_read_model.json",
  ) || [];
}

export function loadLatestManualSubmissionResult(jobSearchRoot = DEFAULT_JOB_SEARCH_PRIVATE_ROOT) {
  return latestJson<ManualSubmissionRecordAndArtifactLinkageResult>(
    path.join(jobSearchRoot, "applications", "careeros-v1-04-submissions"),
    "manual_submission_record_and_artifact_linkage_result.json",
  );
}

export function loadExistingApplicationArtifactSubmissionLinks(options: {
  applicationRoot: string;
  repositoryRoot: string;
}) {
  if (!existsSync(options.applicationRoot)) return [] as ApplicationArtifactSubmissionLink[];
  assertOutsideRepository(options.applicationRoot, options.repositoryRoot, "Private application root");
  const links = new Map<string, ApplicationArtifactSubmissionLink>();
  for (const filePath of walkJsonFiles(options.applicationRoot)) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(readFileSync(filePath, "utf8"));
    } catch {
      continue;
    }
    const candidates = Array.isArray(parsed)
      ? parsed
      : parsed && typeof parsed === "object" && Array.isArray((parsed as Record<string, unknown>).artifactSubmissionLinks)
        ? (parsed as Record<string, unknown>).artifactSubmissionLinks as unknown[]
        : [parsed];
    for (const candidate of candidates) {
      if (
        candidate &&
        typeof candidate === "object" &&
        (candidate as Record<string, unknown>).schemaVersion === APPLICATION_ARTIFACT_SUBMISSION_LINK_SCHEMA_VERSION &&
        typeof (candidate as Record<string, unknown>).linkId === "string"
      ) {
        const link = candidate as ApplicationArtifactSubmissionLink;
        links.set(link.linkId, link);
      }
    }
  }
  return [...links.values()];
}

export function runManualSubmissionRecordAndArtifactLinkageFromPrivateArtifacts(input: {
  generatedAt?: string;
  jobSearchRoot?: string;
  repositoryRoot?: string;
  artifactVersionId: string;
  submittedAt: string | null;
  submittedAtPrecision?: SubmittedAtPrecision;
  submissionChannel?: string | null;
  operatorConfirmed?: boolean;
  writeOutputs?: boolean;
}) {
  const generatedAt = input.generatedAt || new Date().toISOString();
  const jobSearchRoot = input.jobSearchRoot || DEFAULT_JOB_SEARCH_PRIVATE_ROOT;
  const repositoryRoot = input.repositoryRoot || process.cwd();
  const applicationRoot = path.join(jobSearchRoot, "applications");
  const packetResult = loadLatestApplicationIntelligencePacketResult(jobSearchRoot);
  const existingStore = loadPrivateApplicationPipelineStore({ applicationRoot, repositoryRoot });
  const result = buildManualSubmissionRecordAndArtifactLinkage({
    generatedAt,
    submissions: [
      {
        artifactVersionId: input.artifactVersionId,
        submittedAt: input.submittedAt,
        submittedAtPrecision: input.submittedAtPrecision,
        submissionChannel: input.submissionChannel || null,
        operatorConfirmed: input.operatorConfirmed === true,
      },
    ],
    exportArtifacts: loadLatestReviewedResumeDraftExportVersions(jobSearchRoot),
    packets: packetResult?.packets || [],
    existingStore,
    existingLinks: loadExistingApplicationArtifactSubmissionLinks({ applicationRoot, repositoryRoot }),
  });
  const writeResult = input.writeOutputs
    ? writeManualSubmissionRecordAndArtifactLinkageOutputs({
        jobSearchRoot,
        repositoryRoot,
        result,
      })
    : null;
  return { result, writeResult };
}

export function buildManualSubmissionRecordAndArtifactLinkageCliSummary(
  result: ManualSubmissionRecordAndArtifactLinkageResult,
  writtenCount = 0,
) {
  return {
    workflowVersion: result.workflowVersion,
    generatedAt: result.generatedAt,
    submissionsRequested: result.summary.submissionsRequested,
    applicationsCreated: result.summary.applicationsCreated,
    applicationEventsCreated: result.summary.applicationEventsCreated,
    artifactLinksCreated: result.summary.artifactLinksCreated,
    artifactStatesSubmitted: result.summary.artifactStatesSubmitted,
    followUpReviewsCreated: result.summary.followUpReviewsCreated,
    blockedSubmissions: result.summary.blockedSubmissions,
    historicalUnknownResumeLinkages: result.summary.historicalUnknownResumeLinkages,
    privateArtifactsWritten: writtenCount,
    noApplicationSubmittedByStaffordOS: result.auditSummary.noApplicationSubmittedByStaffordOS,
    noResumeGenerated: result.auditSummary.noResumeGenerated,
    noResumeMutated: result.auditSummary.noResumeMutated,
    noMessageSent: result.auditSummary.noMessageSent,
    noBrowserAutomation: result.auditSummary.noBrowserAutomation,
    noExternalProviderCall: result.auditSummary.noExternalProviderCall,
    noExternalAi: result.auditSummary.noExternalAi,
    noOllama: result.auditSummary.noOllama,
    exactArtifactLinkRequired: result.auditSummary.exactArtifactLinkRequired,
    noFilenameGuessing: result.auditSummary.noFilenameGuessing,
    privatePathVisible: false,
  };
}
