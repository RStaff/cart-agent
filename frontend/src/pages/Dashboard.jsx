import { useEffect, useState } from "react";

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    fetch("/api/metrics").then(r => r.json()).then(setMetrics).catch(console.error);
    fetch("/api/carts/recent").then(r => r.json()).then(setRecent).catch(console.error);
  }, []);

  return (
    <div style={{ fontFamily: "system-ui", padding: 16, maxWidth: 960, margin: "0 auto" }}>
      <h1>Cart Agent — Dashboard</h1>
      {metrics ? (
        <div style={{ display: "flex", gap: 16, margin: "16px 0" }}>
          <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: "#666" }}>Total carts</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{metrics.total}</div>
          </div>
          <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: "#666" }}>Last 7 days</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{metrics.last7Days}</div>
          </div>
        </div>
      ) : <p>Loading metrics…</p>}

      <h2 style={{ marginTop: 24 }}>Recent carts</h2>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", borderBottom: "1px solid #eee", padding: 8 }}>ID</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #eee", padding: 8 }}>Checkout</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #eee", padding: 8 }}>Email</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #eee", padding: 8 }}>Total</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #eee", padding: 8 }}>Created</th>
            </tr>
          </thead>
          <tbody>
            {recent.map(r => (
              <tr key={r.id}>
                <td style={{ borderBottom: "1px solid #f5f5f5", padding: 8 }}>{r.id}</td>
                <td style={{ borderBottom: "1px solid #f5f5f5", padding: 8 }}>{r.checkoutId}</td>
                <td style={{ borderBottom: "1px solid #f5f5f5", padding: 8 }}>{r.email}</td>
                <td style={{ borderBottom: "1px solid #f5f5f5", padding: 8 }}>${Number(r.totalPrice).toFixed(2)}</td>
                <td style={{ borderBottom: "1px solid #f5f5f5", padding: 8 }}>
                  {new Date(r.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
