import {
  CAREEROS_BETA_OPERATIONS_READ_PERMISSION,
  type StaffordOsOperatorAuthConfig,
  authorizeStaffordOsOperatorRead,
  operatorAuthConfigFromEnv,
} from "./staffordosOperatorSession";
import {
  type CareerOsBetaOperationsReadModel,
  loadCareerOsBetaOperationsReadModel,
} from "./careerosBetaOperationsReadModel";

export type CareerOsBetaOperationsSuccessBody = CareerOsBetaOperationsReadModel & {
  ok: true;
  authority: typeof CAREEROS_BETA_OPERATIONS_READ_PERMISSION;
  customerDataRead: true;
  customerDataMutated: false;
  privateCareerDataReturned: false;
};

export type CareerOsBetaOperationsFailureBody =
  | {
      ok: false;
      error:
        | "OPERATOR_SESSION_MISSING"
        | "OPERATOR_SESSION_INVALID"
        | "OPERATOR_SESSION_EXPIRED"
        | "OPERATOR_PERMISSION_MISSING";
    }
  | {
      ok: false;
      error: "CAREEROS_BETA_OPERATIONS_READ_MODEL_UNAVAILABLE";
    };

export type CareerOsBetaOperationsResult =
  | {
      status: 200;
      body: CareerOsBetaOperationsSuccessBody;
    }
  | {
      status: 401 | 403 | 500;
      body: CareerOsBetaOperationsFailureBody;
    };

type AccessOptions = {
  config?: StaffordOsOperatorAuthConfig;
  now?: Date;
  loadReadModel?: () => Promise<CareerOsBetaOperationsReadModel>;
};

export async function getCareerOsBetaOperationsResult(
  cookieValue: string,
  options: AccessOptions = {},
): Promise<CareerOsBetaOperationsResult> {
  const config = options.config || operatorAuthConfigFromEnv(process.env);
  const authorization = authorizeStaffordOsOperatorRead(
    cookieValue,
    CAREEROS_BETA_OPERATIONS_READ_PERMISSION,
    config,
    options.now,
  );

  if (!authorization.ok) {
    return {
      status: authorization.status,
      body: {
        ok: false,
        error: authorization.error,
      },
    };
  }

  try {
    const readModel = options.loadReadModel
      ? await options.loadReadModel()
      : await loadCareerOsBetaOperationsReadModel({ now: options.now });

    return {
      status: 200,
      body: {
        ...readModel,
        ok: true,
        authority: CAREEROS_BETA_OPERATIONS_READ_PERMISSION,
        customerDataRead: true,
        customerDataMutated: false,
        privateCareerDataReturned: false,
      },
    };
  } catch {
    return {
      status: 500,
      body: {
        ok: false,
        error: "CAREEROS_BETA_OPERATIONS_READ_MODEL_UNAVAILABLE",
      },
    };
  }
}
