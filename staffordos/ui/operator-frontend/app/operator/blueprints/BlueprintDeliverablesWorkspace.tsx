"use client";

import { useEffect, useMemo, useState } from "react";

type Engagement = { id: string; buyerEvidence?: { email?: string | null; name?: string | null }; state?: string; paidAt?: string };
type Deliverable = {
  id: string;
  engagementId: string;
  identifier: string;
  version: number;
  recordVersion: number;
  status: "recorded" | "reviewed";
  owner: string;
  prerequisiteRefs: unknown[];
  contents: Record<string, unknown>;
  evidenceRefs: unknown[];
  claimClassifications: unknown[];
  limitations: unknown[];
  qualityReviewEvidenceRef: string | null;
  supersedesId: string | null;
  createdAt: string;
  updatedAt: string;
  auditEvents?: AuditEvent[];
};
type AuditEvent = { id: string; version: number; action: string; previousStatus: string; nextStatus: string; actorSubject: string; reason: string; evidenceRef: string; createdAt: string };
type Draft = { owner: string; primary: string; supporting: string; openDecisions: string; prerequisites: string; evidence: string; classifications: string; limitations: string };

const PUBLIC_DELIVERABLES = [
  { id: "workflow_interview_current_state_map", label: "Workflow interview and current-state map", question: "How does this work today, and where does it break?", minimum: "Selected workflow boundary, steps, roles, systems, handoffs, exceptions, human controls, and breakdown points." },
  { id: "primary_automation_diagnosis", label: "Primary automation diagnosis", question: "What problem matters most, and what must remain human?", minimum: "Priority problem, operational consequences, root-cause hypotheses, risk/control boundary, data/access constraints, ownership, and adoption context." },
  { id: "recommended_system_design", label: "Recommended system design", question: "What should the selected workflow look like?", minimum: "Triggers, workflow, outputs, tools/integrations, approvals, exceptions, privacy/access controls, costs, ownership, maintenance, and recovery." },
  { id: "prioritized_opportunities", label: "Prioritized opportunities", question: "Which improvements should we consider first?", minimum: "Up to three options ranked by value, feasibility, effort, risk, and dependencies; options are not implementation approval." },
  { id: "implementation_roadmap", label: "Implementation roadmap", question: "What would implementation involve?", minimum: "Phases, indicative timing, software requirements, responsibilities, dependencies, human approvals, adoption, costs, exceptions, and recovery." },
  { id: "written_blueprint_review", label: "Written Blueprint and review", question: "What do we receive, and how do we decide?", minimum: "Synthesis of the preceding outputs, evidence/limitations register, recommendation, design, roadmap, measurement plan, and open decisions." },
] as const;

const emptyDraft: Draft = { owner: "", primary: "", supporting: "", openDecisions: "", prerequisites: "", evidence: "", classifications: "", limitations: "" };
const CLAIM_CLASSIFICATIONS = new Set(["CLIENT_STATED", "OBSERVED", "ESTIMATE", "ASSUMPTION"]);

function formatDate(value: unknown) {
  if (!value) return "Not recorded";
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

function asLines(value: unknown, field = "ref") {
  if (!Array.isArray(value)) return "";
  return value.map((item) => typeof item === "string" ? item : String((item as any)?.[field] || (item as any)?.text || "")).filter(Boolean).join("\n");
}

function classificationLines(value: unknown) {
  if (!Array.isArray(value)) return "";
  return value.map((item) => {
    if (typeof item === "string") return item;
    const classification = String((item as any)?.classification || "").trim();
    const claim = String((item as any)?.claim || "").trim();
    return claim ? `${classification} | ${claim}` : classification;
  }).filter(Boolean).join("\n");
}

function contentText(contents: Record<string, unknown> | undefined, keys: string[]) {
  for (const key of keys) if (typeof contents?.[key] === "string") return String(contents[key]);
  return "";
}

function draftFrom(item: Deliverable | undefined): Draft {
  if (!item) return { ...emptyDraft };
  return {
    owner: item.owner || "",
    primary: contentText(item.contents, ["primary", "answer", "summary", "synthesis"]),
    supporting: contentText(item.contents, ["supporting", "findings", "notes", "design", "roadmap"]),
    openDecisions: contentText(item.contents, ["openDecisions", "open_decisions", "decisions"]),
    prerequisites: asLines(item.prerequisiteRefs),
    evidence: asLines(item.evidenceRefs),
    classifications: classificationLines(item.claimClassifications),
    limitations: asLines(item.limitations, "text"),
  };
}

function lines(value: string) { return value.split("\n").map((item) => item.trim()).filter(Boolean); }

function toContents(item: Deliverable | undefined, draft: Draft, descriptor: typeof PUBLIC_DELIVERABLES[number]) {
  return {
    ...(item?.contents || {}),
    primary: draft.primary,
    supporting: draft.supporting,
    openDecisions: draft.openDecisions,
    checkpointQuestion: descriptor.question,
  };
}

function toEvidence(value: string) { return lines(value).map((ref) => ({ ref })); }
function toClassifications(value: string) { return lines(value).map((line) => { const [classification, ...claim] = line.split("|"); return { classification: classification.trim(), claim: claim.join("|").trim() }; }); }
function toLimitations(value: string) { return lines(value).map((text) => ({ text })); }

function draftValidation(draft: Draft) {
  if (!draft.owner.trim()) return "Owner is required before registering a draft.";
  const evidence = lines(draft.evidence);
  if (!evidence.length) return "Add at least one evidence reference before registering a draft.";
  const classifications = toClassifications(draft.classifications);
  if (!classifications.length) return "Add at least one claim classification in the form CLASSIFICATION | claim.";
  const invalid = classifications.find(({ classification, claim }) => !CLAIM_CLASSIFICATIONS.has(classification) || !claim);
  if (invalid) return "Use CLIENT_STATED, OBSERVED, ESTIMATE, or ASSUMPTION followed by | and the claim.";
  return "";
}

function missingEvidence(item: Deliverable | undefined) {
  if (!item) return "Draft not recorded; owner, contents, and evidence are required.";
  const missing = [];
  if (!item.owner) missing.push("owner");
  if (!item.evidenceRefs?.length) missing.push("supporting evidence");
  if (!item.claimClassifications?.length) missing.push("claim classification");
  if (item.status === "reviewed" && !item.qualityReviewEvidenceRef) missing.push("quality-review evidence");
  return missing.length ? `Missing ${missing.join(", ")}.` : "Minimum evidence recorded; substantive quality remains Ross’s review responsibility.";
}

function activeVersion(items: Deliverable[], id: string) { return items.filter((item) => item.identifier === id).sort((a, b) => b.version - a.version)[0]; }

function operatorLoadError(error: unknown) {
  const code = String((error as any)?.message || "");
  if (["OPERATOR_SESSION_MISSING", "OPERATOR_SESSION_INVALID", "OPERATOR_PERMISSION_MISSING"].includes(code)) {
    return "Your operator session is missing or expired. Sign in again to load Blueprint deliverables; any unsaved form values remain here.";
  }
  return code || "Deliverable authority unavailable";
}

export default function BlueprintDeliverablesWorkspace() {
  const [engagements, setEngagements] = useState<Engagement[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [items, setItems] = useState<Deliverable[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [reviewInputs, setReviewInputs] = useState<Record<string, { reason: string; evidenceRef: string }>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState({ state: "idle" as "idle" | "success" | "error", message: "" });
  const [saving, setSaving] = useState("");

  async function loadEngagements(preferred = "") {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/operator/blueprints", { cache: "no-store" });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Blueprint engagements unavailable");
      const next = Array.isArray(body.engagements) ? body.engagements : [];
      setEngagements(next);
      const id = next.some((entry: Engagement) => entry.id === preferred) ? preferred : next[0]?.id || "";
      setSelectedId(id);
      if (id) await loadDeliverables(id);
      else setItems([]);
    } catch (cause: any) { setError(operatorLoadError(cause)); }
    finally { setLoading(false); }
  }

  async function loadDeliverables(id: string) {
    setError("");
    try {
      const response = await fetch(`/api/operator/blueprints/${encodeURIComponent(id)}/deliverables`, { cache: "no-store" });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Deliverable authority unavailable");
      const next = Array.isArray(body.deliverables) ? body.deliverables : [];
      setItems(next);
      setDrafts(Object.fromEntries(PUBLIC_DELIVERABLES.map((descriptor) => [descriptor.id, draftFrom(activeVersion(next, descriptor.id))])));
      setReviewInputs({});
    } catch (cause: any) { setError(operatorLoadError(cause)); }
  }

  useEffect(() => { void loadEngagements(); }, []);

  const selected = useMemo(() => engagements.find((entry) => entry.id === selectedId), [engagements, selectedId]);
  const reviewedCount = PUBLIC_DELIVERABLES.filter((descriptor) => activeVersion(items, descriptor.id)?.status === "reviewed").length;
  const nextActions = PUBLIC_DELIVERABLES.map((descriptor) => {
    const item = activeVersion(items, descriptor.id);
    if (!item) return `Register ${descriptor.label}`;
    if (item.status === "recorded") return `Record Ross quality review for ${descriptor.label}`;
    return `Release authority unavailable for ${descriptor.label}; retain reviewed evidence`;
  });
  const nextAction = nextActions.find((action) => !action.startsWith("Release authority unavailable")) || nextActions[0] || "Select a verified engagement";

  function changeDraft(id: string, key: keyof Draft, value: string) { setDrafts((current) => ({ ...current, [id]: { ...(current[id] || emptyDraft), [key]: value } })); }

  async function command(descriptor: typeof PUBLIC_DELIVERABLES[number], action: "REGISTER_DRAFT" | "REVISE_DRAFT" | "RECORD_QUALITY_REVIEW") {
    const item = activeVersion(items, descriptor.id);
    const draft = drafts[descriptor.id] || emptyDraft;
    const review = reviewInputs[descriptor.id] || { reason: "", evidenceRef: "" };
    const validation = action === "RECORD_QUALITY_REVIEW" ? "" : draftValidation(draft);
    if (validation) { setFeedback({ state: "error", message: validation }); return; }
    setSaving(descriptor.id); setFeedback({ state: "idle", message: "" });
    const data = action === "RECORD_QUALITY_REVIEW" ? { identifier: descriptor.id, expectedDraftVersion: item?.version, reason: review.reason, evidenceRef: review.evidenceRef } : {
      identifier: descriptor.id,
      ...(action === "REVISE_DRAFT" ? { expectedDraftVersion: item?.version } : {}),
      owner: draft.owner,
      prerequisiteRefs: lines(draft.prerequisites),
      contents: toContents(item, draft, descriptor),
      evidenceRefs: toEvidence(draft.evidence),
      claimClassifications: toClassifications(draft.classifications),
      limitations: toLimitations(draft.limitations),
      reason: action === "REGISTER_DRAFT" ? "Register Blueprint draft" : "Revise Blueprint draft",
      evidenceRef: lines(draft.evidence)[0] || "",
    };
    try {
      const response = await fetch(`/api/operator/blueprints/${encodeURIComponent(selectedId)}/deliverables/commands`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ expectedVersion: item?.recordVersion ?? 0, command: action, data }) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Deliverable save failed");
      await loadDeliverables(selectedId);
      setFeedback({ state: "success", message: `${descriptor.label} saved and refreshed from durable authority.` });
    } catch (cause: any) {
      setFeedback({ state: "error", message: `${String(cause?.message || "Deliverable save failed")}. Your entered values remain in this form; refresh only when you are ready to discard them.` });
    } finally { setSaving(""); }
  }

  return <section className="blueprintDeliverablesWorkspace" aria-labelledby="deliverables-heading">
    <div className="blueprintDeliverablesHeading"><div><p className="operatorShellHeaderLabel">Step 5A durable authority</p><h2 id="deliverables-heading">Blueprint deliverables</h2><p>Preparation is separate from onboarding readiness, delivery, client acceptance, and implementation. Only the three Step 5A commands are available.</p></div><button type="button" onClick={() => void loadEngagements(selectedId)}>Refresh deliverables</button></div>
    {loading ? <p role="status">Loading verified engagements…</p> : error ? <div className="blueprintAlert blueprintAlertError" role="alert">{error}<button type="button" onClick={() => void loadEngagements(selectedId)}>Try again</button></div> : null}
    {!loading && error && /session|sign in/i.test(error) ? <a href="/api/operator/auth/login?returnTo=%2Foperator%2Fblueprints">Sign in again</a> : null}
    {!loading && !error && !selected ? <p>No verified Blueprint engagement is available.</p> : null}
    {selected ? <>
      <div className="blueprintDeliverableContext"><label>Engagement<select value={selectedId} onChange={(event) => { setSelectedId(event.target.value); void loadDeliverables(event.target.value); }}>{engagements.map((entry) => <option key={entry.id} value={entry.id}>{entry.buyerEvidence?.name || entry.buyerEvidence?.email || entry.id} · {entry.id}</option>)}</select></label><span>Preparation reviewed: {reviewedCount}/6 ({Math.round((reviewedCount / 6) * 100)}%)</span><span>Next action: {nextAction}</span></div>
      {feedback.message ? <div className={`blueprintAlert ${feedback.state === "error" ? "blueprintAlertError" : "blueprintAlertSuccess"}`} role={feedback.state === "error" ? "alert" : "status"}>{feedback.message}</div> : null}
      <div className="blueprintDeliverableList">
        {PUBLIC_DELIVERABLES.map((descriptor) => {
          const versions = items.filter((item) => item.identifier === descriptor.id).sort((a, b) => b.version - a.version);
          const item = versions[0];
          const draft = drafts[descriptor.id] || draftFrom(item);
          const review = reviewInputs[descriptor.id] || { reason: "", evidenceRef: "" };
          return <details className="blueprintDeliverableCard" key={descriptor.id}>
            <summary><span><strong>{descriptor.label}</strong><small>{item ? `v${item.version} · ${item.status}` : "Not recorded"}</small></span><span className="blueprintDeliverableMissing">{missingEvidence(item)}</span></summary>
            <div className="blueprintDeliverableBody">
              <p><strong>Client question:</strong> {descriptor.question}</p><p><strong>Minimum substantive contents:</strong> {descriptor.minimum}</p>
              <div className="blueprintDeliverableMeta"><span>Owner: {item?.owner || "Not recorded"}</span><span>Active version: {item ? `v${item.version}` : "None"}</span><span>Quality review: {item?.qualityReviewEvidenceRef || "Not reviewed"}</span></div>
              <fieldset><legend>{item ? `Draft v${item.version} · ${item.status}` : "Register draft v1"}</legend><div className="blueprintFormGrid"><label className="blueprintField"><span>Owner</span><input value={draft.owner} onChange={(event) => changeDraft(descriptor.id, "owner", event.target.value)} /></label><label className="blueprintField"><span>Primary response</span><textarea rows={4} value={draft.primary} onChange={(event) => changeDraft(descriptor.id, "primary", event.target.value)} /></label><label className="blueprintField"><span>Supporting findings / design notes</span><textarea rows={4} value={draft.supporting} onChange={(event) => changeDraft(descriptor.id, "supporting", event.target.value)} /></label><label className="blueprintField"><span>Open decisions, unknowns, or assumptions</span><textarea rows={3} value={draft.openDecisions} onChange={(event) => changeDraft(descriptor.id, "openDecisions", event.target.value)} /></label><label className="blueprintField"><span>Prerequisite references (one per line)</span><textarea rows={2} value={draft.prerequisites} onChange={(event) => changeDraft(descriptor.id, "prerequisites", event.target.value)} /></label><label className="blueprintField"><span>Evidence references (one per line)</span><textarea rows={3} value={draft.evidence} onChange={(event) => changeDraft(descriptor.id, "evidence", event.target.value)} /></label><label className="blueprintField"><span>Claim classifications (CLIENT_STATED | claim; OBSERVED | claim; ESTIMATE | claim; or ASSUMPTION | claim)</span><textarea rows={3} value={draft.classifications} onChange={(event) => changeDraft(descriptor.id, "classifications", event.target.value)} aria-describedby={`classification-help-${descriptor.id}`} /></label><label className="blueprintField"><span>Limitations (one per line)</span><textarea rows={3} value={draft.limitations} onChange={(event) => changeDraft(descriptor.id, "limitations", event.target.value)} /></label></div>
                <p id={`classification-help-${descriptor.id}`} className="blueprintFieldHint">Use exactly one allowed classification before the separator. OBSERVED is for dated evidence-backed observations; CLIENT_STATED, ESTIMATE, and ASSUMPTION remain distinct. A file reference or digest alone does not prove storage, release, delivery, or acceptance.</p>
                <div className="blueprintCommandRow">{!item ? <button type="button" disabled={saving === descriptor.id} onClick={() => void command(descriptor, "REGISTER_DRAFT")}>Register draft</button> : <button type="button" disabled={saving === descriptor.id} onClick={() => void command(descriptor, "REVISE_DRAFT")}>Save revision</button>}</div>
              </fieldset>
              {item?.status === "recorded" ? <fieldset><legend>Ross quality review for exact v{item.version}</legend><div className="blueprintFormGrid"><label className="blueprintField"><span>Review reason</span><input value={review.reason} onChange={(event) => setReviewInputs((current) => ({ ...current, [descriptor.id]: { ...review, reason: event.target.value } }))} /></label><label className="blueprintField"><span>Review evidence reference</span><input value={review.evidenceRef} onChange={(event) => setReviewInputs((current) => ({ ...current, [descriptor.id]: { ...review, evidenceRef: event.target.value } }))} /></label></div><button type="button" disabled={saving === descriptor.id} onClick={() => void command(descriptor, "RECORD_QUALITY_REVIEW")}>Record quality review</button></fieldset> : null}
              <div className="blueprintDeliverableHistory"><h4>Prior-version history and quality evidence</h4>{versions.length ? <ol>{versions.map((version) => <li key={version.id}><strong>v{version.version} · {version.status}</strong> · updated {formatDate(version.updatedAt)} · {version.qualityReviewEvidenceRef ? `quality evidence: ${version.qualityReviewEvidenceRef}` : "not reviewed"}{version.auditEvents?.length ? <ul>{version.auditEvents.map((event) => <li key={event.id}>{event.action} by {event.actorSubject} · {event.reason} · evidence: {event.evidenceRef}</li>)}</ul> : null}</li>)}</ol> : <p>No draft version recorded.</p>}</div>
              <p className="blueprintDeliverableUnavailable">Release and delivery are unavailable in Step 5A. No external artifact storage, client access, messaging, or retention policy is added here.</p>
            </div>
          </details>;
        })}
      </div>
    </> : null}
  </section>;
}
