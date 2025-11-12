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
      <body className={inter.className}>{children}</body>
    </html>
  );
}
