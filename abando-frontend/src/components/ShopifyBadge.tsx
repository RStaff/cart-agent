import Image from "next/image";

export default function ShopifyBadge() {
  return (
    <div className="flex items-center rounded-full border border-slate-800 bg-slate-900/80 px-3 py-1">
      <span className="sr-only">Built for Shopify</span>
      <div className="relative h-5 w-20">
        <Image
          src="/shopify_monotone_white.svg"
          alt="Shopify"
          fill
          className="object-contain"
        />
      </div>
    </div>
  );
}
