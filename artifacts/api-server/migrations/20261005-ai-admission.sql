-- Apply once with the publisher's authenticated database migration workflow.
-- No user profiles, photos, notes or raw attestation tokens are retained here.
CREATE TABLE IF NOT EXISTS boxer_ai_daily_budget (
  day date PRIMARY KEY,
  requests integer NOT NULL CHECK (requests BETWEEN 1 AND 500)
);
CREATE TABLE IF NOT EXISTS boxer_ai_used_tokens (
  token_hash char(64) PRIMARY KEY,
  expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS boxer_ai_used_tokens_expiry ON boxer_ai_used_tokens(expires_at);
