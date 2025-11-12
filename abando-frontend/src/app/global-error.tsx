"use client";
export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <html>
      <body>
        <main style={{maxWidth: 720, margin: "6rem auto", padding: "0 1rem", color: "#e5e7eb"}}>
          <h1 style={{fontSize: "1.5rem", fontWeight: 800, marginBottom: 8}}>App crashed</h1>
          <p style={{opacity: .8, marginBottom: 24}}>{error?.message ?? "Unexpected error."}</p>
          <button onClick={reset} style={{borderRadius: 8, padding: "10px 14px", background: "#6E56CF", color: "#fff"}}>Reload</button>
        </main>
      </body>
    </html>
  );
}
