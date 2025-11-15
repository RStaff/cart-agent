"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/demo/playground", label: "Demo" },
  { href: "/command-center", label: "Command Center" },
  { href: "/#pricing", label: "Pricing" },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:py-4">
        {/* Logo block – uses your real PNG, no wolf nonsense */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/abando-logo.png"
            alt="Abando logo"
            width={28}
            height={28}
            className="rounded-md"
            priority
          />
          <span className="text-sm font-semibold tracking-tight text-slate-50">
            Abando
          </span>
        </Link>

        <nav className="flex items-center gap-4 md:gap-6">
          {navLinks.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "hidden md:inline-block text-xs font-medium transition-colors",
                  active
                    ? "text-slate-50"
                    : "text-slate-400 hover:text-slate-100",
                ].join(" ")}
              >
                {item.label}
              </Link>
            );
          })}

          {/* Primary CTA – internal link only */}
          <Link
            href="/demo/playground"
            className="hidden rounded-full bg-amber-400 px-3 py-1.5 text-xs font-semibold text-slate-950 shadow-sm hover:bg-amber-300 md:inline-flex"
          >
            Open demo
          </Link>

          {/* Shopify Partner badge – purely visual */}
          <div className="hidden items-center gap-1 rounded-full border border-slate-700/80 bg-slate-900 px-2.5 py-1 md:flex">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-300">
              Shopify Partner
            </span>
          </div>
        </nav>
      </div>
    </header>
  );
}

export default NavBar;
