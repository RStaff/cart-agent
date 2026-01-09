if (process.env.DISABLE_WORKER === '1') {
  console.log('[worker] disabled by DISABLE_WORKER');
  process.exit(0);
}
await import('./send-worker-loop.js');
