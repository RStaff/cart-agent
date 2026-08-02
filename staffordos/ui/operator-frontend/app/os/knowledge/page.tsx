import Link from "next/link";
import { WorkspacePage } from "../../../components/staffordos/WorkspacePage";
import { sectionByKey } from "../../../lib/staffordos/workspaces";

export default function KnowledgePage() {
  return (
    <WorkspacePage section={sectionByKey("knowledge")}>
      <section className="staffordObjectiveNote">
        <strong>What supports current work</strong>
        <p>Use these read-only records to understand choices, evidence, proof, and lessons without changing work.</p>
      </section>

      <section className="staffordObjectiveNote">
        <strong>Decision memory</strong>
        <p>Review what StaffordOS has already chosen and the evidence behind those choices.</p>
        <Link href="/os/decisions" className="staffordHomeActionLink">
          Decisions and Why We Made Them
        </Link>
      </section>

      <section className="staffordObjectiveNote">
        <strong>Evidence behind actions</strong>
        <p>Review why current actions looked worth considering before proof exists.</p>
        <Link href="/os/evidence" className="staffordHomeActionLink">
          Why We Believe This
        </Link>
      </section>

      <section className="staffordObjectiveNote">
        <strong>Proof after outcomes</strong>
        <p>Review narrow validation proof without treating it as business completion.</p>
        <Link href="/os/proof" className="staffordHomeActionLink">
          What Has Been Proven
        </Link>
      </section>

      <section className="staffordObjectiveNote">
        <strong>Lessons to reuse</strong>
        <p>Review what StaffordOS should remember next time after proof and scope are clear.</p>
        <Link href="/os/learning" className="staffordHomeActionLink">
          What We Have Learned
        </Link>
      </section>
    </WorkspacePage>
  );
}
