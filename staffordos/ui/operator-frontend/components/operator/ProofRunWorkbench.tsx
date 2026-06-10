import { PROOF_RUN_STAGE_CONFIGS, type ProofRunStageKey } from "../../lib/operator/proofRunStageConfigs";

type ProofRunMerchant = {
  store?: string;
  client_id?: string;
};

type ProofRunWorkbenchProps = {
  stage: ProofRunStageKey;
  merchant: ProofRunMerchant;
  proofRunPath: string;
  date: string;
  saved?: boolean;
  onSubmit: (formData: FormData) => Promise<void>;
};

export function ProofRunWorkbench({
  stage,
  merchant,
  proofRunPath,
  date,
  saved,
  onSubmit
}: ProofRunWorkbenchProps) {
  const config = PROOF_RUN_STAGE_CONFIGS[stage];

  return (
    <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="operatorHomeActionFooter" style={{ marginBottom: 12 }}>
        <div>
          <small>Stage</small>
          <strong>{config.title}</strong>
        </div>
        <div>
          <small>Store</small>
          <strong>{merchant.store || "unavailable"}</strong>
        </div>
        <div>
          <small>Client ID</small>
          <strong>{merchant.client_id || "unavailable"}</strong>
        </div>
        <div>
          <small>Date</small>
          <strong>{date || "—"}</strong>
        </div>
        <div>
          <small>Proof run</small>
          <strong>{proofRunPath}</strong>
        </div>
      </div>

      <p className="hint" style={{ marginBottom: 12 }}>
        {config.description}
      </p>

      {saved ? (
        <div className="badge success" style={{ marginBottom: 12 }}>
          {config.savedLabel}
        </div>
      ) : null}

      <form action={onSubmit} style={{ display: "grid", gap: 12 }}>
        <input type="hidden" name="store" value={merchant.store || "unavailable"} />
        <input type="hidden" name="date" value={date || ""} />

        <div
          style={{
            display: "grid",
            gap: 12,
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))"
          }}
        >
          {config.fields.map((field) => {
            if (field.type === "textarea") {
              return (
                <label key={field.name} style={{ display: "grid", gap: 6 }}>
                  <span className="eyebrow">{field.label}</span>
                  <textarea name={field.name} rows={field.rows || 3} defaultValue="" placeholder={field.placeholder} />
                </label>
              );
            }

            return (
              <label key={field.name} style={{ display: "grid", gap: 6 }}>
                <span className="eyebrow">{field.label}</span>
                <input name={field.name} type="text" defaultValue="" placeholder={field.placeholder} />
              </label>
            );
          })}
        </div>

        <button type="submit" className="button" style={{ width: "fit-content" }}>
          {config.submitLabel}
        </button>
      </form>
    </div>
  );
}
