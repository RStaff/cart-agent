import { readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { Client } from "pg";

async function ensureCareerSchema() {
  if (!process.env.DATABASE_URL) {
    if (process.env.NODE_ENV === "production") throw new Error("DATABASE_URL_REQUIRED");
    return;
  }
  const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try { await client.query(await readFile(new URL("../prisma/migrations/20260818030000_add_resume_drafts/migration.sql", import.meta.url), "utf8")); }
  finally { await client.end(); }
}

await ensureCareerSchema();
const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start"], { stdio: "inherit", env: process.env });
child.on("exit", (code, signal) => process.exit(signal ? 1 : code ?? 1));
