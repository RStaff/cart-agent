import { writeFileSync, mkdirSync } from "fs";

const outDir = "staffordos/operator_daemon/output";
mkdirSync(outDir, { recursive: true });

const draft = {
  schema: "staffordos.followup_draft.v1",
  generated_at: new Date().toISOString(),
  system: "shopifixer",
  status: "draft_created",
  message: {
    subject: "Quick follow-up on your Shopify store audit",
    body: "Hi — I took a look at your store and found a few high-impact conversion gaps. Happy to share a quick breakdown if helpful."
  },
  proof: {
    drafted: true,
    sent: false,
    revenue_action: false
  }
};

writeFileSync(
  `${outDir}/shopifixer_followup_draft_v1.json`,
  JSON.stringify(draft, null, 2)
);

console.log("✅ follow-up draft created");
console.log(JSON.stringify(draft, null, 2));
