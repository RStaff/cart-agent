import DiscoverClient from "./DiscoverClient";
import { currentCareerContext } from "../../../lib/career/careerP0Auth";
import { getSearchPreferences } from "../../../lib/career/careerP0Product.mjs";
import { redirect } from "next/navigation";

export const runtime = "nodejs";

export default async function DiscoverPage() {
  const context = await currentCareerContext();
  if (!context) redirect("/career/login");
  return <main className="careerShell"><header className="careerHeader"><div><p className="careerEyebrow">CareerOS</p><h1>Discovery settings</h1><p className="careerMuted">Save criteria for authorized providers when they are available. CareerOS does not send your career profile or application materials to job providers.</p></div><span><a href="/career">CareerOS Home</a> · <a href="/career/jobs">Saved jobs</a></span></header><DiscoverClient initialPreferences={await getSearchPreferences(context)} /></main>;
}
