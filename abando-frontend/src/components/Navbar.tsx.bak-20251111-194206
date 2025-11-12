import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
  return (
    <header className="site-header" role="banner" aria-label="Primary">
      <div className="navRow" role="navigation" aria-label="Main">
        {/* LEFT — Brand */}
        <div className="brand">
          <Link href="/" className="brandLink" aria-label="Abando home">
            <Image
              src="/brand/abando-mark.svg"
              alt="Abando"
              width={24}
              height={24}
              priority
            />
            <span className="brandName">Abando</span>
            <span className="brandTm">™</span>
          </Link>
        </div>

        {/* CENTER — Links (no demo here) */}
        <nav className="midLinks" aria-label="Primary links">
          <Link href="/pricing">Pricing</Link>
          <Link href="/onboarding">Onboarding</Link>
          <Link href="/support">Support</Link>
        </nav>

        {/* RIGHT — CTAs */}
        <div className="ctaGroup" aria-label="Actions">
          <Link href="/demo/playground" className="btn secondary">Open demo</Link>
          <Link href="/trial" className="btn primary">Start free trial</Link>
        </div>
      </div>
    </header>
  );
}
