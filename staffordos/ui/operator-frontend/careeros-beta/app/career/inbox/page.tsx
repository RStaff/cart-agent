import { redirect } from "next/navigation";
import { currentCareerContext } from "../../../lib/career/careerP0Auth";
import { listOpportunityInbox } from "../../../lib/career/careerP0Product.mjs";
import OpportunityInboxClient from "./OpportunityInboxClient";
export const runtime = "nodejs";
export default async function OpportunityInboxPage() {
  const context = await currentCareerContext();
  if (!context) redirect("/career/login");
  return <main className="careerShell"><header className="careerHeader"><div><p className="careerEyebrow">CareerOS</p><h1>Opportunity inbox</h1><p className="careerMuted">Bring opportunities from different sources into one place. CareerOS does not fetch or scrape job sites from a URL.</p></div><a href="/career/jobs">Saved jobs</a></header><OpportunityInboxClient initialItems={await listOpportunityInbox(context)} /></main>;
}
