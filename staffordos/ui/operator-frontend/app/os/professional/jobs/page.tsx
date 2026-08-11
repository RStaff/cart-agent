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

export default function ProfessionalJobCommandPage() {
  const { experience } = loadCareerOsDailyJobSearchExperienceFromPrivateArtifacts();
  return <JobCommandSurface experience={experience} jobIntakeAction={analyzeJobAction} />;
}
