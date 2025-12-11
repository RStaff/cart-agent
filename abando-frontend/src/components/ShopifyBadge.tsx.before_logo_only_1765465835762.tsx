import Image from "next/image";
import type { FC } from "react";

type ShopifyBadgeProps = {
  /**
   * Variant:
   * - "embedded"  → "Embedded in Shopify admin"
   * - "works-with" → "Works with Shopify"
   */
  variant?: "embedded" | "works-with";
};

const ShopifyBadge: FC<ShopifyBadgeProps> = ({ variant = "embedded" }) => {
  const label =
    variant === "embedded"
      ? "Embedded in Shopify admin"
      : "Works with Shopify";

  return (
    <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
      <span className="uppercase tracking-[0.24em] text-slate-500">
        {label}
      </span>
      <div className="flex items-center">
        <Image
          src="/shopify_monotone_white.svg"
          alt="Shopify"
          width={80}
          height={24}
          priority
        />
      </div>
    </div>
  );
};

export default ShopifyBadge;
