"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { blueprintSaveMessage, blueprintWorkspaceActions } from "../../../lib/operator/blueprintOnboardingViewModel.mjs";

type EngagementSummary = {
  id: string;
  state: string;
  associationStatus: string;
  offerId: string;
  paymentStatus: string;
  amountTotal: number;
  currency: string;
  quantity: number;
  stripeSessionId: string;
  stripePaymentLinkId: string;
  stripeProductId: string;
  stripePriceId: string;
  paidAt: string;
  clientId: string | null;
  inquiryId: string | null;
  buyerEvidence: { email: string | null; name: string | null; phone: string | null; claimedInquiryReference: string | null; authority: string };
  onboarding: any;
};

type Detail = { engagement: EngagementSummary; onboarding: any; auditEvents: any[] };
type Feedback = { state: "idle" | "saving" | "success" | "error"; message: string };
type InputDraft = { key: string; label: string; owner: string; rationale: string; status: "PENDING" | "RECEIVED" | "UNAVAILABLE"; evidenceRef: string; receivedAt: string; limitation: string };

const EMPTY_INPUT: InputDraft = { key: "", label: "", owner: "", rationale: "", status: "PENDING", evidenceRef: "", receivedAt: "", limitation: "" };
const STATE_LABELS: Record<string, string> = {
  PAID_IDENTITY_REVIEW: "Paid · identity review",
  ONBOARDING: "Onboarding",
  WAITING_FOR_CLIENT_INPUT: "Waiting for client input",
  READY_FOR_INTERVIEW: "Ready for interview",
  INTERVIEW_COMPLETE: "Interview complete",
  DELIVERY_READY: "Ready for Blueprint delivery",
};

function formatDate(value: unknown) {
  if (!value) return "Not recorded";
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

function localDateTimeValue(value: unknown) {
  if (!value) return "";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return "";
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function money(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: String(currency || "USD").toUpperCase() }).format((amount || 0) / 100);
}

function lines(value: FormDataEntryValue | null) {
  return String(value || "").split("\n").map((item) => item.trim()).filter(Boolean);
}

function iso(value: FormDataEntryValue | null) {
  const raw = String(value || "").trim();
  return raw ? new Date(raw).toISOString() : "";
}

function boundary(form: FormData, prefix = "") {
  const get = (name: string) => form.get(`${prefix}${name}`);
  return {
    name: String(get("name") || "").trim(),
    trigger: String(get("trigger") || "").trim(),
    terminalOutcome: String(get("terminalOutcome") || "").trim(),
    includedWork: lines(get("includedWork")),
    roles: lines(get("roles")),
    teams: lines(get("teams")),
    systems: lines(get("systems")),
    exclusions: lines(get("exclusions")),
    adjacentWorkflows: lines(get("adjacentWorkflows")),
    knownExceptions: lines(get("knownExceptions")),
    humanControls: lines(get("humanControls")),
    clientWorkflowOwner: String(get("clientWorkflowOwner") || "").trim(),
    staffordMediaOwner: String(get("staffordMediaOwner") || "").trim(),
    selectionRationale: String(get("selectionRationale") || "").trim(),
  };
}

function common(form: FormData) {
  return { reason: String(form.get("reason") || "").trim(), evidenceRef: String(form.get("evidenceRef") || "").trim() };
}

function Field({ label, name, defaultValue = "", required = true, type = "text", children }: { label: string; name: string; defaultValue?: string; required?: boolean; type?: string; children?: ReactNode }) {
  return <label className="blueprintField"><span>{label}</span>{children || <input name={name} type={type} defaultValue={defaultValue} required={required} />}</label>;
}

function TextArea({ label, name, defaultValue = "", required = true, hint }: { label: string; name: string; defaultValue?: string; required?: boolean; hint?: string }) {
  return <label className="blueprintField"><span>{label}</span>{hint ? <small>{hint}</small> : null}<textarea name={name} defaultValue={defaultValue} required={required} rows={3} /></label>;
}

function BoundaryFields({ value = {}, prefix = "" }: { value?: any; prefix?: string }) {
  const list = (name: string) => Array.isArray(value?.[name]) ? value[name].join("\n") : "";
  return <div className="blueprintFormGrid">
    <Field label="Workflow name" name={`${prefix}name`} defaultValue={value?.name || ""} />
    <Field label="Trigger" name={`${prefix}trigger`} defaultValue={value?.trigger || ""} />
    <Field label="Terminal outcome" name={`${prefix}terminalOutcome`} defaultValue={value?.terminalOutcome || ""} />
    <Field label="Client workflow owner" name={`${prefix}clientWorkflowOwner`} defaultValue={value?.clientWorkflowOwner || ""} />
    <Field label="Stafford Media owner" name={`${prefix}staffordMediaOwner`} defaultValue={value?.staffordMediaOwner || "Ross Stafford"} />
    <TextArea label="Included work" name={`${prefix}includedWork`} defaultValue={list("includedWork")} hint="One item per line." />
    <TextArea label="Roles" name={`${prefix}roles`} defaultValue={list("roles")} required={false} hint="One role per line." />
    <TextArea label="Teams" name={`${prefix}teams`} defaultValue={list("teams")} required={false} hint="One team per line." />
    <TextArea label="Systems" name={`${prefix}systems`} defaultValue={list("systems")} required={false} hint="One system per line." />
    <TextArea label="Exclusions" name={`${prefix}exclusions`} defaultValue={list("exclusions")} required={false} hint="One exclusion per line." />
    <TextArea label="Adjacent workflows" name={`${prefix}adjacentWorkflows`} defaultValue={list("adjacentWorkflows")} required={false} />
    <TextArea label="Known exceptions" name={`${prefix}knownExceptions`} defaultValue={list("knownExceptions")} required={false} />
    <TextArea label="Human controls" name={`${prefix}humanControls`} defaultValue={list("humanControls")} required={false} />
    <TextArea label="Selection rationale" name={`${prefix}selectionRationale`} defaultValue={value?.selectionRationale || ""} />
  </div>;
}

function CommonFields() {
  return <div className="blueprintFormGrid blueprintCommonFields">
    <Field label="Reason for this governed change" name="reason" />
    <Field label="Evidence reference" name="evidenceRef" />
  </div>;
}

export default function BlueprintOnboardingWorkspace() {
  const [engagements, setEngagements] = useState<EngagementSummary[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [feedback, setFeedback] = useState<Feedback>({ state: "idle", message: "" });
  const [inputs, setInputs] = useState<InputDraft[]>([{ ...EMPTY_INPUT }]);
  const selectionRequest = useRef(0);

  async function loadDetail(id: string, requestId = selectionRequest.current) {
    const response = await fetch(`/api/operator/blueprints/${encodeURIComponent(id)}`, { cache: "no-store" });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw Object.assign(new Error(body.error || "BLUEPRINT_ONBOARDING_SOURCE_UNAVAILABLE"), { status: response.status, code: body.error });
    if (requestId !== selectionRequest.current) return;
    setDetail(body);
    const items = body.onboarding?.requiredInputChecklist?.items;
    setInputs(Array.isArray(items) && items.length ? items.map((item: any) => ({
      key: item.key || "", label: item.label || "", owner: item.owner || "", rationale: item.rationale || "", status: item.status || "PENDING",
      evidenceRef: item.evidenceRef || "", receivedAt: localDateTimeValue(item.receivedAt), limitation: item.limitation || "",
    })) : [{ ...EMPTY_INPUT }]);
  }

  async function loadList(preferredId = "") {
    setLoading(true);
    setListError("");
    try {
      const response = await fetch("/api/operator/blueprints", { cache: "no-store" });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw Object.assign(new Error(body.error || "BLUEPRINT_ONBOARDING_SOURCE_UNAVAILABLE"), { status: response.status, code: body.error });
      const next = Array.isArray(body.engagements) ? body.engagements : [];
      setEngagements(next);
      const id = next.some((item: EngagementSummary) => item.id === preferredId) ? preferredId : next[0]?.id || "";
      setSelectedId(id);
      if (id) await loadDetail(id); else setDetail(null);
    } catch (error: any) {
      setListError(blueprintSaveMessage(error?.status || 503, error?.code || error?.message));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadList(); }, []);

  async function select(id: string) {
    const requestId = selectionRequest.current + 1;
    selectionRequest.current = requestId;
    setSelectedId(id);
    setDetail(null);
    setFeedback({ state: "idle", message: "" });
    try { await loadDetail(id, requestId); } catch (error: any) {
      if (requestId === selectionRequest.current) setFeedback({ state: "error", message: blueprintSaveMessage(error?.status || 503, error?.code) });
    }
  }

  async function save(command: string, data: any) {
    if (!detail) return;
    setFeedback({ state: "saving", message: "Saving governed change…" });
    const engagementId = detail.engagement.id;
    const requestId = selectionRequest.current;
    try {
      const response = await fetch(`/api/operator/blueprints/${encodeURIComponent(engagementId)}/commands`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ expectedVersion: detail.onboarding?.version || 0, command, data }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw Object.assign(new Error(body.error || "BLUEPRINT_ONBOARDING_SAVE_FAILED"), { status: response.status, code: body.error });
      await loadDetail(engagementId, requestId);
      if (requestId !== selectionRequest.current) return;
      const listResponse = await fetch("/api/operator/blueprints", { cache: "no-store" });
      const listBody = await listResponse.json().catch(() => ({}));
      if (listResponse.ok && Array.isArray(listBody.engagements)) setEngagements(listBody.engagements);
      setFeedback({ state: "success", message: "Saved. The engagement was refreshed from durable authority." });
    } catch (error: any) {
      setFeedback({ state: "error", message: blueprintSaveMessage(error?.status || 503, error?.code || error?.message) });
    }
  }

  const actions = useMemo(() => blueprintWorkspaceActions(detail), [detail]);
  const versionKey = detail ? `${detail.engagement.id}:${detail.onboarding?.version || 0}` : "empty";

  return <div className="blueprintWorkspace">
    <aside className="blueprintEngagementList" aria-label="Blueprint engagements">
      <div className="blueprintListHeader"><h2>Paid engagements</h2><button type="button" onClick={() => void loadList(selectedId)}>Refresh</button></div>
      {loading ? <p>Loading verified purchases…</p> : listError ? <div role="alert" className="blueprintAlert blueprintAlertError"><p>{listError}</p><a href="/api/operator/auth/login?returnTo=%2Foperator%2Fblueprints">Sign in</a></div> : engagements.length === 0 ? <p>No verified Blueprint purchases are available.</p> : engagements.map((item) => <button type="button" key={item.id} className={`blueprintEngagementChoice${selectedId === item.id ? " blueprintEngagementChoiceActive" : ""}`} onClick={() => void select(item.id)} aria-pressed={selectedId === item.id}>
        <strong>{item.buyerEvidence?.name || item.buyerEvidence?.email || "Buyer evidence unavailable"}</strong>
        <span>{STATE_LABELS[item.state] || item.state}</span>
        <small>{formatDate(item.paidAt)} · {money(item.amountTotal, item.currency)}</small>
      </button>)}
    </aside>

    <section className="blueprintEngagementDetail" aria-live="polite">
      {!detail ? <p>Select an engagement to review onboarding.</p> : <div key={versionKey}>
        <div className="blueprintDetailHeader"><div><p className="operatorShellHeaderLabel">Engagement</p><h2>{detail.engagement.id}</h2></div><span className="statusPill statusPillReady">{STATE_LABELS[detail.engagement.state] || detail.engagement.state}</span></div>
        {feedback.message ? <div className={`blueprintAlert ${feedback.state === "error" ? "blueprintAlertError" : feedback.state === "success" ? "blueprintAlertSuccess" : ""}`} role={feedback.state === "error" ? "alert" : "status"}>{feedback.message}{feedback.state === "error" ? <button type="button" onClick={() => void loadDetail(detail.engagement.id)}>Refresh engagement</button> : null}</div> : null}

        <div className="blueprintSummaryGrid">
          <article><h3>Verified payment</h3><strong>{detail.engagement.paymentStatus} · {money(detail.engagement.amountTotal, detail.engagement.currency)}</strong><p>{detail.engagement.quantity} Blueprint · paid {formatDate(detail.engagement.paidAt)}</p><small>Offer: {detail.engagement.offerId} · Provider session: {detail.engagement.stripeSessionId}</small></article>
          <article><h3>Buyer evidence</h3><strong>{detail.engagement.buyerEvidence?.name || "Name not supplied"}</strong><p>{detail.engagement.buyerEvidence?.email || "Email not supplied"}{detail.engagement.buyerEvidence?.phone ? ` · ${detail.engagement.buyerEvidence.phone}` : ""}</p>{detail.engagement.buyerEvidence?.claimedInquiryReference ? <p>Claimed inquiry reference: {detail.engagement.buyerEvidence.claimedInquiryReference}</p> : null}<small>Payment-provider evidence and claimed references are not confirmed identity.</small></article>
          <article><h3>Identity review</h3><strong>{detail.onboarding?.identityDecision || "Ross review required"}</strong><p>Association: {detail.engagement.associationStatus}</p><small>Verified client: {detail.engagement.clientId || "Not associated"} · Verified inquiry: {detail.engagement.inquiryId || "Not associated"}</small></article>
          <article><h3>Readiness and deadline</h3><strong>{detail.onboarding?.requiredInputChecklist?.readinessSatisfied ? "Required inputs ready" : "Not ready"}</strong><p>Interview: {formatDate(detail.onboarding?.currentInterviewCompletedAt)}</p><small>Clock: {formatDate(detail.onboarding?.currentDeliveryClockStartedAt)} · Current due: {formatDate(detail.onboarding?.currentDeliveryDueAt)} · Original due: {formatDate(detail.onboarding?.originalDeliveryDueAt)}</small></article>
        </div>

        <div className="blueprintProgress"><span>Onboarding version {detail.onboarding?.version || 0}</span><span>Workflow version {detail.onboarding?.workflowVersion || 0}</span><span>Checklist version {detail.onboarding?.checklistVersion || 0}</span><span>Calendar {detail.onboarding?.calendarVersion || "Not started"}</span></div>

        <div className="blueprintActionStack">
          {actions.identity ? <details><summary>1. Review buyer identity</summary><div className="blueprintActionBody">
            <p>Buyer evidence is a review lead, not identity authority. Durable client lookup/creation is unavailable in this slice.</p>
            <fieldset disabled className="blueprintDisabledAuthority"><legend>Unavailable association actions</legend><label><input type="radio" /> Confirm existing client</label><label><input type="radio" /> Establish new client</label><label><input type="text" placeholder="Client or inquiry identifier" /></label><small>Disabled until a compatible durable client authority can verify the exact identifier.</small></fieldset>
            <form onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); void save("DECIDE_IDENTITY", { ...common(form), decision: form.get("decision"), candidates: lines(form.get("candidates")), safeOperatingContactConfirmed: form.get("safeOperatingContactConfirmed") === "on" }); }}>
              <Field label="Identity decision" name="decision"><select name="decision" defaultValue={detail.onboarding?.identityDecision || "LEAVE_UNASSOCIATED_PENDING"}><option value="LEAVE_UNASSOCIATED_PENDING">Leave unassociated pending Ross review</option><option value="REJECT_CLAIMED_ASSOCIATION">Reject claimed association</option></select></Field>
              <TextArea label="Candidate notes" name="candidates" required={false} hint="One candidate or observation per line. These do not become associations." defaultValue={Array.isArray(detail.onboarding?.identityCandidates) ? detail.onboarding.identityCandidates.join("\n") : ""} />
              <label className="blueprintCheckbox"><input type="checkbox" name="safeOperatingContactConfirmed" required defaultChecked={detail.onboarding?.safeOperatingContactConfirmed === true} /> Ross confirmed a safe operating contact.</label>
              <CommonFields /><button type="submit" disabled={feedback.state === "saving"}>Save identity decision</button>
            </form>
          </div></details> : null}

          {actions.workflow ? <details><summary>2. Define and confirm one workflow</summary><div className="blueprintActionBody"><form onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); void save("DEFINE_WORKFLOW", { ...common(form), boundary: boundary(form), clientConfirmedAt: iso(form.get("clientConfirmedAt")), clientConfirmedBy: form.get("clientConfirmedBy"), clientConfirmationEvidenceRef: form.get("clientConfirmationEvidenceRef") }); }}>
            <BoundaryFields value={detail.onboarding?.workflowBoundary || {}} />
            <div className="blueprintFormGrid"><Field label="Client confirmed at" name="clientConfirmedAt" type="datetime-local" /><Field label="Client confirmer" name="clientConfirmedBy" defaultValue={detail.onboarding?.workflowClientConfirmedBy || ""} /><Field label="Client confirmation evidence" name="clientConfirmationEvidenceRef" defaultValue={detail.onboarding?.workflowClientConfirmationEvidenceRef || ""} /></div>
            <CommonFields /><button type="submit" disabled={feedback.state === "saving"}>Save confirmed workflow</button>
          </form></div></details> : null}

          {actions.requiredInputs ? <details><summary>3. Required inputs and limitations</summary><div className="blueprintActionBody"><form onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); const unavailable = inputs.some((item) => item.status === "UNAVAILABLE"); void save("SET_REQUIRED_INPUTS", { ...common(form), checklist: { items: inputs.map((item) => ({ key: item.key, label: item.label, owner: item.owner, rationale: item.rationale, status: item.status, ...(item.status === "RECEIVED" ? { evidenceRef: item.evidenceRef, receivedAt: iso(item.receivedAt) } : {}), ...(item.status === "UNAVAILABLE" ? { limitation: item.limitation } : {}) })), allSixDeliverablesAchievable: form.get("allSixDeliverablesAchievable") === "on", ...(unavailable ? { clientAgreesToLimitations: form.get("clientAgreesToLimitations") === "on", clientAgreedBy: form.get("clientAgreedBy"), clientAgreedAt: iso(form.get("clientAgreedAt")), clientAgreementEvidenceRef: form.get("clientAgreementEvidenceRef") } : {}) }, readinessEvidenceRef: form.get("readinessEvidenceRef") }); }}>
            <div className="blueprintInputList">{inputs.map((item, index) => <fieldset key={index}><legend>Input {index + 1}</legend><div className="blueprintFormGrid">
              {(["key", "label", "owner", "rationale"] as const).map((name) => <label className="blueprintField" key={name}><span>{name === "key" ? "Stable key" : name[0].toUpperCase() + name.slice(1)}</span><input value={item[name]} required onChange={(event) => setInputs((current) => current.map((entry, i) => i === index ? { ...entry, [name]: event.target.value } : entry))} /></label>)}
              <label className="blueprintField"><span>Status</span><select value={item.status} onChange={(event) => setInputs((current) => current.map((entry, i) => i === index ? { ...entry, status: event.target.value as InputDraft["status"] } : entry))}><option value="PENDING">Pending</option><option value="RECEIVED">Received</option><option value="UNAVAILABLE">Unavailable with agreed limitation</option></select></label>
              {item.status === "RECEIVED" ? <><label className="blueprintField"><span>Evidence reference</span><input value={item.evidenceRef} required onChange={(event) => setInputs((current) => current.map((entry, i) => i === index ? { ...entry, evidenceRef: event.target.value } : entry))} /></label><label className="blueprintField"><span>Received at</span><input type="datetime-local" value={item.receivedAt} required onChange={(event) => setInputs((current) => current.map((entry, i) => i === index ? { ...entry, receivedAt: event.target.value } : entry))} /></label></> : null}
              {item.status === "UNAVAILABLE" ? <label className="blueprintField"><span>Recorded limitation</span><textarea value={item.limitation} required onChange={(event) => setInputs((current) => current.map((entry, i) => i === index ? { ...entry, limitation: event.target.value } : entry))} /></label> : null}
            </div><button type="button" className="blueprintSecondaryButton" disabled={inputs.length === 1} onClick={() => setInputs((current) => current.filter((_, i) => i !== index))}>Remove input</button></fieldset>)}</div>
            <button type="button" className="blueprintSecondaryButton" onClick={() => setInputs((current) => [...current, { ...EMPTY_INPUT }])}>Add required input</button>
            <label className="blueprintCheckbox"><input type="checkbox" name="allSixDeliverablesAchievable" defaultChecked={detail.onboarding?.requiredInputChecklist?.allSixDeliverablesAchievable === true} /> All six promised deliverables remain achievable.</label>
            {inputs.some((item) => item.status === "UNAVAILABLE") ? <div className="blueprintFormGrid"><label className="blueprintCheckbox"><input type="checkbox" name="clientAgreesToLimitations" /> Client agrees to the recorded limitations.</label><Field label="Client agreement by" name="clientAgreedBy" /><Field label="Client agreed at" name="clientAgreedAt" type="datetime-local" /><Field label="Limitation agreement evidence" name="clientAgreementEvidenceRef" /></div> : null}
            <Field label="Readiness evidence (required when all inputs are resolved)" name="readinessEvidenceRef" required={false} defaultValue={detail.onboarding?.requiredInformationReadinessEvidenceRef || ""} />
            <CommonFields /><button type="submit" disabled={feedback.state === "saving"}>Save required inputs</button>
          </form></div></details> : null}

          {actions.interview ? <details><summary>4. Record completed interview</summary><div className="blueprintActionBody"><form onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); const participants = lines(form.get("participants")).map((line) => { const [name, ...role] = line.split("|"); return { name: name.trim(), role: role.join("|").trim() }; }); void save("RECORD_INTERVIEW", { ...common(form), completedAt: iso(form.get("completedAt")), participants, interviewEvidenceRef: form.get("interviewEvidenceRef") }); }}>
            <Field label="Interview completed at" name="completedAt" type="datetime-local" /><TextArea label="Participants" name="participants" hint="One per line as Name | role." /><Field label="Interview evidence reference" name="interviewEvidenceRef" /><CommonFields /><button type="submit" disabled={feedback.state === "saving"}>Record interview</button>
          </form></div></details> : null}

          {actions.transitions.length ? <details><summary>5. Move to the next permitted stage</summary><div className="blueprintActionBody blueprintTransitionGrid">{actions.transitions.map((transition: any) => <form key={transition.nextState} onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); void save("TRANSITION", { ...common(form), nextState: transition.nextState }); }}><h4>{STATE_LABELS[transition.nextState] || transition.nextState}</h4><Field label="Reason" name="reason" /><Field label="Evidence reference" name="evidenceRef" /><button type="submit" disabled={!transition.enabled || feedback.state === "saving"}>Move to this stage</button>{!transition.enabled ? <small>Complete this stage’s recorded prerequisites first.</small> : null}</form>)}</div></details> : null}

          {actions.materialRevision ? <details><summary>Material workflow revision (explicit Ross/client agreement)</summary><div className="blueprintActionBody"><p>This preserves the original scope and dates in audit history. It never silently resets the clock.</p><form onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); const deadlineEffect = String(form.get("deadlineEffect")); void save("APPROVE_MATERIAL_WORKFLOW_CHANGE", { ...common(form), boundary: boundary(form, "revision_"), clientAgreedBy: form.get("clientAgreedBy"), clientAgreedAt: iso(form.get("clientAgreedAt")), clientAgreementEvidenceRef: form.get("clientAgreementEvidenceRef"), deadlineEffect, ...(deadlineEffect === "REVISED" ? { revisedDueAt: iso(form.get("revisedDueAt")) } : {}) }); }}>
            <BoundaryFields value={detail.onboarding?.workflowBoundary || {}} prefix="revision_" /><div className="blueprintFormGrid"><Field label="Client agreed by" name="clientAgreedBy" /><Field label="Client agreed at" name="clientAgreedAt" type="datetime-local" /><Field label="Agreement evidence" name="clientAgreementEvidenceRef" /><Field label="Deadline effect" name="deadlineEffect"><select name="deadlineEffect"><option value="UNCHANGED">Original deadline unchanged</option><option value="REVISED">Explicitly revised deadline</option></select></Field><Field label="Revised due at (only when revised)" name="revisedDueAt" type="datetime-local" required={false} /></div><CommonFields /><button type="submit" disabled={feedback.state === "saving"}>Approve material revision</button>
          </form></div></details> : null}
        </div>

        <section className="blueprintAudit"><h3>Audit history</h3>{detail.auditEvents?.length ? <ol>{detail.auditEvents.map((event) => <li key={event.id}><div><strong>v{event.version} · {event.action}</strong><span>{formatDate(event.createdAt)} · {event.actorSubject}</span></div><p>{event.previousState} → {event.nextState}</p><p>{event.reason}</p><small>Evidence: {event.evidenceRef}</small><details><summary>Recorded change evidence</summary><pre>{JSON.stringify(event.payload, null, 2)}</pre></details></li>)}</ol> : <p>No onboarding changes have been recorded.</p>}</section>
      </div>}
    </section>
  </div>;
}
