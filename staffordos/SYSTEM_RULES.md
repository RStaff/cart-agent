SYSTEM RULES — NON NEGOTIABLE

1. CONTROL PLANE vs PRODUCT ENGINE
- StaffordOS = control plane
- Abando = execution engine
- NEVER mix responsibilities

2. NO UI MERGING
- StaffordOS UI is operator-only
- Abando UI is merchant-only
- NEVER embed one inside the other

3. API BOUNDARY ONLY
- StaffordOS reads product data via APIs
- NEVER imports product logic or DB directly

4. READ-ONLY DURING REVIEW
- StaffordOS may ONLY consume read-only summaries from Abando
- MUST NOT mutate, trigger, or control Abando execution

5. TRUTH FIRST
- no fake revenue
- no fake sends
- no simulated success states

6. LIGHTWEIGHT CONTROL PLANE
- fast
- resilient to missing APIs

7. NO CROSS-SYSTEM COUPLING
- no shared logic
- no shared state mutation
- only explicit API contracts

8. PRODUCTS GENERATE VALUE
- Abando = generates revenue
- StaffordOS = coordinates work

ANY VIOLATION = STOP AND CORRECT
