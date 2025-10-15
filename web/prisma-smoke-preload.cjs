const Module = require('module');
const path = require('path');
const fs = require('fs');

if (process.env.PRISMA_FORCE_REAL === '1') { module.exports = {}; return; }

const shimCode = `
class PrismaClient {
  constructor(){ console.warn('[prisma-shim] Mock PrismaClient active'); }
  async $connect(){} async $disconnect(){}
  async $executeRaw(){return 0;} async $queryRaw(){return [];}
}
module.exports = { PrismaClient };
`.trim();

const shimPath = path.join(__dirname,'_prisma_shim.cjs');
try { if (!fs.existsSync(shimPath)) fs.writeFileSync(shimPath, shimCode); } catch {}
const shim = require(shimPath);

const orig = Module.prototype.require;
Module.prototype.require = function(request) {
  if (request === '@prisma/client' || (typeof request === 'string' && request.startsWith('@prisma/client/'))) {
    return shim;
  }
  return orig.apply(this, arguments);
};
