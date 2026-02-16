import './App.css'

function App() {
  return (
    <main style={{ maxWidth: 780, margin: "48px auto", padding: "0 16px", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: 8 }}>Abando Frontend Build</h1>
      <p style={{ color: "#444", lineHeight: 1.5 }}>
        This build artifact is managed for static hosting checks. The canonical Shopify runtime is served by the backend
        at <code>/app</code> and <code>/embedded</code>.
      </p>
      <div style={{ display: "flex", gap: 12, marginTop: 20, flexWrap: "wrap" }}>
        <a href="/pricing">Pricing</a>
        <a href="/onboarding">Onboarding</a>
        <a href="/support">Support</a>
      </div>
    </main>
  )
}

export default App
