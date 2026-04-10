# Abando

Abando is the recovery-focused product module inside StaffordOS.

## Recovery Queue V1

Recovery Queue V1 is an operator-assisted queue for shopper recovery opportunities.

Ross uses it to:
- review queued checkout recovery opportunities
- generate a recovery draft
- edit the draft before use
- explicitly mark rows as sent, returned, or lost
- log each final operator action

Status meanings:
- `queued`: opportunity is in the queue and has not been drafted yet
- `draft_generated`: a recovery message draft exists and is ready for review
- `sent`: Ross confirmed the recovery message was sent
- `returned`: Ross confirmed the shopper returned
- `lost`: Ross confirmed the opportunity is no longer being pursued

V1 is operator-assisted only.
It does not replace the live Abando recovery runtime.
Later versions can connect this queue to automated send flows, but that is not part of V1.
