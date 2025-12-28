export default function HomePage() {
  return (
    <main style={{ padding: "3rem", maxWidth: 720, margin: "0 auto" }}>
      <h1>Abando</h1>
      <p>
        Abando helps Shopify stores recover abandoned checkouts using intelligent,
        conversational follow-ups.
      </p>

      <div style={{ marginTop: "2rem" }}>
        <a
          href="/demo/playground"
          style={{
            padding: "0.75rem 1.25rem",
            background: "#000",
            color: "#fff",
            textDecoration: "none",
            borderRadius: 6,
            marginRight: 12,
            display: "inline-block",
          }}
        >
          Try the demo
        </a>

        <a
          href="/embedded"
          style={{
            padding: "0.75rem 1.25rem",
            border: "1px solid #000",
            color: "#000",
            textDecoration: "none",
            borderRadius: 6,
            display: "inline-block",
          }}
        >
          Open app
        </a>
      </div>
    </main>
  );
}
