import Image from "next/image"

export default function LogosRow() {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-3 opacity-80">
      <Image
        src="/abando-logo.png"
        alt="Abando"
        width={84}
        height={24}
        className="h-6 w-auto"
        priority
      />
      <span className="text-sm text-slate-500">Shopify</span>
      <span className="text-sm text-slate-500">Stripe</span>
      <span className="text-sm text-slate-500">Klaviyo</span>
    </div>
  );
}
