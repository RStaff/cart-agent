type Evidence = { sourceType: string; sourceExcerpt: string; scopeStatement: string | null; confirmation: string };
type ProfileFact = { id: string; label: string; statement: string; primary: boolean; evidence: Evidence };
type ProfileView = {
  profile: { displayName: string; headline: string | null; location: string | null; careerStage: string | null } | null;
  sections: Array<{ label: string; facts: ProfileFact[] }>;
  evidenceOnly: ProfileFact[];
  reviewCandidates: Array<{ id: string; statement: string; sourceType: string; status: string }>;
};

export function HumanCareerProfile({ view }: { view: ProfileView }) {
  const hasConfirmed = view.sections.length > 0;
  return <section className="careerProfilePanel careerHumanProfile" aria-labelledby="career-profile-heading">
    <p className="careerEyebrow">Your career profile</p>
    <h2 id="career-profile-heading">What CareerOS currently knows about your career</h2>
    {view.profile?.headline || view.profile?.location || view.profile?.careerStage ? <p className="careerMuted">{[view.profile.headline, view.profile.location, view.profile.careerStage].filter(Boolean).join(" · ")}</p> : <p className="careerMuted">Your profile will become clearer as you review more of your experience.</p>}
    {!hasConfirmed ? <p className="careerMuted">No confirmed career experience is shown here yet. Add experience below and review what CareerOS understands.</p> : null}
    <div className="careerHumanProfileSections">{view.sections.map((section) => <section key={section.label} aria-labelledby={`profile-section-${section.label}`}><h3 id={`profile-section-${section.label}`}>{section.label}</h3><div className="careerHumanProfileFacts">{section.facts.map((fact) => <article className="careerHumanProfileFact" key={fact.id}><p>{fact.statement}</p><details><summary>How CareerOS knows this</summary><div className="careerEvidence"><p>{fact.evidence.confirmation} from {fact.evidence.sourceType.toLowerCase()}.</p>{fact.evidence.scopeStatement ? <p>Scope stated: {fact.evidence.scopeStatement}</p> : null}<p>Source excerpt: “{fact.evidence.sourceExcerpt}”</p></div></details></article>)}</div></section>)}</div>
    {view.evidenceOnly.length > 0 ? <details className="careerSecondaryEvidence"><summary>Other confirmed information needing context</summary>{view.evidenceOnly.map((fact) => <article className="careerHumanProfileFact" key={fact.id}><p>{fact.statement}</p><details><summary>How CareerOS knows this</summary><p className="careerMuted">{fact.evidence.sourceExcerpt}</p></details></article>)}</details> : null}
  </section>;
}
