import "./globals.css";
import { inter } from "./fonts";
import "../styles/brand-overrides.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Abando — AI Cart Recovery",
  description: "Recover more checkouts with Abando.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
      {/* ABANDO_DEMO_GLOBAL_STYLES */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        body {
          margin: 0;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
            sans-serif;
          background-color: #020617; /* dark slate */
          color: #f9fafb;            /* near-white text */
        }
        main.min-h-screen {
          min-height: 100vh;
        }
        .abando-demo-shell {
          max-width: 72rem;
          margin: 0 auto;
          padding: 2.5rem 1rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .abando-demo-card {
          border-radius: 0.75rem;
          border: 1px solid #1e293b;
          background: rgba(15,23,42,0.7);
          padding: 1rem;
        }
          `,
        }}
      />
{children}</body>
    </html>
  );
}
