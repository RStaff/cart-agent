# CareerFact Review Contract

Customer actions are append-only review decisions:

- `CONFIRM`: retain the proposed statement and create/update a tenant CareerFact with `CUSTOMER_CONFIRMED_SOURCE_BACKED` authority.
- `CORRECT`: preserve the original proposal, append the correction decision, and update the active tenant CareerFact statement.
- `REJECT`: mark the candidate rejected; no CareerFact is promoted.
- `KEEP_FOR_LATER`: retain the candidate as unresolved for later review.

Raw CareerSource text never changes when a fact is corrected. CareerEvidence is not created in this mission. Existing owner-private fact/evidence authorities are not read or mutated.
