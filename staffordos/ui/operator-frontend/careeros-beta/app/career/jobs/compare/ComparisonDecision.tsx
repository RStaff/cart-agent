"use client";
import { useState } from "react";

const options = [{ value: "CONSIDERING", label: "Considering" }, { value: "PURSUE", label: "Pursue" }, { value: "PASS", label: "Pass" }];
export default function ComparisonDecision({ opportunityId, initialDecision }: { opportunityId: string; initialDecision: string }) {
  const [decision, setDecision] = useState(initialDecision || "CONSIDERING");
  const [message, setMessage] = useState("");
  async function save(value: string) {
    setDecision(value); setMessage("");
    const response = await fetch(`/api/career/opportunities/${opportunityId}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ decisionState: value }) });
    setMessage(response.ok ? "Decision saved" : "Could not save decision.");
  }
  return <div className="careerCompareDecision"><p className="careerMuted">What do you want to do?</p><div className="careerChoiceGrid">{options.map((option) => <button className="careerSmallButton" key={option.value} aria-pressed={decision === option.value} onClick={() => save(option.value)}>{option.label}</button>)}</div>{message && <p className="careerSaved" role="status">{message}</p>}</div>;
}
