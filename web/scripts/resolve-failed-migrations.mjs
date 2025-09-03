import { execSync } from 'node:child_process';

function sh(cmd) {
  return execSync(cmd, { stdio: 'pipe', encoding: 'utf8' });
}
function run(cmd) {
  console.log(`[migrate-safe] ${cmd}`);
  execSync(cmd, { stdio: 'inherit' });
}

try {
  // Try Prisma JSON status (Prisma 6+). If it fails, we continue without blocking.
  let failed = [];
  try {
    const out = sh('npx prisma migrate status --schema=./prisma/schema.prisma --json');
    const status = JSON.parse(out);
    const dbMigs = (status.database && status.database.migrations) || [];
    failed = dbMigs.filter(m =>
      (!m.finishedAt || m.finishedAt === null) && (!m.rolledBackAt || m.rolledBackAt === null)
    );
  } catch (e) {
    console.warn('[migrate-safe] Could not parse JSON status; proceeding without auto-resolve.', e.message);
  }

  if (failed.length) {
    console.log(`[migrate-safe] Found ${failed.length} incomplete migration(s):`);
    for (const f of failed) console.log(`  - ${f.migrationName} (startedAt=${f.startedAt || 'unknown'})`);
    for (const f of failed) run(`npx prisma migrate resolve --rolled-back "${f.migrationName}" --schema=./prisma/schema.prisma`);
  } else {
    console.log('[migrate-safe] No incomplete migrations found.');
  }
  process.exit(0);
} catch (e) {
  console.error('[migrate-safe] Error while resolving failed migrations:', e.message || e);
  // Do not fail the process; allow boot to continue.
  process.exit(0);
}
