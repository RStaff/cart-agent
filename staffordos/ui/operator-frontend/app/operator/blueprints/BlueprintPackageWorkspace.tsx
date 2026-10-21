"use client";

import { useEffect, useRef, useState } from "react";
import { createPackageResponseGuard } from "../../../lib/packageResponseGuard.mjs";
import { createPackageWorkspaceController } from "../../../lib/packageWorkspaceController.mjs";
import { snapshotDownloadFilename, verifySnapshotDownload } from "../../../lib/snapshotDownload.mjs";

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
  const [packages, setPackages] = useState<any[]>([]);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [recipient, setRecipient] = useState("");
  const [channel, setChannel] = useState("MANUAL_EMAIL");
  const [recipientVerified, setRecipientVerified] = useState(false);
  const [handoffAt, setHandoffAt] = useState("");
  const [evidenceRef, setEvidenceRef] = useState("");
  const [deliveryIdempotencyKey, setDeliveryIdempotencyKey] = useState("");
  const [operationIdempotencyKeys, setOperationIdempotencyKeys] = useState<Record<string, string>>({});
  const responseGuard = useRef(createPackageResponseGuard()).current;
  const workspaceController = useRef(createPackageWorkspaceController()).current;
  const clearDelivery = () => { setRecipient(""); setChannel("MANUAL_EMAIL"); setRecipientVerified(false); setHandoffAt(""); setEvidenceRef(""); setDeliveryIdempotencyKey(""); };
  const resetSelectionState = () => { clearDelivery(); setBusy(""); setMessage(""); setSnapshot(null); setPackages([]); };
  async function downloadSnapshotHtml() {
    const verified = await verifySnapshotDownload(snapshot);
    if (!verified.ok) { setMessage("Snapshot digest verification failed. Nothing was downloaded."); return; }
    const url = URL.createObjectURL(new Blob([verified.html], { type: "text/html;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = verified.filename || snapshotDownloadFilename(snapshot.id); link.click();
    URL.revokeObjectURL(url); setMessage("Verified snapshot HTML downloaded. No release or delivery was recorded.");
  }

  async function loadEngagements() {
    const response = await fetch("/api/operator/blueprints", { cache: "no-store" });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || "Engagements unavailable");
    const next = Array.isArray(body.engagements) ? body.engagements : [];
    setEngagements(next);
    if (!engagementId && next[0]?.id) setEngagementId(next[0].id);
  }
  useEffect(() => { void loadEngagements().catch((error) => setMessage(error.message)); }, []);
  useEffect(() => { if (engagementId) { workspaceController.select(engagementId); void inspect("").catch((error) => setMessage(error.message)); } }, [engagementId]);

  async function command(action: string, data: Record<string, unknown> = {}) {
    if (!engagementId) return false;
    const providedKey = typeof data.idempotencyKey === "string" ? data.idempotencyKey : "";
    const operation = workspaceController.beginCommand(action, engagementId, data);
    const idempotencyKey = providedKey || operationIdempotencyKeys[action] || operation.idempotencyKey || `${action}-${engagementId}-${Date.now()}`;
    if (!providedKey && !operationIdempotencyKeys[action]) setOperationIdempotencyKeys((current) => ({ ...current, [action]: idempotencyKey }));
    setBusy(action); setMessage("");
    try {
      const response = await fetch(`/api/operator/blueprints/${encodeURIComponent(engagementId)}/package/commands`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ command: action, data: { idempotencyKey, reason: `Step 5 package ${action}`, evidenceRef: evidenceRef || "operator://package-review", ...data } }) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Package command failed");
      if (!workspaceController.isCurrent(operation)) return false;
      if (body.package?.id || snapshot?.id) await inspect(body.package?.id || snapshot.id);
      workspaceController.complete(action);
      setOperationIdempotencyKeys((current) => { const next = { ...current }; delete next[action]; return next; });
      setMessage(action === "CREATE_PREVIEW_SNAPSHOT" ? "Immutable preview created. Inspect it before release." : `${action} recorded.`); return true;
    } catch (error: any) { if (workspaceController.isCurrent(operation)) setMessage(`${error.message}. No delivery was sent.`); return false; }
    finally { if (workspaceController.isCurrent(operation)) setBusy(""); }
  }
  async function inspect(id: string) {
    if (!engagementId) return;
    const selection = id ? `${engagementId}:${id}` : engagementId;
    const request = responseGuard.begin(selection);
    const response = await fetch(`/api/operator/blueprints/${encodeURIComponent(engagementId)}/package${id ? `?snapshotId=${encodeURIComponent(id)}` : ""}`, { cache: "no-store" });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || "Package unavailable");
    if (!responseGuard.accepts(request, selection)) return;
    setSnapshot(body.package);
    setPackages(Array.isArray(body.packages) ? body.packages : []);
  }

  return <section className="blueprintPackageWorkspace" aria-labelledby="package-heading">
    <div className="blueprintDeliverablesHeading"><div><p className="operatorShellHeaderLabel">Step 5 package delivery</p><h2 id="package-heading">Inspect and release Blueprint package</h2><p>Release is separate from delivery. No message or client receipt is created here.</p></div></div>
    <label>Engagement<select value={engagementId} onChange={(event) => { resetSelectionState(); workspaceController.select(event.target.value); setEngagementId(event.target.value); }}><option value="">Select engagement</option>{engagements.map((entry) => <option key={entry.id} value={entry.id}>{entry.id}</option>)}</select></label>
    <p className="blueprintFieldHint">A preview requires all six exact deliverables to be currently reviewed: {IDS.join(", ")}.</p>
    <button type="button" disabled={!engagementId || Boolean(busy)} onClick={() => void command("CREATE_PREVIEW_SNAPSHOT")}>Create immutable preview</button>
    {message ? <div role="status" className="blueprintAlert">{message}</div> : null}
    {snapshot ? <div className="blueprintPackageInspection"><h3>Snapshot inspection</h3><p>Snapshot {snapshot.id} · {snapshot.status} · digest {snapshot.contentDigest}</p><button type="button" className="blueprintSecondaryButton" onClick={() => void downloadSnapshotHtml()}>Download HTML</button><iframe title="Sanitized Blueprint package preview" sandbox="" srcDoc={snapshot.renderedHtml} className="blueprintPackagePreview" />
      {packages.length > 1 ? <label>Package version<select value={snapshot.id} onChange={(event) => { const nextPackageId = event.target.value; resetSelectionState(); workspaceController.select(`${engagementId}:${nextPackageId}`); void inspect(nextPackageId); }}>{packages.map((entry) => <option key={entry.id} value={entry.id}>v{entry.packageVersion} · {entry.status} · {entry.id}</option>)}</select></label> : null}
      {snapshot.status === "preview" ? <button type="button" disabled={Boolean(busy)} onClick={() => void command("RELEASE_PACKAGE", { snapshotId: snapshot.id, contentDigest: snapshot.contentDigest, inspectionSnapshotId: snapshot.id, inspectionDigest: snapshot.contentDigest, inspectionConfirmed: true, idempotencyKey: `release-${snapshot.id}` })}>Release inspected snapshot</button> : null}
      {snapshot.status === "released" ? <fieldset><legend>Record manual delivery</legend><label>Verified recipient<input value={recipient} onChange={(event) => { setRecipient(event.target.value); setDeliveryIdempotencyKey(""); }} /></label><label>Channel<select value={channel} onChange={(event) => { setChannel(event.target.value); setDeliveryIdempotencyKey(""); }}><option value="MANUAL_EMAIL">Manual email</option><option value="MANUAL_SHARED_LINK">Manual shared link</option><option value="MANUAL_IN_PERSON">Manual in-person handoff</option></select></label><label><input type="checkbox" checked={recipientVerified} onChange={(event) => { setRecipientVerified(event.target.checked); setDeliveryIdempotencyKey(""); }} /> I verified this recipient through the approved operating process</label><label>Handoff time<input type="datetime-local" step="1" value={handoffAt} onChange={(event) => { setHandoffAt(event.target.value); setDeliveryIdempotencyKey(""); }} /></label><label>Handoff evidence reference<input value={evidenceRef} onChange={(event) => { setEvidenceRef(event.target.value); setDeliveryIdempotencyKey(""); }} /></label><button type="button" disabled={Boolean(busy)} onClick={async () => { if (!recipient.trim() || !recipientVerified || !handoffAt || !evidenceRef.trim()) { setMessage("Recipient, verification, handoff time, and evidence are required. No delivery was recorded."); return; } const absoluteHandoffAt = new Date(handoffAt).toISOString(); const key = deliveryIdempotencyKey || `delivery-${snapshot.id}-${Date.now()}`; setDeliveryIdempotencyKey(key); if (await command("RECORD_DELIVERY", { snapshotId: snapshot.id, recipient, channel, recipientVerified, handoffAt: absoluteHandoffAt, evidenceRef, idempotencyKey: key })) setDeliveryIdempotencyKey(""); }}>Record actual handoff</button></fieldset> : null}
    </div> : null}
  </section>;
}
