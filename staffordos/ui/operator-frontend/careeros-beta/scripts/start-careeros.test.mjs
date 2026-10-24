import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("./start-careeros.mjs", import.meta.url), "utf8");
assert.match(source, /import\s*\{\s*runCareerosMigrations\s*\}\s*from\s*["']\.\/migrate-careeros\.mjs["']/);
assert.match(source, /await\s+runCareerosMigrations\(\)/);
assert.match(source, /spawn\(process\.execPath,\s*\["node_modules\/next\/dist\/bin\/next",\s*"start"\]/);
assert.doesNotMatch(source, /prisma\s+migrate\s+deploy/);
console.log("CareerOS startup authority test passed: CareerOSMigration runner gates Next startup; no competing Prisma command.");
