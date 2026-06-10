export type ProofRunStageKey = "before_evidence";

export type ProofRunStageConfig = {
  stage: ProofRunStageKey;
  title: string;
  description: string;
  outputPath: string;
  submitLabel: string;
  savedLabel: string;
  fields: Array<{
    name: string;
    label: string;
    placeholder: string;
    type: "text" | "textarea";
    rows?: number;
  }>;
};

export const PROOF_RUN_STAGE_CONFIGS: Record<ProofRunStageKey, ProofRunStageConfig> = {
  before_evidence: {
    stage: "before_evidence",
    title: "Capture Before Evidence",
    description: "Record the pre-fix problem state for the active ShopiFixer merchant.",
    outputPath: "staffordos/proof_runs/internal_shopifixer_dry_run_v1/before_evidence.md",
    submitLabel: "Capture Before Evidence",
    savedLabel: "Before evidence saved",
    fields: [
      {
        name: "affected_page_or_artifact",
        label: "Affected Page / Artifact",
        placeholder: "staffordos/clients/generate_shopifixer_offer_v1.mjs",
        type: "text"
      },
      {
        name: "issue",
        label: "Issue",
        placeholder: "Describe the problem visible before the fix.",
        type: "textarea",
        rows: 3
      },
      {
        name: "why_it_matters",
        label: "Why It Matters",
        placeholder: "Explain the merchant or business risk.",
        type: "textarea",
        rows: 3
      },
      {
        name: "screenshot",
        label: "Screenshot",
        placeholder: "proof_runs/internal_shopifixer_dry_run_v1/screenshots/before.png",
        type: "text"
      },
      {
        name: "notes",
        label: "Notes",
        placeholder: "Any supporting notes for the proof run.",
        type: "textarea",
        rows: 3
      }
    ]
  }
};
