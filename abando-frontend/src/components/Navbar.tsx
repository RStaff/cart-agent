"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 2);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`site-header${scrolled ? " is-scrolled" : ""}`}>
      <div className="container navRow" role="navigation" aria-label="Main">
        {/* Brand (LEFT) */}
        <Link href="/" className="brandLink" aria-label="Abando home">
          <span className="brandMark">
            <Image
              src="/logo/cart-wolf.svg"
              alt=""
              width={24}
              height={24}
              priority
            />
          </span>
          <span className="brandText">Abando</span>
          <span className="tm">™</span>
        </Link>

        {/* Primary links (CENTER) — no "Demo" link to avoid duplication */}
        <nav className="primaryNav" aria-label="Primary">
          <Link href="/pricing">Pricing</Link>
          <Link href="/onboarding">Onboarding</Link>
          <Link href="/support">Support</Link>
        </nav>

        {/* CTAs (RIGHT) — single Demo CTA + primary Start trial */}
        <div className="ctaRow" role="group" aria-label="Actions">
          <Link href="/demo/playground" className="btn ghost">Open demo</Link>
          <Link href="/trial" className="btn primary">Start free trial</Link>
        </div>
      </div>
    </header>
  );
}
