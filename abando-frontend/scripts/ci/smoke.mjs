import { spawn } from 'node:child_process';
import http from 'node:http';

const PORT = process.env.PORT || '3000';
const MUST_200 = ['/', '/pricing', '/v2'];

function waitForReady(port, ms=15000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    (function tick(){
      const req = http.get({ host: '127.0.0.1', port, path: '/' }, res => {
        res.resume();
        resolve();
      });
      req.on('error', () => {
        if (Date.now() - start > ms) return reject(new Error('timeout'));
        setTimeout(tick, 300);
      });
    })();
  });
}

function req(path) {
  return new Promise((resolve, reject) => {
    http.get({ host: '127.0.0.1', port: PORT, path }, res => {
      const ok = res.statusCode >= 200 && res.statusCode < 300;
      res.resume();
      ok ? resolve() : reject(new Error(`${path} → ${res.statusCode}`));
    }).on('error', reject);
  });
}

(async () => {
  console.log('→ next start');
  const ps = spawn('npx', ['--yes', 'next', 'start', '-p', PORT], { stdio: 'inherit' });

  try {
    await waitForReady(PORT);
    console.log('✓ server ready');

    for (const p of MUST_200) {
      process.stdout.write(`→ probe ${p} ... `);
      await req(p);
      console.log('200');
    }

    console.log('✓ smoke OK');
    process.exitCode = 0;
  } catch (e) {
    console.error('✗ smoke failed:', e.message || e);
    process.exitCode = 1;
  } finally {
    try { ps.kill('SIGTERM'); } catch {}
  }
})();
