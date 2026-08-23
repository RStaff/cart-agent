import { redirect } from "next/navigation";
import { careerP0Store, currentCareerContext } from "../../../lib/career/careerP0Auth";
import { ContextClaimsClient } from "./ContextClaimsClient";

export const runtime = "nodejs";

export default async function CareerContextPage() {
  const context = await currentCareerContext();
  if (!context) redirect("/career/login");
  const data = await careerP0Store.listContextClaims(context.session.id);
  return <ContextClaimsClient initialClaims={data.claims} initialSummary={data.summary} />;
}
