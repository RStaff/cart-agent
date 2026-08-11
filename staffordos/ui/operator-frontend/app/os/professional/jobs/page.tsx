import { redirect } from "next/navigation";
import { JobCommandSurface } from "../../../../components/staffordos/JobCommandSurface";
import { loadCareerOsDailyJobSearchExperienceFromPrivateArtifacts } from "../../../../lib/staffordos/careerOsDailyJobSearchExperiencePrivateLoader";
import { runJobDescriptionIntakeBridgeFromPrivateArtifacts } from "../../../../lib/staffordos/jobDescriptionIntakeBridge";

export const dynamic = "force-dynamic";

async function analyzeJobAction(formData: FormData) {
  "use server";
  const jobUrl = String(formData.get("jobUrl") || "").trim();
  const jobDescription = String(formData.get("jobDescription") || "").trim();
  runJobDescriptionIntakeBridgeFromPrivateArtifacts({
    sourceUrl: jobUrl || null,
    jobDescriptionText: jobDescription || null,
    operatorApprovedForOpportunityImport: true,
    writeOutputs: true,
  });
  redirect("/os/professional/jobs");
}

export default function ProfessionalJobCommandPage() {
  const { experience } = loadCareerOsDailyJobSearchExperienceFromPrivateArtifacts();
  return <JobCommandSurface experience={experience} jobIntakeAction={analyzeJobAction} />;
}
