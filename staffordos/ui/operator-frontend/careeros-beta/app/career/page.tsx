import Link from "next/link";
import { currentCareerContext, careerP0Store } from "../../lib/career/careerP0Auth";

export const runtime = "nodejs";

export default async function CareerHomePage() {
  const context = await currentCareerContext();
  if (!context) {
    const { redirect } = await import("next/navigation");
    redirect("/career/login");
  }
  const profile = await careerP0Store.getProfile(context.session.id);
  const story = await careerP0Store.getOnboardingState(context.session.id);
  const storyHref = profile ? "/career/profile" : "/career/onboarding";
  return <main className="careerShell"><header className="careerHeader"><div><p className="careerEyebrow">CareerOS</p><h1>Your career home</h1><p className="careerMuted">A private place to build your professional story and understand how your experience applies across opportunities.</p></div><Link className="careerLinkButton" href="/career/privacy">Data notice</Link></header><section className="careerProfilePanel"><p className="careerEyebrow">Next step</p><h2>{profile ? "Keep building your career story" : "Start your career profile"}</h2><p className="careerMuted">{profile ? "Your reviewed experience is a starting point, not a finished career. Add another role, project, accomplishment, or experience whenever you remember one." : "Create your private profile, then add the experience you want CareerOS to organize."}</p><Link className="careerPrimaryButton careerHomePrimary" href={storyHref}>Continue building your career story</Link><p className="careerMuted careerHomeStatus">{story.storyStatus === "CAREER_STORY_COMPLETE_FOR_NOW" ? "Your story is complete for now, and you can reopen it at any time." : "Your story is open for more experience."}</p></section><nav className="careerProfilePanel careerHomeNav" aria-label="CareerOS customer navigation"><p className="careerEyebrow">Your CareerOS</p><div className="careerHomeLinks"><Link href={storyHref}>Career story and profile</Link><Link href="/career/capabilities">Review capabilities</Link><Link href="/career/jobs">Analyze a job</Link><Link href="/career/privacy">Privacy and data notice</Link></div></nav></main>;
}
