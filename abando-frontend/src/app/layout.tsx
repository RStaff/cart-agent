import { Montserrat, Inter } from "next/font/google";import IntentTracker from "../lib/intent";import Script from "next/script";import "./globals.css"
import React from "react";

const heading = Montserrat({ subsets:["latin"], weight:["700","800"], variable:"--font-heading" });
const body = Inter({ subsets:["latin"], weight:["400","500"], variable:"--font-body" });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`dark  `}><IntentTracker />{process.env.NEXT_PUBLIC_ANALYTICS==="plausible" ? (<Script defer data-domain={(process.env.NEXT_PUBLIC_ANALYTICS_DOMAIN||"abando.ai")} src="https://plausible.io/js/script.js" />) : null}<IntentTracker />{process.env.NEXT_PUBLIC_ANALYTICS==="plausible"?(<Script defer data-domain={(process.env.NEXT_PUBLIC_ANALYTICS_DOMAIN||"abando.ai")} src="https://plausible.io/js/script.js" />):null}{children}</body>
    </html>
  );
}
