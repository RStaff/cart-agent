"use client";

import { useState } from "react";

type TargetSummary = { company: string | null; title: string | null; requirementText: string };

export default function L2TargetInspector({ targets }: { targets: TargetSummary[] }) {
  const [page, setPage] = useState(0);
  const pageSize = 25;
  const pageCount = Math.max(1, Math.ceil(targets.length / pageSize));
  const visible = targets.slice(page * pageSize, (page + 1) * pageSize);
  return (
    <details>
      <summary>Inspect {targets.length} exact targets</summary>
      <p>Showing {page * pageSize + 1}-{Math.min((page + 1) * pageSize, targets.length)} of {targets.length}. Exact identities remain in the private save authority.</p>
      <ul>
        {visible.map((target, index) => <li key={`${page}-${index}`}>{target.company || "Unknown company"} / {target.title || "Unknown role"}: {target.requirementText}</li>)}
      </ul>
      {pageCount > 1 ? <nav aria-label="Exact target pages"><button type="button" onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}>Previous targets</button><span>Page {page + 1} of {pageCount}</span><button type="button" onClick={() => setPage(Math.min(pageCount - 1, page + 1))} disabled={page === pageCount - 1}>Next targets</button></nav> : null}
    </details>
  );
}
