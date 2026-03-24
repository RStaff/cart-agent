"use client";

import { useEffect, useState } from "react";

type LeadItem = {
  id: string;
  leadName: string;
  productSource: string;
  status: string;
  lastActivity: string;
  nextAction: string;
};

type LeadQueueResponse = {
  ok?: boolean;
  placeholder?: boolean;
  source?: string;
  leads?: LeadItem[];
};

export function LeadQueue() {
  const [data, setData] = useState<LeadQueueResponse | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadQueue() {
      try {
        const response = await fetch("/api/leads/queue", {
          method: "GET",
          cache: "no-store",
        });
        const payload = (await response.json()) as LeadQueueResponse;

        if (!response.ok || !payload?.ok) {
          throw new Error("Lead queue request failed.");
        }

        if (isMounted) {
          setData(payload);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Could not load the leads queue.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadQueue();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <section className="panel">
        <div className="panelInner">
          <h2 className="sectionTitle">Lead Queue</h2>
          <p className="subtitle" style={{ marginTop: 0 }}>
            Loading StaffordOS lead queue.
          </p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="panel errorPanel">
        <div className="panelInner">
          <h2 className="sectionTitle">Lead Queue</h2>
          <p className="subtitle" style={{ marginTop: 0 }}>
            {error}
          </p>
        </div>
      </section>
    );
  }

  const leads = Array.isArray(data?.leads) ? data.leads : [];

  return (
    <section className="panel">
      <div className="panelInner">
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h2 className="sectionTitle" style={{ marginBottom: 0 }}>
            Lead Queue
          </h2>
          <p className="hint">{data?.placeholder ? "Placeholder queue data" : "Live queue data"}</p>
        </div>

        {data?.placeholder ? (
          <div className="emptyState" style={{ marginTop: 0, marginBottom: 16 }}>
            <p className="emptyStateLabel">Stub endpoint</p>
            <p className="emptyStateText">
              `GET /api/leads/queue` is currently a StaffordOS stub endpoint. Replace it with a real cross-product queue when the leads backend is ready.
            </p>
          </div>
        ) : null}

        {leads.length === 0 ? (
          <div className="emptyState" style={{ marginTop: 0 }}>
            <p className="emptyStateLabel">Empty queue</p>
            <p className="emptyStateText">No leads are currently available.</p>
          </div>
        ) : (
          <div className="tableWrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Lead Name</th>
                  <th>Product Source</th>
                  <th>Status</th>
                  <th>Last Activity</th>
                  <th>Next Action</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id}>
                    <td>{lead.leadName}</td>
                    <td>{lead.productSource}</td>
                    <td>{lead.status}</td>
                    <td>{lead.lastActivity}</td>
                    <td>{lead.nextAction}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
