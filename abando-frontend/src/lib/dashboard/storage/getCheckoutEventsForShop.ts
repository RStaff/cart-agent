import { getCheckoutEventsForShop as getCheckoutEventsForShopFromStore } from "@/lib/dashboard/storage/repository";

export async function getCheckoutEventsForShop(
  shopDomain: string,
  measurementWindow: "24h" | "7d" | "all" = "all",
) {
  return getCheckoutEventsForShopFromStore(shopDomain, measurementWindow);
}
