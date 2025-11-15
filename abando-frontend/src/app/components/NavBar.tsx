"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/demo/playground", label: "Demo" },
  { href: "/command-center", label: "Command Center" },
];

function classNames(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export default function NavBar() {
  const pathname = usePathname();

  return (
    <header className="border-b border-slate-800/70 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 md:px-6">
        {/* Left: logo + wordmark */}
        <Link href="/" className="flex items-center gap-2">
          <div className="relative h-8 w-8 overflow-hidden rounded-md border border-slate-700 bg-slate-900">
            <Image
              src="/abando-logo.png"
              alt="Abando logo"
              fill
              className="object-contain p-0.5"
              priority
            />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-tight text-slate-50">
              Abando
            </span>
            <span className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
              AI Cart Recovery
            </span>
          </div>
        </Link>

        {/* Right: nav links + CTA + Shopify badge */}
        <nav className="flex items-center gap-3 md:gap-6">
          {navItems.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname?.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={classNames(
                  "text-xs md:text-sm transition-colors",
                  active
                    ? "text-amber-300"
                    : "text-slate-300 hover:text-amber-200"
                )}
              >
                {item.label}
              </Link>
            );
          })}

          {/* Primary CTA (internal link, not Shopify) */}
          <Link
            href="/demo/playground"
            className="hidden rounded-full bg-amber-400 px-3 py-1.5 text-xs font-semibold text-slate-950 shadow-sm hover:bg-amber-300 md:inline-flex"
          >
            Open demo
          </Link>

          {/* Shopify Partner badge – purely visual for now */}
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
