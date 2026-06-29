# SHOPIFIXER_COMPETENCY_ENGINE_V1

## Executive Summary

ShopiFixer needs a closed-loop competency engine that turns every completed engineering exercise into measurable capability growth.

This engine must connect:
- Mission Evidence
- Engineering Memory
- Pattern Library
- Competency Progress
- Capability Score

The goal is not to track activity. The goal is to track mastery.

Current classification: **CONDITIONAL GO**

ShopiFixer has enough evidence to operate the early learning loop on NoKings, but it should still learn under controlled conditions until competency data is broader across product, collection, cart, header, footer, and rollback scenarios.

---

## 1) Canonical Competency Object

```json
{
  "competency_id": "comp_homepage_cta_emphasis_v1",
  "module": "Module 3 - Homepage and Discovery Surfaces",
  "skill": "Homepage CTA style promotion",
  "mastery_level": 0.62,
  "evidence_count": 2,
  "successful_exercises": 2,
  "failed_exercises": 0,
  "confidence": 0.84,
  "last_demonstrated": "2026-06-28T00:00:00.000Z"
}
```

### Field definitions

- `competency_id`
  - stable identifier for one skill slice
- `module`
  - curriculum module that owns the competency
- `skill`
  - specific engineering capability
- `mastery_level`
  - normalized 0.0 to 1.0 score for demonstrated capability
- `evidence_count`
  - number of mission evidence artifacts supporting the competency
- `successful_exercises`
  - count of completed exercises that positively demonstrated the skill
- `failed_exercises`
  - count of exercises that exposed gaps or regressions
- `confidence`
  - confidence in the mastery estimate based on evidence quality and repetition
- `last_demonstrated`
  - timestamp of the most recent successful demonstration

---

## 2) How Every Completed Exercise Updates Competency

Every completed engineering exercise should update the competency engine in five stages:

1. **Identify the skill**
   - map the exercise to one or more competencies
2. **Grade the evidence**
   - assess whether the evidence shows the skill, not just the output
3. **Update mastery**
   - increase mastery for successful demonstration
4. **Update confidence**
   - raise confidence when evidence is specific, repeatable, and validated
5. **Update promotion state**
   - promote the competency if thresholds are met

### Update inputs

- mission evidence
- before/after state
- validation results
- rollback result
- pattern library entry
- engineering memory entry

### Update outputs

- competency record delta
- module progress delta
- capability score delta
- pattern promotion eligibility

---

## 3) Scoring Rules

### Base scoring dimensions

Each exercise contributes to competency scoring across these dimensions:

- **Correctness**
  - did the change or analysis match the target problem?
- **Safety**
  - was the change narrow and reversible?
- **Evidence quality**
  - was before/after proof captured?
- **Rollback readiness**
  - was the rollback path explicit or tested?
- **Reusability**
  - did the result produce a reusable pattern?
- **Scope discipline**
  - was the exercise confined to the approved surface?

### Suggested weighting

- Correctness: 30%
- Safety: 25%
- Evidence quality: 15%
- Rollback readiness: 10%
- Reusability: 10%
- Scope discipline: 10%

### Exercise score

```text
exercise_score = 0.30*correctness
               + 0.25*safety
               + 0.15*evidence_quality
               + 0.10*rollback_readiness
               + 0.10*reusability
               + 0.10*scope_discipline
```

Each subscore is normalized from 0 to 1.

### Mastery level update

```text
new_mastery = clamp(
  old_mastery * 0.80 + exercise_score * 0.20 + bonus,
  0,
  1
)
```

Where `bonus` is small and only awarded when:
- evidence is strong
- the exercise is repeated successfully
- a pattern is promoted

### Confidence update

Confidence should rise faster when:
- the same skill is demonstrated multiple times
- evidence is specific and durable
- rollback is understood
- no regressions are observed

Confidence should fall when:
- a validation failure occurs
- rollback is unclear
- evidence is incomplete
- the competency is inferred rather than directly demonstrated

---

## 4) Promotion Criteria

A competency may be promoted when all of the following are true:

- `mastery_level >= 0.80`
- `successful_exercises >= 3`
- `failed_exercises == 0` or failures are fully resolved
- at least one exercise has before/after evidence
- rollback path is defined
- at least one reusable lesson exists

### Promotion states

- **observed**
  - seen once
- **developing**
  - demonstrated repeatedly with partial confidence
- **proficient**
  - repeatable under supervision
- **approved**
  - ready for broader use in controlled work
- **mastered**
  - reliable enough for autonomous low-risk execution

---

## 5) Regression Criteria

A competency should regress when:

- a previously successful skill fails validation
- a rollback is needed unexpectedly
- a broader dependency was missed
- a repeated exercise shows inconsistency
- the evidence contradicts the claimed mastery

### Regression effects

- reduce `mastery_level`
- reduce `confidence`
- increase `failed_exercises`
- mark the related pattern as requiring review
- re-open the curriculum module if necessary

### Regression severity

- **minor**
  - cosmetic or evidence-level issue
- **moderate**
  - validation or rollback weakness
- **major**
  - user-facing or structural regression

---

## 6) Automatic Exercise Selection

StaffordOS should select the next engineering exercise by looking at the lowest-confidence, highest-value competency gap in the curriculum.

### Selection algorithm

1. Rank modules by business value.
2. Within each module, rank competencies by lowest mastery.
3. Prefer exercises that:
   - are safe
   - have clear evidence paths
   - increase pattern reuse
   - broaden surface mastery
4. Avoid repeating a competency that is already mastered unless regression is being tested.
5. If two exercises are close, choose the one with the smallest safe scope and the clearest rollback.

### Current recommendation logic

Because Exercise 003 completed the merchandising analysis loop, the next exercise should move to the product detail surface rather than repeat the same merchandising surface.

Best next candidate:
- `Exercise 004 - Product Page Analysis`

Reason:
- it follows the completed Exercise 003 merchandising analysis
- it moves into the product detail surface that is central to Shopify engineering
- it is still low-risk when approached read-only first
- it supports future product-page and commerce-critical competency growth

---

## 7) AI Chief of Staff Daily Learning Recommendation

The AI Chief of Staff should produce a daily recommendation with this structure:

- top competency gap
- safest next exercise
- expected learning gain
- required evidence
- rollback expectation
- whether the exercise should be supervised or autonomous

### Recommendation logic

The AI should:
- read the mission record
- read the competency table
- inspect pattern library confidence
- inspect unresolved regressions
- choose one exercise that maximizes learning while minimizing risk

### Daily objective format

```text
Today:
1. primary skill to learn
2. exercise to run
3. evidence to capture
4. rollback expectation
5. promotion target
```

---

## 8) Capability Score for ShopiFixer

The Capability Score is a single number from 0 to 100 that summarizes the system's readiness to do useful Shopify work.

### Inputs

- average competency mastery
- average competency confidence
- pattern library size
- rollback reliability
- evidence completeness
- number of validated exercises
- breadth across Shopify surfaces

### Suggested weighting

- Competency mastery: 35%
- Confidence: 20%
- Pattern reuse: 15%
- Rollback reliability: 10%
- Evidence completeness: 10%
- Surface breadth: 10%

### Formula

```text
Capability Score =
  35% * avg_mastery_100
  + 20% * avg_confidence_100
  + 15% * pattern_reuse_100
  + 10% * rollback_reliability_100
  + 10% * evidence_completeness_100
  + 10% * surface_breadth_100
```

### Interpretation

- 0-24: learning only
- 25-49: controlled training
- 50-69: supervised merchant support
- 70-84: low-risk autonomous support
- 85-100: production merchant readiness

---

## 9) Closed-Loop Algorithm

### Input chain

Mission Evidence
-> Engineering Memory
-> Pattern Library
-> Competency Progress
-> Capability Score

### Step 1 - Mission Evidence

Collect:
- before state
- after state
- validation
- rollback notes
- lessons

### Step 2 - Engineering Memory

Convert the evidence into a structured lesson:
- what was learned
- what changed
- why it was safe
- what to repeat

### Step 3 - Pattern Library

If the lesson is reusable, promote it into a pattern:
- problem class
- safe fix pattern
- validation checklist
- rollback plan
- confidence

### Step 4 - Competency Progress

Update competency records:
- mastery
- confidence
- success count
- failure count
- evidence count
- last demonstrated

### Step 5 - Capability Score

Recompute the global readiness score from the updated competency graph.

### Pseudocode

```text
for each completed_exercise:
  evidence = load_mission_evidence(exercise)
  lesson = derive_lesson(evidence)
  update_engineering_memory(lesson)

  if lesson.is_reusable:
    promote_pattern(lesson)

  competencies = map_exercise_to_competencies(exercise)
  for competency in competencies:
    delta = score_exercise_against_competency(exercise, competency)
    competency.mastery_level = update_mastery(competency.mastery_level, delta)
    competency.confidence = update_confidence(competency.confidence, evidence)
    competency.evidence_count += 1
    if exercise.success:
      competency.successful_exercises += 1
    else:
      competency.failed_exercises += 1
    competency.last_demonstrated = now()
    if should_promote(competency):
      promote(competency)
    if should_regress(competency):
      regress(competency)

  capability_score = recompute_capability_score(all_competencies, all_patterns, all_evidence)
```

---

## 10) Current Estimated Capability Level

**Estimated capability level: 38/100**

Interpretation:
- strong at read-only discovery on the homepage and product-list surfaces
- capable of very small, controlled visual changes
- capable of recording lessons and reusable patterns
- broader across Shopify merchandising surfaces, but not yet broad enough for autonomous merchant work

---

## 11) Recommended Exercise 004

**Exercise 004 - Product Page Analysis**

Why next:
- it follows the completed homepage CTA and product-list learning loop
- it moves into the product detail surface that is central to Shopify engineering
- it has a clear file map and low implementation risk when approached read-only first
- it prepares the system for more meaningful product-page and commerce-critical work

Expected capability gain:
- +5 to +8 points in capability score
- increase in product-page and variant-surface confidence
- stronger commerce-surface breadth
- one more reusable pattern candidate

---

## 12) Final Classification

**CONDITIONAL GO**

ShopiFixer should continue controlled NoKings training and use the competency engine to drive the next exercise. It is not ready to operate independently on production merchants yet, but the learning loop is now explicit, measurable, and promotable.
