# CAPACITY AUTHORITY V1

## Purpose

Determine how many merchant sprints can be fulfilled simultaneously without reducing quality.

## Sprint States

Queued
Approved
In Progress
Waiting Merchant
QA
Proof Ready
Completed

## Operator View

For every active merchant:

- merchant
- selected product
- packet id
- sprint state
- owner
- due date
- proof status

## Capacity Rule

Do not sell more work than can be fulfilled with proof and quality.

## Initial Capacity

Target:

1 completed sprint

Then:

3 concurrent sprints

Then:

5 concurrent sprints

Increase only after proof-backed fulfillment is repeatable.

## Success Metric

Every paid merchant receives:

- execution
- proof
- completion

before new capacity is added.

