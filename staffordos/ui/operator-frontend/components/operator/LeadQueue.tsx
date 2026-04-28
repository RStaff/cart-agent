"use client";

import { useEffect, useState } from "react";

type Lead = {
  id: string;
  name?: string;
  domain?: string;
  product?: string;
  lifecycle_stage?: string;
  status?: {
    current_stage?: string;
    next_action?: string;
  };
};

export function LeadQueue() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/operator/lead-registry", { cache: "no-store" });
    const json = await res.json();

    if (!res.ok || !json?.ok) {
      throw new Error("Failed to load canonical lead registry");
    }

    setLeads(json.registry?.items || []);
  }

  async function runAction(leadId: string, action: string) {
    const res = await fetch("/api/operator/lead-registry/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId, action })
    });

    const json = await res.json();

    if (!res.ok || !json?.ok) {
      throw new Error(json?.error || "Action failed");
    }

    await load();
  }

  useEffect(() => {
    let mounted = true;

    load()
      .catch((err) => {
        if (mounted) setError(err instanceof Error ? err.message : "Load failed");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return <div className="panel"><div className="panelInner">Loading leads…</div></div>;
  }

  if (error) {
    return <div className="panel"><div className="panelInner">{error}</div></div>;
  }

  return (
    <section className="panel">
      <div className="panelInner">
        <h2 className="sectionTitle">Lead Queue (Canonical)</h2>

        <div className="tableWrap">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Product</th>
                <th>Stage</th>
                <th>Next Action</th>
                <th>Send Proof</th>
                <th>Operator Action</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => {
                const stage = l.lifecycle_stage || l.status?.current_stage || "unknown";

                return (
                  <tr key={l.id}>
                    <td>{l.name || l.domain || l.id}</td>
                    <td>{l.product || "unknown"}</td>
                    <td>{stage}</td>
                    <td>{l.status?.next_action || "Review"}</td>
                    <td>
                      {l.execution?.latest_send_proof_id ? (
                        <span className="hint">
                          {l.execution.latest_send_proof_status || "proof_recorded"} / {l.execution.latest_send_proof_id}
                        </span>
                      ) : (
                        <span className="hint">No proof</span>
                      )}
                    </td>
                    <td>
                      {stage === "contact_needed" || stage === "cold" ? (
                        <button className="chip" onClick={() => runAction(l.id, "move_to_outreach")}>
                          Move to outreach
                        </button>
                      ) : stage === "send_initial_outreach" ? (
                        <button className="chip" onClick={() => runAction(l.id, "mark_sent")}>
                          Mark sent
                        </button>
                      ) : stage === "sent" ? (
                        <button className="chip" onClick={() => runAction(l.id, "mark_engaged")}>
                          Mark engaged
                        </button>
                      ) : (
                        <span className="hint">No action</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
