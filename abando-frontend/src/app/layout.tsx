import InstallCTA from "@/components/InstallCTA";

import "../styles/brand-overrides.css";
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
