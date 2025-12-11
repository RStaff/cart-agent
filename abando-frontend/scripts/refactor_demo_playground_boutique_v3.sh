#!/bin/bash

set -e

TARGET="app/demo/playground/page.tsx"
BACKUP="${TARGET}.bak-$(date +%Y%m%d-%H%M%S)"

echo "[demo] Backing up existing ${TARGET} -> ${BACKUP}"
mkdir -p "$(dirname "$TARGET")"
cp "$TARGET" "$BACKUP" 2>/dev/null || true

cat > "$TARGET" << 'TSX'
import React from "react";
import Link from "next/link";

export default function DemoPlaygroundPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-16 lg:flex-row lg:gap-12">
        {/* LEFT: Hero narrative */}
        <section className="flex-1 rounded-3xl border border-slate-800 bg-slate-950/70 p-8 lg:p-10">
          <p className="text-[11px] font-semibold tracking-[0.24em] text-emerald-300">
            ABANDO DEMO · WOMEN&apos;S BOUTIQUE APPAREL
          </p>
          <h1 className="mt-4 text-3xl font-semibold leading-tight sm:text-4xl">
            See how Abando reads shopper behavior
            <br className="hidden sm:block" /> and turns it into recovered
            orders.
          </h1>

          <p className="mt-5 text-sm leading-relaxed text-slate-300">
            This demo uses a women&apos;s boutique apparel store as an example.
            In production, Abando watches what shoppers view, search, and leave
            in their cart, then groups those sessions into a few clear behavior
            patterns instead of treating everyone who abandoned the same way.
          </p>

          <div className="mt-6 space-y-2 text-sm text-slate-300">
            <p className="font-semibold text-slate-100">
              You&apos;ll see three things:
            </p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>
                How Abando segments shoppers instead of blasting discounts.
              </li>
              <li>
                Three high-impact hesitation patterns for boutique shoppers.
              </li>
              <li>
                A 7-day snapshot of extra orders recovered from those plays.
              </li>
            </ol>
          </div>
        </section>

        {/* RIGHT: What this demo is + Next steps */}
        <aside className="w-full max-w-md space-y-4 lg:w-80">
          <section className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
            <p className="text-[11px] font-semibold tracking-[0.24em] text-slate-300">
              WHAT THIS DEMO IS (AND ISN&apos;T)
            </p>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              This isn&apos;t a fake &ldquo;AI magic&rdquo; animation. It&apos;s
              a realistic sketch of how Abando observes boutique shopper
              sessions, groups them into patterns, and shows the impact in plain
              numbers.
            </p>
            <p className="mt-3 text-sm text-slate-300">
              The goal is for your team to say,{" "}
              <em>
                &ldquo;Okay, we can see what&apos;s happening with our
                shoppers—and we know which three plays to run next.&rdquo;
              </em>
            </p>
          </section>

          <section className="rounded-3xl border border-emerald-500/40 bg-slate-950/80 p-6">
            <p className="text-[11px] font-semibold tracking-[0.24em] text-emerald-300">
              WHAT YOU&apos;D DO NEXT WITH ABANDO
            </p>
            <ol className="mt-3 space-y-2 text-sm text-slate-200">
              <li>1. Connect your Shopify store (about 1–2 minutes).</li>
              <li>
                2. Let Abando quietly observe a week of traffic and learn your
                shopper patterns.
              </li>
              <li>
                3. Turn on 2–3 plays for your strongest patterns first, then
                expand from there.
              </li>
            </ol>

            <div className="mt-5 space-y-2">
              <Link
                href="/marketing/women-boutique/playbook"
                className="inline-flex w-full items-center justify-center rounded-lg bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-300"
              >
                See full boutique growth plan
              </Link>
              <Link
                href="/marketing"
                className="inline-flex w-full items-center justify-center rounded-lg border border-emerald-400/60 px-4 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/10"
              >
                See other verticals
              </Link>
              <p className="text-[10px] text-emerald-200/80">
                Most merchants start by improving one pattern (like cart
                parkers), then expand to additional plays as recovered orders
                grow.
              </p>
            </div>
          </section>
        </aside>
      </div>

      <div className="mx-auto flex max-w-6xl flex-col gap-14 px-4 pb-20">
        {/* SECTION 1 – Why segments */}
        <section className="rounded-3xl border border-slate-800 bg-slate-950/80 p-8">
          <p className="text-[11px] font-semibold tracking-[0.24em] text-slate-400">
            1 · WHY SEGMENTS INSTEAD OF &quot;EVERYONE WHO ABANDONED&quot;?
          </p>
          <h2 className="mt-3 text-xl font-semibold text-slate-50">
            Some shoppers are almost ready. Others are still browsing.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            Not every abandoned cart is the same. Some shoppers are checking
            outfits on their phone at work. Others park items while they wait
            for payday. Treating them all the same leads to noisy discounts and
            trained bargain hunters.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            Abando focuses on a small set of{" "}
            <span className="text-emerald-300">
              clear shopper patterns
            </span>
            . That keeps your strategy simple, measurable, and easy to iterate
            on with your team.
          </p>
        </section>

        {/* SECTION 2 – Three patterns */}
        <section className="rounded-3xl border border-slate-800 bg-slate-950/80 p-8">
          <p className="text-[11px] font-semibold tracking-[0.24em] text-slate-400">
            2 · THREE HIGH-IMPACT PATTERNS IN THIS BOUTIQUE DEMO
          </p>
          <h2 className="mt-3 text-xl font-semibold text-slate-50">
            Today&apos;s key patterns in this boutique demo
          </h2>
          <p className="mt-2 text-sm text-slate-300">
            Names are for clarity, not jargon. Each pattern is just a different
            kind of hesitation Abando knows how to respond to.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {/* Pattern 1 */}
            <div className="rounded-2xl border border-emerald-500/30 bg-slate-950/80 p-5">
              <p className="text-[11px] font-semibold tracking-[0.24em] text-emerald-300">
                PATTERN 1 · CART PARKERS
              </p>
              <h3 className="mt-2 text-sm font-semibold text-slate-50">
                They park pieces &quot;to think about it&quot;
              </h3>

              <p className="mt-3 text-[11px] font-semibold tracking-[0.16em] text-slate-400">
                WHAT&apos;S REALLY GOING ON
              </p>
              <p className="mt-1 text-sm text-slate-300">
                Shopper likes the item but isn&apos;t sure about fit, occasion,
                or total spend. They&apos;re mentally trying on outfits and need
                reassurance more than a bigger coupon.
              </p>

              <p className="mt-3 text-[11px] font-semibold tracking-[0.16em] text-slate-400">
                HOW ABANDO RESPONDS
              </p>
              <p className="mt-1 text-sm text-slate-300">
                Sends a delayed nudge like{" "}
                <span className="italic">
                  &quot;Still love this look? Here&apos;s how other customers
                  styled it.&quot;
                </span>{" "}
                instead of a generic 10%-off blast.
              </p>
            </div>

            {/* Pattern 2 */}
            <div className="rounded-2xl border border-emerald-500/30 bg-slate-950/80 p-5">
              <p className="text-[11px] font-semibold tracking-[0.24em] text-emerald-300">
                PATTERN 2 · SIZE CHECKERS
              </p>
              <h3 className="mt-2 text-sm font-semibold text-slate-50">
                They bounce between sizes &amp; size charts
              </h3>

              <p className="mt-3 text-[11px] font-semibold tracking-[0.16em] text-slate-400">
                WHAT&apos;S REALLY GOING ON
              </p>
              <p className="mt-1 text-sm text-slate-300">
                Fear of ordering the wrong size, especially on dresses, denim,
                and fitted tops. They pause until they feel confident they
                won&apos;t have to hassle with returns.
              </p>

              <p className="mt-3 text-[11px] font-semibold tracking-[0.16em] text-slate-400">
                HOW ABANDO RESPONDS
              </p>
              <p className="mt-1 text-sm text-slate-300">
                Plays that lead with sizing confidence and fit proof (reviews
                mentioning size, photos, try-at-home messaging) in emails or
                onsite banners.
              </p>
            </div>

            {/* Pattern 3 */}
            <div className="rounded-2xl border border-emerald-500/30 bg-slate-950/80 p-5">
              <p className="text-[11px] font-semibold tracking-[0.24em] text-emerald-300">
                PATTERN 3 · DROP WATCHERS
              </p>
              <h3 className="mt-2 text-sm font-semibold text-slate-50">
                They wait for new arrivals or a better deal
              </h3>

              <p className="mt-3 text-[11px] font-semibold tracking-[0.16em] text-slate-400">
                WHAT&apos;S REALLY GOING ON
              </p>
              <p className="mt-1 text-sm text-slate-300">
                Shopper is engaged with the brand but habitually waits for a
                signal—new drop, low-stock alert, or limited-time offer—before
                committing.
              </p>

              <p className="mt-3 text-[11px] font-semibold tracking-[0.16em] text-slate-400">
                HOW ABANDO RESPONDS
              </p>
              <p className="mt-1 text-sm text-slate-300">
                Gentle urgency plays tied to low-stock sizes, bundle
                suggestions, or{" "}
                <span className="italic">"last chance for this collection"</span>{" "}
                instead of constant promos.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 3 – Weekly snapshot */}
        <section className="rounded-3xl border border-slate-800 bg-slate-950/80 p-8">
          <p className="text-[11px] font-semibold tracking-[0.24em] text-slate-400">
            3 · WHAT THIS MEANS OVER A WEEK
          </p>
          <div className="mt-3 flex items-baseline justify-between gap-4">
            <h2 className="text-xl font-semibold text-slate-50">
              7-day recovered orders snapshot
            </h2>
            <p className="text-xs text-emerald-300">
              42 orders · $4,880{" "}
              <span className="text-emerald-200/80">(demo week)</span>
            </p>
          </div>

          <p className="mt-3 text-sm text-slate-300">
            This example boutique recovers a handful of extra outfits per
            day—small lifts that add up. In a live account, this view is driven
            by your real Shopify data and lets you compare patterns like cart
            parkers vs. drop watchers.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            {[
              { day: "Mon", orders: 3 },
              { day: "Tue", orders: 5 },
              { day: "Wed", orders: 6 },
              { day: "Thu", orders: 5 },
              { day: "Fri", orders: 7 },
              { day: "Sat", orders: 8 },
              { day: "Sun", orders: 8 },
            ].map((d) => (
              <div
                key={d.day}
                className={`flex h-20 w-24 flex-col items-center justify-center rounded-full border border-emerald-500/70 bg-emerald-500/80 text-slate-950 shadow-lg ${
                  d.day === "Wed" ? "ring-2 ring-emerald-300" : ""
                }`}
              >
                <span className="text-sm font-semibold">{d.day}</span>
                <span className="text-xs">{d.orders} orders</span>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-emerald-500/40 bg-slate-950/80 p-5">
            <p className="text-[11px] font-semibold tracking-[0.24em] text-emerald-300">
              HIGHLIGHT OF THE DAY
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-50">
              Wed: 6 recovered orders ($740 demo revenue)
            </p>

            <div className="mt-3 space-y-2 text-sm text-slate-300">
              <p>
                <span className="font-semibold">Shopper pattern:</span> Cart
                parkers.
              </p>
              <p>
                <span className="font-semibold">What they were eyeing:</span>{" "}
                Event dresses and statement tops saved to cart to &quot;think
                about it.&quot;
              </p>
              <p>
                <span className="font-semibold">What&apos;s really going on:</span>{" "}
                Biggest lift day. Shoppers were planning outfits for events but
                sat on full carts.
              </p>
              <p>
                <span className="font-semibold">How Abando got them back:</span>{" "}
                Lookbook-style SMS linking back to the exact outfits they saved
                with styling ideas.
              </p>
            </div>

            <p className="mt-3 text-[11px] text-slate-400">
              In the live product, clicking a day opens the actual recovered
              sessions for that date so your team can see the carts and
              messages that fired.
            </p>
          </div>
        </section>

        {/* SECTION 4 – Raw signal → interpretation */}
        <section className="rounded-3xl border border-slate-800 bg-slate-950/80 p-8">
          <p className="text-[11px] font-semibold tracking-[0.24em] text-slate-400">
            4 · HOW ABANDO TURNS RAW SIGNAL INTO GUIDED PLAYS
          </p>

          <div className="mt-4 grid gap-8 md:grid-cols-2">
            {/* Raw signal */}
            <div>
              <h3 className="text-xs font-semibold tracking-[0.24em] text-slate-300">
                WHAT THE RAW SIGNAL LOOKS LIKE
              </h3>
              <p className="mt-2 text-sm text-slate-300">
                Under the hood, Abando is watching anonymous event streams like:
              </p>

              <pre className="mt-4 max-h-[260px] overflow-auto rounded-2xl bg-slate-950/90 p-4 text-[11px] leading-relaxed text-emerald-200/90">
{`[
  {
    "session_id": "s_1432",
    "events": [
      "view/dresses/midi-wrap",
      "view/size-guide/dresses",
      "add_to_cart:SKU-DF-102",
      "view/returns-policy",
      "abandon_checkout"
    ]
  },
  {
    "session_id": "b3c__",
    "events": [
      "view/tops/cropped-knit",
      "add_to_cart:SKU-CK-204",
      "abandon_checkout"
    ]
  }
]`}
              </pre>

              <p className="mt-3 text-xs text-slate-400">
                Abando sees events like this across hundreds of sessions, then
                groups them into patterns your team can actually act on.
              </p>

              <div className="mt-4 grid gap-3 rounded-2xl border border-emerald-600/40 bg-emerald-900/10 p-4 text-xs">
                <div>
                  <h4 className="text-[11px] font-semibold tracking-[0.24em] text-emerald-300">
                    RAW SHOPPER EVENTS
                  </h4>
                  <p className="mt-1 text-emerald-100/90">
                    Clicks, searches, size-guide views, add-to-cart, and
                    checkout steps Abando receives from Shopify.
                  </p>
                </div>
                <div>
                  <h4 className="text-[11px] font-semibold tracking-[0.24em] text-emerald-300">
                    BEHAVIOR PATTERNS
                  </h4>
                  <p className="mt-1 text-emerald-100/90">
                    Abando clusters sessions into hesitation types like Cart
                    Parkers, Size Checkers, and Drop Watchers instead of one big
                    &quot;abandoned&quot; bucket.
                  </p>
                </div>
                <div>
                  <h4 className="text-[11px] font-semibold tracking-[0.24em] text-emerald-300">
                    GUIDED PLAYS
                  </h4>
                  <p className="mt-1 text-emerald-100/90">
                    Each pattern maps to a small set of proven plays so your
                    team chooses tone and channels—not targeting logic.
                  </p>
                </div>
              </div>
            </div>

            {/* Interpretation */}
            <div>
              <h3 className="text-xs font-semibold tracking-[0.24em] text-slate-300">
                HOW ABANDO INTERPRETS IT
              </h3>
              <p className="mt-2 text-sm text-slate-300">
                Abando doesn&apos;t dump raw logs on your team. It rolls those
                events up into a few clear insights you can read in seconds,
                like:
              </p>

              <ul className="mt-3 space-y-2 text-sm text-slate-200">
                <li>
                  • 38% of abandons happened right after shoppers checked the
                  returns policy.
                </li>
                <li>
                  • 24% abandoned after comparing 3+ outfits side by side.
                </li>
                <li>
                  • 18% abandoned while building full outfits and never quite
                  hitting &ldquo;Buy.&rdquo;
                </li>
              </ul>

              <p className="mt-4 text-sm text-slate-300">
                Each pattern maps to a small set of plays (emails, SMS, onsite
                prompts), so your team isn&apos;t guessing which message to send
                first.
              </p>

              <p className="mt-3 text-xs text-slate-400">
                In a live account, you&apos;d click any pattern to see the
                underlying sessions and which campaigns recovered those orders.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
TSX

echo "[demo] New boutique-focused /demo/playground written to ${TARGET}"
echo "[demo] Backup saved at ${BACKUP}"
TSX
