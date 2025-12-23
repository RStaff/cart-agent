export const runtime = "nodejs";

export async function GET() {
  return new Response(
    JSON.stringify({
      ok: true,
      app: "abando-frontend",
      ts: new Date().toISOString(),
    }),
    { status: 200, headers: { "content-type": "application/json" } }
  );
}
