import { spawn } from "node:child_process";
import { runCareerosMigrations } from "./migrate-careeros.mjs";

await runCareerosMigrations();
const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start"], { stdio: "inherit", env: process.env });
child.on("exit", (code, signal) => process.exit(signal ? 1 : code ?? 1));
