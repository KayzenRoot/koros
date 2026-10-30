-- KOR-PM03-WO-003: transactional outbox hardening for retries and reconciliation.
-- The table already exists in 0001_init; these columns add the idempotency tuple,
-- lease, approval binding and reconciliation state without changing existing rows.

ALTER TABLE outbox_actions
  ADD COLUMN IF NOT EXISTS source text,
  ADD COLUMN IF NOT EXISTS external_id text,
  ADD COLUMN IF NOT EXISTS payload_version integer,
  ADD COLUMN IF NOT EXISTS payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS approval_id uuid REFERENCES approvals(approval_id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approval_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS lease_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS reconciliations integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_error_code text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;

ALTER TABLE outbox_actions DROP CONSTRAINT IF EXISTS outbox_actions_status_check;
ALTER TABLE outbox_actions ADD CONSTRAINT outbox_actions_status_check
  CHECK (status IN ('PENDING', 'DISPATCHING', 'COMPLETED', 'FAILED', 'UNCERTAIN', 'PAUSED'));

ALTER TABLE outbox_actions DROP CONSTRAINT IF EXISTS outbox_actions_payload_version_check;
ALTER TABLE outbox_actions ADD CONSTRAINT outbox_actions_payload_version_check
  CHECK (payload_version IS NULL OR payload_version > 0);

ALTER TABLE outbox_actions DROP CONSTRAINT IF EXISTS outbox_actions_payload_object_check;
ALTER TABLE outbox_actions ADD CONSTRAINT outbox_actions_payload_object_check
  CHECK (jsonb_typeof(payload) = 'object');

ALTER TABLE outbox_actions DROP CONSTRAINT IF EXISTS outbox_actions_source_check;
ALTER TABLE outbox_actions ADD CONSTRAINT outbox_actions_source_check
  CHECK (source IS NULL OR (length(source) BETWEEN 1 AND 200));

ALTER TABLE outbox_actions DROP CONSTRAINT IF EXISTS outbox_actions_external_id_check;
ALTER TABLE outbox_actions ADD CONSTRAINT outbox_actions_external_id_check
  CHECK (external_id IS NULL OR (length(external_id) BETWEEN 1 AND 200));

ALTER TABLE outbox_actions DROP CONSTRAINT IF EXISTS outbox_actions_reconciliations_check;
ALTER TABLE outbox_actions ADD CONSTRAINT outbox_actions_reconciliations_check
  CHECK (reconciliations >= 0);

ALTER TABLE outbox_actions DROP CONSTRAINT IF EXISTS outbox_actions_last_error_code_check;
ALTER TABLE outbox_actions ADD CONSTRAINT outbox_actions_last_error_code_check
  CHECK (last_error_code IS NULL OR length(last_error_code) <= 64);

-- The operation_key is a hash of tenant + source + external_id + payload_version.
-- This unique partial index also protects rows written directly with the tuple.
CREATE UNIQUE INDEX IF NOT EXISTS uq_outbox_tenant_source_external_version
  ON outbox_actions (tenant_id, source, external_id, payload_version)
  WHERE source IS NOT NULL AND external_id IS NOT NULL AND payload_version IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_outbox_claim
  ON outbox_actions (tenant_id, status, next_attempt_at);

CREATE INDEX IF NOT EXISTS idx_outbox_lease
  ON outbox_actions (status, lease_expires_at);

COMMENT ON COLUMN outbox_actions.payload IS
  'Synthetic canonical contact payload; never a secret or raw provider response.';
COMMENT ON COLUMN outbox_actions.lease_expires_at IS
  'Worker lease; an expired DISPATCHING row is moved to UNCERTAIN for reconciliation.';
