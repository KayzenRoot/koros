-- Development/test rollback only. Production rollback uses backup/restore.
-- PAUSED does not exist in the pre-0003 status check, so map it to FAILED first.
UPDATE outbox_actions SET status = 'FAILED' WHERE status = 'PAUSED';

ALTER TABLE outbox_actions DROP CONSTRAINT IF EXISTS outbox_actions_status_check;
ALTER TABLE outbox_actions ADD CONSTRAINT outbox_actions_status_check
  CHECK (status IN ('PENDING', 'DISPATCHING', 'COMPLETED', 'FAILED', 'UNCERTAIN'));

ALTER TABLE outbox_actions DROP CONSTRAINT IF EXISTS outbox_actions_payload_version_check;
ALTER TABLE outbox_actions DROP CONSTRAINT IF EXISTS outbox_actions_payload_object_check;
ALTER TABLE outbox_actions DROP CONSTRAINT IF EXISTS outbox_actions_source_check;
ALTER TABLE outbox_actions DROP CONSTRAINT IF EXISTS outbox_actions_external_id_check;
ALTER TABLE outbox_actions DROP CONSTRAINT IF EXISTS outbox_actions_reconciliations_check;
ALTER TABLE outbox_actions DROP CONSTRAINT IF EXISTS outbox_actions_last_error_code_check;

DROP INDEX IF EXISTS uq_outbox_tenant_source_external_version;
DROP INDEX IF EXISTS idx_outbox_claim;
DROP INDEX IF EXISTS idx_outbox_lease;

ALTER TABLE outbox_actions
  DROP COLUMN IF EXISTS completed_at,
  DROP COLUMN IF EXISTS updated_at,
  DROP COLUMN IF EXISTS last_error_code,
  DROP COLUMN IF EXISTS reconciliations,
  DROP COLUMN IF EXISTS lease_expires_at,
  DROP COLUMN IF EXISTS approval_expires_at,
  DROP COLUMN IF EXISTS approval_id,
  DROP COLUMN IF EXISTS payload,
  DROP COLUMN IF EXISTS payload_version,
  DROP COLUMN IF EXISTS external_id,
  DROP COLUMN IF EXISTS source;
