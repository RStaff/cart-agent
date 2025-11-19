// app/embedded/page.tsx
export default function EmbeddedPage() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>Abando Embedded Shell</h1>
      <p>
        If you can see this, <code>/embedded</code> is wired correctly to the app
        frontend in production.
      </p>
    </main>
  );
}
