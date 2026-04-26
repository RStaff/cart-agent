import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const candidates = [
  "/Users/rossstafford/projects/_staffordmedia-site_parked/apps/website",
  "/Users/rossstafford/projects/StaffordMediaConsulting/apps/website",
  "/Users/rossstafford/projects/_staffordmedia-site_parked/_smc_clean"
];

function exists(p) {
  return fs.existsSync(p);
}

function safeReadJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

function safeCmd(cmd, cwd) {
  try {
    return execSync(cmd, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  } catch {
    return "";
  }
}

function listPages(root) {
  const owners = [];
  const pageCandidates = [
    "app/page.tsx",
    "src/app/page.tsx",
    "app/abando/page.tsx",
    "src/app/abando/page.tsx",
    "app/shopifixer/page.tsx",
    "src/app/shopifixer/page.tsx",
    "app/services/page.tsx",
    "src/app/services/page.tsx",
    "app/contact/page.tsx",
    "src/app/contact/page.tsx"
  ];

  for (const rel of pageCandidates) {
    const full = path.join(root, rel);
    if (exists(full)) {
      owners.push({
        route: "/" + rel.replace(/^src\//, "").replace(/^app\//, "").replace(/\/page\.tsx$/, "").replace(/^page\.tsx$/, ""),
        file: full,
        relative_file: rel,
        size: fs.statSync(full).size
      });
    }
  }

  return owners;
}

function scoreRoot(root) {
  const pkg = safeReadJson(path.join(root, "package.json"));
  const hasNext = !!pkg?.dependencies?.next || !!pkg?.devDependencies?.next;
  const hasApp = exists(path.join(root, "app")) || exists(path.join(root, "src/app"));
  const hasDeployConfig = exists(path.join(root, "vercel.json")) || exists(path.join(root, "next.config.mjs")) || exists(path.join(root, "next.config.ts"));
  const remote = safeCmd("git remote -v", root);
  const branch = safeCmd("git branch --show-current", root);
  const owners = listPages(root);

  let score = 0;
  const hasShopifixerOwner = owners.some((o) => o.route === "/shopifixer");
  const isActiveLaunchBranch = branch === "launch/website";
  const isParkedPath = root.includes("_parked");

  if (hasNext) score += 20;
  if (hasApp) score += 20;
  if (hasDeployConfig) score += 10;
  if (remote.includes("Stafford") || remote.includes("stafford") || remote.includes("website")) score += 20;
  if (owners.length) score += 10;
  if (hasShopifixerOwner) score += 35;
  if (isActiveLaunchBranch) score += 15;
  if (isParkedPath) score -= 20;

  return {
    root,
    exists: true,
    score,
    branch,
    remote,
    package_name: pkg?.name || null,
    has_next: hasNext,
    has_app_router: hasApp,
    has_deploy_config: hasDeployConfig,
    scripts: pkg?.scripts || {},
    has_shopifixer_owner: owners.some((o) => o.route === "/shopifixer"),
    page_owners: owners
  };
}

const existing = candidates.filter(exists);
const roots = existing.map(scoreRoot).sort((a, b) => b.score - a.score);

const sandboxOwner = "abando-frontend/app/shopifixer/page.tsx";
const sandboxExists = exists(sandboxOwner);

const report = {
  ok: true,
  agent: "prod_parity_agent_v1",
  mode: "production_source_discovery",
  generated_at: new Date().toISOString(),
  current_cart_agent_branch: safeCmd("git branch --show-current", process.cwd()),
  candidate_roots_ranked: roots,
  probable_production_source_root: roots[0]?.root || null,
  confidence: roots[0]?.score >= 70 ? "high" : roots[0]?.score >= 45 ? "medium" : "low",
  sandbox_shopifixer: {
    exists: sandboxExists,
    owner: sandboxOwner,
    status: sandboxExists ? "sandbox_concept_only_not_prod_source" : "missing"
  },
  conclusion: roots[0]
    ? "Use the highest-scoring StaffordMedia root as source-of-truth candidate, then verify remote/deployment before changing production surfaces."
    : "No StaffordMedia production source candidate found.",
  next_steps: [
    "Verify highest-scoring root remote and branch.",
    "Identify whether /shopifixer exists in production source.",
    "If missing, create a migration packet instead of patching cart-agent sandbox.",
    "Only after source root is confirmed: branch from that repo, apply changes there, preview, approve, promote."
  ]
};

fs.mkdirSync("staffordos/system_inventory", { recursive: true });
fs.writeFileSync(
  "staffordos/system_inventory/prod_parity_report_v1.json",
  JSON.stringify(report, null, 2) + "\n"
);

console.log(JSON.stringify(report, null, 2));
