import IntentTracker from "../lib/intent";import Script from "next/script";import "./globals.css"
import React from "react";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body><IntentTracker />{process.env.NEXT_PUBLIC_ANALYTICS==="plausible"?(<Script defer data-domain={(process.env.NEXT_PUBLIC_ANALYTICS_DOMAIN||"abando.ai")} src="https://plausible.io/js/script.js" />):null}{children}</body>
    </html>
  );
}
