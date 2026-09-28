"use client";

import { useEffect, useState } from "react";

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
  nextAction: string;
};

export default function InboundAutomationReview() {
  const [state, setState] = useState<{ loading: boolean; configured: boolean; inquiries: Inquiry[] }>({ loading: true, configured: true, inquiries: [] });
  useEffect(() => {
    fetch("/api/operator/inbound-automation", { cache: "no-store" })
      .then(async (response) => ({ response, body: await response.json().catch(() => ({})) }))
      .then(({ response, body }) => setState({ loading: false, configured: response.ok, inquiries: Array.isArray(body.inquiries) ? body.inquiries : [] }))
      .catch(() => setState({ loading: false, configured: false, inquiries: [] }));
  }, []);
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
              <p><strong>Contact:</strong> {inquiry.name || "Name not supplied"} · {inquiry.email}{inquiry.phone ? ` · ${inquiry.phone}` : ""}</p>
              {inquiry.businessType ? <p><strong>Business:</strong> {inquiry.businessType}</p> : null}
              <p><strong>Improve:</strong> {inquiry.improvements.join(", ") || "—"}</p>
              <p><strong>Systems:</strong> {inquiry.systems.join(", ") || "—"}</p>
              {inquiry.currentWorkflow ? <p><strong>Current workflow:</strong> {inquiry.currentWorkflow}</p> : null}
              {inquiry.desiredWorkflow ? <p><strong>Desired workflow:</strong> {inquiry.desiredWorkflow}</p> : null}
              {inquiry.possibleDuplicateOfId ? <p><strong>Review note:</strong> possible duplicate of {inquiry.possibleDuplicateOfId}</p> : null}
              <p><strong>Next action:</strong> {inquiry.nextAction}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
