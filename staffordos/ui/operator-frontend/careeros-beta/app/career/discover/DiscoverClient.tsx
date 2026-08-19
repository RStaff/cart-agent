"use client";
import { useState } from "react";

type Result = { sourceProvider: string; externalOpportunityId: string | null; title: string | null; company: string | null; location: string | null; sourceUrl: string | null; description: string | null; postedAt: string | null; closingAt: string | null; salaryMin: number | null; salaryMax: number | null; employmentType: string | null; retrievedAt: string };
function date(value: string | null) { return value ? new Date(value).toLocaleDateString() : null; }

export default function DiscoverClient() {
  const [form, setForm] = useState({ keywords: "", location: "", remotePreference: "any", postedWithinDays: "", salaryMin: "", resultLimit: "10" });
  const [results, setResults] = useState<Result[]>([]); const [message, setMessage] = useState(""); const [saving, setSaving] = useState<string | null>(null);
  async function search(event: React.FormEvent) {
    event.preventDefault(); setMessage("");
    const response = await fetch("/api/career/discover", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...form, postedWithinDays: form.postedWithinDays || null, salaryMin: form.salaryMin || null, resultLimit: Number(form.resultLimit) }) });
    const body = await response.json();
    if (!response.ok) { setMessage(body.error || "USAJOBS search is unavailable right now."); return; }
    setResults(body.results || []); setMessage((body.results?.length || 0) + " opportunities found via USAJOBS.");
  }
  async function save(result: Result) {
    setSaving(result.externalOpportunityId);
    const response = await fetch("/api/career/opportunity-inbox", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ sourceType: "API_IMPORT", sourceName: "USAJOBS", sourceUrl: result.sourceUrl, externalOpportunityId: result.externalOpportunityId, discoveredAt: result.retrievedAt, title: result.title, company: result.company, location: result.location, description: result.description }) });
    const body = await response.json(); setSaving(null); setMessage(response.ok ? (body.duplicate === "DUPLICATE" ? "This opportunity is already in your inbox." : "Opportunity added to your inbox.") : body.error || "Could not add this opportunity.");
  }
  return <><section className="careerProfilePanel"><h2>Search USAJOBS</h2><p className="careerMuted">Federal jobs — ACTIVE — USAJOBS. Technology, education, and service/hospitality sources are coming soon.</p><form className="careerForm" onSubmit={search}><label>Job title, skill, agency, or keyword<input value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} /></label><label>Location<input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></label><label>Remote<select value={form.remotePreference} onChange={(e) => setForm({ ...form, remotePreference: e.target.value })}><option value="any">Any</option><option value="remote">Remote only</option><option value="nonRemote">Exclude remote</option></select></label><label>Posted within days<input type="number" min="0" max="60" value={form.postedWithinDays} onChange={(e) => setForm({ ...form, postedWithinDays: e.target.value })} /></label><label>Minimum salary<input type="number" min="0" value={form.salaryMin} onChange={(e) => setForm({ ...form, salaryMin: e.target.value })} /></label><button className="careerPrimaryButton">Search now</button>{message && <p className="careerDraftState" role="status">{message}</p>}</form></section>{results.length > 0 && <section className="careerProfilePanel"><h2>Results</h2>{results.map((result) => <article className="careerCandidate" key={result.externalOpportunityId || result.sourceUrl}><h3>{result.title || "Untitled opportunity"}</h3><p>{[result.company, result.location].filter(Boolean).join(" · ") || "Details not provided"}</p><p className="careerMuted">Source: USAJOBS{result.employmentType ? " · " + result.employmentType : ""}{result.salaryMin ? " · $" + result.salaryMin.toLocaleString() + "+" : ""}</p><p className="careerMuted">{date(result.postedAt) ? "Posted " + date(result.postedAt) : "Posting date not provided"}{date(result.closingAt) ? " · Closes " + date(result.closingAt) : ""}</p>{result.sourceUrl && <p><a href={result.sourceUrl} target="_blank" rel="noreferrer">View on USAJOBS</a></p>}<button className="careerSmallButton" disabled={saving === result.externalOpportunityId} onClick={() => save(result)}>{saving === result.externalOpportunityId ? "Adding..." : "Add to Opportunity Inbox"}</button></article>)}</section>}</>;
}
