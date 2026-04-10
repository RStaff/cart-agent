import fs from "node:fs";
import path from "node:path";

const currentRoot = process.cwd();
const sourceDir = path.join(currentRoot, ".next");
const targetDir = path.join(currentRoot, "..", ".next");
const dataSourceDir = path.join(currentRoot, ".data");
const dataTargetDir = path.join(currentRoot, "..", ".data");
const packageNamesToSync = [
  "next",
  "react",
  "react-dom",
  "scheduler",
  "clsx",
  "stripe",
  "@swc/helpers",
  "@shopify/app-bridge",
  "@shopify/app-bridge-react",
];

function syncPackage(packageName) {
  const sourcePackageDir = path.join(
    currentRoot,
    "node_modules",
    ...packageName.split("/"),
  );
  const targetPackageDir = path.join(
    currentRoot,
    "..",
    "node_modules",
    ...packageName.split("/"),
  );

  if (!fs.existsSync(sourcePackageDir)) {
    return null;
  }

  fs.mkdirSync(path.dirname(targetPackageDir), { recursive: true });
  fs.cpSync(sourcePackageDir, targetPackageDir, {
    recursive: true,
    force: true,
  });
  return targetPackageDir;
}

if (!fs.existsSync(sourceDir)) {
  process.exit(0);
}

if (path.resolve(sourceDir) === path.resolve(targetDir)) {
  process.exit(0);
}

fs.mkdirSync(targetDir, { recursive: true });
fs.cpSync(sourceDir, targetDir, { recursive: true, force: true });

if (fs.existsSync(dataSourceDir)) {
  fs.mkdirSync(dataTargetDir, { recursive: true });
  fs.cpSync(dataSourceDir, dataTargetDir, {
    recursive: true,
    force: true,
  });
}

const syncedPackages = packageNamesToSync
  .map((packageName) => ({
    packageName,
    targetDir: syncPackage(packageName),
  }))
  .filter((entry) => entry.targetDir);

console.log(`Synced Next build artifacts to ${targetDir}`);
for (const entry of syncedPackages) {
  console.log(
    `Synced runtime package artifact ${entry.packageName} to ${entry.targetDir}`,
  );
}
if (fs.existsSync(dataSourceDir)) {
  console.log(`Synced runtime data artifacts to ${dataTargetDir}`);
}
