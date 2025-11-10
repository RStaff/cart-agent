import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
  return (
    <header className="nav-wrap">
      <div className="nav-inner">
        <Link href="/" className="nav-brand" aria-label="Abando home">
          <Image src="/abando-logo.png" alt="Abando logo" width={28} height={28} priority />
          <span className="nav-wordmark">Abando</span><sup>™</sup>
        </Link>
        <nav className="nav-links" aria-label="Primary">
          <Link className="nav-link" href="/demo/playground">Open demo</Link>
          <Link className="nav-link" href="/pricing">Pricing</Link>
          <Link className="nav-link" href="/onboarding">Onboarding</Link>
          <Link className="nav-link" href="/support">Support</Link>
        </nav>
        <div className="nav-ctas">
          <Link className="btn btn-ghost" href="/demo/playground">Try the demo</Link>
          <Link className="btn btn-primary" href="/onboarding">Start free trial</Link>
        </div>
      </div>
    </header>
  );
}
