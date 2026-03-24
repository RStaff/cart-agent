function getOperatorApiBase() {
  const raw = process.env.NEXT_PUBLIC_OPERATOR_API_BASE || "";
  return raw.replace(/\/$/, "");
}

function buildOperatorQueryUrl() {
  const base = getOperatorApiBase();
  return base ? `${base}/api/operator/query` : "/api/operator/query";
}

export async function queryOperatorApi(text: string) {
  const response = await fetch(buildOperatorQueryUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  const payload = await response.json();

  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error || "Operator query failed.");
  }

  return payload;
}
