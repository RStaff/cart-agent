import { redirect } from "next/navigation";
import { currentCareerContext, careerP0Store } from "../../../lib/career/careerP0Auth";
import { ProfileForm } from "../components/ProfileForm";
import { IntakeReview } from "../components/IntakeReview";
import { PrivacyDisclosure } from "../components/PrivacyDisclosure";

export const runtime = "nodejs";

export default async function CareerOnboardingPage() {
  const context = await currentCareerContext();
  if (!context) redirect("/career/login");
  const profile = await careerP0Store.getProfile(context.session.id);
  return profile ? <main className="careerShell"><header className="careerHeader"><div><p className="careerEyebrow">CareerOS</p><h1>Build your career foundation</h1><p className="careerMuted">Signed in as {context.user.email}. Add source text when you are ready.</p></div></header><PrivacyDisclosure /><IntakeReview /></main> : <ProfileForm initialProfile={null} email={context.user.email} mode="onboarding" />;
}
