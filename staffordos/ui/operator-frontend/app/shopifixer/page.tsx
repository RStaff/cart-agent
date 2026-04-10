import type { Metadata } from "next";
import { ShopifixerLandingClient } from "./ShopifixerLandingClient";

export const metadata: Metadata = {
  title: "Shopifixer | Quick Shopify Store Review",
  description: "Shopifixer highlights small friction points that quietly reduce conversions and shows what to fix first.",
};

export default function ShopifixerPage() {
  return <ShopifixerLandingClient />;
}
