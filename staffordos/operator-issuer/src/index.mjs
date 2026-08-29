import { configFromEnv } from "./issuer.mjs";
import { createIssuerServer } from "./server.mjs";

const config = configFromEnv();
const server = createIssuerServer({ config });

server.listen(config.port, () => {
  process.stdout.write(`staffordos-operator-issuer listening on ${config.port}\n`);
});
