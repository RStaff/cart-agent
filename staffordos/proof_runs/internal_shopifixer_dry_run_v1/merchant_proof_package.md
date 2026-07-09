# MERCHANT PROOF PACKAGE

Proof Package Version:
v1

Generated At:
2026-07-09T04:08:21.563Z

Proof Run ID:
internal_shopifixer_dry_run_v1

Manifest Path:
../../../../var/folders/2_/z7ybpx8x5097zxjpfxstdrtm0000gn/T/staffordos-evidence-manifest-14476.json

Manifest Generated At:
2026-07-09T04:08:21.560Z

Merchant / Store:
validation-shop.example.com

Before Evidence Artifact IDs:
- ev_1e5e23c277e092dd
- ev_ed59f3aa30e101e9

After Evidence Artifact IDs:
- ev_ebca0ca064ea7746
- ev_6a66f37992d02ad2

Screenshot Artifact References:
- artifact_id: cd74031f6068016a
  stage: before_evidence
  original_reference: /var/folders/2_/z7ybpx8x5097zxjpfxstdrtm0000gn/T/staffordos-evidence-sources-No3hsC/before.png
  stored_path: ../../../../var/folders/2_/z7ybpx8x5097zxjpfxstdrtm0000gn/T/staffordos-evidence-artifacts-14476/cd74031f6068016a.png
  exists: true
  status: stored
- artifact_id: 1da08e1acdcbfb74
  stage: after_evidence
  original_reference: /var/folders/2_/z7ybpx8x5097zxjpfxstdrtm0000gn/T/staffordos-evidence-sources-No3hsC/after.png
  stored_path: ../../../../var/folders/2_/z7ybpx8x5097zxjpfxstdrtm0000gn/T/staffordos-evidence-artifacts-14476/1da08e1acdcbfb74.png
  exists: true
  status: stored
- artifact_id: 2b992ca724f6e79d
  stage: before_evidence
  original_reference: /var/folders/2_/z7ybpx8x5097zxjpfxstdrtm0000gn/T/staffordos-evidence-sources-No3hsC/missing.png
  stored_path: ../../../../var/folders/2_/z7ybpx8x5097zxjpfxstdrtm0000gn/T/staffordos-evidence-artifacts-14476/2b992ca724f6e79d.png
  exists: false
  status: referenced_missing
- artifact_id: 39814db2b6d7678f
  stage: after_evidence
  original_reference: /var/folders/2_/z7ybpx8x5097zxjpfxstdrtm0000gn/T/staffordos-evidence-sources-No3hsC/missing.png
  stored_path: ../../../../var/folders/2_/z7ybpx8x5097zxjpfxstdrtm0000gn/T/staffordos-evidence-artifacts-14476/39814db2b6d7678f.png
  exists: false
  status: referenced_missing

Missing Screenshot Artifacts:
- 2b992ca724f6e79d referenced_missing: /var/folders/2_/z7ybpx8x5097zxjpfxstdrtm0000gn/T/staffordos-evidence-sources-No3hsC/missing.png
- 39814db2b6d7678f referenced_missing: /var/folders/2_/z7ybpx8x5097zxjpfxstdrtm0000gn/T/staffordos-evidence-sources-No3hsC/missing.png

Evidence Source Paths:
- staffordos/proof_runs/internal_shopifixer_dry_run_v1/before_evidence.md
- staffordos/proof_runs/internal_shopifixer_dry_run_v1/fix_scope.md
- staffordos/proof_runs/internal_shopifixer_dry_run_v1/after_evidence.md
- ../../../../var/folders/2_/z7ybpx8x5097zxjpfxstdrtm0000gn/T/staffordos-evidence-artifacts-14476/cd74031f6068016a.png
- ../../../../var/folders/2_/z7ybpx8x5097zxjpfxstdrtm0000gn/T/staffordos-evidence-artifacts-14476/1da08e1acdcbfb74.png
- ../../../../var/folders/2_/z7ybpx8x5097zxjpfxstdrtm0000gn/T/staffordos-evidence-artifacts-14476/2b992ca724f6e79d.png
- ../../../../var/folders/2_/z7ybpx8x5097zxjpfxstdrtm0000gn/T/staffordos-evidence-artifacts-14476/39814db2b6d7678f.png

Store:
validation-shop.example.com

Problem Found:
before evidence validation fixture

Why It Mattered:
prove append-only manifest behavior

What Was Changed:
unavailable

Before Evidence:
Store:
validation-shop.example.com

Date:
2026-07-08

Affected Page / Artifact:
staffordos/qa/validate_evidence_manifest_v1.mjs

Issue:
before evidence validation fixture

Why It Matters:
prove append-only manifest behavior

Screenshot:
/var/folders/2_/z7ybpx8x5097zxjpfxstdrtm0000gn/T/staffordos-evidence-sources-No3hsC/missing.png

Notes:
validation fixture second append

After Evidence:
Store:
validation-shop.example.com

Date:
2026-07-08

Affected Page / Artifact:
staffordos/qa/validate_evidence_manifest_v1.mjs

Screenshot:
/var/folders/2_/z7ybpx8x5097zxjpfxstdrtm0000gn/T/staffordos-evidence-sources-No3hsC/missing.png

After Notes:
validation fixture second append

Observed Improvement:
manifest append recorded again

Remaining Limitations:
none

Merchant-Facing Summary:
validation fixture

Proof Summary:
manifest append recorded again

Recommended Next Watch Item:
none

Completion Status:
proof_package_composed_from_existing_evidence

Manifest Artifact Details:
- artifact_id: ev_1e5e23c277e092dd
  stage: before_evidence
  created_at: 2026-07-09T04:08:21.557Z
  output_path: staffordos/proof_runs/internal_shopifixer_dry_run_v1/before_evidence.md
  source_writer: writeShopifixerBeforeEvidence
  screenshot_artifacts:
    - artifact_id: cd74031f6068016a
      original_reference: /var/folders/2_/z7ybpx8x5097zxjpfxstdrtm0000gn/T/staffordos-evidence-sources-No3hsC/before.png
      stored_path: ../../../../var/folders/2_/z7ybpx8x5097zxjpfxstdrtm0000gn/T/staffordos-evidence-artifacts-14476/cd74031f6068016a.png
      exists: true
      status: stored

- artifact_id: ev_ebca0ca064ea7746
  stage: after_evidence
  created_at: 2026-07-09T04:08:21.559Z
  output_path: staffordos/proof_runs/internal_shopifixer_dry_run_v1/after_evidence.md
  source_writer: writeShopifixerAfterEvidence
  screenshot_artifacts:
    - artifact_id: 1da08e1acdcbfb74
      original_reference: /var/folders/2_/z7ybpx8x5097zxjpfxstdrtm0000gn/T/staffordos-evidence-sources-No3hsC/after.png
      stored_path: ../../../../var/folders/2_/z7ybpx8x5097zxjpfxstdrtm0000gn/T/staffordos-evidence-artifacts-14476/1da08e1acdcbfb74.png
      exists: true
      status: stored

- artifact_id: ev_ed59f3aa30e101e9
  stage: before_evidence
  created_at: 2026-07-09T04:08:21.560Z
  output_path: staffordos/proof_runs/internal_shopifixer_dry_run_v1/before_evidence.md
  source_writer: writeShopifixerBeforeEvidence
  screenshot_artifacts:
    - artifact_id: 2b992ca724f6e79d
      original_reference: /var/folders/2_/z7ybpx8x5097zxjpfxstdrtm0000gn/T/staffordos-evidence-sources-No3hsC/missing.png
      stored_path: ../../../../var/folders/2_/z7ybpx8x5097zxjpfxstdrtm0000gn/T/staffordos-evidence-artifacts-14476/2b992ca724f6e79d.png
      exists: false
      status: referenced_missing

- artifact_id: ev_6a66f37992d02ad2
  stage: after_evidence
  created_at: 2026-07-09T04:08:21.560Z
  output_path: staffordos/proof_runs/internal_shopifixer_dry_run_v1/after_evidence.md
  source_writer: writeShopifixerAfterEvidence
  screenshot_artifacts:
    - artifact_id: 39814db2b6d7678f
      original_reference: /var/folders/2_/z7ybpx8x5097zxjpfxstdrtm0000gn/T/staffordos-evidence-sources-No3hsC/missing.png
      stored_path: ../../../../var/folders/2_/z7ybpx8x5097zxjpfxstdrtm0000gn/T/staffordos-evidence-artifacts-14476/39814db2b6d7678f.png
      exists: false
      status: referenced_missing
