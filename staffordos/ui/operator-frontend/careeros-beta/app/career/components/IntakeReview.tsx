"use client";

import { useEffect, useRef, useState } from "react";

type Candidate = { candidateFactId: string; factType: string; statement: string; sourceExcerpt: string; status: string; sourceType: string; scopeStatement: string | null };
type IntakeReviewProps = { focusReview?: boolean; onReviewStateChange?: (hasReviewableCandidates: boolean) => void };

const SOURCE_TYPES = ["RESUME_TEXT", "EMPLOYMENT", "CONSULTING", "MANUAL_WORK_HISTORY", "PROJECT", "ACCOMPLISHMENT", "TECHNICAL_BUILD", "CERTIFICATION", "EDUCATION", "SPEAKING_TEACHING", "LEADERSHIP", "VOLUNTEER_COMMUNITY", "PORTFOLIO_DESCRIPTION", "OTHER_USER_PROVIDED_TEXT"];

export function IntakeReview({ focusReview = false, onReviewStateChange }: IntakeReviewProps) {
  const [sourceType, setSourceType] = useState(SOURCE_TYPES[0]);
  const [text, setText] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [stage, setStage] = useState("CAREER_SOURCE");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const reviewRef = useRef<HTMLElement | null>(null);

  async function refresh() {
    const response = await fetch("/api/career/intake/candidates", { cache: "no-store" });
    if (!response.ok) return;
    const result = await response.json();
    const nextCandidates = result.candidates || [];
    setCandidates(nextCandidates);
    setStage(result.onboarding?.stage || "CAREER_SOURCE");
    onReviewStateChange?.(nextCandidates.some((candidate: Candidate) => ["PROPOSED", "NEEDS_REVIEW"].includes(candidate.status)));
    if (focusReview) requestAnimationFrame(() => reviewRef.current?.scrollIntoView({ block: "start" }));
  }

  useEffect(() => { refresh(); }, []);

  async function submitSource(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const response = await fetch("/api/career/intake/source", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ sourceType, text }) });
    const result = await response.json();
    setBusy(false);
    if (!response.ok) { setMessage(result.error || "Source was not processed."); return; }
    setText("");
    setMessage(`${result.candidates.length} proposed experience statement${result.candidates.length === 1 ? "" : "s"} saved. Review them before reviewing capabilities.`);
    await refresh();
  }

  async function review(candidateId: string, decision: string) {
    let correction;
    if (decision === "CORRECT") {
      correction = window.prompt("Edit the proposed fact", candidates.find((candidate) => candidate.candidateFactId === candidateId)?.statement || "");
      if (!correction) return;
    }
    const response = await fetch(`/api/career/intake/candidates/${encodeURIComponent(candidateId)}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ decision, correction }) });
    if (response.ok) { setMessage("Review saved."); await refresh(); } else setMessage("Review was not saved.");
  }

  const reviewable = candidates.filter((candidate) => candidate.status === "PROPOSED" || candidate.status === "NEEDS_REVIEW");
  return <section id="career-story-review" ref={reviewRef} className="careerProfilePanel"><p className="careerEyebrow">Review what CareerOS understands</p><h2>{stage === "FACT_REVIEW" ? "Review proposed experience" : "Add another experience"}</h2><p className="careerMuted">Each addition is organized into source-backed proposals for your review. Nothing becomes confirmed experience until you approve it.</p><form onSubmit={submitSource} className="careerForm"><label>What kind of experience is this?<select value={sourceType} onChange={(event) => setSourceType(event.target.value)}>{SOURCE_TYPES.map((type) => <option key={type}>{type}</option>)}</select></label><label>Paste or describe the experience<textarea value={text} onChange={(event) => setText(event.target.value)} required maxLength={50000} placeholder="Describe a role, project, accomplishment, certification, or work history here." /></label><button className="careerPrimaryButton" disabled={busy}>{busy ? "Organizing..." : "Organize this experience"}</button></form>{message ? <p className="careerSaved" role="status">{message}</p> : null}<div className="careerCandidateList">{reviewable.map((candidate) => <article key={candidate.candidateFactId} className="careerCandidate"><div><span className="careerEyebrow">Proposed experience</span><h3>{candidate.statement}</h3><p className="careerMuted">This is not confirmed yet. Review it before CareerOS uses it as part of your profile.</p><p className="careerMuted">Source excerpt: “{candidate.sourceExcerpt}”</p>{candidate.scopeStatement ? <p className="careerMuted">Scope stated: {candidate.scopeStatement}</p> : null}</div><div className="careerCandidateActions"><button className="careerSmallButton" onClick={() => review(candidate.candidateFactId, "CONFIRM")}>Confirm</button><button className="careerSmallButton" onClick={() => review(candidate.candidateFactId, "CORRECT")}>Correct</button><button className="careerSmallButton" onClick={() => review(candidate.candidateFactId, "REJECT")}>Reject</button><button className="careerSmallButton" onClick={() => review(candidate.candidateFactId, "KEEP_FOR_LATER")}>Later</button></div></article>)}</div>{reviewable.length === 0 ? <p className="careerMuted">Nothing is waiting for review. Confirmed experience appears in your profile above.</p> : null}</section>;
}
