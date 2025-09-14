import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Abando – Recover abandoned carts with AI",
  description: "Cart Agent follows up across email and chat to recover revenue.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
