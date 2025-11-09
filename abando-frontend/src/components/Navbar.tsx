"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header">
      <nav className="nav">
        <div className="nav__brand">
          <Link href="/" className="brand">
            Abando<span className="tm">™</span>
          </Link>
        </div>

        <button
          className="nav__toggle"
          aria-label="Toggle menu"
          aria-expanded={open ? "true" : "false"}
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>

        <div className={`nav__links ${open ? "is-open" : ""}`}>
          <Link href="/demo" className="navlink">Demo</Link>
          <Link href="/pricing" className="navlink">Pricing</Link>
          <Link href="/onboarding" className="navlink">Onboarding</Link>
          <Link href="/support" className="navlink">Support</Link>
          <Link href="/demo/playground" className="navlink">Open Interactive Demo</Link>
          <Link href="/trial" className="navlink cta">Start AI Revenue Trial</Link>
        </div>
      </nav>

      <style jsx>{`
        /* Container */
        .site-header {
          position: sticky;
          top: 0;
          z-index: 50;
          background: #0b0b0c; /* matches your dark theme */
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          max-width: 1120px;
          margin: 0 auto;
          padding: 12px 20px;
          gap: 16px;
        }

        /* Brand */
        .brand {
          display: inline-flex;
          align-items: center;
          font-weight: 700;
          letter-spacing: .2px;
          color: #f5f6f7;
          text-decoration: none;
          font-size: 18px;
          line-height: 1;
        }
        .tm {
          font-size: 10px;
          margin-left: 2px;
          opacity: .7;
          vertical-align: super;
        }

        /* Links row */
        .nav__links {
          display: flex;
          align-items: center;
          gap: 18px;
          flex-wrap: wrap;
        }
        .navlink {
          display: inline-block;
          padding: 8px 6px;
          text-decoration: none;
          color: #d6d7dc;
          font-size: 14px;
          line-height: 1.2;
          border-radius: 6px;
        }
        .navlink:hover {
          color: var(--performance-gold, #D4AF37);
          background: rgba(255,255,255,0.03);
        }
        .navlink.cta {
          padding: 8px 12px;
          border: 1px solid rgba(212,175,55,0.35);
          color: #f0f1f2;
        }
        .navlink.cta:hover {
          box-shadow: 0 0 0 2px rgba(212,175,55,0.12), inset 0 0 0 1px rgba(212,175,55,0.4);
        }

        /* Mobile toggle */
        .nav__toggle {
          display: none;
          background: transparent;
          border: 0;
          width: 40px;
          height: 32px;
          padding: 0;
          margin: 0;
          cursor: pointer;
          flex-shrink: 0;
          align-items: center;
          justify-content: center;
          gap: 5px;
          flex-direction: column;
        }
        .nav__toggle span {
          display: block;
          width: 22px;
          height: 2px;
          background: #e9eaee;
          border-radius: 2px;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .nav {
            padding: 10px 16px;
          }
          .nav__toggle {
            display: flex;
          }
          .nav__links {
            display: none;
            position: absolute;
            left: 0;
            right: 0;
            top: 56px;
            background: #0b0b0c;
            border-top: 1px solid rgba(255,255,255,0.06);
            padding: 10px 16px 14px;
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }
          .nav__links.is-open {
            display: flex;
          }
        }
      `}</style>
    </header>
  );
}
