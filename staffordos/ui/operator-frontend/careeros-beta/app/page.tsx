import { redirect } from "next/navigation";
import { currentCareerContext } from "../lib/career/careerP0Auth";

export const runtime = "nodejs";

export default async function RootPage() {
  const context = await currentCareerContext();
  redirect(context ? "/career" : "/career/login");
}
