import './globals.css';
import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Abando – AI Shopping Copilot',
  description: 'Recover more checkouts with Abando.',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="dark">
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
