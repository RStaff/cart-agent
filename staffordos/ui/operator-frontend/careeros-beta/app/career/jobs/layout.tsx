import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { currentCareerContext } from "../../../lib/career/careerP0Auth";

export const runtime = "nodejs";

export default async function JobsLayout({ children }: { children: ReactNode }) {
  const context = await currentCareerContext();
  if (!context) redirect("/career/login");
  return children;
}
