import fs from 'node:fs';
import path from 'node:path';

const fp = path.join('web','src','index.js');
let s = fs.readFileSync(fp,'utf8');

// 1) Normalize imports to named Node crypto functions
s = s
  // remove any default crypto import lines
  .replace(/^\s*import\s+crypto\s+from\s+["']node:crypto["'];?\s*$/m, '')
  .replace(/^\s*import\s+crypto\s+from\s+["']crypto["'];?\s*$/m, '')
  // ensure we have named imports
  .replace(/^\s*import\s+{([^}]*)}\s+from\s+["']node:crypto["'];?\s*$/m, (m, inside)=>{
    const have = new Set(inside.split(',').map(x=>x.trim()).filter(Boolean));
    ['randomBytes','createHmac'].forEach(k=>have.add(k));
    return `import { ${Array.from(have).join(', ')} } from "node:crypto";`;
  });

// If no node:crypto named import exists yet, add one at the top
if (!/from "node:crypto";/.test(s)) {
  s = `import { randomBytes, createHmac } from "node:crypto";\n` + s;
}

// 2) Replace usages that referenced "crypto." with named calls
s = s.replace(/\bcrypto\.randomBytes\(/g, 'randomBytes(')
     .replace(/\bcrypto\.createHmac\(/g, 'createHmac(');

// 3) Extra safety: never shadow with globalThis.crypto
s = s.replace(/const\s+{?\s*crypto\s*}?\s*=\s*globalThis\s*;?/g, '// removed globalThis.crypto shadow');

fs.writeFileSync(fp, s);
console.log('✅ Patched', fp);
