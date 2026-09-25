"use client";

import { useState } from "react";

type Transaction = {
  id: string;
  status: string;
  recipient: string;
  sender: string;
  subject: string;
  body: string;
  draft: { contentHash: string };
  approval: null | { id: string };
  providerReceipt: null | { providerId: string | null; status: string };
  outcome: null | { outcome: string; note: string; followUpAt: string | null };
};

async function post(payload: Record<string, unknown>) {
  const response = await fetch("/api/operator/revenue-operations/action", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Revenue operation failed");
  return result;
}

export default function GovernedProspectTransaction({ leadId, email, transaction }: { leadId: string; email: string | null; transaction: Transaction | null }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function run(payload: Record<string, unknown>) {
    setBusy(true);
    setError("");
    try {
      await post(payload);
      window.location.reload();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Revenue operation failed");
      setBusy(false);
    }
  }

  if (!email) return <span style={{ color: "#666" }}>Valid email required</span>;

  if (!transaction) {
    return (
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const values = new FormData(event.currentTarget);
          run({ action: "create_draft", leadId, recipient: email, sender: values.get("sender"), subject: values.get("subject"), body: values.get("body") });
        }}
        style={{ display: "grid", gap: 6, minWidth: 260 }}
      >
        <input name="sender" type="email" required defaultValue="support@staffordmedia.ai" aria-label="Sender" />
        <input name="subject" required maxLength={180} placeholder="Subject" aria-label="Subject" />
        <textarea name="body" required maxLength={10000} rows={4} placeholder="Immutable email body" aria-label="Email body" />
        <button disabled={busy} type="submit">Create immutable draft</button>
        {error && <small role="alert">{error}</small>}
      </form>
    );
  }

  return (
    <div style={{ display: "grid", gap: 6, minWidth: 260 }}>
      <strong>{transaction.status}</strong>
      <small>To: {transaction.recipient}</small>
      <small>From: {transaction.sender}</small>
      <small>Subject: {transaction.subject}</small>
      <pre style={{ margin: 0, whiteSpace: "pre-wrap", fontFamily: "inherit", maxWidth: 360 }}>{transaction.body}</pre>
      <small>Draft: {transaction.draft.contentHash.slice(0, 12)}...</small>
      {transaction.status === "DRAFTED" && (
        <button disabled={busy} onClick={() => run({ action: "approve", transactionId: transaction.id, contentHash: transaction.draft.contentHash })}>
          Approve exact draft once
        </button>
      )}
      {transaction.status === "APPROVED" && transaction.approval && (
        <button disabled={busy} onClick={() => run({ action: "send", transactionId: transaction.id, approvalId: transaction.approval?.id, recipient: transaction.recipient, contentHash: transaction.draft.contentHash })}>
          Send once
        </button>
      )}
      {transaction.providerReceipt && <small>Resend: {transaction.providerReceipt.status} {transaction.providerReceipt.providerId || ""}</small>}
      {transaction.status === "SENT" && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const values = new FormData(event.currentTarget);
            run({ action: "record_outcome", transactionId: transaction.id, outcome: values.get("outcome"), note: values.get("note"), followUpAt: values.get("followUpAt") || null });
          }}
          style={{ display: "grid", gap: 6 }}
        >
          <select name="outcome" aria-label="Manual outcome" required defaultValue="FOLLOW_UP_DUE">
            <option value="FOLLOW_UP_DUE">Follow-up due</option>
            <option value="REPLIED">Replied</option>
            <option value="QUALIFIED">Qualified</option>
            <option value="NOT_INTERESTED">Not interested</option>
            <option value="WON">Won</option>
            <option value="LOST">Lost</option>
          </select>
          <input name="followUpAt" type="datetime-local" aria-label="Follow-up time" />
          <input name="note" required maxLength={2000} placeholder="Manual outcome note" aria-label="Outcome note" />
          <button disabled={busy} type="submit">Record outcome</button>
        </form>
      )}
      {transaction.outcome && <small>{transaction.outcome.outcome}: {transaction.outcome.note}</small>}
      {error && <small role="alert">{error}</small>}
    </div>
  );
}
