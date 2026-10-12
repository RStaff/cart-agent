import { configFromEnv, validateRuntimeConfig } from "./issuer.mjs";
import { createIssuerServer } from "./server.mjs";
import { runHandoffMigrations } from "./migrations.mjs";

const config = configFromEnv();
const validatedConfig = validateRuntimeConfig(config);
if (validatedConfig.frontendHandoffUrl) await runHandoffMigrations(validatedConfig);
const server = createIssuerServer({ config: validatedConfig });

server.listen(validatedConfig.port, () => {
  process.stdout.write(`staffordos-operator-issuer listening on ${validatedConfig.port}\n`);
});
