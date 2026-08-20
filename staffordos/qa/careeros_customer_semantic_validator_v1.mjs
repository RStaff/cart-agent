import { existsSync, readFileSync } from "node:fs";

const root = "staffordos/ui/operator-frontend/careeros-beta";
const authorityPath = `${root}/lib/career/customerSemanticAuthority.mjs`;
const authorityJsonPath = `${root}/lib/career/customerSemanticAuthority.json`;
const detailPath = `${root}/app/career/jobs/[opportunityId]/page.tsx`;
const jobsPath = `${root}/app/career/jobs/page.tsx`;
const comparePath = `${root}/app/career/jobs/compare/page.tsx`;
const profilePath = `${root}/app/career/profile/page.tsx`;
const storyPath = `${root}/app/career/onboarding/page.tsx`;
const storyBuilderPath = `${root}/app/career/components/CareerStoryBuilder.tsx`;
const intakeReviewPath = `${root}/app/career/components/IntakeReview.tsx`;
const intakeSourcePath = `${root}/app/api/career/intake/source/route.ts`;
const productPath = `${root}/lib/career/careerP0Product.mjs`;
const homePath = `${root}/app/career/page.tsx`;
const discoverPath = `${root}/app/career/discover/DiscoverClient.tsx`;
const discoverApiPath = `${root}/app/api/career/discover/route.ts`;
const jobsPagePath = `${root}/app/career/jobs/page.tsx`;

function read(path) {
  return existsSync(path) ? readFileSync(path, "utf8") : "";
}

const authority = read(authorityPath) + read(authorityJsonPath);
let navigationAuthority = null;
try { navigationAuthority = JSON.parse(read(authorityJsonPath)).NAVIGATION_DESTINATION; } catch { navigationAuthority = null; }
const detail = read(detailPath);
const jobs = read(jobsPath);
const compare = read(comparePath);
const profile = read(profilePath);
const story = read(storyPath);
const storyBuilder = read(storyBuilderPath);
const intakeReview = read(intakeReviewPath);
const intakeSource = read(intakeSourcePath);
const product = read(productPath);
const home = read(homePath);
const discover = read(discoverPath);
const discoverApi = read(discoverApiPath);
const jobsPage = read(jobsPagePath);
const checks = {
  authority_exists: Boolean(authority),
  match_score_is_not_ready: /MATCH_SCORE[\s\S]*["']?status["']?\s*:\s*"NOT_READY"/.test(authority),
  match_score_is_not_customer_facing: /MATCH_SCORE[\s\S]*["']?customerFacingAllowed["']?\s*:\s*false/.test(authority),
  evidence_fit_has_explicit_authority: /EVIDENCE_COVERAGE_PERCENTAGE[\s\S]*["']?authoritativeSource["']?\s*:\s*"buildEvidenceFit"/.test(authority),
  navigation_contract_exists: Boolean(navigationAuthority?.destinations?.CAREEROS_HOME && navigationAuthority?.destinations?.JOB_SEARCH_WORKSPACE),
  navigation_destinations_are_distinct: Boolean(navigationAuthority && new Set(Object.values(navigationAuthority.destinations)).size === Object.keys(navigationAuthority.destinations).length),
  detail_uses_semantic_presentation: /customerEvidenceFitPresentation/.test(detail),
  comparison_uses_semantic_presentation: /customerEvidenceFitPresentation/.test(compare),
  detail_does_not_render_raw_percentage: !/fit\.percentage/.test(detail),
  comparison_does_not_render_raw_percentage: !/evidenceFit\.percentage/.test(compare),
  no_match_score_percentage_surface: !/(match|compatibility|alignment|qualification)[^\n%]{0,100}%/i.test(detail + compare),
  detail_has_home_breadcrumb: /CareerOS Home/.test(detail) && /href="\/career"/.test(detail),
  detail_has_workspace_breadcrumb: /Job Search Workspace/.test(detail) && /href="\/career\/jobs"/.test(detail),
  jobs_has_single_internal_destination: !/Open opportunity/.test(jobs),
  jobs_has_home_destination: /href="\/career"/.test(jobs) && /CareerOS Home/.test(jobs),
  jobs_preserves_source_destination: /Open source link/.test(jobs),
  profile_identity_authority_exists: /PROFILE_IDENTITY/.test(authority) && /CareerProfile/.test(authority),
  career_story_authority_exists: /CAREER_STORY/.test(authority) && /CareerFactCandidate/.test(authority),
  evidence_authority_exists: /CAREER_EVIDENCE/.test(authority) && /CareerFact and source provenance/.test(authority),
  capability_authority_separate: /CAPABILITY_AUTHORITY/.test(authority) && /CareerCapabilityAuthority/.test(authority),
  application_artifact_authority_separate: /APPLICATION_ARTIFACTS/.test(authority) && /CareerResumeDraft/.test(authority),
  profile_does_not_render_story_builder: !/CareerStoryBuilder/.test(profile),
  profile_has_story_destination: /href="\/career\/onboarding"/.test(profile) && /Career Story/.test(profile),
  story_renders_story_builder: /CareerStoryBuilder/.test(story) && /Career Story/.test(story),
  story_has_profile_and_home_destinations: /href="\/career\/profile"/.test(story) && /href="\/career"/.test(story),
  testimony_continuity_authority_exists: /TESTIMONY_REVIEW_CONTINUITY/.test(authority),
  submitted_testimony_exposes_review: /Review what CareerOS understands/.test(storyBuilder + intakeReview) && /setMode\("PASTE_OR_TYPE"\)/.test(storyBuilder) && /focusReview/.test(storyBuilder),
  candidates_are_explicitly_unconfirmed: /not confirmed yet/.test(intakeReview) && /Review proposed experience/.test(intakeReview),
  strengths_does_not_bypass_pending_review: /hasReviewableCandidates/.test(storyBuilder) && /Review proposed experience/.test(storyBuilder) && /href="\/career\/capabilities"/.test(storyBuilder),
  testimony_uses_existing_source_candidate_path: /careerP0Store\.createSource/.test(intakeSource) && /careerP0Store\.saveCandidates/.test(intakeSource),
  capabilities_remain_confirmed_fact_only: /CUSTOMER_CONFIRMED_SOURCE_BACKED/.test(product) && /deriveCapabilityCandidates\(facts\)/.test(product),
  home_has_distinct_profile_and_story_destinations: /href="\/career\/profile"/.test(home) && /storyHref\s*=\s*"\/career\/onboarding"/.test(home) && /href=\{storyHref\}/.test(home),
  discovery_authority_exists: /SEARCH_PREFERENCE/.test(authority) && /PROVIDER_RESULT/.test(authority) && /TRIAGE_STATUS/.test(authority),
  auto_import_prohibited: /AUTO_IMPORT/.test(authority) && /PROHIBITED/.test(authority) && /BACKGROUND_SEARCH/.test(authority) && /NOT_AUTHORIZED/.test(authority),
  discovery_saves_without_provider_call: /Save search preferences/.test(discover) && /method: "PUT"/.test(discover),
  discovery_requires_explicit_search: /Search now/.test(discover) && /export async function POST/.test(discoverApi),
  provider_results_are_not_match_claims: /not CareerOS match assessments/.test(discover),
  discovery_has_home_navigation: /href="\/career"/.test(discoverPath ? discover : "") || /href="\/career"/.test(read(`${root}/app/career/discover/page.tsx`)),
  jobs_has_needs_attention_view: /Needs attention/.test(jobsPage),
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
