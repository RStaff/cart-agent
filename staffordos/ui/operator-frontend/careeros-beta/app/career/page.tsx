import Link from "next/link";
import { currentCareerContext, careerP0Store } from "../../lib/career/careerP0Auth";

export const runtime = "nodejs";

const betaFeedbackHref = "https://www.staffordmedia.ai/contact";

export default async function CareerHomePage() {
  const context = await currentCareerContext();
  if (!context) {
    const { redirect } = await import("next/navigation");
    redirect("/career/login");
  }
  const profile = await careerP0Store.getProfile(context.session.id);
  const story = await careerP0Store.getOnboardingState(context.session.id);
  const storyHref = "/career/onboarding";
  const hasProfile = Boolean(profile);
  const hasExperience = story.sourceCount > 0;
  const hasConfirmedExperience = story.confirmedFactCount > 0;
  const hasReviewWaiting = story.stage === "FACT_REVIEW";

  const journey = [
    {
      label: "Build my career profile",
      body: hasProfile
        ? "Add roles, projects, and accomplishments when you want CareerOS to learn more about you."
        : "Create a private profile, then add the experience you want CareerOS to organize.",
      href: hasProfile ? storyHref : "/career/profile",
      action: hasProfile ? "Continue Career Story" : "Create Career Profile",
      status: hasExperience ? "Started" : "Start here",
    },
    {
      label: "Review what CareerOS learned",
      body: "Confirm or fix the experience CareerOS identified before it shapes the rest of your journey.",
      href: hasReviewWaiting ? `${storyHref}#career-story-review` : "/career/context",
      action: hasReviewWaiting ? "Review proposed experience" : "Review context",
      status: hasReviewWaiting ? "Needs review" : hasConfirmedExperience ? "Ready" : "After experience",
    },
    {
      label: "Find jobs for me",
      body: "Search connected sources for opportunities that may fit your experience.",
      href: "/career/discover",
      action: "Find jobs",
      status: hasConfirmedExperience ? "Ready" : "After review",
    },
    {
      label: "Understand my matches",
      body: "See why an opportunity fits, what transfers, and what is missing.",
      href: "/career/discover",
      action: "View opportunities",
      status: hasConfirmedExperience ? "Ready" : "After review",
    },
    {
      label: "Manage my opportunities",
      body: "Save decisions, prepare, track, and follow up with human approval.",
      href: "/career/inbox",
      action: "Opportunity Inbox",
      status: "Next workspace",
    },
  ];

  return <main className="careerShell">
    <header className="careerHeader">
      <div>
        <p className="careerEyebrow">CareerOS</p>
        <h1>Your career home</h1>
        <p className="careerMuted">A private place to build your professional story and understand how your experience applies across opportunities.</p>
      </div>
      <div className="careerHeaderActions">
        <Link className="careerLinkButton" href="/career/privacy">Data notice</Link>
        <a className="careerLinkButton" href={betaFeedbackHref} target="_blank" rel="noreferrer">Beta feedback</a>
      </div>
    </header>

    <section className="careerProfilePanel">
      <p className="careerEyebrow">Next step</p>
      <h2>{profile ? "Keep building your career story" : "Start your career profile"}</h2>
      <p className="careerMuted">{profile ? "Your reviewed experience is a starting point, not a finished career. Add another role, project, accomplishment, or experience whenever you remember one." : "Create your private profile, then add the experience you want CareerOS to organize."}</p>
      <Link className="careerPrimaryButton careerHomePrimary" href={profile ? storyHref : "/career/profile"}>{profile ? "Continue to Career Story" : "Create your Career Profile"}</Link>
      <p className="careerMuted careerHomeStatus">{story.storyStatus === "CAREER_STORY_COMPLETE_FOR_NOW" ? "Your story is complete for now, and you can reopen it at any time." : "Your story is open for more experience."}</p>
    </section>

    <section className="careerProfilePanel careerHomeJourney" aria-labelledby="career-journey-heading">
      <p className="careerEyebrow">Your CareerOS journey</p>
      <h2 id="career-journey-heading">From your experience to your next opportunity</h2>
      <div className="careerJourneyList">
        {journey.map((step, index) => <article className="careerJourneyStep" key={step.label}>
          <span className="careerJourneyNumber">{index + 1}</span>
          <div>
            <p className="careerEyebrow">{step.status}</p>
            <h3>{step.label}</h3>
            <p className="careerMuted">{step.body}</p>
            <Link className={index === 2 ? "careerPrimaryButton" : "careerLinkButton"} href={step.href}>{step.action}</Link>
            {index === 3 && <Link className="careerLinkButton" href="/career/jobs">Paste a job</Link>}
          </div>
        </article>)}
      </div>
      <div className="careerHomeUtility">
        <p className="careerEyebrow">Beta utility</p>
        <p className="careerMuted">Help improve the experience with a quick note.</p>
        <a className="careerLinkButton" href={betaFeedbackHref} target="_blank" rel="noreferrer">Give beta feedback</a>
      </div>
    </section>

    <section className="careerProfilePanel careerHomeConcepts">
      <div>
        <p className="careerEyebrow">Context</p>
        <h2>Details CareerOS found in your experience</h2>
        <p className="careerMuted">Tools, methods, stakeholders, workflows, processes, domains, and outcomes stay reviewable as context.</p>
        <Link className="careerLinkButton" href="/career/context">Review context</Link>
      </div>
      <div>
        <p className="careerEyebrow">Capabilities</p>
        <h2>Reusable abilities supported by your experience</h2>
        <p className="careerMuted">Capabilities summarize broader strengths without replacing the source experience you reviewed.</p>
        <Link className="careerLinkButton" href="/career/capabilities">Review capabilities</Link>
      </div>
    </section>

    <nav className="careerProfilePanel careerHomeNav" aria-label="CareerOS customer navigation">
      <p className="careerEyebrow">Your CareerOS</p>
      <div className="careerHomeLinks">
        <Link href="/career/profile">Career Profile</Link>
        <Link href={storyHref}>Career Story / Experience</Link>
        <Link href="/career/context">Review context</Link>
        <Link href="/career/capabilities">Review capabilities</Link>
        <Link href="/career/jobs">Paste a job description</Link>
        <Link href="/career/discover">Discover opportunities</Link>
        <Link href="/career/inbox">Opportunity Inbox</Link>
        <Link href="/career/privacy">Privacy and data notice</Link>
        <a href={betaFeedbackHref} target="_blank" rel="noreferrer">Beta feedback</a>
      </div>
      <p className="careerMuted">CareerOS supports a governed path from discovery and evaluation through preparation, human-approved applications, tracking, follow-up, and development. This beta focuses on reviewed experience, capabilities, context, and explainable job evaluation.</p>
    </nav>
  </main>;
}
