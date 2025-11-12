const fs = require('fs');
const path = require('path');
const p = path.resolve('package.json');
const pkg = JSON.parse(fs.readFileSync(p, 'utf8'));

// Ensure scripts object exists
pkg.scripts = pkg.scripts || {};

// Guarded prepare:
// - If CI is set OR HUSKY=0, do nothing; otherwise run husky
pkg.scripts.prepare = "sh -c 'if [ -n \"$CI\" ] || [ \"$HUSKY\" = \"0\" ]; then exit 0; fi; npx --no husky install'";

pkg.devDependencies = pkg.devDependencies || {};
pkg.devDependencies.husky = pkg.devDependencies.husky || "^9.1.6";

// Write pretty JSON
fs.writeFileSync(p, JSON.stringify(pkg, null, 2) + "\n");
console.log("✅ package.json repaired with guarded `prepare` and husky devDependency");
