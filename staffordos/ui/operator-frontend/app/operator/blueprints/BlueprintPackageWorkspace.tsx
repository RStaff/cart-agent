"use client";

import { useEffect, useState } from "react";

const IDS = [
  "workflow_interview_current_state_map",
  "primary_automation_diagnosis",
  "recommended_system_design",
  "prioritized_opportunities",
  "implementation_roadmap",
  "written_blueprint_review",
];

export default function BlueprintPackageWorkspace() {
  const [engagementId, setEngagementId] = useState("");
  const [engagements, setEngagements] = useState<any[]>([]);
  const [snapshot, setSnapshot] = useState<any>(null);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [recipient, setRecipient] = useState("");
  const [channel, setChannel] = useState("MANUAL_EMAIL");
  const [recipientVerified, setRecipientVerified] = useState(false);
  const [handoffAt, setHandoffAt] = useState("");
  const [evidenceRef, setEvidenceRef] = useState("");

  async function loadEngagements() {
    const response = await fetch("/api/operator/blueprints", { cache: "no-store" });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || "Engagements unavailable");
    const next = Array.isArray(body.engagements) ? body.engagements : [];
    setEngagements(next);
    if (!engagementId && next[0]?.id) setEngagementId(next[0].id);
  }
  useEffect(() => { void loadEngagements().catch((error) => setMessage(error.message)); }, []);

  async function command(action: string, data: Record<string, unknown> = {}) {
    if (!engagementId) return;
    setBusy(action); setMessage("");
    try {
      const response = await fetch(`/api/operator/blueprints/${encodeURIComponent(engagementId)}/package/commands`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ command: action, data: { idempotencyKey: `${action}-${engagementId}-${Date.now()}`, reason: `Step 5 package ${action}`, evidenceRef: evidenceRef || "operator://package-review", ...data } }) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Package command failed");
      setSnapshot(body.package || snapshot); setMessage(action === "CREATE_PREVIEW_SNAPSHOT" ? "Immutable preview created. Inspect it before release." : `${action} recorded.`);
    } catch (error: any) { setMessage(`${error.message}. No delivery was sent.`); }
    finally { setBusy(""); }
  }
  async function inspect(id: string) {
    if (!engagementId || !id) return;
    const response = await fetch(`/api/operator/blueprints/${encodeURIComponent(engagementId)}/package/${encodeURIComponent(id)}`, { cache: "no-store" });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || "Package unavailable");
    setSnapshot(body.package);
  }

  return <section className="blueprintPackageWorkspace" aria-labelledby="package-heading">
    <div className="blueprintDeliverablesHeading"><div><p className="operatorShellHeaderLabel">Step 5 package delivery</p><h2 id="package-heading">Inspect and release Blueprint package</h2><p>Release is separate from delivery. No message or client receipt is created here.</p></div></div>
    <label>Engagement<select value={engagementId} onChange={(event) => { setEngagementId(event.target.value); setSnapshot(null); }}><option value="">Select engagement</option>{engagements.map((entry) => <option key={entry.id} value={entry.id}>{entry.id}</option>)}</select></label>
    <p className="blueprintFieldHint">A preview requires all six exact deliverables to be currently reviewed: {IDS.join(", ")}.</p>
    <button type="button" disabled={!engagementId || Boolean(busy)} onClick={() => void command("CREATE_PREVIEW_SNAPSHOT")}>Create immutable preview</button>
    {message ? <div role="status" className="blueprintAlert">{message}</div> : null}
    {snapshot ? <div className="blueprintPackageInspection"><h3>Snapshot inspection</h3><p>Snapshot {snapshot.id} · {snapshot.status} · digest {snapshot.contentDigest}</p><iframe title="Sanitized Blueprint package preview" sandbox="" srcDoc={snapshot.renderedHtml} className="blueprintPackagePreview" />
      {snapshot.status === "preview" ? <button type="button" disabled={Boolean(busy)} onClick={() => void command("RELEASE_PACKAGE", { snapshotId: snapshot.id, contentDigest: snapshot.contentDigest, idempotencyKey: `release-${snapshot.id}` })}>Release inspected snapshot</button> : null}
      {snapshot.status === "released" ? <fieldset><legend>Record manual delivery</legend><label>Verified recipient<input value={recipient} onChange={(event) => setRecipient(event.target.value)} /></label><label>Channel<select value={channel} onChange={(event) => setChannel(event.target.value)}><option value="MANUAL_EMAIL">Manual email</option><option value="MANUAL_SHARED_LINK">Manual shared link</option><option value="MANUAL_IN_PERSON">Manual in-person handoff</option></select></label><label><input type="checkbox" checked={recipientVerified} onChange={(event) => setRecipientVerified(event.target.checked)} /> I verified this recipient through the approved operating process</label><label>Handoff time<input type="datetime-local" value={handoffAt} onChange={(event) => setHandoffAt(event.target.value)} /></label><label>Handoff evidence reference<input value={evidenceRef} onChange={(event) => setEvidenceRef(event.target.value)} /></label><button type="button" disabled={Boolean(busy)} onClick={() => { if (!recipient.trim() || !recipientVerified || !handoffAt || !evidenceRef.trim()) { setMessage("Recipient, verification, handoff time, and evidence are required. No delivery was recorded."); return; } void command("RECORD_DELIVERY", { snapshotId: snapshot.id, recipient, channel, recipientVerified, handoffAt, evidenceRef, idempotencyKey: `delivery-${snapshot.id}-${recipient}` }); }}>Record actual handoff</button></fieldset> : null}
    </div> : null}
  </section>;
}
