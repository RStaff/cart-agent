import { redirect } from "next/navigation";
import { careerP0Store, currentCareerContext } from "../../../lib/career/careerP0Auth";
import { ProfileForm } from "../components/ProfileForm";
import { PrivacyDisclosure } from "../components/PrivacyDisclosure";

export const runtime = "nodejs";

export default async function CareerProfilePage() {
  const context = await currentCareerContext();
  if (!context) redirect("/career/login");
  const profile = await careerP0Store.getProfile(context.session.id);
  if (!profile) redirect("/career/onboarding");
  return <><PrivacyDisclosure compact /><ProfileForm initialProfile={profile} email={context.user.email} mode="profile" /></>;
}
