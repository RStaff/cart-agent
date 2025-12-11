import type { ReactNode } from "react";

export const metadata = {
  title: "Abando – AI Cart Recovery for Women’s Boutique Apparel",
  description:
    "Abando is your AI cart recovery copilot for women’s boutique apparel shops on Shopify. Turn abandoned carts into repeat customers.",
};

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-8">
        {children}
      </div>
    </div>
  );
}
