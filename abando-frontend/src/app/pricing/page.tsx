import { PricingExplainer } from "@/components/Explainers";
export const dynamic = "force-dynamic"; // avoid static prerender
import PricingClient from "./Client";
export default function Page() {
  return <PricingClient />;
}
