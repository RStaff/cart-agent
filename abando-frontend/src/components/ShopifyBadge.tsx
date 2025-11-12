import Image from "next/image";

export default function ShopifyBadge() {
  return (
    <a
      href="https://partners.shopify.com"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Proud Shopify Partner"
      className="inline-flex items-center rounded-md bg-[#0E0F12] ring-1 ring-white/10 px-2.5 py-1.5 hover:ring-white/20 transition"
      style={{ lineHeight: 1 }}
    >
      <Image
        src="/logos/shopify-lockup-light.svg"
        alt="Shopify"
        width={92}
        height={28}
        priority
      />
      <span className="sr-only">Proud Shopify Partner</span>
    </a>
  );
}
