# CareerOS V1.24F Requirement Extraction Repair

Offline authority repair only. V2D weights/formula and production behavior remain unchanged.

## Pipeline

Existing requirement records and V1.24D evidence mappings were reused. This projection adds conservative section/type, importance, deduplication, specialist, and responsibility-family diagnostics while retaining source text and IDs. Current source-section headings are unavailable in the existing contract and are recorded as null rather than inferred.

## Before/after counts

{
  "calibration": {
    "totalExtracted": 916,
    "deduplicated": 916,
    "capabilityBearing": 861,
    "nonCapability": 55,
    "exactSupport": 0,
    "transferableSupport": 317,
    "partialSupport": 0,
    "unresolved": 599,
    "noSupportedEquivalent": 0,
    "coreSupported": 310,
    "specialistSupport": 0,
    "mandatorySpecialist": 26,
    "mandatoryGeneral": 7,
    "coreResponsibility": 411,
    "preferred": 2,
    "tools": 35,
    "domain": 61,
    "seniority": 22,
    "softSkill": 17,
    "structural": 25,
    "legal": 8,
    "location": 1,
    "compensation": 4,
    "benefitsMarketing": 0,
    "duplicatesMerged": 51,
    "splitCandidates": 14,
    "headingsSuppressed": 25,
    "specialistPreserved": 26,
    "provenanceRetained": true
  },
  "holdout": {
    "totalExtracted": 716,
    "deduplicated": 716,
    "capabilityBearing": 672,
    "nonCapability": 44,
    "exactSupport": 0,
    "transferableSupport": 291,
    "partialSupport": 0,
    "unresolved": 425,
    "noSupportedEquivalent": 4,
    "coreSupported": 280,
    "specialistSupport": 0,
    "mandatorySpecialist": 101,
    "mandatoryGeneral": 6,
    "coreResponsibility": 375,
    "preferred": 4,
    "tools": 25,
    "domain": 21,
    "seniority": 16,
    "softSkill": 18,
    "structural": 6,
    "legal": 9,
    "location": 8,
    "compensation": 2,
    "benefitsMarketing": 1,
    "duplicatesMerged": 0,
    "splitCandidates": 11,
    "headingsSuppressed": 6,
    "specialistPreserved": 101,
    "provenanceRetained": true
  },
  "combined": {
    "totalExtracted": 1632,
    "deduplicated": 1632,
    "capabilityBearing": 1533,
    "nonCapability": 99,
    "exactSupport": 0,
    "transferableSupport": 608,
    "partialSupport": 0,
    "unresolved": 1024,
    "noSupportedEquivalent": 4,
    "coreSupported": 590,
    "specialistSupport": 0,
    "mandatorySpecialist": 127,
    "mandatoryGeneral": 13,
    "coreResponsibility": 786,
    "preferred": 6,
    "tools": 60,
    "domain": 82,
    "seniority": 38,
    "softSkill": 35,
    "structural": 31,
    "legal": 17,
    "location": 9,
    "compensation": 6,
    "benefitsMarketing": 1,
    "duplicatesMerged": 51,
    "splitCandidates": 25,
    "headingsSuppressed": 31,
    "specialistPreserved": 127,
    "provenanceRetained": true
  }
}

## Finding

The repaired authority suppresses non-capability text and preserves specialist distinctions, but the 80-role corpus still has substantial unresolved requirements. It is not sufficient to justify weight tuning.
