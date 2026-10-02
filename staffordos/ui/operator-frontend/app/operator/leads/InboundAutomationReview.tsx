"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";

type Inquiry = {
  id: string;
  status: string;
  source: string;
  submittedAt: string;
  name: string | null;
  email: string;
  phone: string | null;
  companyName: string | null;
  businessType: string | null;
  improvements: string[];
  systems: string[];
  currentWorkflow: string | null;
  desiredWorkflow: string | null;
  possibleDuplicateOfId: string | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
  nextAction: string;
};

export default function InboundAutomationReview() {
  const [state, setState] = useState<{ loading: boolean; configured: boolean; inquiries: Inquiry[] }>({ loading: true, configured: true, inquiries: [] });
  const [feedback, setFeedback] = useState<Record<string, { state: "saving" | "success" | "error"; message: string }>>({});
  useEffect(() => {
    fetch("/api/operator/inbound-automation", { cache: "no-store" })
      .then(async (response) => ({ response, body: await response.json().catch(() => ({})) }))
      .then(({ response, body }) => setState({ loading: false, configured: response.ok, inquiries: Array.isArray(body.inquiries) ? body.inquiries : [] }))
      .catch(() => setState({ loading: false, configured: false, inquiries: [] }));
  }, []);
  async function saveReview(event: FormEvent<HTMLFormElement>, inquiry: Inquiry) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const nextAction = String(form.get("nextAction") || "").trim();
    setFeedback((current) => ({ ...current, [inquiry.id]: { state: "saving", message: "Saving review…" } }));
    try {
      const response = await fetch("/api/operator/inbound-automation/review", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ inquiryId: inquiry.id, nextAction, reviewed: true }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Unable to save this inquiry review.");
      setState((current) => ({ ...current, inquiries: current.inquiries.map((item) => item.id === inquiry.id ? { ...item, ...(body.inquiry as Inquiry) } : item) }));
      setFeedback((current) => ({ ...current, [inquiry.id]: { state: "success", message: "Review saved." } }));
    } catch (error) {
      setFeedback((current) => ({ ...current, [inquiry.id]: { state: "error", message: error instanceof Error ? error.message : "Unable to save this inquiry review." } }));
    }
  }
  return (
    <section className="outreachRegister" aria-labelledby="inbound-automation-heading">
      <h3 id="inbound-automation-heading">Inbound automation inquiries</h3>
      <p>Website inquiries are separate from researched outbound prospects. Ross reviews each one before any follow-up.</p>
      {state.loading ? <p>Loading inbound inquiries…</p> : !state.configured ? <p>Inbound review source is not configured in this local operator runtime.</p> : state.inquiries.length === 0 ? <p>No inbound inquiries have been accepted.</p> : (
        <div className="outreachProspectList">
          {state.inquiries.map((inquiry) => (
            <article className="outreachProspect" key={inquiry.id}>
              <h4>{inquiry.companyName || inquiry.name || "Unidentified business"}</h4>
              <p><strong>Status:</strong> {inquiry.status} · <strong>Source:</strong> {inquiry.source} · <strong>Submitted:</strong> {inquiry.submittedAt}</p>
              <p><strong>Review:</strong> {inquiry.reviewedAt ? "Reviewed" : "Awaiting review"}</p>
              <p><strong>Contact:</strong> {inquiry.name || "Name not supplied"} · {inquiry.email}{inquiry.phone ? ` · ${inquiry.phone}` : ""}</p>
              {inquiry.businessType ? <p><strong>Business:</strong> {inquiry.businessType}</p> : null}
              <p><strong>Improve:</strong> {inquiry.improvements.join(", ") || "—"}</p>
              <p><strong>Systems:</strong> {inquiry.systems.join(", ") || "—"}</p>
              {inquiry.currentWorkflow ? <p><strong>Current workflow:</strong> {inquiry.currentWorkflow}</p> : null}
              {inquiry.desiredWorkflow ? <p><strong>Desired workflow:</strong> {inquiry.desiredWorkflow}</p> : null}
              {inquiry.possibleDuplicateOfId ? <p><strong>Review note:</strong> possible duplicate of {inquiry.possibleDuplicateOfId}</p> : null}
              {inquiry.reviewedAt ? <p><strong>Reviewed:</strong> {inquiry.reviewedAt}</p> : null}
              <p><strong>Next action:</strong> {inquiry.nextAction}</p>
              <form className="inboundReviewForm" onSubmit={(event) => saveReview(event, inquiry)}>
                <strong>Ross review</strong>
                <label>Next action<input name="nextAction" required maxLength={500} defaultValue={inquiry.nextAction} /></label>
                <button type="submit" disabled={feedback[inquiry.id]?.state === "saving"}>{feedback[inquiry.id]?.state === "saving" ? "Saving…" : "Mark reviewed and save"}</button>
                {feedback[inquiry.id] ? <p role={feedback[inquiry.id].state === "error" ? "alert" : "status"} aria-live="polite">{feedback[inquiry.id].message}</p> : null}
              </form>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
