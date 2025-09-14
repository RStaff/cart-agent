import Link from "next/link";

export default function CTA() {
  return (
    <section className="border-y bg-gradient-to-r from-brand-50 to-white">
      <div className="container py-12 sm:py-16 grid gap-6 sm:grid-cols-[1fr_auto] sm:items-center">
        <div>
          <div className="text-sm font-medium text-brand-700">Try the live demo</div>
          <h3 className="mt-1 text-2xl font-semibold tracking-tight">
            See Abando’s dashboard with sample data in minutes.
          </h3>
          <p className="mt-2 text-slate-600">
            Use a test checkout to spin up a demo account instantly. No Shopify store required.
          </p>
        </div>
        <div className="flex gap-3 sm:justify-end">
          <Link href="/trial" className="btn btn-primary">Open demo dashboard</Link>
          <a href="#pricing" className="btn btn-ghost">See pricing</a>
        </div>
      </div>
    </section>
  );
}
