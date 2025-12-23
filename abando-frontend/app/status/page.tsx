export const dynamic = "force-dynamic";

function safe(v: string | undefined, fallback = "NOT_SET") {
  return (v && v.trim().length > 0) ? v : fallback;
}

export default function StatusPage() {
  const billingMode = safe(process.env.NEXT_PUBLIC_BILLING_MODE, "stub");
  const backendUrl = safe(process.env.NEXT_PUBLIC_CART_AGENT_API_BASE, "NOT_SET");

  // Placeholder value signals (wire later)
  const recovered = safe(process.env.NEXT_PUBLIC_DEMO_RECOVERED_REVENUE, "$0");
  const carts = safe(process.env.NEXT_PUBLIC_DEMO_ABANDONED_CARTS, "0");

  return (
    <main style={{ maxWidth: 860, margin: "40px auto", padding: "0 16px", fontFamily: "system-ui" }}>
      <h1 style={{ marginBottom: 8 }}>Abando Status</h1>
      <p style={{ marginTop: 0, opacity: 0.8 }}>
        This page exists to make Abando feel like real software: installed, billable, and value-visible.
      </p>

      <div style={{ display: "grid", gap: 12 }}>
        <section style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
          <h2 style={{ marginTop: 0 }}>Install</h2>
          <p style={{ marginBottom: 0 }}>If you can see this page inside the embedded app, install routing is working.</p>
        </section>

        <section style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
          <h2 style={{ marginTop: 0 }}>Billing</h2>
          <p style={{ margin: "8px 0" }}><b>Mode:</b> {billingMode}</p>
          <p style={{ margin: "8px 0" }}><b>Backend:</b> {backendUrl}</p>
          <p style={{ marginBottom: 0, opacity: 0.8 }}>
            When billing is live, this page should reflect the active plan + access state.
          </p>
        </section>

        <section style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
          <h2 style={{ marginTop: 0 }}>Value Signal (placeholder)</h2>
          <p style={{ margin: "8px 0" }}><b>Recovered:</b> {recovered}</p>
          <p style={{ margin: "8px 0" }}><b>Abandoned carts detected:</b> {carts}</p>
          <p style={{ marginBottom: 0, opacity: 0.8 }}>
            Wire this to real data once the backend is producing it.
          </p>
        </section>
      </div>
    </main>
  );
}
