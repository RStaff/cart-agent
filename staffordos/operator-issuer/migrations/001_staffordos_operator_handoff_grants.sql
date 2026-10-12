CREATE TABLE IF NOT EXISTS staffordos_operator_handoff_grants (
  code_hash BYTEA PRIMARY KEY,
  ciphertext BYTEA NOT NULL,
  auth_tag BYTEA NOT NULL,
  nonce BYTEA NOT NULL,
  key_id TEXT NOT NULL,
  browser_challenge TEXT NOT NULL,
  return_to TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS staffordos_operator_handoff_grants_expires_at_idx
  ON staffordos_operator_handoff_grants (expires_at);
