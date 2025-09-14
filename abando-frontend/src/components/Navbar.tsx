"use client";
import Image from "next/image";
import Link from "next/link";

const links = [
  { href: "/#how", label: "How it works" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#faq", label: "FAQ" },
];

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur">
      <nav className="container flex h-14 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="Abando" width={26} height={26} priority className="rounded-sm" />
          <span className="font-semibold text-slate-800">Abando</span>
        </Link>
        <div className="hidden gap-6 sm:flex">
          {links.map(l => (
            <a key={l.href} href={l.href} className="text-sm text-slate-600 hover:text-slate-900">{l.label}</a>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Link href="/demo" className="btn btn-ghost">Open demo</Link>
          <Link href="/trial" className="btn btn-primary">Start free trial</Link>
        </div>
      </nav>
    </header>
  );
}
