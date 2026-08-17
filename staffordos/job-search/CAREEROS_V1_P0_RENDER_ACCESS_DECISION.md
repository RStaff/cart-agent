# CareerOS Render Access Decision

## Decision

`RENDER_OPERATOR_LOGIN_REQUIRED`

The configured local Render session is rejected as unauthorized. The most likely bounded cause is an expired or revoked token/session; account/workspace mismatch cannot be ruled out until interactive authentication succeeds.

## Exact operator action

From the repository environment, run the provider-supported existing-account flow:

```text
render login
```

Authenticate to the existing Stafford Media Render account and select the intended workspace. Do not create an account, create a token in source control, paste credentials into chat, or provision any resource.

After successful login, rerun `render whoami` and this mission’s read-only workspace/resource/permission audit. The next deployment mission remains `CAREEROS_V1_PRODUCTIZATION_P0_DEPLOYMENT_PROVISION_AND_PROOF`.

No Render resources, databases, domains, secrets, deployments, migrations, or existing Abando/ShopiFixer assets were changed.
