"use client";

import { useState } from "react";

type Claim = { claimId: string; dimension: string; displayValue: string; authorityState: string; status: string; sourceType?: string | null; evidence?: { statement?: string; sourceExcerpt?: string | null } | null };
type Props = { initialClaims: Claim[]; initialSummary: Record<string, string[]> };

const labels: Record<string, string> = { TOOL: "Tools and platforms", PROCESS: "Processes", STAKEHOLDER: "People and stakeholders", WORKFLOW: "Workflows", METHOD: "Methods and techniques", DOMAIN: "Domains", OUTCOME: "Outcomes" };

export function ContextClaimsClient({ initialClaims, initialSummary }: Props) {
  const [claims, setClaims] = useState(initialClaims);
  const [summary, setSummary] = useState(initialSummary);
  const [message, setMessage] = useState("");

  async function review(claim: Claim, decision: "CONFIRM" | "CORRECT" | "REJECT") {
    const correction = decision === "CORRECT" ? window.prompt("What should CareerOS call this detail?", claim.displayValue) : undefined;
    if (decision === "CORRECT" && !correction) return;
    const response = await fetch("/api/career/context/claims", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ claimId: claim.claimId, decision, correction }) });
    const result = await response.json();
    if (!response.ok) { setMessage(result.error || "Review was not saved."); return; }
    setClaims(result.claims || []);
    setSummary(result.summary || {});
    setMessage("Context review saved.");
  }

  const proposed = claims.filter((claim) => claim.status === "ACTIVE" && claim.authorityState === "SYSTEM_PROPOSED");
  const confirmed = Object.entries(summary).filter(([, values]) => values.length > 0);
  return <main className="careerShell"><header className="careerHeader"><div><p className="careerEyebrow">CareerOS context</p><h1>Review details from your confirmed experience</h1><p className="careerMuted">CareerOS keeps these details separate from your capabilities until you review them.</p></div><nav><a href="/career">Career home</a> · <a href="/career/profile">Profile</a> · <a href="/career/onboarding">Career Story</a></nav></header><section className="careerProfilePanel"><p className="careerEyebrow">Proposed details</p><h2>CareerOS sees this in your confirmed experience</h2><p className="careerMuted">Review each detail before it becomes part of your confirmed context.</p>{proposed.length === 0 ? <p className="careerMuted">No new context details are waiting for review.</p> : proposed.map((claim) => <article className="careerCandidate" key={claim.claimId}><p className="careerEyebrow">{labels[claim.dimension] || "Career detail"}</p><h3>{claim.displayValue}</h3><div className="careerCandidateActions"><button className="careerSmallButton" type="button" onClick={() => review(claim, "CONFIRM")}>Yes, keep this</button><button className="careerSmallButton" type="button" onClick={() => review(claim, "CORRECT")}>Correct</button><button className="careerSmallButton" type="button" onClick={() => review(claim, "REJECT")}>No, remove this</button></div><details><summary>Why CareerOS thinks this</summary><p>{claim.evidence?.statement || "Confirmed experience supports this detail."}</p>{claim.sourceType ? <p className="careerMuted">Source: {claim.sourceType}</p> : null}</details></article>)}{message ? <p className="careerSaved" role="status">{message}</p> : null}</section><section className="careerProfilePanel"><p className="careerEyebrow">Confirmed context</p><h2>Details you have reviewed</h2><p className="careerMuted">This summary is based only on details you confirmed from your experience. It is not a complete inventory.</p>{confirmed.length === 0 ? <p className="careerMuted">No contextual details have been confirmed yet.</p> : confirmed.map(([dimension, values]) => <div key={dimension}><h3>{labels[dimension] || dimension}</h3><ul>{values.map((value) => <li key={value}>{value}</li>)}</ul></div>)}</section></main>;
}
