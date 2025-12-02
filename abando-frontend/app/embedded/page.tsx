"use client";

import React, { useEffect, useState } from "react";

type SegmentSummary = {
  segment: string;
  urgency: string;
  risk: string;
  event_count: string;
  total_value: string;
};

type RecentEvent = {
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
  segments: SegmentSummary[];
  recent: RecentEvent[];
};

const containerStyle = {
  minHeight: "100vh",
  padding: "1.5rem",
  fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
  backgroundColor: "#020617", // slate-950
  color: "#e5e7eb", // gray-200
};

const cardStyle = {
  maxWidth: "900px",
  margin: "0 auto",
  backgroundColor: "#020617", // slate-950
  borderRadius: "0.75rem",
  border: "1px solid #1f2937",
  padding: "1.25rem",
  boxShadow: "0 10px 40px rgba(0,0,0,0.6)",
};

const headerRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "0.75rem",
};

const titleStyle = {
  fontSize: "1.1rem",
  fontWeight: 600,
  letterSpacing: "0.03em",
  display: "flex",
  alignItems: "center",
  gap: "0.4rem",
};

const badgeStyle = {
  fontSize: "0.65rem",
  textTransform: "uppercase" as const,
  padding: "0.1rem 0.35rem",
  borderRadius: "999px",
  backgroundColor: "#111827",
  border: "1px solid #374151",
  color: "#9ca3af",
};

const subtitleStyle = {
  fontSize: "0.8rem",
  color: "#9ca3af",
  marginBottom: "0.75rem",
};

const sectionTitleStyle = {
  fontSize: "0.85rem",
  fontWeight: 500,
  color: "#9ca3af",
  marginBottom: "0.5rem",
};

const summaryRowStyle = {
  display: "flex",
  flexWrap: "wrap" as const,
  gap: "0.75rem",
  marginBottom: "1rem",
};

const pillStyleBase = {
  borderRadius: "999px",
  padding: "0.45rem 0.8rem",
  fontSize: "0.7rem",
  border: "1px solid #1f2937",
  backgroundColor: "#020617",
  display: "flex",
  flexDirection: "column" as const,
  gap: "0.15rem",
};

const labelStyle = {
  fontSize: "0.6rem",
  textTransform: "uppercase" as const,
  letterSpacing: "0.1em",
  color: "#6b7280",
};

const valueStyle = {
  fontSize: "0.8rem",
  fontWeight: 500,
  color: "#e5e7eb",
};

const tableWrapperStyle = {
  marginTop: "0.5rem",
  borderRadius: "0.5rem",
  border: "1px solid #1f2937",
  overflow: "hidden",
};

const tableStyle = {
  borderCollapse: "collapse" as const,
  width: "100%",
  fontSize: "0.8rem",
  backgroundColor: "#020617",
};

const thStyle = {
  borderBottom: "1px solid #1f2937",
  textAlign: "left" as const,
  padding: "0.5rem 0.75rem",
  fontWeight: 500,
  fontSize: "0.7rem",
  color: "#9ca3af",
};

const tdStyle = {
  borderBottom: "1px solid #020617",
  padding: "0.5rem 0.75rem",
  fontSize: "0.75rem",
};

const tagStyleBase = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.25rem",
  borderRadius: "999px",
  padding: "0.15rem 0.5rem",
  fontSize: "0.65rem",
  border: "1px solid transparent",
};

const segmentTagStyle = {
  ...tagStyleBase,
  borderColor: "#374151",
  backgroundColor: "#020617",
};

const urgencyTagStyle = {
  ...tagStyleBase,
  borderColor: "#4b5563",
  backgroundColor: "#020617",
};

const riskTagStyle = {
  ...tagStyleBase,
  borderColor: "#b91c1c",
  backgroundColor: "#1f2937",
  color: "#fecaca",
};

const footerStyle = {
  marginTop: "0.75rem",
  fontSize: "0.7rem",
  color: "#6b7280",
  display: "flex",
  justifyContent: "space-between",
  gap: "0.5rem",
  flexWrap: "wrap" as const,
};

export default function EmbeddedDashboardPage() {
  // For now, we hardcode dev-store to keep the build simple and stable
  const storeId = "dev-store";

  const [data, setData] = useState<SegmentsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const base = (process.env.NEXT_PUBLIC_ABANDO_API_BASE || "").replace(/\/$/, "");
    if (!base) {
      setError("NEXT_PUBLIC_ABANDO_API_BASE is not configured.");
      setLoading(false);
      return;
    }

    const url = `${base}/api/ai-segments/${encodeURIComponent(storeId)}`;

    async function fetchSegments() {
      try {
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const json = (await res.json()) as SegmentsResponse;
        setData(json);
      } catch (err: any) {
        console.error("Failed to fetch AI segments:", err);
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchSegments();
  }, [storeId]);

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={headerRowStyle}>
          <div>
            <div style={titleStyle}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "1.4rem",
                  height: "1.4rem",
                  borderRadius: "999px",
                  border: "1px solid #4b5563",
                  fontSize: "0.8rem",
                }}
              >
                🐺
              </span>
              <span>Abando – AI Segments</span>
              <span style={badgeStyle}>dev-store</span>
            </div>
            <div style={subtitleStyle}>
              Live AI segmentation view for{" "}
              <span style={{ fontWeight: 500, color: "#e5e7eb" }}>dev-store</span>. This is the
              embedded dashboard your merchants will see inside Shopify.
            </div>
          </div>
        </div>

        {loading && (
          <div style={{ fontSize: "0.8rem", color: "#9ca3af" }}>
            Loading AI segments from <code>/api/ai-segments/dev-store</code>…
          </div>
        )}

        {error && !loading && (
          <div
            style={{
              marginTop: "0.5rem",
              padding: "0.5rem 0.75rem",
              borderRadius: "0.5rem",
              border: "1px solid #7f1d1d",
              backgroundColor: "#450a0a",
              color: "#fecaca",
              fontSize: "0.8rem",
            }}
          >
            <strong style={{ fontWeight: 600 }}>API Error:</strong> {error}
          </div>
        )}

        {!loading && !error && data && (
          <>
            {/* Summary bubbles */}
            <div style={sectionTitleStyle}>Segment Summary</div>
            <div style={summaryRowStyle}>
              <div style={pillStyleBase}>
                <span style={labelStyle}>Primary Segment</span>
                <span style={valueStyle}>
                  {data.segments[0]?.segment ?? "low_value"} ·{" "}
                  <span style={{ color: "#9ca3af", fontWeight: 400 }}>
                    {data.segments[0]?.event_count ?? "0"} events
                  </span>
                </span>
              </div>
              <div style={pillStyleBase}>
                <span style={labelStyle}>Total Value</span>
                <span style={valueStyle}>${data.segments[0]?.total_value ?? "0.00"}</span>
              </div>
              <div style={pillStyleBase}>
                <span style={labelStyle}>Urgency</span>
                <span style={valueStyle}>{data.segments[0]?.urgency ?? "normal"}</span>
              </div>
              <div style={pillStyleBase}>
                <span style={labelStyle}>Risk</span>
                <span style={valueStyle}>{data.segments[0]?.risk ?? "standard"}</span>
              </div>
            </div>

            {/* Recent events table */}
            <div style={sectionTitleStyle}>Recent Cart + Checkout Signals</div>
            <div style={tableWrapperStyle}>
              {data.recent.length === 0 ? (
                <div style={{ padding: "0.75rem", fontSize: "0.8rem", color: "#9ca3af" }}>
                  No recent events yet. Once shoppers start hitting checkout, they’ll appear here.
                </div>
              ) : (
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Time</th>
                      <th style={thStyle}>Event</th>
                      <th style={thStyle}>Value</th>
                      <th style={thStyle}>Segment</th>
                      <th style={thStyle}>Urgency</th>
                      <th style={thStyle}>Risk</th>
                      <th style={thStyle}>Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent.map((e, idx) => (
                      <tr key={idx}>
                        <td style={tdStyle}>
                          {new Date(e.created_at).toLocaleString(undefined, {
                            month: "short",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td style={tdStyle}>{e.event_type}</td>
                        <td style={tdStyle}>${e.value}</td>
                        <td style={tdStyle}>
                          {e.segment ? (
                            <span style={segmentTagStyle}>
                              <span
                                style={{
                                  width: "0.35rem",
                                  height: "0.35rem",
                                  borderRadius: "999px",
                                  backgroundColor: "#22c55e",
                                }}
                              />
                              {e.segment}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td style={tdStyle}>
                          {e.urgency ? (
                            <span style={urgencyTagStyle}>{e.urgency}</span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td style={tdStyle}>
                          {e.risk ? (
                            <span style={riskTagStyle}>
                              <span>●</span>
                              {e.risk}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td style={tdStyle}>{e.note || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div style={footerStyle}>
              <div>
                Powered by{" "}
                <span style={{ fontWeight: 500, color: "#e5e7eb" }}>Abando AI Segments</span>. This
                view is safe to embed directly in the Shopify admin.
              </div>
              <div>Store: {data.storeId}</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
