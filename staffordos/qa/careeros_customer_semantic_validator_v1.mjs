import { existsSync, readFileSync } from "node:fs";

const root = "staffordos/ui/operator-frontend/careeros-beta";
const authorityPath = `${root}/lib/career/customerSemanticAuthority.mjs`;
const authorityJsonPath = `${root}/lib/career/customerSemanticAuthority.json`;
const detailPath = `${root}/app/career/jobs/[opportunityId]/page.tsx`;
const jobsPath = `${root}/app/career/jobs/page.tsx`;
const comparePath = `${root}/app/career/jobs/compare/page.tsx`;

function read(path) {
  return existsSync(path) ? readFileSync(path, "utf8") : "";
}

const authority = read(authorityPath) + read(authorityJsonPath);
const detail = read(detailPath);
const jobs = read(jobsPath);
const compare = read(comparePath);
const checks = {
  authority_exists: Boolean(authority),
  match_score_is_not_ready: /MATCH_SCORE[\s\S]*["']?status["']?\s*:\s*"NOT_READY"/.test(authority),
  match_score_is_not_customer_facing: /MATCH_SCORE[\s\S]*["']?customerFacingAllowed["']?\s*:\s*false/.test(authority),
  evidence_fit_has_explicit_authority: /EVIDENCE_COVERAGE_PERCENTAGE[\s\S]*["']?authoritativeSource["']?\s*:\s*"buildEvidenceFit"/.test(authority),
  detail_uses_semantic_presentation: /customerEvidenceFitPresentation/.test(detail),
  comparison_uses_semantic_presentation: /customerEvidenceFitPresentation/.test(compare),
  detail_does_not_render_raw_percentage: !/fit\.percentage/.test(detail),
  comparison_does_not_render_raw_percentage: !/evidenceFit\.percentage/.test(compare),
  no_match_score_percentage_surface: !/(match|compatibility|alignment|qualification)[^\n%]{0,100}%/i.test(detail + compare),
  detail_has_home_breadcrumb: /CareerOS Home/.test(detail) && /href="\/career"/.test(detail),
  detail_has_workspace_breadcrumb: /Job Search Workspace/.test(detail) && /href="\/career\/jobs"/.test(detail),
  jobs_has_single_internal_destination: !/Open opportunity/.test(jobs),
  jobs_preserves_source_destination: /Open source link/.test(jobs),
};

const failures = Object.entries(checks).filter(([, value]) => !value).map(([key]) => key);
const result = {
  schema: "careeros.customer_semantic_validator.v1",
  status: failures.length ? "FAIL" : "PASS",
  checks,
  failures,
  authority: "CareerOS customer semantic authority",
  deterministic: true,
};
console.log(JSON.stringify(result, null, 2));
if (failures.length) process.exit(1);
