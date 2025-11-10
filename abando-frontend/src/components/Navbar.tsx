"use client";
import Link from "next/link";
import Image from "next/image";

const nav = [
  { href: "/demo/playground", label: "Demo" },
  { href: "/pricing", label: "Pricing" },
  { href: "/onboarding", label: "Onboarding" },
  { href: "/support", label: "Support" },
];

export default function Navbar() {
  return (
    <header className="w-full sticky top-0 z-50 bg-[rgba(12,12,14,0.85)] backdrop-blur border-b border-slate-800/60">
      <nav className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          {/* Correct logo path */}
          <Image
            src="/abando-logo.png"
            alt="Abando logo"
            width={28}
            height={28}
            priority
          />
          <span className="text-slate-100 font-semibold tracking-wide">Abando</span>
          <sup className="text-slate-400 text-xs">TM</sup>
        </Link>

        <ul className="hidden md:flex items-center gap-6">
          {nav.map((n) => (
            <li key={n.href}>
              <Link href={n.href} className="nav__link hover:underline">
                {n.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/demo/playground" className="underline">Open demo</Link>
          <Link href="/onboarding" className="wolf-btn-primary">Start free trial</Link>
        </div>

        {/* Mobile */}
        <div className="md:hidden">
          <details>
            <summary className="cursor-pointer text-slate-200">Menu</summary>
            <div className="mt-2 flex flex-col gap-2">
              {nav.map((n) => (
                <Link key={n.href} href={n.href} className="underline">{n.label}</Link>
              ))}
              <Link href="/demo/playground" className="underline">Open demo</Link>
              <Link href="/onboarding" className="wolf-btn-primary inline-block text-center">Start free trial</Link>
            </div>
          </details>
        </div>
      </nav>
    </header>
  );
}
