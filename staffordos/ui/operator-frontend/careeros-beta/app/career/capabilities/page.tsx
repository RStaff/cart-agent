"use client";
import { useEffect, useState } from "react";
type Capability = { id: string; label: string; authorityState: string; question: { key: string; prompt: string; choices: string[] } | null; decision?: { answer: string } | null };
const labels: Record<string, string> = { DIRECT: "Yes, directly", TRANSFERABLE: "Related experience", PARTIAL: "Part of this", KEEP_UNRESOLVED: "Keep unresolved" };
export default function CapabilitiesPage() {
  const [items, setItems] = useState<Capability[]>([]); const [index, setIndex] = useState(0); const [saveNotice, setSaveNotice] = useState<{ capabilityId: string; text: string } | null>(null);
  useEffect(() => { fetch("/api/career/capabilities").then((r) => r.json()).then((body) => setItems(body.profile?.capabilities || [])); }, []);
  const current = items[index];
  async function answer(answer: string) {
    if (!current?.question) return;
    const response = await fetch("/api/career/capabilities", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ capabilityId: current.id, questionKey: current.question.key, answer }) });
    if (!response.ok) { setSaveNotice({ capabilityId: current.id, text: "We could not save this answer." }); return; }
    setItems((previous) => previous.map((item, itemIndex) => itemIndex === index ? { ...item, authorityState: answer === "DIRECT" ? "VERIFIED_DIRECT" : answer === "TRANSFERABLE" ? "VERIFIED_TRANSFERABLE" : answer === "PARTIAL" ? "PARTIALLY_SUPPORTED" : "KEEP_UNRESOLVED", decision: { answer } } : item)); setSaveNotice({ capabilityId: current.id, text: "Answer saved" }); window.setTimeout(() => setSaveNotice((notice) => notice?.capabilityId === current.id ? null : notice), 2500);
  }
  function moveTo(nextIndex: number) { setSaveNotice(null); setIndex(nextIndex); }
  return <main className="careerShell"><header className="careerHeader"><div><p className="careerEyebrow">CareerOS</p><h1>Review your capabilities</h1><p className="careerMuted">A few reusable questions help CareerOS describe your experience without turning every job into a new questionnaire.</p></div><a href="/career/profile">Profile</a></header><section className="careerProfilePanel">{!current ? <p className="careerMuted">Confirm some career facts first, then return here.</p> : <><p className="careerMuted">Question {index + 1} of {items.length}</p><h2>{current.label}</h2><p className="careerMuted">{current.question?.prompt}</p><div className="careerChoiceGrid">{(current.question?.choices || []).map((choice) => <button className="careerSmallButton" key={choice} onClick={() => answer(choice)} aria-pressed={current.decision?.answer === choice}>{labels[choice] || choice}</button>)}</div>{saveNotice?.capabilityId === current.id ? <p className="careerSaved" role="status">{saveNotice.text}</p> : null}<nav className="careerNav"><button className="careerLinkButton" disabled={index === 0} onClick={() => moveTo(index - 1)}>Previous</button><button className="careerLinkButton" onClick={() => moveTo((index + 1) % items.length)}>Next unreviewed</button><a className="careerLinkButton" href="/career/jobs">Add a job</a></nav></>}</section></main>;
}
