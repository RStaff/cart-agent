'use client';
import Link from 'next/link';
import Image from 'next/image';

export default function Navbar() {
  return (
    <header className="navWrap">
      <div className="container navRow">
        {/* Brand */}
        <Link href="/" className="brandLink" aria-label="Abando home">
          <Image src="/abando-logo.png" alt="Abando" width={30} height={30} priority />
          <span className="brandTxt">Abando</span>
          <sup className="tm">™</sup>
        </Link>

        {/* Center nav links (text only) */}
        <nav className="navLinks" aria-label="Primary">
          <Link href="/demo/playground" className="nav-link">Demo</Link>
          <Link href="/pricing"          className="nav-link">Pricing</Link>
          <Link href="/onboarding"       className="nav-link">Onboarding</Link>
          <Link href="/support"          className="nav-link">Support</Link>
        </nav>

        {/* Right CTAs */}
        <div className="navCtas">
          <Link href="/demo/playground" className="btn btnGhost">Open demo</Link>
          <Link href="/onboarding"      className="btn btnPrimary">Start free trial</Link>
        </div>
      </div>
    </header>
  );
}
