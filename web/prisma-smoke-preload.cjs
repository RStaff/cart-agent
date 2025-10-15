/**
 * prisma-smoke-preload.cjs
 * - If @prisma/client exists (generated), do nothing.
 * - Otherwise, intercept require('@prisma/client') with a lightweight mock so the server can boot for smoke checks.
 */
const Module = require('module');
const fs = require('fs');
const path = require('path');

function hasGeneratedClient() {
  try {
    // Typical path after "prisma generate" in the web package
    const root = path.join(__dirname, 'node_modules', '.prisma', 'client');
    if (fs.existsSync(root)) return true;
    // As a fallback, try resolving normally
    require.resolve('@prisma/client');
    return true;
  } catch { return false; }
}

if (!hasGeneratedClient()) {
  const shimPath = path.join(__dirname, '_prisma_shim.cjs');
  if (!fs.existsSync(shimPath)) {
    fs.writeFileSync(shimPath, `
class PrismaClient {
  constructor() { console.warn('[prisma-shim] Using mock PrismaClient for local smoke (no DB).'); }
  async $connect(){} async $disconnect(){} async $executeRaw(){return 0;} async $queryRaw(){return [];}
}
module.exports = { PrismaClient };
`.trimStart());
  }
  const orig = Module._resolveFilename;
  Module._resolveFilename = function(request, parent, isMain, options) {
    if (request === '@prisma/client') {
      return shimPath;
    }
    return orig.apply(this, arguments);
  };
}
