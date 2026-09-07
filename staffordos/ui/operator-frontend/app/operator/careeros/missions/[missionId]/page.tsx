import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { CareerOsMissionObservation } from "../../../../../components/operator/CareerOsMissionObservation";
import { getCareerOsBetaOperationsResult } from "../../../../../lib/operator/careerosBetaOperationsAccess";
import { loadCareerOsMissionObservation } from "../../../../../lib/operator/careerosMissionObservationReadModel.mjs";
import { STAFFORDOS_OPERATOR_SESSION_COOKIE } from "../../../../../lib/operator/staffordosOperatorSession";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function CareerOsMissionPage({ params }: { params: Promise<{ missionId: string }> }) {
  const { missionId } = await params;
  const jar = await cookies();
  const cookieValue = jar.get(STAFFORDOS_OPERATOR_SESSION_COOKIE)?.value || "";
  const result = await getCareerOsBetaOperationsResult(cookieValue);

  if (result.status !== 200) {
    return <div className="container operatorHomeContainer"><section className="panel errorPanel"><div className="panelInner"><p className="eyebrow">CareerOS Operations</p><h1 className="title">Operator authorization required</h1><p className="subtitle">{result.body.error}</p></div></section></div>;
  }

  const observation = await loadCareerOsMissionObservation({ operationsReadModel: result.body as any } as any);
  if (!observation || observation.missionId !== missionId) notFound();
  return <CareerOsMissionObservation observation={observation as any} />;
}
