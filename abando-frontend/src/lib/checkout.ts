export async function startCheckout(opts: {
  backend: string;
  email: string;
  priceId?: string;
  devToken?: string;
}) {
  const res = await fetch(, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(opts.devToken ? { Authorization:  } : {}),
      Origin: typeof window !== "undefined" ? window.location.origin : "http://localhost:3000",
    },
    body: JSON.stringify({
      email: opts.email,
      ...(opts.priceId ? { priceId: opts.priceId } : {}),
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "checkout_failed");
  if (!data?.url) throw new Error("no_checkout_url");
  return data.url as string;
}
