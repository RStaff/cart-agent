const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const publicDir = path.join(root, "public");
const archiveDir = path.join(publicDir, "_wolf_archive");

if (!fs.existsSync(publicDir)) {
  console.log("ℹ️ public/ directory not found, skipping wolf asset check.");
  process.exit(0);
}

fs.mkdirSync(archiveDir, { recursive: true });

function walk(dir, results = []) {
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      walk(full, results);
    } else {
      results.push(full);
    }
  }
  return results;
}

const files = walk(publicDir);
let moved = 0;

for (const file of files) {
  const name = path.basename(file).toLowerCase();
  if (name.includes("wolf") && !file.includes("_wolf_archive")) {
    const dest = path.join(archiveDir, path.basename(file));
    fs.renameSync(file, dest);
    console.log(`🧹 moved wolf asset → ${dest}`);
    moved++;
  }
}

if (!moved) {
  console.log("✅ No wolf image assets found under public/.");
} else {
  console.log(`✅ Done. Moved ${moved} wolf asset(s) into ${archiveDir}`);
}
