export function capabilityAuthorityStateChanged(previousState, nextState) {
  return previousState !== nextState;
}

export async function invalidateCurrentMatchEvaluations(client, context, profile) {
  return client.query('UPDATE "CareerMatchEvaluation" SET stale=true WHERE "tenantId"=$1 AND "userId"=$2 AND "profileId"=$3 AND stale=false', [context.tenant.id, context.user.id, profile]);
}
