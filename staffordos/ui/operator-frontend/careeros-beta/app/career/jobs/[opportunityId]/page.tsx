import { redirect } from "next/navigation";
import { currentCareerContext } from "../../../../lib/career/careerP0Auth";
import { getOpportunity } from "../../../../lib/career/careerP0Product.mjs";
export const runtime = "nodejs";
type MatchRelationship = { id: string; text: string; explanation: string; state: string };
export default async function JobResultPage({ params }: { params: Promise<{ opportunityId: string }> }) {
  const context = await currentCareerContext(); if (!context) redirect("/career/login");
  const data = await getOpportunity(context, (await params).opportunityId);
  const relationships = data.match.relationships as MatchRelationship[]; const groups = new Map<string, MatchRelationship[]>(); for (const item of relationships) groups.set(item.state, [...(groups.get(item.state) || []), item]);
  return <main className="careerShell"><header className="careerHeader"><div><p className="careerEyebrow">CareerOS match explanation</p><h1>{data.opportunity.title}</h1><p className="careerMuted">{data.opportunity.company || "User-supplied role"}{data.opportunity.location ? " · " + data.opportunity.location : ""}</p></div><a href="/career/jobs">Jobs</a></header><section className="careerProfilePanel"><h2>{data.match.summary.headline}</h2><p className="careerMuted">This is a capability explanation, not a promise or a decision about whether to apply.</p>{[["DIRECT", "Direct matches"], ["TRANSFERABLE", "Transferable strengths"], ["PARTIAL", "Partial or adjacent"], ["UNKNOWN", "Needs more evidence"], ["SPECIALIST_BLOCKED", "Specialist requirements"]].map(([key, label]) => <div className="careerResultGroup" key={key}><h3>{label}</h3>{(groups.get(key) || []).length === 0 ? <p className="careerMuted">None identified.</p> : groups.get(key)!.map((item) => <article className="careerCandidate" key={item.id}><strong>{item.text}</strong><p className="careerMuted">{item.explanation}</p></article>)}</div>)}</section></main>;
}
