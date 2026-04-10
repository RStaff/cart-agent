# Job Search OS

This module is the isolated StaffordOS boundary for a single-user Job Search OS MVP.

It owns:
- job-search-specific route handlers
- job-search-specific service logic
- job-search-specific storage boundaries
- job-search-specific UI placeholders
- truthful resume tailoring from canonical source material only

It must not touch:
- Abando routes, schemas, flows, or merchant state
- StaffordOS runtime, router, truth, or execution internals
- shared persistence outside this module

Current status:
- isolated module with placeholder routes
- resume block and candidate profile boundaries
- deterministic resume tailoring service
- no ATS calls
- no scoring
- no application submission

Next build sequence:
1. Implement module-local job ingestion and normalization
2. Connect tailoring service to stored canonical resume, resume blocks, and candidate profile
3. Add scoring and queue behavior inside this boundary
4. Add ATS-supported submission handlers and tracking
