import { redirect } from "next/navigation";
import Link from "next/link";
import { careerP0Store, currentCareerContext } from "../../../lib/career/careerP0Auth";
import { ContextClaimsClient } from "./ContextClaimsClient";

export const runtime = "nodejs";

export default async function CareerContextPage() {
  const context = await currentCareerContext();
  if (!context) redirect("/career/login");
  try {
    const data = await careerP0Store.listContextClaims(context.session.id);
    return <ContextClaimsClient initialClaims={data.claims} initialSummary={data.summary} />;
  } catch (error) {
    const code = error instanceof Error ? (error as Error & { code?: string }).code || error.message : "CONTEXT_UNAVAILABLE";
    if (code === "PROFILE_REQUIRED") {
      return <main className="careerShell">
        <header className="careerHeader">
          <div>
            <p className="careerEyebrow">CareerOS context</p>
            <h1>Start with your Career Story</h1>
            <p className="careerMuted">Context details appear after you create a profile and confirm some experience.</p>
          </div>
          <nav><Link href="/career">Career home</Link></nav>
        </header>
        <section className="careerProfilePanel">
          <h2>Reviewable context comes from confirmed experience</h2>
          <p className="careerMuted">CareerOS looks for tools, methods, stakeholders, workflows, processes, domains, and outcomes after you review what it understood.</p>
          <nav className="careerNav"><Link className="careerPrimaryButton" href="/career/onboarding">Go to Career Story</Link><Link className="careerLinkButton" href="/career/profile">Career Profile</Link></nav>
        </section>
      </main>;
    }
    throw error;
  }
}
