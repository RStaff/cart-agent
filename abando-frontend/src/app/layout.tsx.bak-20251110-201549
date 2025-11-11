import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  adjustFontFallback: true,
  fallback: ["system-ui","Arial"],
  variable: "--font-sans",
});
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Abando – AI Shopping Copilot",
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
      <head>
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
