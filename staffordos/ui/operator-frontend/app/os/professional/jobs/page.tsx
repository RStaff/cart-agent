import { JobCommandSurface } from "../../../../components/staffordos/JobCommandSurface";
import { loadCareerOsDailyJobSearchExperienceFromPrivateArtifacts } from "../../../../lib/staffordos/careerOsDailyJobSearchExperiencePrivateLoader";

export const dynamic = "force-dynamic";

export default function ProfessionalJobCommandPage() {
  const { experience } = loadCareerOsDailyJobSearchExperienceFromPrivateArtifacts();
  return <JobCommandSurface experience={experience} />;
}
