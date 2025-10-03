"use client";

import Link from "next/link";

const links = [
  { href: "/demo/playground", label: "Demo" },
  { href: "/pricing", label: "Pricing" },
  { href: "/onboarding", label: "Onboarding" },
  { href: "/support", label: "Support" },
];

export default function NavbarV2() {
  return (
    <div className="sticky top-0 z-50 bg-[rgba(11,18,32,.95)] backdrop-blur border-b border-white/10">
      <nav className="h-16 max-w-[1120px] mx-auto px-4 flex items-center justify-between">
        <Link href="/" aria-label="Abando home" className="flex items-center gap-2 text-slate-100 no-underline">
          <img src="/abando-logo.png" alt="" width="28" height="28" className="block" />
          <span className="font-bold">Abando</span><sup className="text-xs text-slate-400 ml-0.5">™</sup>
        </Link>
        <div className="hidden sm:flex items-center gap-6">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm text-slate-300 hover:text-slate-100">
              {l.label}
            </Link>
          ))}
        </div>
        <div className="hidden md:flex items-center gap-2">
          <Link href="/demo/playground" className="btn btn-ghost">Open demo</Link>
          <Link href="/onboarding?trial=1" className="btn btn-primary">Start free trial</Link>
        </div>
      </nav>
    </div>
  );
}
