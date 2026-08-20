import { redirect } from "next/navigation";
import Link from "next/link";
import { careerP0Store, currentCareerContext } from "../../../lib/career/careerP0Auth";
import { ProfileForm } from "../components/ProfileForm";
import { PrivacyDisclosure } from "../components/PrivacyDisclosure";

export const runtime = "nodejs";

export default async function CareerProfilePage() {
  const context = await currentCareerContext();
  if (!context) redirect("/career/login");
  const profile = await careerP0Store.getProfile(context.session.id);
  if (!profile) redirect("/career/onboarding");
  return <><PrivacyDisclosure compact /><ProfileForm initialProfile={profile} email={context.user.email} mode="profile" /><main className="careerShell"><section className="careerProfilePanel" aria-labelledby="career-profile-next-heading"><p className="careerEyebrow">Career Profile</p><h2 id="career-profile-next-heading">Who you are professionally</h2><p className="careerMuted">Your profile holds your professional identity and positioning. Your experience, confirmed evidence, and capabilities live in their own review surfaces.</p><nav className="careerNav" aria-label="Profile navigation"><Link className="careerPrimaryButton" href="/career/onboarding">Continue to Career Story</Link><Link className="careerLinkButton" href="/career/capabilities">Review Capabilities</Link><Link className="careerLinkButton" href="/career">CareerOS Home</Link></nav></section></main></>;
}
