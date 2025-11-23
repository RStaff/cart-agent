"use client";

import Link from "next/link";
import Image from "next/image";

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
        
<Link href="/" className="flex items-center gap-2">
  <Image
    src="/brand/abando-logo-transparent.png"
    alt="Abando™ logo"
    width={32}
    height={32}
    className="h-8 w-auto"
    priority
  />
  <span className="text-sm font-semibold tracking-tight text-slate-100">
    Abando™
  </span>
</Link>

        <div className="hidden sm:flex items-center gap-6">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm text-slate-300 hover:text-slate-100">
              {l.label}
            </Link>
          ))}
        </div>
        <div className="hidden md:flex items-center gap-2">
          <Link href="/demo/playground" data-cta="open_demo" className="inline-flex items-center rounded-md px-3 py-2 text-sm font-medium bg-slate-700 hover:bg-slate-600 text-white shadow-sm">Open demo</Link>
          <Link href="/onboarding?trial=1&plan=basic" data-cta="start_free_trial" className="inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold bg-indigo-500 hover:bg-indigo-400 text-white shadow-sm">Start free trial</Link>
        </div>
      </nav>
    </div>
  );
}
