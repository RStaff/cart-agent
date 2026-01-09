import Link from "next/link";
export default function NotFound() {
  return (
    <main style={{ maxWidth: 760, margin: "64px auto", padding: "0 16px" }}>
      <h1 style={{ marginBottom: 8 }}>Page not found</h1>
      <p style={{ color: "#94a3b8" }}>
        The page you’re looking for doesn’t exist. Try the demo or head back
        home.
      </p>
      <div style={{ marginTop: 16 }}>
        <Link href="/" style={{ textDecoration: "underline" }}>
          Home
        </Link>
        <span style={{ margin: "0 8px" }}>•</span>
        <Link href="/demo/playground" style={{ textDecoration: "underline" }}>
          Open demo
        </Link>
      </div>
    </main>
  );
}
