import Image from "next/image";
import Link from "next/link";

export default function EmbeddedShellPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#050811",
        color: "#e5e7eb",
        fontFamily:
          'system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
      }}
    >
      <header
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          backgroundColor: "#050811",
          padding: "16px 24px",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div
          style={{
            maxWidth: "1120px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "24px",
          }}
        >
          {/* Left: Abando logo + wordmark (smaller) */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flex: "0 0 auto",
            }}
          >
            <Image
              src="/brand/abando-logo-transparent.png"
              alt="Abando™ logo"
              width={40}
              height={40}
              priority
            />
            <span
              style={{
                fontSize: "14px",
                fontWeight: 600,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#e5e7eb",
                whiteSpace: "nowrap",
              }}
            >
              Abando™
            </span>
          </div>

          {/* Center nav */}
          <nav
            style={{
              display: "flex",
              alignItems: "center",
              gap: "24px",
              fontSize: "14px",
              flex: "0 0 auto",
            }}
          >
            <Link
              href="/demo"
              style={{ textDecoration: "none", color: "#e5e7eb" }}
            >
              Demo
            </Link>
            <Link
              href="/pricing"
              style={{ textDecoration: "none", color: "#e5e7eb" }}
            >
              Pricing
            </Link>
            <Link
              href="/onboarding"
              style={{ textDecoration: "none", color: "#e5e7eb" }}
            >
              Onboarding
            </Link>
            <Link
              href="/support"
              style={{ textDecoration: "none", color: "#e5e7eb" }}
            >
              Support
            </Link>
          </nav>

          {/* Right: Proud Shopify Partner */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flex: "0 0 auto",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                color: "#9ca3af",
                whiteSpace: "nowrap",
              }}
            >
              Proud Shopify Partner
            </span>
            <Image
              src="/brand/shopify-logo-white.png"
              alt="Shopify logo"
              width={72}
              height={22}
            />
          </div>
        </div>
      </header>

      <main
        style={{
          maxWidth: "720px",
          margin: "0 auto",
          padding: "48px 24px 64px",
        }}
      >
        <p
          style={{
            fontSize: "11px",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "#9ca3af",
            marginBottom: "12px",
          }}
        >
          ABANDO™ FOR SHOPIFY
        </p>

        <h1
          style={{
            fontSize: "32px",
            lineHeight: 1.1,
            fontWeight: 600,
            marginBottom: "16px",
          }}
        >
          Abando Embedded App Shell
        </h1>

        <p
          style={{
            fontSize: "15px",
            color: "#d1d5db",
            lineHeight: 1.6,
            marginBottom: "24px",
          }}
        >
          This subdomain is reserved for Abando&apos;s Shopify embedded app.
          Merchants normally access it from within their Shopify admin, not
          directly.
        </p>

        <section
          style={{
            borderRadius: "10px",
            border: "1px solid rgba(148,163,184,0.35)",
            background:
              "radial-gradient(circle at top left, rgba(56,189,248,0.12), transparent 60%)",
            padding: "16px 18px",
            fontSize: "14px",
            color: "#e5e7eb",
          }}
        >
          <p
            style={{
              fontWeight: 500,
              marginBottom: "6px",
            }}
          >
            Next step (implementation note)
          </p>
          <p
            style={{
              lineHeight: 1.6,
            }}
          >
            Configure your Abando plan and cart segments from the dashboard.
            For now this shell confirms that{" "}
            <code
              style={{
                backgroundColor: "rgba(15,23,42,0.8)",
                padding: "2px 4px",
                borderRadius: "4px",
                fontSize: "12px",
              }}
            >
              https://app.abando.ai/embedded
            </code>{" "}
            is reachable by Shopify.
          </p>
        </section>

        <footer
          style={{
            marginTop: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            fontSize: "12px",
            color: "#9ca3af",
            flexWrap: "wrap",
          }}
        >
          <span>© {new Date().getFullYear()} Abando™</span>
          <div style={{ display: "flex", gap: "16px" }}>
            <Link
              href="/legal/terms"
              style={{ color: "#9ca3af", textDecoration: "none" }}
            >
              Terms
            </Link>
            <Link
              href="/legal/privacy"
              style={{ color: "#9ca3af", textDecoration: "none" }}
            >
              Privacy
            </Link>
            <Link
              href="/legal/dpa"
              style={{ color: "#9ca3af", textDecoration: "none" }}
            >
              DPA
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
