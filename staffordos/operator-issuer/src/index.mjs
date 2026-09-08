import { configFromEnv } from "./issuer.mjs";
import { createIssuerServer } from "./server.mjs";
import { runHandoffMigrations } from "./migrations.mjs";

const config = configFromEnv();
if (config.frontendHandoffUrl) await runHandoffMigrations(config);
const server = createIssuerServer({ config });

server.listen(config.port, () => {
  process.stdout.write(`staffordos-operator-issuer listening on ${config.port}\n`);
});
