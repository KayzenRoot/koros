-- KOR-PM04-WO-003: server-side approval request/decision metadata.
-- Existing rows keep safe defaults; new service code refuses empty scopes/fields.

ALTER TABLE approvals
  ADD COLUMN IF NOT EXISTS scope text NOT NULL DEFAULT 'crm.contact.upsert',
  ADD COLUMN IF NOT EXISTS proposed_operation jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS field_allowlist text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS payload_version integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS operation_hash text,
  ADD COLUMN IF NOT EXISTS token_hash text,
  ADD COLUMN IF NOT EXISTS requested_by uuid REFERENCES users(user_id),
  ADD COLUMN IF NOT EXISTS decided_by uuid REFERENCES users(user_id),
  ADD COLUMN IF NOT EXISTS revoked_at timestamptz,
  ADD COLUMN IF NOT EXISTS revoked_by uuid REFERENCES users(user_id);

ALTER TABLE approvals DROP CONSTRAINT IF EXISTS approvals_decision_check;
ALTER TABLE approvals DROP CONSTRAINT IF EXISTS approvals_check;

ALTER TABLE approvals ADD CONSTRAINT approvals_decision_state_check
  CHECK (
    (decision = 'PENDING' AND decided_at IS NULL)
    OR (decision IN ('APPROVED', 'REJECTED', 'EXPIRED', 'REVOKED') AND decided_at IS NOT NULL)
  );

ALTER TABLE approvals DROP CONSTRAINT IF EXISTS approvals_scope_check;
ALTER TABLE approvals ADD CONSTRAINT approvals_scope_check
  CHECK (length(scope) BETWEEN 1 AND 100);

ALTER TABLE approvals DROP CONSTRAINT IF EXISTS approvals_proposed_object_check;
ALTER TABLE approvals ADD CONSTRAINT approvals_proposed_object_check
  CHECK (jsonb_typeof(proposed_operation) = 'object');

ALTER TABLE approvals DROP CONSTRAINT IF EXISTS approvals_payload_version_check;
ALTER TABLE approvals ADD CONSTRAINT approvals_payload_version_check
  CHECK (payload_version > 0);

ALTER TABLE approvals DROP CONSTRAINT IF EXISTS approvals_token_hash_check;
ALTER TABLE approvals ADD CONSTRAINT approvals_token_hash_check
  CHECK (token_hash IS NULL OR length(token_hash) = 64);

ALTER TABLE approvals DROP CONSTRAINT IF EXISTS approvals_operation_hash_check;
ALTER TABLE approvals ADD CONSTRAINT approvals_operation_hash_check
  CHECK (operation_hash IS NULL OR length(operation_hash) = 64);

ALTER TABLE approvals DROP CONSTRAINT IF EXISTS approvals_revocation_check;
ALTER TABLE approvals ADD CONSTRAINT approvals_revocation_check
  CHECK (
    (revoked_at IS NULL AND revoked_by IS NULL)
    OR (revoked_at IS NOT NULL AND revoked_by IS NOT NULL)
  );

CREATE INDEX IF NOT EXISTS idx_approvals_decision_expiry
  ON approvals (tenant_id, decision, expires_at);

COMMENT ON COLUMN approvals.scope IS
  'Server-side operation scope; the UI never supplies tenant or actor identity.';
COMMENT ON COLUMN approvals.token_hash IS
  'SHA-256 of the one-time approval token; the token itself is never stored.';
