import { readLatestDocxExport } from "../../../../../../../lib/staffordos/reviewedResumeDraftExport";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ artifactVersionId: string }> | { artifactVersionId: string } },
) {
  const params = await Promise.resolve(context.params);
  const artifactVersionId = String(params.artifactVersionId || "").trim();
  const exportFile = artifactVersionId
    ? readLatestDocxExport({ artifactVersionId })
    : null;

  if (!exportFile) {
    return new Response("Resume artifact not found.", { status: 404 });
  }

  const filename = exportFile.filename.replace(/["\r\n]/g, "");
  return new Response(new Uint8Array(exportFile.buffer), {
    headers: {
      "Content-Type": exportFile.mimeType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
