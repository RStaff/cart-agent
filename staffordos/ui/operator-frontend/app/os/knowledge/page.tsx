import Link from "next/link";
import { WorkspacePage } from "../../../components/staffordos/WorkspacePage";
import { sectionByKey } from "../../../lib/staffordos/workspaces";

export default function KnowledgePage() {
  return (
    <WorkspacePage section={sectionByKey("knowledge")}>
      <section className="staffordObjectiveNote">
        <strong>Decision memory</strong>
        <p>Review what StaffordOS has already chosen and the evidence behind those choices.</p>
        <Link href="/os/decisions" className="staffordHomeActionLink">
          Decisions and Why We Made Them
        </Link>
      </section>
    </WorkspacePage>
  );
}
