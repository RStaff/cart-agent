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
  runTruthBoundResumeDraftsFromPrivateArtifacts({
    packetIds: packetId ? [packetId] : [],
    limit: 1,
    repositoryRoot: process.cwd(),
    writeOutputs: true,
  });
  redirect("/os/professional/jobs");
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

export default function ProfessionalJobCommandPage() {
  const { experience } = loadCareerOsDailyJobSearchExperienceFromPrivateArtifacts();
  return (
    <JobCommandSurface
      experience={experience}
      jobIntakeAction={analyzeJobAction}
      resumeDraftAction={prepareResumeDraftAction}
      resumeReviewAction={reviewResumeDraftAction}
      manualSubmissionAction={markSubmittedAction}
      opportunityDecisionAction={decideOpportunityAction}
    />
  );
}
