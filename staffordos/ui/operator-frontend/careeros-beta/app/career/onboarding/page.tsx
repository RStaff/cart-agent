import { redirect } from "next/navigation";
import Link from "next/link";
import { currentCareerContext, careerP0Store } from "../../../lib/career/careerP0Auth";
import { ProfileForm } from "../components/ProfileForm";
import { CareerStoryBuilder } from "../components/CareerStoryBuilder";
import { PrivacyDisclosure } from "../components/PrivacyDisclosure";

export const runtime = "nodejs";

export default async function CareerOnboardingPage() {
  const context = await currentCareerContext();
  if (!context) redirect("/career/login");
  const profile = await careerP0Store.getProfile(context.session.id);
  return profile ? <main className="careerShell"><header className="careerHeader"><div><p className="careerEyebrow">CareerOS</p><h1>Career Story</h1><p className="careerMuted">What you have done, organized for your review. Your professional story can grow over time.</p></div><nav aria-label="Career Story navigation"><Link href="/career">CareerOS Home</Link> · <Link href="/career/profile">Career Profile</Link></nav></header><PrivacyDisclosure /><CareerStoryBuilder /></main> : <ProfileForm initialProfile={null} email={context.user.email} mode="onboarding" />;
}
