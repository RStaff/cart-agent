import "./globals.css";
import React from "react";
import InstallCTA from "@/components/InstallCTA";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        {/* Install CTA */}
        <InstallCTA sticky />
      </body>
    </html>
  );
}
