"use client";

import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
  return (
    <header className="border-b border-slate-800 bg-slate-950/70 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand: cart + AI logo + wordmark */}
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/abando-logo.png"
              alt="Abando logo"
              width={30}
              height={30}
              className="h-7 w-auto"
              priority
            />
            <span className="text-base font-semibold tracking-tight text-slate-50">
              Abando
            </span>
          </Link>
        </div>

        {/* Center nav */}
        <nav className="hidden items-center gap-8 text-sm font-medium text-slate-200 sm:flex">
          <Link href="/pricing" className="hover:text-white">
            Pricing
          </Link>
          <Link href="/onboarding" className="hover:text-white">
            Onboarding
          </Link>
          <Link href="/support" className="hover:text-white">
            Support
          </Link>
        </nav>

        {/* Right: demo + trial + static Shopify badge */}
        <div className="flex items-center gap-3">
          <Link
            href="/marketing/demo/playground"
            className="hidden sm:inline-flex rounded-full border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-100 hover:border-slate-400 hover:text-slate-50"
          >
            Open demo
          </Link>
          <Link
            href="/trial"
            className="inline-flex rounded-full bg-indigo-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-400"
          >
            Start free trial
          </Link>
          <span className="hidden sm:inline-flex items-center">
            <Image
              src="/shopify.svg"
              alt="Shopify Partner"
              width={88}
              height={24}
              className="h-6 w-auto select-none"
            />
          </span>
        </div>
      </div>
    </header>
  );
}
