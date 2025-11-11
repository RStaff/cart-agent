// NOTE: production-grade navbar — brand left, links center, CTAs right
'use client';

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`site-header ${scrolled ? "is-scrolled" : ""}`} role="banner">
      <div className="container navRow">
        {/* Brand */}
        <Link href="/" className="brandLink" aria-label="Abando home">
          <span className="brandMark" aria-hidden="true">🛒</span>
          <span className="brandName">Abando</span>
          <span className="tm" aria-hidden="true">™</span>
        </Link>

        {/* Center nav */}
        <nav className="navCenter" aria-label="Primary">
          <Link className="nav-link" href="/demo">Demo</Link>
          <Link className="nav-link" href="/pricing">Pricing</Link>
          <Link className="nav-link" href="/onboarding">Onboarding</Link>
          <Link className="nav-link" href="/support">Support</Link>
        </nav>

        <div className="spacer" aria-hidden="true" />

        {/* Right CTAs */}
        <div className="ctaRow">
          <Link className="btn btnGhost" href="/demo/playground">Open demo</Link>
          <Link className="btn btnPrimary" href="/trial">Start free trial</Link>
        </div>
      </div>
    </header>
  );
}
