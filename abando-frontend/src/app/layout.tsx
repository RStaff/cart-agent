import "./globals.css";
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import type { Metadata } from "next";


export const metadata: Metadata = {
  title: "Abando – AI Shopping Copilot",
  description: "Recover more checkouts with Abando.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="dark">
        <Navbar />
        <main>{children}</main>
        <Footer />
        <footer className="page_footer__ZP1xQ">
          <div className="page_container__s52HK">
            <small>© 2025 Abando<sup>™</sup> · <a href="/legal/terms">Terms</a> · <a href="/legal/privacy">Privacy</a> · <a href="/legal/dpa">DPA</a></small>
          </div>
        </footer>
      </body>
    </html>
  );
}
