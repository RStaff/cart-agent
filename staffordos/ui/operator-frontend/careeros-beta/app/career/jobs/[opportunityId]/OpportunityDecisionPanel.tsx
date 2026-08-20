"use client";
import { useState } from "react";

const options = [{ value: "CONSIDERING", label: "Considering" }, { value: "PURSUE", label: "Pursue" }, { value: "PASS", label: "Pass" }];
export default function OpportunityDecisionPanel({ opportunityId, initialDecision, stale, reanalyzeRequired = false }: { opportunityId: string; initialDecision: string; stale: boolean; reanalyzeRequired?: boolean }) {
  const [decision, setDecision] = useState(initialDecision || "CONSIDERING");
  const [message, setMessage] = useState("");
  async function save(value: string) {
    setDecision(value); setMessage("");
    const response = await fetch(`/api/career/opportunities/${opportunityId}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ decisionState: value }) });
    setMessage(response.ok ? "Decision saved" : "We could not save that decision. Try again.");
  }
  async function reanalyze() {
    setMessage("");
    const response = await fetch(`/api/career/opportunities/${opportunityId}`, { method: "POST" });
    if (response.ok) window.location.reload(); else setMessage("We could not re-analyze this job. Try again.");
  }
  return <section className="careerProfilePanel"><h2>What do you want to do?</h2><p className="careerMuted">This is your decision about the opportunity. It does not change your career profile or match.</p><div className="careerChoiceGrid">{options.map((option) => <button className="careerSmallButton" key={option.value} aria-pressed={decision === option.value} onClick={() => save(option.value)}>{option.label}</button>)}</div>{message && <p className="careerSaved" role="status">{message}</p>}{stale ? <><p className="careerWarning">Your career information has changed since this job was analyzed. Re-analyze the job to refresh the explanation.</p><button className="careerPrimaryButton" onClick={reanalyze}>Re-analyze job</button></> : reanalyzeRequired ? <><p className="careerWarning">This analysis has too little meaningful requirement coverage. Add or review the job information, then re-analyze it.</p><button className="careerPrimaryButton" onClick={reanalyze}>Re-analyze job</button></> : <p className="careerMuted">{decision === "CONSIDERING" ? "Review the match and decide whether you want to pursue this opportunity." : decision === "PURSUE" ? "This opportunity is marked Pursue. Your analysis is saved." : "This opportunity is marked Pass. You can change your decision later."}</p>}</section>;
}
