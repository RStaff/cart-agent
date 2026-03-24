import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StaffordOS Operator Console",
  description: "Minimal StaffordOS operator frontend for Ross.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
