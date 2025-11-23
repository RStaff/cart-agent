export default function Home() {
  return (
    <main
      style={{
        padding: "40px",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <h1>Abando – Dev Landing</h1>
      <p>This is the temporary landing page for the Abando dev environment.</p>

      <ul>
        <li>
          <a href="/command-center">Go to Command Center →</a>
        </li>
      </ul>

      <p style={{ marginTop: "24px", fontSize: "14px", opacity: 0.7 }}>
        Backend health: <code>http://localhost:3000/health</code>
      </p>
    </main>
  );
}
