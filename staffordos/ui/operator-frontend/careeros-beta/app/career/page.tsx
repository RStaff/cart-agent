import { redirect } from "next/navigation";
import { currentCareerContext, careerP0Store } from "../../lib/career/careerP0Auth";

export const runtime = "nodejs";

export default async function CareerHomePage() {
  const context = await currentCareerContext();
  if (!context) redirect("/career/login");
  const profile = await careerP0Store.getProfile(context.session.id);
  redirect(profile ? "/career/profile" : "/career/onboarding");
}
