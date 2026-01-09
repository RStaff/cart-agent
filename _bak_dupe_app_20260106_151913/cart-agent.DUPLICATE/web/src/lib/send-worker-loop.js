const TICK_MS = parseInt(process.env.WORKER_TICK_MS || '10000', 10);

async function tick() {
  try {
    // run one batch
    await import('./send-worker.js');
  } catch (e) {
    console.error('[worker] tick error', e);
  } finally {
    setTimeout(tick, TICK_MS);
  }
}

tick();
