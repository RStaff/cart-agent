import Link from "next/link";
import { normalizeSearchParams } from "@/lib/searchParams";
import type { AppPageProps } from "@/types/app";
import { OnboardingExplainer } from "@/components/Explainers";

export const dynamic = "force-dynamic";

export default async function Onboarding({ searchParams }: AppPageProps) {
  const sp = await normalizeSearchParams(searchParams);
  const plan = sp.plan ?? "basic";

  const demoLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/demo/playground", label: "Demo playground" },
  ];

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <OnboardingExplainer />
      <h1 className="text-3xl font-bold mb-2">Onboarding</h1>
      <p className="text-slate-500 mb-6">
        You’re in <b>demo mode.</b> Add Stripe keys in Settings to go live — or explore the dashboard and demo first.
      </p>

      <div className="rounded-lg border border-slate-800 bg-slate-950 p-5 mb-8">
        <div className="text-slate-300">Plan:</div>
        <div className="text-lg font-medium text-white capitalize">{plan}</div>
      </div>

      <div className="flex gap-3">
        {demoLinks.map(x => (
          <Link key={x.href} href={x.href} className="px-4 py-2 rounded bg-violet-600 text-white hover:bg-violet-500">
            {x.label} →
          </Link>
        ))}
        <Link href="/pricing" className="px-4 py-2 rounded border border-slate-700 text-slate-300 hover:text-white">
          See plans
        </Link>
      </div>
    </div>
  );
}
