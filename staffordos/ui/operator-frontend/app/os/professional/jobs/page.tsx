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
  runReviewedResumeDraftExportFromPrivateArtifacts,
} from "../../../../lib/staffordos/reviewedResumeDraftExport";

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

async function exportResumeDraftAction(formData: FormData) {
  "use server";
  const artifactVersionId = String(formData.get("artifactVersionId") || "").trim();
  runReviewedResumeDraftExportFromPrivateArtifacts({
    artifactIds: artifactVersionId ? [artifactVersionId] : [],
    approveForExport: true,
    limit: 1,
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
      resumeExportAction={exportResumeDraftAction}
    />
  );
}
