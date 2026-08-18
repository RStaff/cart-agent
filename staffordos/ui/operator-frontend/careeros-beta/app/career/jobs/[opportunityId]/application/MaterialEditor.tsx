"use client";
import { useState } from "react";
type Props = { savePath: string; draft: any; materialType?: string; extraBody?: Record<string, string> };
export default function MaterialEditor({ savePath, draft: initialDraft, materialType = "RESUME", extraBody = {} }: Props) {
  const [draft, setDraft] = useState(initialDraft);
  const [text, setText] = useState(String(initialDraft.content?.text || ""));
  const [style, setStyle] = useState("PROFESSIONAL");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const isAi = draft.generationMethod === "AI_ASSISTED";
  async function request(action: string) {
    setBusy(true); setMessage("");
    const response = await fetch(savePath, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action, draftId: draft.id, text, style, ...extraBody }) });
    const body = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok || (body.generated && !["AI_ASSISTED", "DETERMINISTIC_RESTORED"].includes(body.generated.status))) { setMessage(body.generated?.message || body.error || "AI wording improvement isn't available right now. Your grounded CareerOS draft is still available."); return; }
    if (body.draft) { setDraft(body.draft); setText(String(body.draft.content?.text || "")); }
    setMessage(action === "improve" ? "AI-assisted draft ready for review" : action === "restore" ? "Grounded draft restored" : "Draft saved");
  }
  async function copy() { await navigator.clipboard.writeText(text); setMessage("Draft copied"); }
  return <><section aria-label="Application draft">
    {isAi && <><h2>AI-assisted draft</h2><p className="careerMuted">CareerOS used information you've confirmed. Review this wording before using it.</p></>}
    <label className="careerForm"><span>{isAi ? "AI-assisted wording" : "Grounded draft"}</span><textarea className="careerResumeEditor" value={text} onChange={(event) => setText(event.target.value)} maxLength={50000} rows={22} /></label>
    <div className="careerInterviewActions"><button className="careerPrimaryButton" type="button" onClick={() => request("save")} disabled={busy}>Save draft</button><button className="careerSmallButton" type="button" onClick={copy}>Copy draft</button>{!isAi && <><label className="careerForm"><span>Writing style</span><select value={style} onChange={(event) => setStyle(event.target.value)}><option value="CONCISE">Concise</option><option value="PROFESSIONAL">Professional</option><option value="CONVERSATIONAL">Conversational</option></select></label><button className="careerSmallButton" type="button" onClick={() => request("improve")} disabled={busy}>Improve wording</button></>}{isAi && <button className="careerSmallButton" type="button" onClick={() => request("restore")} disabled={busy}>Restore grounded draft</button>}{message && <span className="careerDraftState" role="status">{message}</span>}</div>
  </section>{isAi && (draft.content.claims || []).some((claim: any) => claim.classification === "NEEDS_REVIEW") && <section className="careerWarning"><strong>Review wording carefully</strong><p>CareerOS could not fully verify every AI-assisted statement from the supplied evidence.</p></section>}<section className="careerProfilePanel"><h2>Why CareerOS included this</h2>{(draft.content.blocks || []).map((block: any, index: number) => <p key={index}><strong>{block.relationship === "TRANSFERABLE" ? "Transferable experience" : "Confirmed experience"}:</strong> {block.statement || block.text}<br /><span className="careerMuted">Relevant to: {block.requirement}</span></p>)}{(draft.content.reviewNeeded || []).length > 0 && <><h2>Review needed</h2><p className="careerMuted">CareerOS could not fully verify claims for: {draft.content.reviewNeeded.join("; ")}.</p></>}</section></>;
}
