"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import Image from "next/image";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  // lock body scroll when menu open (mobile)
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <header className="nav">
      <div className="nav__inner">
        {/* Left: brand */}
        <div className="nav__left">
          <Link href="/" className="nav__brand" aria-label="Abando Home">
            <Image src="/logo-mark.svg" alt="" width={28} height={28} className="nav__logo" />
            <span className="nav__brandText">Abando<span className="nav__tm">™</span></span>
          </Link>
        </div>

        {/* Center: links */}
        <nav className={`nav__center ${open ? "is-open": ""}`} aria-label="Primary">
          <Link href="/demo/playground" className="nav__link">Demo</Link>
          <Link href="/pricing" className="nav__link">Pricing</Link>
          <Link href="/onboarding" className="nav__link">Onboarding</Link>
          <Link href="/support" className="nav__link">Support</Link>
          <Link href="/v1" className="nav__link">Open Interactive Demo</Link>
        </nav>

        {/* Right: call-to-actions */}
        <div className="nav__right">
          <Link href="/trial" className="wolf-btn-primary nav__cta">Start AI Revenue Trial</Link>
          <button
            className="nav__burger"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      {/* mobile drawer */}
      <div className={`nav__drawer ${open ? "is-open" : ""}`}>
        <Link onClick={() => setOpen(false)} href="/demo/playground" className="nav__drawerLink">Demo</Link>
        <Link onClick={() => setOpen(false)} href="/pricing" className="nav__drawerLink">Pricing</Link>
        <Link onClick={() => setOpen(false)} href="/onboarding" className="nav__drawerLink">Onboarding</Link>
        <Link onClick={() => setOpen(false)} href="/support" className="nav__drawerLink">Support</Link>
        <Link onClick={() => setOpen(false)} href="/v1" className="nav__drawerLink">Open Interactive Demo</Link>
        <Link onClick={() => setOpen(false)} href="/trial" className="wolf-btn-primary nav__drawerCta">Start AI Revenue Trial</Link>
      </div>

      <style jsx>{`
        .nav { position: sticky; top: 0; z-index: 50; backdrop-filter: saturate(120%) blur(6px); }
        .nav__inner {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 16px;
          padding: 14px min(5vw,24px);
          border-bottom: 1px solid rgba(212,175,55,0.14);
          background: rgba(5,8,13,0.85);
        }
        .nav__left { display:flex; align-items:center; }
        .nav__brand { display:flex; align-items:center; gap:10px; text-decoration:none; }
        .nav__brandText { font-weight: 700; letter-spacing: .2px; }
        .nav__tm { font-size: .65em; opacity: .6; margin-left: 2px; }

        .nav__center { display:flex; justify-content:center; gap: 22px; }
        .nav__link { opacity:.9; text-decoration:none; }
        .nav__link:hover { opacity:1; text-decoration:underline; }

        .nav__right { display:flex; justify-content:flex-end; align-items:center; gap: 12px; }
        .nav__cta { display:none; }
        .nav__burger {
          display:inline-flex; flex-direction:column; gap:4px;
          background:transparent; border:0; padding:6px; cursor:pointer;
        }
        .nav__burger span { width:22px; height:2px; background:#cbd5e1; transition:.2s; }

        /* mobile drawer (hidden by default) */
        .nav__drawer { display:none; }
        .nav__drawer.is-open {
          display:flex; flex-direction:column; gap:10px;
          background: rgba(5,8,13,.98);
          border-bottom:1px solid rgba(212,175,55,0.14);
          padding: 12px min(5vw,24px) 16px;
        }
        .nav__drawerLink { padding:8px 0; text-decoration:none; }
        .nav__drawerCta { margin-top:8px; align-self:flex-start; }

        /* ≥ 980px: show desktop layout fully */
        @media (min-width: 980px) {
          .nav__cta { display:inline-flex; }
          .nav__burger { display:none; }
          .nav__drawer { display:none !important; }
        }
      `}</style>
    </header>
  );
}
