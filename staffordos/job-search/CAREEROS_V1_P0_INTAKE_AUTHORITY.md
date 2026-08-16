# CareerOS P0 Intake Authority

Career intake is an upstream, tenant-private proposal flow:

`CareerSource -> deterministic candidate CareerFact -> customer review -> tenant CareerFact`

Candidate extraction never mutates owner-private StaffordOS CareerFacts or CareerEvidence. Confirmation creates a tenant-owned `CUSTOMER_CONFIRMED_SOURCE_BACKED` CareerFact record for later capability onboarding. No capability, requirement, or match relationship is created here.

The runtime is synthetic/local only while the P0 JSON persistence adapter remains temporary.
