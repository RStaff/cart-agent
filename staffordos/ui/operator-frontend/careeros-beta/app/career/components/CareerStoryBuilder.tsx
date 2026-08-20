"use client";

import { useEffect, useState } from "react";
import { IntakeReview } from "./IntakeReview";
import { VoiceRecorder } from "./VoiceRecorder";

type Mode = "PASTE_OR_TYPE" | "DOCUMENT" | "TALK";
type InputMode = "VOICE" | "TEXT";
const followUps = [
  "What did you personally do in this experience?",
  "What did you own, and what did you support in this experience?",
  "What responsibilities, stakeholders, or systems were involved in this experience?",
  "What was the scope, scale, timing, or context of this experience?",
  "What changed or was accomplished through this experience?",
  "What evidence or source could help you confirm this experience later?",
];
const questionOneGuidance = "Describe the work you performed yourself—not just what the team or organization did. Think about actions you took, decisions you made, problems you solved, meetings you led, things you created, and responsibilities you handled.";

export function CareerStoryBuilder() {
  const [mode, setMode] = useState<Mode>("PASTE_OR_TYPE");
  const [status, setStatus] = useState("CURRENT_FACTS_REVIEWED");
  const [message, setMessage] = useState("");
  const [experienceContext, setExperienceContext] = useState("");
  const [contextInputMode, setContextInputMode] = useState<InputMode>("VOICE");
  const [contextDraft, setContextDraft] = useState("");
  const [contextTranscript, setContextTranscript] = useState("");
  const [talkAnswers, setTalkAnswers] = useState<Array<string | null>>(followUps.map(() => null));
  const [inputModes, setInputModes] = useState<Array<InputMode | null>>(followUps.map(() => null));
  const [questionIndex, setQuestionIndex] = useState(0);
  const [inputMode, setInputMode] = useState<InputMode>("VOICE");
  const [draftAnswer, setDraftAnswer] = useState("");
  const [transcriptDraft, setTranscriptDraft] = useState("");
  const [interviewReview, setInterviewReview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [reviewStateKnown, setReviewStateKnown] = useState(false);
  const [hasReviewableCandidates, setHasReviewableCandidates] = useState(false);
  const [focusReview, setFocusReview] = useState(false);

  async function refresh() { const response = await fetch("/api/career/story", { cache: "no-store" }); if (response.ok) setStatus((await response.json()).story?.storyStatus || "CURRENT_FACTS_REVIEWED"); }
  useEffect(() => { refresh(); }, []);

  async function setStoryStatus(action: "COMPLETE_FOR_NOW" | "REOPEN") {
    const response = await fetch("/api/career/story", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action }) });
    if (response.ok) { setStatus((await response.json()).story?.storyStatus); setMessage(action === "COMPLETE_FOR_NOW" ? "Your story is marked complete for now. You can add more experience whenever you want." : "Your story is open for more experience."); }
  }

  function talkDraft() {
    const context = experienceContext.trim() ? `Experience context\n${experienceContext.trim()}` : "";
    const answers = followUps.map((prompt, index) => talkAnswers[index]?.trim() ? `${prompt}\n${talkAnswers[index]?.trim()}` : "").filter(Boolean);
    return [context, ...answers].filter(Boolean).join("\n\n");
  }
  function loadQuestion(index: number, nextInputMode: InputMode = "VOICE") { setQuestionIndex(index); setInputMode(nextInputMode); setDraftAnswer(talkAnswers[index] || ""); setTranscriptDraft(""); setFeedback(""); }
  function keepContext() {
    const context = (contextTranscript || contextDraft).trim();
    if (!context) { setFeedback("Add a short description of the experience or skip back to paste/type it."); return; }
    setExperienceContext(context); setContextTranscript(""); setFeedback("");
  }
  function startInterview() { if (!experienceContext.trim()) { setFeedback("Tell CareerOS which experience this interview is about first."); return; } setQuestionIndex(0); setInputMode("VOICE"); setDraftAnswer(talkAnswers[0] || ""); setFeedback(""); }
  function keepAnswer() {
    const answer = (transcriptDraft || draftAnswer).trim();
    if (!answer) { setFeedback("Add an answer or skip this question for now."); return; }
    setTalkAnswers((current) => current.map((value, index) => index === questionIndex ? answer : value));
    setInputModes((current) => current.map((value, index) => index === questionIndex ? inputMode : value));
    setTranscriptDraft(""); setFeedback("Answer kept. This story is still a draft.");
    if (questionIndex < followUps.length - 1) loadQuestion(questionIndex + 1); else setInterviewReview(true);
  }
  function skipQuestion() { setTalkAnswers((current) => current.map((value, index) => index === questionIndex ? null : value)); setInputModes((current) => current.map((value, index) => index === questionIndex ? null : value)); setFeedback("Skipped for now. Skipping is not treated as a negative answer."); if (questionIndex < followUps.length - 1) loadQuestion(questionIndex + 1); else setInterviewReview(true); }
  function previousQuestion() { if (questionIndex > 0) loadQuestion(questionIndex - 1); }
  function editAnswer(index: number) { setInterviewReview(false); loadQuestion(index, "TEXT"); }

  async function transcribe(blob: Blob, mimeType: string, target: "CONTEXT" | "QUESTION") {
    setFeedback("Transcribing your recording…");
    const form = new FormData(); form.append("audio", blob, mimeType.includes("mp4") ? "careeros-voice.mp4" : "careeros-voice.webm");
    const response = await fetch("/api/career/story/transcribe", { method: "POST", body: form });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) { setFeedback(body.error === "VOICE_TRANSCRIPTION_UNUSABLE" || body.error === "VOICE_TRANSCRIPTION_EMPTY" ? "We couldn't get a usable transcript. Try again or type instead." : "Voice did not work this time. You can try again or type your answer."); return; }
    if (target === "CONTEXT") setContextTranscript(body.transcript || ""); else setTranscriptDraft(body.transcript || "");
    setFeedback("");
  }

  async function submitTalk() {
    const draft = talkDraft();
    if (!draft) { setFeedback("Add at least one answer before submitting your story draft."); return; }
    setSubmitting(true);
    const sourceType = inputModes.some((value) => value === "VOICE") || contextInputMode === "VOICE" ? "VOICE_TRANSCRIPT" : "OTHER_USER_PROVIDED_TEXT";
    const response = await fetch("/api/career/intake/source", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ sourceType, text: draft }) });
    const result = await response.json().catch(() => ({}));
    setSubmitting(false);
    if (!response.ok) { setMessage("The story draft could not be added."); return; }
    setMode("PASTE_OR_TYPE");
    setFocusReview(true);
    setReviewStateKnown(false);
    setMessage(`${result.candidates?.length || 0} proposed experience statement${result.candidates?.length === 1 ? "" : "s"} saved. Review what CareerOS understood before reviewing capabilities.`);
  }

  function contextStep() {
    return <div className="careerInterview" aria-label="Career story context"><p className="careerEyebrow">Before we begin</p><h3>What experience would you like to tell CareerOS about?</h3><p className="careerMuted">This can be a job, consulting engagement, project, business, teaching role, leadership experience, volunteer or community work, accomplishment, or anything else professionally relevant. Use the name or description that feels clear to you. CareerOS will not fill in an employer, title, dates, or relationship you do not provide.</p>{contextTranscript ? <div className="careerTranscriptReview"><h4>Here is what CareerOS heard</h4><textarea aria-label="Editable experience context" value={contextTranscript} onChange={(event) => setContextTranscript(event.target.value)} /><div className="careerCandidateActions"><button type="button" className="careerPrimaryButton" onClick={keepContext}>Use this experience</button><button type="button" className="careerSmallButton" onClick={() => setContextTranscript("")}>Record again</button></div></div> : contextInputMode === "VOICE" ? <div className="careerInterviewVoice"><VoiceRecorder onRecordingReady={(blob, mimeType) => transcribe(blob, mimeType, "CONTEXT")} onNoSpeech={() => setFeedback("We didn't hear enough speech. Try again or type your answer.")} /><button type="button" className="careerSmallButton" onClick={() => { setContextInputMode("TEXT"); setFeedback(""); }}>Type instead</button></div> : <label className="careerInterviewText">Experience name or description<textarea autoFocus aria-label="Experience name or description" value={contextDraft} onChange={(event) => setContextDraft(event.target.value)} maxLength={1000} /></label>}{contextInputMode === "TEXT" && !contextTranscript ? <div className="careerInterviewActions"><button type="button" className="careerPrimaryButton" onClick={keepContext}>Use this experience</button><button type="button" className="careerSmallButton" onClick={() => { setContextInputMode("VOICE"); setFeedback(""); }}>Answer by voice</button></div> : null}{feedback ? <p className="careerError" role="alert">{feedback}</p> : null}</div>;
  }

  function guidedInterview() {
    const currentAnswer = talkAnswers[questionIndex];
    return <div className="careerInterview" aria-label="Career story interview"><div className="careerContextAnchor"><strong>Talking about:</strong> <span>{experienceContext}</span></div><div className="careerInterviewHeader"><div><p className="careerEyebrow">Career story interview</p><h3>Question {questionIndex + 1} of {followUps.length}</h3></div><div className="careerProgress" role="progressbar" aria-label={`Question ${questionIndex + 1} of ${followUps.length}`} aria-valuemin={1} aria-valuemax={followUps.length} aria-valuenow={questionIndex + 1}><span style={{ width: `${((questionIndex + 1) / followUps.length) * 100}%` }} /></div></div><p className="careerInterviewQuestion">{followUps[questionIndex]}</p>{questionIndex === 0 ? <p className="careerMuted">{questionOneGuidance}</p> : <p className="careerMuted">Answer by voice or type instead. Your answer is kept in this draft only when you choose to continue.</p>}{transcriptDraft ? <div className="careerTranscriptReview"><h4>Here is what CareerOS heard</h4><textarea aria-label="Editable transcript" value={transcriptDraft} onChange={(event) => setTranscriptDraft(event.target.value)} /><div className="careerCandidateActions"><button type="button" className="careerPrimaryButton" onClick={keepAnswer}>Keep answer &amp; continue</button><button type="button" className="careerSmallButton" onClick={() => { setTranscriptDraft(""); setFeedback(""); }}>Record again</button></div></div> : inputMode === "VOICE" ? <div className="careerInterviewVoice"><VoiceRecorder onRecordingReady={(blob, mimeType) => transcribe(blob, mimeType, "QUESTION")} onNoSpeech={() => setFeedback("We didn't hear enough speech. Try again or type your answer.")} /><button type="button" className="careerSmallButton" onClick={() => { setInputMode("TEXT"); setDraftAnswer(currentAnswer || ""); setFeedback(""); }}>Type instead</button></div> : <label className="careerInterviewText">Your answer<textarea autoFocus aria-label={`Answer: ${followUps[questionIndex]}`} value={draftAnswer} onChange={(event) => setDraftAnswer(event.target.value)} maxLength={4000} /></label>}{inputMode === "TEXT" && !transcriptDraft ? <div className="careerInterviewActions"><button type="button" className="careerPrimaryButton" onClick={keepAnswer}>Keep answer &amp; continue</button><button type="button" className="careerSmallButton" onClick={() => { setInputMode("VOICE"); setFeedback(""); }}>Answer by voice</button></div> : null}<div className="careerInterviewFooter"><button type="button" className="careerSmallButton" onClick={previousQuestion} disabled={questionIndex === 0}>Back</button><button type="button" className="careerSmallButton" onClick={skipQuestion}>Skip for now</button><span className="careerDraftState">{feedback || "Draft not yet submitted"}</span></div></div>;
  }

  function finalReview() { return <div className="careerInterviewReview"><div className="careerContextAnchor"><strong>Talking about:</strong> <span>{experienceContext}</span></div><p className="careerEyebrow">Review your draft</p><h3>Your career story draft</h3><p className="careerMuted">Review what you want CareerOS to organize. Submitting creates proposed information for the normal review flow; it does not confirm facts automatically.</p>{followUps.map((question, index) => <div className="careerReviewAnswer" key={question}><div><strong>Question {index + 1}</strong><p>{question}</p><p className="careerMuted">{talkAnswers[index] || "Skipped for now"}</p></div><button type="button" className="careerSmallButton" onClick={() => editAnswer(index)}>Edit answer</button></div>)}<div className="careerInterviewActions"><button type="button" className="careerPrimaryButton" onClick={submitTalk} disabled={submitting}>Submit story for review</button><button type="button" className="careerSmallButton" onClick={() => loadQuestion(followUps.length - 1, "TEXT")}>Back</button></div>{feedback ? <p className="careerSaved" role="status">{feedback}</p> : null}</div>; }

  return <section className="careerProfilePanel"><p className="careerEyebrow">Career story</p><h2>Add experience whenever you remember it</h2><p className="careerMuted">Your confirmed facts are a starting point, not a finished profile. Add employment, consulting, projects, accomplishments, builds, certifications, education, teaching, leadership, community work, or anything else professionally relevant.</p><p className="careerMuted"><strong>{status === "CAREER_STORY_COMPLETE_FOR_NOW" ? "Complete for now" : "Open for more experience"}</strong> · This status is reversible.</p><div className="careerModeTabs" role="tablist"><button className="careerSmallButton" onClick={() => setMode("PASTE_OR_TYPE")} aria-selected={mode === "PASTE_OR_TYPE"}>Paste or type</button><button className="careerSmallButton" onClick={() => { setMode("TALK"); setInterviewReview(false); setFeedback(""); }} aria-selected={mode === "TALK"}>Talk with CareerOS</button><button className="careerSmallButton" onClick={() => setMode("DOCUMENT")} aria-selected={mode === "DOCUMENT"}>Add document</button></div>{mode === "PASTE_OR_TYPE" ? <><p className="careerMuted">Tell CareerOS about your experience. Paste a resume, describe a role, or write about a project or accomplishment. Do not worry about formatting; we will organize what we understand and let you review it.</p><IntakeReview focusReview={focusReview} onReviewStateChange={(hasPending) => { setHasReviewableCandidates(hasPending); setReviewStateKnown(true); }} /></> : mode === "DOCUMENT" ? <div className="careerStoryDisabled"><h3>Document upload is not supported yet</h3><p className="careerMuted">Binary resume and document uploads are intentionally disabled. Paste or type the content instead. Secure file storage, scanning, access control, retention, and deletion proof are required before this mode can accept files.</p></div> : !experienceContext.trim() ? contextStep() : interviewReview ? finalReview() : guidedInterview()}{message ? <p className="careerSaved" role="status">{message}</p> : null}<div className="careerNav"><button className="careerSmallButton" onClick={() => setStoryStatus(status === "CAREER_STORY_COMPLETE_FOR_NOW" ? "REOPEN" : "COMPLETE_FOR_NOW")}>{status === "CAREER_STORY_COMPLETE_FOR_NOW" ? "Add more experience" : "Complete my story for now"}</button>{!reviewStateKnown ? <span className="careerMuted">Checking experience review status…</span> : hasReviewableCandidates ? <a className="careerLinkButton" href="#career-story-review">Review proposed experience</a> : <a className="careerLinkButton" href="/career/capabilities">Review strengths</a>}<a className="careerLinkButton" href="/career/privacy">Data notice</a></div></section>;
}
