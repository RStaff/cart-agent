try {
  const Module = require('module');
  const path = require('path');

  // Load the real express once
  const expressPath = require.resolve('express');
  const realExpress = require(expressPath);

  // Build wrapped express(): call original, then install our router
  const wrapped = function(...args) {
    const app = realExpress(...args);
    try {
      const { installSmcAlign } = require(path.join(process.cwd(), 'web', 'smc-align.js'));
      if (typeof installSmcAlign === 'function') {
        installSmcAlign(app);
        if (process.env.SMC_PRELOAD_LOG) console.log('[smc-preload] alignment router installed');
      }
    } catch (e) {
      console.error('[smc-preload] failed to install alignment router:', e && e.message);
    }
    return app;
  };

  // Copy all enumerable props so it behaves like express (Router, static, etc)
  Object.assign(wrapped, realExpress);

  // Replace the export in require.cache so *both* CJS require and ESM import get wrapped
  const cached = require.cache[expressPath];
  if (cached) {
    cached.exports = wrapped;
    if (process.env.SMC_PRELOAD_LOG) console.log('[smc-preload] express export replaced in require.cache');
  }

  // Also patch Module.prototype.require as a fallback for odd loaders
  const origRequire = Module.prototype.require;
  Module.prototype.require = function(id) {
    const m = origRequire.apply(this, arguments);
    return (id === 'express') ? wrapped : m;
  };
} catch (e) {
  console.error('[smc-preload] init failed:', e && e.message);
}
