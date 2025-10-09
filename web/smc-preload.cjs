const Module = require('module');
const orig = Module.prototype.require;
Module.prototype.require = function (id) {
  const m = orig.apply(this, arguments);
  if (id === 'express' && typeof m === 'function') {
    const express = m;
    const wrapped = function(...args){
      const app = express(...args);
      try {
        const { installSmcAlign } = require('./smc-align');
        if (typeof installSmcAlign === 'function') {
          installSmcAlign(app);
          if (process.env.SMC_PRELOAD_LOG) console.log('[smc-preload] installed alignment router');
        }
      } catch (e) { console.error('[smc-preload] failed to install router', e); }
      return app;
    };
    Object.assign(wrapped, express);
    return wrapped;
  }
  return m;
};
