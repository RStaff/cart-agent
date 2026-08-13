import { redirect } from "next/navigation";
import { JobCommandSurface } from "../../../../components/staffordos/JobCommandSurface";
import {
  buildApplicationIntelligencePackets,
  writeApplicationIntelligencePacketOutputs,
} from "../../../../lib/staffordos/applicationIntelligencePacket";
import { loadCareerOsDailyJobSearchExperienceFromPrivateArtifacts } from "../../../../lib/staffordos/careerOsDailyJobSearchExperiencePrivateLoader";
import {
  loadLatestResumeVersionsFromPrivateArtifacts,
  runJobDescriptionIntakeBridgeFromPrivateArtifacts,
} from "../../../../lib/staffordos/jobDescriptionIntakeBridge";
import {
  runTruthBoundResumeDraftsFromPrivateArtifacts,
} from "../../../../lib/staffordos/truthBoundResumeDraft";
import {
  RESUME_DRAFT_EXPORT_REVIEW_DECISIONS,
  runReviewedResumeDraftExportFromPrivateArtifacts,
  type ResumeDraftExportReviewDecision,
} from "../../../../lib/staffordos/reviewedResumeDraftExport";
import {
  runManualSubmissionRecordAndArtifactLinkageFromPrivateArtifacts,
} from "../../../../lib/staffordos/manualSubmissionRecordAndArtifactLinkage";
import {
  CAREER_WORKFLOW_ACTION_TYPES,
  runCareerWorkflowActionFromPrivateArtifacts,
  type CareerWorkflowActionType,
} from "../../../../lib/staffordos/careerWorkflowActions";
import {
  PIPELINE_REVIEW_DECISION_TYPES,
  runApplicationOutcomeDecisionFromPrivateArtifacts,
  type PipelineReviewDecisionType,
} from "../../../../lib/staffordos/privateApplicationPipelineReview";
import { saveJobSearchPreferences } from "../../../../lib/staffordos/jobSearchPreferencesAuthority";

export const dynamic = "force-dynamic";

async function analyzeJobAction(formData: FormData) {
  "use server";
  const jobUrl = String(formData.get("jobUrl") || "").trim();
  const jobDescription = String(formData.get("jobDescription") || "").trim();
  const { result } = runJobDescriptionIntakeBridgeFromPrivateArtifacts({
    sourceUrl: jobUrl || null,
    jobDescriptionText: jobDescription || null,
    operatorApprovedForOpportunityImport: true,
    writeOutputs: true,
  });
  if (result.queueResult && result.recommendationResult) {
    const packetResult = buildApplicationIntelligencePackets({
      generatedAt: result.generatedAt,
      queueResult: result.queueResult,
      recommendationResult: result.recommendationResult,
      analysisBundles: result.analysisBundle ? [result.analysisBundle] : [],
      normalizedOpportunities: result.normalizedOpportunity ? [result.normalizedOpportunity] : [],
      resumeVersions: loadLatestResumeVersionsFromPrivateArtifacts(),
    });
    writeApplicationIntelligencePacketOutputs({
      repositoryRoot: process.cwd(),
      result: packetResult,
    });
  }
  redirect("/os/professional/jobs");
}

async function prepareResumeDraftAction(formData: FormData) {
  "use server";
  const packetId = String(formData.get("packetId") || "").trim();
  const { result } = runTruthBoundResumeDraftsFromPrivateArtifacts({
    packetIds: packetId ? [packetId] : [],
    limit: 1,
    repositoryRoot: process.cwd(),
    writeOutputs: true,
  });
  const artifact = result.artifactVersions.find((item) =>
    item.applicationIntelligencePacketId === packetId,
  );
  if (!artifact) {
    redirect("/os/professional/jobs?resumeDraftError=1");
  }
  redirect(`/os/professional/jobs?resumeDraft=${encodeURIComponent(artifact.artifactVersionId)}#resume-draft-${encodeURIComponent(artifact.artifactVersionId)}`);
}

function reviewDecisionFromForm(value: FormDataEntryValue | null): ResumeDraftExportReviewDecision | null {
  const decision = String(value || "").trim();
  return RESUME_DRAFT_EXPORT_REVIEW_DECISIONS.includes(decision as ResumeDraftExportReviewDecision)
    ? decision as ResumeDraftExportReviewDecision
    : null;
}

async function reviewResumeDraftAction(formData: FormData) {
  "use server";
  const artifactVersionId = String(formData.get("artifactVersionId") || "").trim();
  const reviewDecision = reviewDecisionFromForm(formData.get("reviewDecision"));
  if (!reviewDecision) redirect("/os/professional/jobs");
  runReviewedResumeDraftExportFromPrivateArtifacts({
    artifactIds: artifactVersionId ? [artifactVersionId] : [],
    reviewDecision,
    limit: 1,
    repositoryRoot: process.cwd(),
    writeOutputs: true,
  });
  redirect("/os/professional/jobs");
}

async function markSubmittedAction(formData: FormData) {
  "use server";
  const artifactVersionId = String(formData.get("artifactVersionId") || "").trim();
  const submittedAt = String(formData.get("submittedAt") || "").trim();
  const submissionChannel = String(formData.get("submissionChannel") || "").trim();
  runManualSubmissionRecordAndArtifactLinkageFromPrivateArtifacts({
    artifactVersionId,
    submittedAt: submittedAt || null,
    submissionChannel: submissionChannel || null,
    submittedAtPrecision: "DATE",
    operatorConfirmed: true,
    repositoryRoot: process.cwd(),
    writeOutputs: true,
  });
  redirect("/os/professional/jobs");
}

function workflowActionFromForm(value: FormDataEntryValue | null): CareerWorkflowActionType | null {
  const action = String(value || "").trim();
  return CAREER_WORKFLOW_ACTION_TYPES.includes(action as CareerWorkflowActionType)
    ? action as CareerWorkflowActionType
    : null;
}

async function decideOpportunityAction(formData: FormData) {
  "use server";
  const recommendationId = String(formData.get("recommendationId") || "").trim();
  const workflowAction = workflowActionFromForm(formData.get("workflowAction"));
  if (!recommendationId || !workflowAction) redirect("/os/professional/jobs");
  runCareerWorkflowActionFromPrivateArtifacts({
    recommendationId,
    actionType: workflowAction,
    operatorConfirmed: true,
    repositoryRoot: process.cwd(),
    writeOutputs: true,
  });
  redirect("/os/professional/jobs");
}

function pipelineDecisionFromForm(value: FormDataEntryValue | null): PipelineReviewDecisionType | null {
  const decision = String(value || "").trim();
  return PIPELINE_REVIEW_DECISION_TYPES.includes(decision as PipelineReviewDecisionType)
    ? decision as PipelineReviewDecisionType
    : null;
}

async function recordApplicationOutcomeAction(formData: FormData) {
  "use server";
  const applicationId = String(formData.get("applicationId") || "").trim();
  const actionId = String(formData.get("actionId") || "").trim();
  const decisionType = pipelineDecisionFromForm(formData.get("decisionType"));
  const occurredAt = String(formData.get("occurredAt") || "").trim();
  const operatorContext = String(formData.get("operatorContext") || "").trim();
  const employerProvidedReason = String(formData.get("employerProvidedReason") || "").trim();
  const operatorConfirmed = String(formData.get("operatorConfirmed") || "").trim() === "true";
  if (!applicationId || !decisionType) redirect("/os/professional/jobs");
  runApplicationOutcomeDecisionFromPrivateArtifacts({
    applicationId,
    actionId: actionId || null,
    decisionType,
    generatedAt: occurredAt ? `${occurredAt.slice(0, 10)}T12:00:00Z` : undefined,
    operatorContext: operatorContext || null,
    employerProvidedReason: employerProvidedReason || null,
    operatorConfirmed,
    repositoryRoot: process.cwd(),
    writeOutputs: true,
  });
  redirect("/os/professional/jobs");
}

function formValues(formData: FormData, name: string) {
  return formData.getAll(name).map((value) => String(value || "").trim()).filter(Boolean);
}

async function saveJobSearchPreferencesAction(formData: FormData) {
  "use server";
  const result = saveJobSearchPreferences({
    preferredRegionIds: formValues(formData, "preferredRegionIds"),
    acceptableRegionIds: formValues(formData, "acceptableRegionIds"),
    remote: String(formData.get("remote") || "UNKNOWN"),
    hybrid: String(formData.get("hybrid") || "UNKNOWN"),
    onsite: String(formData.get("onsite") || "UNKNOWN"),
    relocation: String(formData.get("relocation") || "UNKNOWN"),
    operatorId: "ROSS",
  });
  redirect(result.ok
    ? "/os/professional/jobs?preferencesSaved=1#job-search-preferences"
    : "/os/professional/jobs?preferencesError=1#job-search-preferences");
}

export default async function ProfessionalJobCommandPage({
  searchParams,
}: {
  searchParams?: Promise<{
    resumeDraft?: string;
    resumeDraftError?: string;
    preferencesSaved?: string;
    preferencesError?: string;
  }>;
}) {
  const params = (await searchParams) || {};
  const { experience } = loadCareerOsDailyJobSearchExperienceFromPrivateArtifacts();
  return (
    <JobCommandSurface
      experience={experience}
      resumeDraftFocusId={params.resumeDraft || null}
      resumeDraftError={params.resumeDraftError === "1"}
      jobIntakeAction={analyzeJobAction}
      resumeDraftAction={prepareResumeDraftAction}
      resumeReviewAction={reviewResumeDraftAction}
      manualSubmissionAction={markSubmittedAction}
      opportunityDecisionAction={decideOpportunityAction}
      applicationOutcomeAction={recordApplicationOutcomeAction}
      preferenceSaveAction={saveJobSearchPreferencesAction}
      preferenceSaveState={params.preferencesSaved === "1" ? "saved" : params.preferencesError === "1" ? "error" : null}
    />
  );
}
