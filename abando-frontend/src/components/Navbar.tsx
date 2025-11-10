'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) =>
    pathname === href || (href !== '/' && pathname?.startsWith(href));

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className="nav" role="banner">
      <div className="nav__inner">
        {/* Left: Brand */}
        <Link href="/" className="brand" aria-label="Abando home">
          <Image
            src="/brand/abando-mark.svg"
            width={24}
            height={24}
            alt="Abando logo"
            aria-hidden
            priority
          />
          <span className="brand__text">Abando</span>
          <span className="brand__tm" aria-hidden>™</span>
        </Link>

        {/* Mobile toggle */}
        <button
          className="nav__toggle"
          aria-label="Toggle menu"
          aria-expanded={open ? 'true' : 'false'}
          aria-controls="primary-navigation"
          onClick={() => setOpen(v => !v)}
        >
          <span className="nav__bar" />
          <span className="nav__bar" />
          <span className="nav__bar" />
        </button>

        {/* Center: Links */}
        <nav
          id="primary-navigation"
          className={`nav__links ${open ? 'is-open' : ''}`}
          aria-label="Primary"
        >
          <Link href="/demo/playground" className={`nav__link ${isActive('/demo') || isActive('/demo/playground') ? 'is-active' : ''}`}>Demo</Link>
          <Link href="/pricing" className={`nav__link ${isActive('/pricing') ? 'is-active' : ''}`}>Pricing</Link>
          <Link href="/onboarding" className={`nav__link ${isActive('/onboarding') ? 'is-active' : ''}`}>Onboarding</Link>
          <Link href="/support" className={`nav__link ${isActive('/support') ? 'is-active' : ''}`}>Support</Link>

          {/* Mobile-only CTAs appear inside the dropdown */}
          <div className="nav__cta nav__cta--mobile">
            <Link href="/demo/playground" className="btn btn--ghost">Open demo</Link>
            <Link href="/trial" className="btn btn--primary">Start free trial</Link>
          </div>
        </nav>

        {/* Right: CTAs (desktop) */}
        <div className="nav__cta nav__cta--desktop">
          <Link href="/demo/playground" className="btn btn--ghost">Open demo</Link>
          <Link href="/trial" className="btn btn--primary">Start free trial</Link>
        </div>
      </div>

      <style jsx>{`
        .nav {
          position: sticky; top: 0; z-index: 60;
          background: rgba(10,12,16,0.9);
          backdrop-filter: saturate(120%) blur(8px);
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .nav__inner {
          max-width: 1200px; margin: 0 auto;
          display: grid; grid-template-columns: auto 1fr auto;
          align-items: center; gap: 12px; padding: 12px 20px;
        }

        .brand { display: inline-flex; align-items: center; gap: 8px; color:#e6ebff; text-decoration: none; font-weight:700; }
        .brand__text { font-size: 18px; letter-spacing: .2px; }
        .brand__tm { font-size: 10px; opacity: .7; transform: translateY(-4px); }

        .nav__toggle { display:none; background:transparent; border:0; padding:8px; border-radius:8px; }
        .nav__toggle:focus-visible { outline:2px solid #7aa2ff; outline-offset:2px; }
        .nav__bar { width:22px; height:2px; background:#cfd7ff; margin:4px 0; border-radius:2px; }

        .nav__links { display:flex; align-items:center; justify-content:center; gap:18px; }
        .nav__link {
          color:#cfd7ff; text-decoration:none; font-size:14px; padding:8px 6px; line-height:1; border-radius:6px; white-space:nowrap;
        }
        .nav__link:hover { color:#fff; }
        .nav__link:focus-visible { outline:2px solid #7aa2ff; outline-offset:2px; }
        .nav__link.is-active { color:#fff; background:rgba(124,156,255,.12); }

        .nav__cta { display:flex; align-items:center; gap:10px; }
        .nav__cta--mobile { display:none; }
        .btn {
          display:inline-flex; align-items:center; justify-content:center;
          height:36px; padding:0 14px; border-radius:10px; font-weight:600; text-decoration:none; white-space:nowrap;
        }
        .btn--primary { background:#5b7dff; color:#fff; box-shadow:0 8px 20px rgba(91,125,255,.25); }
        .btn--primary:hover { filter:brightness(1.07); }
        .btn--primary:focus-visible { outline:2px solid #7aa2ff; outline-offset:2px; }
        .btn--ghost { color:#e6ebff; border:1px solid rgba(198,205,255,.35); background:transparent; }
        .btn--ghost:hover { border-color:rgba(198,205,255,.6); color:#fff; }

        @media (max-width: 960px) {
          .nav__inner { grid-template-columns: auto auto 1fr; }
          .nav__toggle { display:inline-flex; }
          .nav__links {
            position:absolute; left:0; right:0; top:100%;
            display:none; flex-direction:column; align-items:flex-start; gap:8px;
            padding:10px 20px 14px;
            background:rgba(10,12,16,.98);
            border-bottom:1px solid rgba(255,255,255,.06);
          }
          .nav__links.is-open { display:flex; }
          .nav__cta--desktop { display:none; }
          .nav__cta--mobile { display:flex; width:100%; gap:8px; margin-top:8px; }
          .nav__cta--mobile .btn { width:100%; justify-content:center; }
        }
      `}</style>
    </header>
  );
}
