"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type QueueRow = {
  id: string;
  shop: string;
  customer_email: string;
  customer_phone: string;
  channel: "email" | "sms";
  cart_value: number;
  currency: string;
  event_type: string;
  experience_id: string;
  recovery_url: string;
  message_angle: "complete_purchase" | "return_to_cart" | "simple_reminder";
  subject: string;
  body: string;
  status: "queued" | "draft_generated" | "sent" | "returned" | "lost";
  notes: string;
};

const EMPTY_FORM: QueueRow = {
  id: "",
  shop: "",
  customer_email: "",
  customer_phone: "",
  channel: "email",
  cart_value: 0,
  currency: "USD",
  event_type: "checkout_abandoned",
  experience_id: "",
  recovery_url: "",
  message_angle: "complete_purchase",
  subject: "",
  body: "",
  status: "queued",
  notes: "",
};

export function AbandoRecoveryConsole() {
  const [queue, setQueue] = useState<QueueRow[]>([]);
  const [form, setForm] = useState<QueueRow>(EMPTY_FORM);
  const [selectedRowId, setSelectedRowId] = useState("");
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isWorking, setIsWorking] = useState(false);

  useEffect(() => {
    void loadQueue();
  }, []);

  async function loadQueue() {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/abando/recovery", {
        method: "GET",
        cache: "no-store",
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "Could not load recovery queue.");
      }

      const rows = Array.isArray(payload.queue) ? payload.queue as QueueRow[] : [];
      setQueue(rows);
      if (!selectedRowId && rows.length > 0) {
        selectRow(rows[0]);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load recovery queue.");
    } finally {
      setIsLoading(false);
    }
  }

  function selectRow(row: QueueRow) {
    setSelectedRowId(row.id);
    setForm({ ...row });
    setStatusMessage("");
    setError("");
  }

  function updateField(field: keyof QueueRow, value: string | number) {
    setForm((current) => ({
      ...current,
      [field]: field === "cart_value" ? Number(value || 0) : value,
    }));
  }

  function replaceQueueRow(queueRow: QueueRow) {
    setQueue((current) => current.map((row) => row.id === queueRow.id ? queueRow : row));
    selectRow(queueRow);
  }

  async function generateDraft() {
    if (!selectedRowId) return;
    setIsWorking(true);
    setError("");
    setStatusMessage("");
    try {
      const response = await fetch("/api/abando/recovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate",
          selected_row_id: selectedRowId,
          input: form,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.errors?.join(", ") || payload?.error || "Draft generation failed.");
      }
      if (payload.queue_row) {
        replaceQueueRow(payload.queue_row as QueueRow);
      }
      setStatusMessage("Recovery draft generated.");
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : "Draft generation failed.");
    } finally {
      setIsWorking(false);
    }
  }

  async function saveReview() {
    if (!selectedRowId) return;
    setIsWorking(true);
    setError("");
    setStatusMessage("");
    try {
      const response = await fetch("/api/abando/recovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_review",
          selected_row_id: selectedRowId,
          input: form,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "Could not save review.");
      }
      if (payload.queue_row) {
        replaceQueueRow(payload.queue_row as QueueRow);
      }
      setStatusMessage("Reviewed recovery draft saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save review.");
    } finally {
      setIsWorking(false);
    }
  }

  async function setStatus(status: QueueRow["status"]) {
    if (!selectedRowId) return;
    setIsWorking(true);
    setError("");
    setStatusMessage("");
    try {
      const response = await fetch("/api/abando/recovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "set_status",
          selected_row_id: selectedRowId,
          input: {
            ...form,
            status,
          },
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "Could not update status.");
      }
      if (payload.queue_row) {
        replaceQueueRow(payload.queue_row as QueueRow);
      }
      setStatusMessage(`Status updated to ${status}.`);
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : "Could not update status.");
    } finally {
      setIsWorking(false);
    }
  }

  return (
    <main className="shell">
      <div className="container">
        <section className="panel">
          <div className="panelInner">
            <p className="eyebrow">StaffordOS</p>
            <h1 className="title">Abando Recovery Queue</h1>
            <p className="subtitle">
              Thin operator queue for recovery opportunities. Ross reviews the queued shopper draft, edits it, and explicitly marks sent, returned, or lost.
            </p>
            <div className="row navRow">
              <Link href="/operator/products" className="chip navChipActive">Products</Link>
              <span className="chip">Abando</span>
              <span className="chip">Recovery Queue</span>
            </div>
          </div>
        </section>

        <section className="grid gridTwo">
          <article className="panel fullWidth">
            <div className="panelInner">
              <p className="eyebrow">Queue</p>
              {isLoading ? <p className="emptyStateText">Loading recovery queue...</p> : null}
              <div className="tableWrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Shop</th>
                      <th>Customer Email</th>
                      <th>Channel</th>
                      <th>Cart Value</th>
                      <th>Message Angle</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {queue.map((row) => (
                      <tr
                        key={row.id}
                        onClick={() => selectRow(row)}
                        style={{
                          cursor: "pointer",
                          background: row.id === selectedRowId ? "rgba(8, 47, 73, 0.55)" : "transparent",
                        }}
                      >
                        <td>{row.shop}</td>
                        <td>{row.customer_email}</td>
                        <td>{row.channel}</td>
                        <td>{row.cart_value} {row.currency}</td>
                        <td>{row.message_angle}</td>
                        <td>{row.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </article>

          <article className="panel">
            <div className="panelInner">
              <p className="eyebrow">Selected Row</p>
              <label className="label">ID<input className="input" value={form.id} onChange={(event) => updateField("id", event.target.value)} /></label>
              <label className="label">Shop<input className="input" value={form.shop} onChange={(event) => updateField("shop", event.target.value)} /></label>
              <label className="label">Customer email<input className="input" value={form.customer_email} onChange={(event) => updateField("customer_email", event.target.value)} /></label>
              <label className="label">Customer phone<input className="input" value={form.customer_phone} onChange={(event) => updateField("customer_phone", event.target.value)} /></label>
              <label className="label">Channel<select className="input" value={form.channel} onChange={(event) => updateField("channel", event.target.value)}><option value="email">email</option><option value="sms">sms</option></select></label>
              <label className="label">Cart value<input className="input" type="number" value={String(form.cart_value)} onChange={(event) => updateField("cart_value", Number(event.target.value))} /></label>
              <label className="label">Currency<input className="input" value={form.currency} onChange={(event) => updateField("currency", event.target.value)} /></label>
              <label className="label">Event type<input className="input" value={form.event_type} onChange={(event) => updateField("event_type", event.target.value)} /></label>
              <label className="label">Experience ID<input className="input" value={form.experience_id} onChange={(event) => updateField("experience_id", event.target.value)} /></label>
              <label className="label">Recovery URL<input className="input" value={form.recovery_url} onChange={(event) => updateField("recovery_url", event.target.value)} /></label>
              <label className="label">Notes<textarea className="textarea compactTextarea" value={form.notes} onChange={(event) => updateField("notes", event.target.value)} /></label>
            </div>
          </article>

          <article className="panel secondaryPanel">
            <div className="panelInner">
              <p className="eyebrow">Operator Status</p>
              <div className="kv">
                <div><strong>Selected row:</strong> {selectedRowId || "none"}</div>
                <div><strong>Current status:</strong> {statusMessage || form.status || "none"}</div>
                <div><strong>Queue rule:</strong> selected row is the source of truth</div>
              </div>
              {error ? <p className="hint" style={{ marginTop: 12, color: "#fecaca" }}>{error}</p> : null}
            </div>
          </article>

          <article className="panel fullWidth">
            <div className="panelInner">
              <p className="eyebrow">Review</p>
              <label className="label">
                Message angle
                <select className="input" value={form.message_angle} onChange={(event) => updateField("message_angle", event.target.value)}>
                  <option value="complete_purchase">complete_purchase</option>
                  <option value="return_to_cart">return_to_cart</option>
                  <option value="simple_reminder">simple_reminder</option>
                </select>
              </label>
              <label className="label">
                Subject
                <textarea className="textarea compactTextarea" value={form.subject} onChange={(event) => updateField("subject", event.target.value)} />
              </label>
              <label className="label">
                Body
                <textarea className="textarea promptTextarea" value={form.body} onChange={(event) => updateField("body", event.target.value)} />
              </label>
              <div className="row" style={{ marginTop: 12 }}>
                <button className="button buttonPrimary" type="button" onClick={() => void generateDraft()} disabled={!selectedRowId || isWorking}>Generate Recovery Draft</button>
                <button className="button" type="button" onClick={() => void saveReview()} disabled={!selectedRowId || isWorking}>Save Review</button>
                <button className="button" type="button" onClick={() => void setStatus("sent")} disabled={!selectedRowId || isWorking}>Mark Sent</button>
                <button className="button" type="button" onClick={() => void setStatus("returned")} disabled={!selectedRowId || isWorking}>Mark Returned</button>
                <button className="button" type="button" onClick={() => void setStatus("lost")} disabled={!selectedRowId || isWorking}>Mark Lost</button>
              </div>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
