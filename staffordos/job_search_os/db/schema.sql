create table if not exists job_search_resume_blocks (
  id text primary key,
  block_key text not null unique,
  section text not null,
  title text not null,
  canonical_text text not null,
  tags_json jsonb not null default '[]'::jsonb,
  seniority_weight integer not null default 1,
  source_ref text not null default 'canonical_resume',
  active boolean not null default true
);

create table if not exists job_search_candidate_profile (
  id text primary key,
  target_roles_json jsonb not null default '[]'::jsonb,
  salary_floor integer null,
  preferred_locations_json jsonb not null default '[]'::jsonb,
  seniority_level text not null,
  constraints_json jsonb not null default '[]'::jsonb
);

create table if not exists job_search_jobs (
  id text primary key,
  source text not null,
  source_job_id text null,
  source_url text not null unique,
  company text not null,
  title text not null,
  location_text text null,
  work_mode text null,
  employment_type text null,
  salary_min integer null,
  salary_max integer null,
  salary_currency text null,
  description_raw text not null,
  description_normalized text not null,
  role_family text null,
  function_tags_json jsonb not null default '[]'::jsonb,
  domain_tags_json jsonb not null default '[]'::jsonb,
  seniority_hint text null,
  requires_people_management boolean not null default false,
  company_quality text null,
  strategic_upside text null,
  fit_score integer null,
  compensation_score integer null,
  narrative_score integer null,
  total_score integer null,
  recommendation text null,
  score_reasoning text null,
  risk_flags_json jsonb not null default '[]'::jsonb,
  strongest_angles_json jsonb not null default '[]'::jsonb
);

create unique index if not exists job_search_jobs_source_job_id_idx
  on job_search_jobs (source, source_job_id)
  where source_job_id is not null;

create table if not exists job_search_applications (
  id text primary key,
  job_id text not null unique,
  company text not null,
  title text not null,
  recommendation text not null,
  approval_state text not null default 'pending',
  draft_state text not null default 'not_started',
  submission_state text not null default 'not_submitted',
  follow_up_state text not null default 'none',
  outcome_state text not null default 'none',
  submitted_at timestamptz null,
  next_follow_up_at timestamptz null,
  last_follow_up_at timestamptz null,
  tailored_resume_markdown text not null,
  selected_resume_blocks_json jsonb not null default '[]'::jsonb,
  strongest_angles_json jsonb not null default '[]'::jsonb,
  risk_flags_json jsonb not null default '[]'::jsonb,
  score_reasoning text not null,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
