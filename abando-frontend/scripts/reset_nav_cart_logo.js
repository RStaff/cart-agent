const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "..", "src", "components", "Navbar.tsx");

const src = String.raw`"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

const NAV_LINKS: { label: string; href: string }[] = [
  { label: "Demo", href: "/demo/playground" },
  { label: "Pricing", href: "/pricing" },
  { label: "Onboarding", href: "/onboarding" },
  { label: "Support", href: "/support" },
];

export default function Navbar() {
  const [open, setOpen] = React.useState(false);

  return (
    <header className="nav-root">
      <div className="nav-inner">
        <Link href="/" className="nav-logo">
          <Image
            src="/abando-logo.png"
            alt="Abando logo"
            width={28}
            height={28}
            className="nav-logo-img"
          />
          <span className="nav-logo-text">
            Abando<span className="nav-logo-mark">™</span>
          </span>
        </Link>

        <button
          className="nav-toggle"
          type="button"
          aria-label="Toggle navigation"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="nav-toggle-bar" />
          <span className="nav-toggle-bar" />
        </button>

        <nav className={`nav-links ${open ? "nav-links--open" : ""}`}>
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="nav-link">
              {link.label}
            </Link>
          ))}

          <Link href="/marketing/demo/playground" className="nav-link nav-link--secondary">
            Open Interactive Demo
          </Link>
          <Link href="/trial" className="nav-link nav-link--primary">
            Start AI Revenue Trial
          </Link>
        </nav>
      </div>

      <style jsx>{`
        .nav-root {
          position: sticky;
          top: 0;
          z-index: 40;
          background: rgba(2, 6, 23, 0.96);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(148, 163, 184, 0.25);
        }

        .nav-inner {
          max-width: 1120px;
          margin: 0 auto;
          padding: 12px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .nav-logo {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
        }

        .nav-logo-img {
          display: block;
        }

        .nav-logo-text {
          font-weight: 700;
          font-size: 1.1rem;
          letter-spacing: 0.04em;
          color: #e5e7eb;
        }

        .nav-logo-mark {
          font-size: 0.7rem;
          vertical-align: super;
          margin-left: 1px;
        }

        .nav-toggle {
          display: none;
          flex-direction: column;
          gap: 4px;
          background: transparent;
          border: none;
          padding: 4px;
          cursor: pointer;
        }

        .nav-toggle-bar {
          width: 18px;
          height: 2px;
          border-radius: 999px;
          background: #e5e7eb;
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 18px;
          font-size: 0.95rem;
        }

        .nav-link {
          text-decoration: none;
          color: #e5e7eb;
          opacity: 0.85;
          padding: 6px 0;
        }

        .nav-link:hover {
          opacity: 1;
        }

        .nav-link--secondary {
          padding: 6px 14px;
          border-radius: 999px;
          border: 1px solid rgba(148, 163, 184, 0.6);
          font-weight: 500;
        }

        .nav-link--primary {
          padding: 7px 18px;
          border-radius: 999px;
          font-weight: 600;
          background: #6366f1;
          color: #ffffff;
        }

        .nav-link--primary:hover {
          background: #4f46e5;
        }

        @media (max-width: 768px) {
          .nav-inner {
            padding-inline: 16px;
          }

          .nav-toggle {
            display: inline-flex;
          }

          .nav-links {
            position: absolute;
            inset-inline: 0;
            top: 100%;
            padding: 10px 16px 14px;
            background: rgba(2, 6, 23, 0.98);
            border-bottom: 1px solid rgba(148, 163, 184, 0.25);
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
            transform-origin: top;
            transform: scaleY(0.8);
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.16s ease, transform 0.16s ease;
          }

          .nav-links--open {
            opacity: 1;
            transform: scaleY(1);
            pointer-events: auto;
          }

          .nav-link--secondary,
          .nav-link--primary {
            width: 100%;
            text-align: center;
          }
        }
      `}</style>
    </header>
  );
}
`;

fs.writeFileSync(file, src, "utf8");
console.log("✅ Navbar.tsx reset to cart+AI logo version:", file);
