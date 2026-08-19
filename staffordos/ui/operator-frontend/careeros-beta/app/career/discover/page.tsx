import DiscoverClient from "./DiscoverClient";
import { currentCareerContext } from "../../../lib/career/careerP0Auth";
import { redirect } from "next/navigation";

export const runtime = "nodejs";

export default async function DiscoverPage() {
  if (!await currentCareerContext()) redirect("/career/login");
  return <main className="careerShell"><header className="careerHeader"><div><p className="careerEyebrow">CareerOS</p><h1>Discover opportunities</h1><p className="careerMuted">Search approved sources using your own criteria. CareerOS does not send your career profile or application materials to job providers.</p></div><a href="/career/jobs">Saved jobs</a></header><DiscoverClient /></main>;
}
