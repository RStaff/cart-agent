# Service Capacity Model v1

Purpose: define how StaffordOS capacity should be measured and scaled, using practical service units rather than vague workload estimates.

## Why This Exists

- Capacity should be measured in service units that map to actual delivery work.
- The first constraint may not be infrastructure.
- StaffordOS should understand where time is spent: system time, operator time, and client wait time.

## Capacity Dimensions

## Operator Capacity

- Measures how much human review, judgment, communication, and exception handling the team can absorb.
- Best tracked in operator minutes per job and operator minutes per day.
- The main question: how many concurrent paid jobs can be actively advanced without weak handoffs or slow responses.

## System Capacity

- Measures automated throughput for scans, packet generation, queues, jobs, and product-side processing.
- Best tracked in queue depth, average system processing time, retry rate, and success rate.
- The main question: whether automation is actually moving work forward fast enough to keep operators productive.

## Infrastructure Capacity

- Measures hosting, database, worker, and API stability under load.
- Best tracked in latency, error rate, worker backlog, storage durability, and incident frequency.
- The main question: whether infrastructure is truly the first bottleneck or whether delivery design is the real constraint.

## Capacity Buckets

- Waiting on system: automation, queue, processing, or API dependency has not finished yet.
- Waiting on operator: a human must review, decide, approve, write, or unblock the next step.
- Waiting on client: the next move depends on merchant response, approval, data, or payment.

These buckets matter more than raw ticket count because they explain why jobs are or are not moving.

## First Benchmark

- Support 3 concurrent paid jobs.

This is the first benchmark because it is enough to expose handoff weakness, review bottlenecks, queue truth issues, and communication gaps without pretending the system is already scaled.

## Service Unit Examples

| Service Name | Job Type | Setup Time | Automated/System Time | Operator Review Time | Client Communication Time | Total Operator Time | Total Wall-Clock Time | Scalability Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Abando | Recovery readiness and action review | 20 min | 90 min | 25 min | 15 min | 40 min | 1.5 to 2.5 hours | Scales only if signals, action durability, and send truth are reliable. Operator time rises quickly when outputs are ambiguous. |
| Shopifixer | Store issue triage and fix packet | 25 min | 60 min | 35 min | 20 min | 55 min | 2 to 6 hours | Likely review-heavy at first because fixes need confidence and client alignment. Strong templates can reduce operator drag. |
| Actinventory | Inventory opportunity audit and recommendation pass | 30 min | 75 min | 30 min | 20 min | 50 min | 3 to 8 hours | Likely limited by merchant data quality and follow-up cycles more than raw system throughput. |

## How To Measure Each Service Unit

For each paid job, record:

- service name
- job type
- setup time
- automated/system time
- operator review time
- client communication time
- total operator time
- total wall-clock time
- current bucket
- blocker or waiting reason

## Planning Implications

- If operator review time dominates, improve packets, templates, and decision rules before adding more automation.
- If client communication time dominates, improve scoping, expectation-setting, and handoff clarity.
- If system time dominates, improve queue reliability, worker visibility, and API response paths.
- If wall-clock time is long but operator time is low, the bottleneck may be external rather than staffing.

## Risks

- Overpromising
  - Capacity can look larger than it is if waiting states are hidden.
- Unclear service units
  - If jobs are not consistently defined, metrics become noise.
- Weak handoffs
  - Jobs stall when the next owner or next condition is not explicit.
- Infrastructure not actually being the first bottleneck
  - The system may look technical, but the real constraint may be review quality or client response.

## Current Reality vs Target State

## Real now

- There are real modules for execution, optimization, routing, revenue, and communication.
- There is not yet a formal cross-product capacity dashboard or service accounting layer.
- Capacity is still better understood as structured planning than as a fully instrumented operating metric.

## Next

- Track all active paid jobs against one board and one service-unit template.
- Measure actual operator minutes and waiting buckets.
- Test the 3 concurrent paid jobs benchmark honestly.

## Later

- Add portfolio reporting inside StaffordOS.
- Compare capacity by product, job type, and operator.
- Use real historical service data to shape staffing and automation investments.
