<<<<<<< HEAD
import InstallCTA from "@/components/InstallCTA";
=======
import "./globals.css";
import { inter } from "./fonts";
import { Inter } from "next/font/google";

import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Abando – AI Shopping Copilot",
  description: "Recover more checkouts with Abando.",
  icons: { icon: "/favicon.ico" },
};
>>>>>>> origin/main

import "../styles/brand-overrides.css";
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link
          rel="preload"
          as="image"
          href="/badges/shopify-logo-darkbg.svg"
          imageSizes="(min-width:1px) 24px"
        />
        <link
          rel="preload"
          href="/badges/shopify-logo-darkbg.svg"
          as="image"
          type="image/svg+xml"
        />
      </head>
      <body
        className={
          `dark`.includes("inter.className")
            ? "dark"
            : `${inter.className} dark`
        }
      >
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
