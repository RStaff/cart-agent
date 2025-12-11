"use client";

import { FC, useState } from "react";
import Image from "next/image";
import ShopifyBadge from "@/src/components/ShopifyBadge";

type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

interface Highlight {
  dayLabel: string; // e.g. "Sat · 8 orders"
  headline: string; // e.g. "8 recovered orders ($920 demo revenue)"
  pattern: string; // "Drop watchers"
  quote: string;
  whatsGoingOn: string;
  followUps: string[];
  responseSummary: string;
  responseDetail: string;
}

const weeklyTotals: Record<DayKey, string> = {
  mon: "Mon · 3 orders",
  tue: "Tue · 5 orders",
  wed: "Wed · 6 orders",
  thu: "Thu · 5 orders",
  fri: "Fri · 7 orders",
  sat: "Sat · 8 orders",
  sun: "Sun · 8 orders",
};

const highlightByDay: Record<DayKey, Highlight> = {
  mon: {
    dayLabel: "Mon · 3 orders",
    headline: "3 recovered orders ($345 demo revenue)",
    pattern: "Cart parkers",
    quote: `"I like it… I just need to think."`,
    whatsGoingOn:
      "Shoppers parking outfits in the cart while they think about fit, occasion, and total spend. They need reassurance and styling ideas more than a heavier discount.",
    followUps: [
      "Email: styling inspiration + how others wear it",
      `SMS: light “Still thinking about this look?” nudge`,
      "Onsite: reassurance on returns & fit when they come back",
    ],
    responseSummary:
      "Abando recognizes this as a “cart parker” pattern and leans on reassurance plays instead of blunt coupons.",
    responseDetail:
      "Under the hood, Abando scores session behavior for hesitation signals—scroll-backs, size swaps, and time parked in cart. It then blends email, SMS, and onsite nudges that show how to wear the item and make returns feel safe, so shoppers move without needing 20%-off blasts.",
  },
  tue: {
    dayLabel: "Tue · 5 orders",
    headline: "5 recovered orders ($540 demo revenue)",
    pattern: "Size checkers",
    quote: `"I’ll buy once I’m sure it fits."`,
    whatsGoingOn:
      "Sessions full of size charts, reviews, and returns-policy checks. Shoppers pause until they feel safe choosing a size.",
    followUps: [
      "Email: fit reviews and size guidance",
      "SMS: reminder with sizing tips for the exact items they viewed",
      "Onsite: fit callouts and “free returns” reassurance",
    ],
    responseSummary:
      "Abando sees size anxiety and reaches for fit-proof messaging instead of urgency.",
    responseDetail:
      "Based on where shoppers hovered and what they re-read, Abando’s AI tilts toward fit guidance. It tags follow-ups with real-customer fit quotes and clear return language, then picks the lowest-friction channel the shopper has responded to before.",
  },
  wed: {
    dayLabel: "Wed · 6 orders",
    headline: "6 recovered orders ($640 demo revenue)",
    pattern: "Cart parkers",
    quote: `"I like it… I just need to think."`,
    whatsGoingOn:
      "Mid-week shoppers comparing outfits and building carts across tabs. They’re engaged but mentally budgeting.",
    followUps: [
      "Email: “complete the look” styling ideas",
      "SMS: reminder right before your typical peak hour",
      "Onsite: saved-cart recap when they return",
    ],
    responseSummary:
      "Abando focuses on completing the outfit instead of pushing a sale at all costs.",
    responseDetail:
      "The system sees multiple items in cart and browsing around accessory categories. It responds with a single, composed reminder that pulls pieces together into an outfit—giving shoppers a story, not a shouty promo.",
  },
  thu: {
    dayLabel: "Thu · 5 orders",
    headline: "5 recovered orders ($560 demo revenue)",
    pattern: "Drop watchers",
    quote: `"I’m waiting for the right moment."`,
    whatsGoingOn:
      "Shoppers hovering around new arrivals and low-stock items, watching for a sign that it’s time to buy.",
    followUps: [
      "Email: light “going fast” cues on key sizes",
      "SMS: quick check-in on low-stock favorites",
      "Onsite: subtle countdown and “only a few left” flags",
    ],
    responseSummary:
      "Abando uses precise urgency tied to inventory instead of blanket “last chance” blasts.",
    responseDetail:
      "Because Abando is wired into product and inventory data, it knows which sizes and colors are actually at risk. It quietly highlights those in email, SMS, and onsite banners so shoppers feel pulled to act—without the brand feeling spammy.",
  },
  fri: {
    dayLabel: "Fri · 7 orders",
    headline: "7 recovered orders ($810 demo revenue)",
    pattern: "Size checkers",
    quote: `"I’ll buy once I’m sure it fits."`,
    whatsGoingOn:
      "Sessions full of size charts, reviews, and returns-policy checks. Shoppers pause until they feel safe choosing a size.",
    followUps: [
      "Email: fit reviews and size guidance",
      "SMS: reminder with sizing tips for the exact items they viewed",
      "Onsite: fit callouts and “free returns” reassurance",
    ],
    responseSummary:
      "Abando runs “fit proof” plays at the exact point shoppers would otherwise stall.",
    responseDetail:
      "When Abando sees repeat visits to size guides and return policies, it chooses reassurance over pressure. It lines up a short series of fit-focused nudges across channels, so by the time they’re back in cart they already feel safe checking out.",
  },
  sat: {
    dayLabel: "Sat · 8 orders",
    headline: "8 recovered orders ($920 demo revenue)",
    pattern: "Drop watchers",
    quote: `"I’m waiting for the right moment."`,
    whatsGoingOn:
      "Engaged shoppers hovering around low-stock items or new arrivals, waiting for a clear signal before they commit. They’re primed to buy but anxious about missing the best drop.",
    followUps: [
      'Email: low-stock and “last chance for this drop” nudges',
      "SMS: short urgency pings around key sizes or outfits",
      "Onsite: subtle low-stock & countdown cues on return visits",
    ],
    responseSummary:
      "Abando’s AI recognizes this as a “drop watcher” pattern and chooses the lightest push that can still move the shopper.",
    responseDetail:
      "Instead of spraying discounts, Abando keys off low-stock and restock-watch behavior. It blends email, SMS, and onsite cues that say “this one might not be here later” so shoppers act now—and your margin stays intact.",
  },
  sun: {
    dayLabel: "Sun · 8 orders",
    headline: "8 recovered orders ($880 demo revenue)",
    pattern: "Cart parkers",
    quote: `"I like it… I just need to think."`,
    whatsGoingOn:
      "Sunday scrollers filling carts on mobile and planning outfits for the week ahead. They’re close—they just need a gentle reason to finish.",
    followUps: [
      "Email: reminder that pulls their saved cart into one view",
      "SMS: short nudge sent at your Sunday evening peak",
      "Onsite: cart-resume banner the next time they open your site",
    ],
    responseSummary:
      "Abando syncs timing with your natural traffic spikes, so follow-ups feel perfectly timed instead of random.",
    responseDetail:
      "Abando learns when your traffic naturally spikes and stacks follow-ups around those peaks. The system waits until shoppers are most likely to be back on their phones, then follows through across email, SMS, and onsite so the path to checkout feels effortless.",
  },
};

const dayOrder: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

const DayPill: FC<{
  day: DayKey;
  active: boolean;
  onClick: () => void;
}> = ({ day, active, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs transition ${
        active
          ? "border-emerald-400 bg-emerald-400/15 text-emerald-200"
          : "border-slate-700 bg-slate-900/80 text-slate-300 hover:border-emerald-400/60 hover:text-emerald-100"
      }`}
    >
      {weeklyTotals[day]}
    </button>
  );
};

export default function EmbeddedDashboardPage() {
  const [selectedDay, setSelectedDay] = useState<DayKey>("sat");
  const highlight = highlightByDay[selectedDay];

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Top header row */}
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-400/40">
              <Image
                src="/abando-logo.inline.png"
                alt="Abando"
                width={28}
                height={28}
                className="rounded-md"
              />
            </div>
            <div>
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-emerald-400">
                Abando dashboard
              </p>
              <p className="text-xs text-slate-400">
                Live view of recovered orders &amp; shopper patterns.
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-6 sm:flex">
            <div className="text-right">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-slate-500">
                Sync status
              </p>
              <p className="text-xs text-emerald-300">
                In sync with your real orders
              </p>
            </div>
            <ShopifyBadge variant="embedded" />
          </div>
        </div>

        {/* Hero + summary cards */}
        <section className="mt-10 space-y-8">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-50 sm:text-[2.15rem]">
              See how Abando turned this week&apos;s hesitations into extra
              orders.
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-400">
              This embedded view lines up with what shoppers actually did in
              your store. Instead of one big &quot;abandoned&quot; bucket,
              Abando groups sessions into a few hesitation patterns and quietly
              runs follow-ups that match how each shopper is hesitating.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 shadow-[0_0_0_1px_rgba(16,185,129,0.25)]">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-emerald-300">
                Recovered revenue · 7 days
              </p>
              <p className="mt-4 text-3xl font-semibold text-emerald-100">
                $5,040
              </p>
              <p className="mt-2 text-xs text-emerald-100/80">
                Revenue that would likely have been lost without Abando’s
                plays.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-5 py-4">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                Extra orders · 7 days
              </p>
              <p className="mt-4 text-3xl font-semibold text-slate-50">
                40+ orders
              </p>
              <p className="mt-2 text-xs text-slate-400">
                Small daily lifts across Cart Parkers, Size Checkers, and Drop
                Watchers.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-5 py-4">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                Psychological impact
              </p>
              <p className="mt-4 text-3xl font-semibold text-slate-50">
                ~1 extra day of sales
              </p>
              <p className="mt-2 text-xs text-slate-400">
                At this pace, each week feels like adding another full day of
                revenue—without more traffic. We surface this so you can feel
                the breathing room Abando is buying you.
              </p>
            </div>
          </div>
        </section>

        {/* Section 1: patterns */}
        <section className="mt-12 space-y-6">
          <div className="space-y-2">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-slate-500">
              1 · What Abando is seeing this week
            </p>
            <h2 className="text-lg font-semibold text-slate-50">
              Same shoppers, clearer patterns.
            </h2>
            <p className="max-w-2xl text-sm text-slate-400">
              Instead of one big &quot;abandoned&quot; bucket, Abando groups
              sessions into hesitation types. That makes it obvious where your
              extra orders are really coming from—and how to talk to those
              shoppers.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-5 py-4">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-emerald-300">
                Pattern · Cart parkers
              </p>
              <p className="mt-2 text-sm font-medium text-slate-50">
                &quot;I like it… I just need to think.&quot;
              </p>
              <p className="mt-2 text-xs text-slate-400">
                Shoppers parking outfits in the cart while they think about fit,
                occasion, and total spend. They need reassurance and styling
                ideas more than a heavier discount.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-5 py-4">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-emerald-300">
                Pattern · Size checkers
              </p>
              <p className="mt-2 text-sm font-medium text-slate-50">
                &quot;I’ll buy once I’m sure it fits.&quot;
              </p>
              <p className="mt-2 text-xs text-slate-400">
                Sessions full of size charts, reviews, and returns-policy
                checks. Shoppers pause until they feel safe choosing a size.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-5 py-4">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-emerald-300">
                Pattern · Drop watchers
              </p>
              <p className="mt-2 text-sm font-medium text-slate-50">
                &quot;I’m waiting for the right moment.&quot;
              </p>
              <p className="mt-2 text-xs text-slate-400">
                Engaged shoppers hovering around low-stock items or new
                arrivals, waiting for a signal before they commit.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: weekly impact + highlight */}
        <section className="mt-14 space-y-6">
          <div className="space-y-2">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-slate-500">
              2 · 7-day recovered orders snapshot
            </p>
            <h2 className="text-lg font-semibold text-slate-50">
              Weekly impact, tied to real follow-ups.
            </h2>
            <p className="max-w-2xl text-sm text-slate-400">
              Demo data, same logic as your live account: small lifts every day
              add up to a clear weekly impact. Click a day to see which pattern
              dominated and how Abando followed up.
            </p>
          </div>

          {/* Weekly impact pill row */}
          <div className="rounded-2xl border border-emerald-500/30 bg-slate-950/70 px-5 py-5 shadow-[0_0_0_1px_rgba(16,185,129,0.25)]">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-emerald-300">
              Weekly impact
            </p>
            <p className="mt-3 text-sm text-slate-300">
              40+ extra orders and just over{" "}
              <span className="font-semibold text-emerald-200">
                $5,040 in recovered revenue in 7 days.
              </span>{" "}
              That&apos;s like adding an extra day of sales each week—without
              buying more traffic or cranking up promo codes. In a live
              account, this roll-up ties directly to your real recovered orders.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {dayOrder.map((day) => (
                <DayPill
                  key={day}
                  day={day}
                  active={day === selectedDay}
                  onClick={() => setSelectedDay(day)}
                />
              ))}
            </div>
          </div>

          {/* Highlight of the day */}
          <div className="rounded-2xl border border-emerald-500/30 bg-slate-950/80 px-5 py-5 shadow-[0_0_0_1px_rgba(16,185,129,0.25)]">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-emerald-300">
              Highlight of the day
            </p>
            <p className="mt-3 text-sm font-medium text-emerald-100">
              {highlight.dayLabel}: {highlight.headline}
            </p>

            <div className="mt-5 grid gap-6 md:grid-cols-4">
              {/* Shopper pattern */}
              <div>
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Shopper pattern
                </p>
                <p className="mt-3 text-sm font-semibold text-slate-50">
                  {highlight.pattern}
                </p>
                <p className="mt-1 text-xs text-slate-400">{highlight.quote}</p>
              </div>

              {/* What's really going on */}
              <div>
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-slate-500">
                  What&apos;s really going on
                </p>
                <p className="mt-3 text-xs leading-relaxed text-slate-300">
                  {highlight.whatsGoingOn}
                </p>
              </div>

              {/* Follow-ups sent */}
              <div>
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Follow-ups sent
                </p>
                <ul className="mt-3 space-y-1 text-xs text-slate-300">
                  {highlight.followUps.map((item, idx) => (
                    <li key={idx} className="flex gap-2">
                      <span className="mt-[3px] h-[3px] w-[3px] rounded-full bg-emerald-400" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Abando response & why */}
              <div>
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-emerald-300">
                  Abando response &amp; why
                </p>
                <p className="mt-3 text-xs font-medium text-emerald-100">
                  {highlight.responseSummary}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-slate-300">
                  {highlight.responseDetail}
                </p>
              </div>
            </div>

            <p className="mt-5 text-[0.7rem] text-slate-500">
              In a live account, these follow-ups reflect the real mix of email,
              SMS, and onsite nudges Abando is running against this pattern in
              your store. The highlight view is designed to match what you see
              in Abando&apos;s full playground demo—same patterns, similar
              recovered-orders math, plus channel mix—just anchored inside your
              Shopify admin.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
