"use client";

export default function LeadActions({ leadId }: { leadId: string }) {
  async function run(action: string) {
    const res = await fetch("/api/operator/lead-registry/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId, action })
    });

    if (!res.ok) {
      alert("Action failed");
      return;
    }

    window.location.reload();
  }

  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      <button onClick={() => run("move_to_outreach")}>Move</button>
      <button onClick={() => run("mark_sent")}>Sent</button>
      <button onClick={() => run("mark_engaged")}>Engaged</button>
    </div>
  );
}
