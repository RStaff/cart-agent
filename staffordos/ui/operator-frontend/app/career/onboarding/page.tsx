import { redirect } from "next/navigation";
import { currentCareerContext } from "../../../lib/career/careerP0Auth";
import { ProfileForm } from "../components/ProfileForm";

export const runtime = "nodejs";

export default async function CareerOnboardingPage() {
  const context = await currentCareerContext();
  if (!context) redirect("/career/login");
  return <ProfileForm initialProfile={null} email={context.user.email} mode="onboarding" />;
}
