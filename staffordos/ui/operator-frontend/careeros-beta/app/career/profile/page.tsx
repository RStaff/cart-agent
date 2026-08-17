import { redirect } from "next/navigation";
import { careerP0Store, currentCareerContext } from "../../../lib/career/careerP0Auth";
import { ProfileForm } from "../components/ProfileForm";
import { PrivacyDisclosure } from "../components/PrivacyDisclosure";
import { CareerStoryBuilder } from "../components/CareerStoryBuilder";
import { HumanCareerProfile } from "../components/HumanCareerProfile";
import { buildCareerProfileView } from "../../../lib/career/careerProfileView.mjs";

export const runtime = "nodejs";

export default async function CareerProfilePage() {
  const context = await currentCareerContext();
  if (!context) redirect("/career/login");
  const profile = await careerP0Store.getProfile(context.session.id);
  if (!profile) redirect("/career/onboarding");
  const [facts, candidates] = await Promise.all([careerP0Store.listCareerFacts(context.session.id), careerP0Store.listCandidateFacts(context.session.id)]);
  const view = buildCareerProfileView({ profile, facts, candidates });
  return <><PrivacyDisclosure compact /><ProfileForm initialProfile={profile} email={context.user.email} mode="profile" /><main className="careerShell"><HumanCareerProfile view={view} /><CareerStoryBuilder /></main></>;
}
