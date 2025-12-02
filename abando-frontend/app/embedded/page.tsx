"use client";

import { useEffect, useState } from "react";

type SegmentRow = {
  segment: string | null;
  urgency: string | null;
  risk: string | null;
  event_count: string;      // comes back as string from Postgres
  total_value: string;      // string too
};

type RecentRow = {
  created_at: string;
  event_type: string;
  value: string;
  segment: string | null;
  urgency: string | null;
  risk: string | null;
  note: string | null;
};

type SegmentsResponse = {
  ok: boolean;
  storeId: string;
  segments: SegmentRow[];
  recent: RecentRow[];
};

const API_BASE =
  process.env.NEXT_PUBLIC_ABANDO_API_BASE ?? "https://pay.abando.ai";

export default function EmbeddedDashboardPage() {
  const [data, setData] = useState<SegmentsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`${API_BASE}/api/ai-segments/dev-store`);
        if (!res.ok) {
          throw new Error(`API error: ${res.status}`);
        }

        const json = (await res.json()) as SegmentsResponse;
        setData(json);
      } catch (err: any) {
        console.error("Failed to load segments:", err);
        setError(err?.message ?? "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) {
    return (
      <div style={rootStyle}>
        <h1 style={titleStyle}>Abando – AI Segments</h1>
        <p style={subtleTextStyle}>Loading live segment data…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={rootStyle}>
        <h1 style={titleStyle}>Abando – AI Segments</h1>
        <p style={{ ...subtleTextStyle, color: "#b91c1c" }}>
          Error loading data: {error}
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={rootStyle}>
        <h1 style={titleStyle}>Abando – AI Segments</h1>
        <p style={subtleTextStyle}>No data available yet.</p>
      </div>
    );
  }

  return (
    <div style={rootStyle}>
      <h1 style={titleStyle}>Abando – AI Segments</h1>
      <p style={subtleTextStyle}>
        Store: <strong>{data.storeId}</strong>
      </p>

      {/* Segment Summary */}
      <section style={{ marginTop: "1.5rem" }}>
        <h2 style={sectionTitleStyle}>Segment Summary</h2>
        {data.segments.length === 0 ? (
          <p style={subtleTextStyle}>No events have been logged yet.</p>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Segment</th>
                <th style={thStyle}>Urgency</th>
                <th style={thStyle}>Risk</th>
                <th style={thStyle}>Events</th>
                <th style={thStyle}>Total Value</th>
              </tr>
            </thead>
            <tbody>
              {data.segments.map((row, idx) => (
                <tr key={idx}>
                  <td style={tdStyle}>{row.segment ?? "—"}</td>
                  <td style={tdStyle}>{row.urgency ?? "—"}</td>
                  <td style={tdStyle}>{row.risk ?? "—"}</td>
                  <td style={tdStyle}>{row.event_count}</td>
                  <td style={tdStyle}>${row.total_value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Recent Events */}
      <section style={{ marginTop: "2rem" }}>
        <h2 style={sectionTitleStyle}>Recent Events</h2>
        {data.recent.length === 0 ? (
          <p style={subtleTextStyle}>No recent events recorded.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {data.recent.map((row, idx) => (
              <li key={idx} style={eventCardStyle}>
                <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                  {new Date(row.created_at).toLocaleString()}
                </div>
                <div style={{ marginTop: "0.25rem", fontWeight: 500 }}>
                  {row.event_type} · ${row.value}
                </div>
                <div style={{ marginTop: "0.25rem", fontSize: "0.85rem" }}>
                  <strong>Segment:</strong> {row.segment ?? "—"} ·{" "}
                  <strong>Urgency:</strong> {row.urgency ?? "—"} ·{" "}
                  <strong>Risk:</strong> {row.risk ?? "—"}
                </div>
                {row.note && (
                  <div
                    style={{
                      marginTop: "0.25rem",
                      fontSize: "0.85rem",
                      color: "#4b5563",
                    }}
                  >
                    {row.note}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

// --- Inline styles (keeps this file dependency-free) ---

const rootStyle: React.CSSProperties = {
  padding: "1.5rem",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, system-ui, -system-ui, "Segoe UI", sans-serif',
  backgroundColor: "#0b0b0c",
  color: "#f9fafb",
  minHeight: "100vh",
};

const titleStyle: React.CSSProperties = {
  fontSize: "1.5rem",
  fontWeight: 600,
};

const subtleTextStyle: React.CSSProperties = {
  fontSize: "0.9rem",
  color: "#9ca3af",
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: "1.1rem",
  fontWeight: 600,
  marginBottom: "0.5rem",
};

const tableStyle: React.CSSProperties = {
  borderCollapse: "collapse",
  width: "100%",
  fontSize: "0.9rem",
  backgroundColor: "#111827",
  borderRadius: "0.5rem",
  overflow: "hidden",
};

const thStyle: React.CSSProperties = {
  borderBottom: "1px solid #374151",
  textAlign: "left",
  padding: "0.5rem 0.75rem",
  fontWeight: 500,
  fontSize: "0.8rem",
  color: "#9ca3af",
};

const tdStyle: React.CSSProperties = {
  borderBottom: "1px solid #1f2937",
  padding: "0.5rem 0.75rem",
};

const eventCardStyle: React.CSSProperties = {
  padding: "0.75rem 0.85rem",
  borderRadius: "0.5rem",
  backgroundColor: "#111827",
  border: "1px solid #1f2937",
  marginBottom: "0.5rem",
};
