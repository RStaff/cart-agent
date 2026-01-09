export const runtime = "nodejs";

export async function GET() {
  return new Response(
    JSON.stringify({ status: "ok", service: "abando.ai", ts: new Date().toISOString() }),
    {
      status: 200,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
      },
    }
  );
}
