# Invite-Only Account Policy

Production signup requires `CAREEROS_INVITE_ONLY=true` and a single-use random invite token whose normalized email matches the signup email and whose expiry has not passed. Consumption occurs in the same transaction as account, tenant, membership, and initial session creation.

Invite issuance is an internal service operation and has no customer-facing operator route in this mission. Public signup, social login, and automated email delivery remain disabled.
