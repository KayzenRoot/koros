-- Development/test rollback only. Production rollback uses backup/restore.
DROP POLICY IF EXISTS tenant_isolation ON budget_policies;
DROP POLICY IF EXISTS tenant_isolation ON tenant_controls;
DROP TABLE IF EXISTS tenant_controls;
DROP TABLE IF EXISTS budget_policies;

DROP INDEX IF EXISTS idx_usage_tenant_status_created;
ALTER TABLE usage_ledger DROP CONSTRAINT IF EXISTS usage_ledger_status_check;
ALTER TABLE usage_ledger
  DROP COLUMN IF EXISTS updated_at,
  DROP COLUMN IF EXISTS status,
  DROP COLUMN IF EXISTS operation,
  DROP COLUMN IF EXISTS correlation_id;

DROP INDEX IF EXISTS idx_audit_tenant_correlation;
DROP INDEX IF EXISTS uq_audit_events_seq;
ALTER TABLE audit_events DROP CONSTRAINT IF EXISTS audit_events_event_hash_check;
ALTER TABLE audit_events DROP CONSTRAINT IF EXISTS audit_events_prev_hash_check;
ALTER TABLE audit_events
  DROP COLUMN IF EXISTS event_hash,
  DROP COLUMN IF EXISTS prev_hash,
  DROP COLUMN IF EXISTS correlation_id,
  DROP COLUMN IF EXISTS audit_seq;
