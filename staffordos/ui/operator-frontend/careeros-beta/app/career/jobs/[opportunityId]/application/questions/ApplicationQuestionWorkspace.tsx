"use client";
import { useState } from "react";
import MaterialEditor from "../MaterialEditor";

export default function ApplicationQuestionWorkspace({ opportunityId, initialDrafts }: { opportunityId: string; initialDrafts: any[] }) {
  const [question, setQuestion] = useState("");
  const [intent, setIntent] = useState("");
  const [draft, setDraft] = useState<any>(null);
  const [message, setMessage] = useState("");
  const endpoint = `/api/career/opportunities/${opportunityId}/application/questions`;
  async function generate() {
    setMessage("");
    const response = await fetch(endpoint, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ question, userIntent: intent }) });
    const body = await response.json();
    if (!response.ok) { setMessage(body.error || "We could not prepare an answer."); return; }
    if (body.generated?.status !== "CURRENT") { setMessage(body.generated?.message || "Add more context before drafting an answer."); return; }
    setDraft(body.draft);
  }
  return <><section className="careerProfilePanel"><h2>New application question</h2><label className="careerForm"><span>Paste or type the question</span><textarea value={question} onChange={(event) => setQuestion(event.target.value)} maxLength={2000} rows={4} /></label><label className="careerForm"><span>Your input, when needed <span className="careerMuted">(optional)</span></span><textarea value={intent} onChange={(event) => setIntent(event.target.value)} placeholder="For example, what interests you about this role?" maxLength={4000} rows={3} /></label><button className="careerPrimaryButton" type="button" onClick={generate} disabled={!question.trim()}>Prepare answer</button>{message && <p className="careerError" role="alert">{message}</p>}</section>{draft && <section className="careerProfilePanel"><h2>Draft answer</h2><p className="careerMuted">CareerOS drafts from confirmed experience and any application-specific input you provided. Review before using.</p><MaterialEditor savePath={endpoint} materialType="APPLICATION_ANSWER" extraBody={{ question: draft.content?.question || "", userIntent: draft.content?.userIntent || "" }} draft={draft} /></section>}{initialDrafts.length > 0 && <section className="careerProfilePanel"><h2>Saved answers</h2>{initialDrafts.map((item) => <article className="careerCandidate" key={item.id}><strong>{item.content.question}</strong><p className="careerMuted">Saved application answer</p></article>)}</section>}</>;
}
