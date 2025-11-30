import React from "react";

export const metadata = {
  title: "Abando",
  description: "Abando – AI cart recovery and checkout agent",
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
