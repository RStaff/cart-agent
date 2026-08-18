import { redirect } from "next/navigation";
import { currentCareerContext } from "../../../../lib/career/careerP0Auth";
import { compareOpportunities } from "../../../../lib/career/careerP0Product.mjs";
import { normalizeComparisonIds } from "../../../../lib/career/jobComparison.mjs";
import ComparisonDecision from "./ComparisonDecision";

export const runtime = "nodejs";
const comparisonGroups = [["direct", "Strongest evidence"], ["transferable", "Relevant transferable experience"], ["partial", "Areas with partial evidence"], ["unknown", "More evidence needed"], ["specialist", "Specialist constraints"]] as const;

export default async function CompareJobsPage({ searchParams }: { searchParams: Promise<{ ids?: string }> }) {
  const context = await currentCareerContext();
  if (!context) redirect("/career/login");
  const ids = normalizeComparisonIds(String((await searchParams).ids || "").split(","));
  const data = await compareOpportunities(context, ids);
  return <main className="careerShell"><header className="careerHeader"><div><p className="careerEyebrow">CareerOS comparison</p><h1>Compare saved jobs</h1><p className="careerMuted">These differences come from your existing requirement-level analysis. They are decision support, not a hiring prediction.</p></div><a href="/career/jobs">Saved jobs</a></header><section className="careerCompareGrid">{data.opportunities.map(({ opportunity, comparison }) => <article className="careerCompareCard" key={opportunity.id}><h2>{opportunity.title}</h2><p className="careerMuted">{[opportunity.company, opportunity.location].filter(Boolean).join(" · ") || "User-supplied role"}</p><p><strong>{opportunity.decisionState === "PURSUE" ? "Pursue" : opportunity.decisionState === "PASS" ? "Pass" : "Considering"}</strong>{opportunity.sourceUrl ? <> · <a href={opportunity.sourceUrl} target="_blank" rel="noreferrer">Source link</a></> : null}</p>{comparison.stale ? <p className="careerWarning">Your career information changed since this analysis. Re-analyze this job before treating it as current.</p> : <p className="careerSaved">Analysis current</p>}<h3>{comparison.priorityLabel}</h3><p className="careerMuted">{comparison.priorityExplanation}</p><ComparisonDecision opportunityId={opportunity.id} initialDecision={opportunity.decisionState} />{comparisonGroups.map(([key, label]) => <div key={key}><h3>{label}</h3>{comparison.groups[key].length === 0 ? <p className="careerMuted">None identified.</p> : comparison.groups[key].map((item: { id: string; text: string; explanation: string }) => <p key={item.id}><strong>{item.text}</strong><br /><span className="careerMuted">{item.explanation}</span></p>)}</div>)}<a href={`/career/jobs/${opportunity.id}`}>Open full analysis</a></article>)}</section></main>;
}
