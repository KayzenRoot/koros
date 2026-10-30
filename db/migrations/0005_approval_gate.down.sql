-- Development/test rollback only. Production rollback uses backup/restore.
-- Collapse new decision values into the pre-0005 REJECTED state before restoring
-- the old check. All rows get a decided_at value required by the old constraint.
UPDATE approvals
   SET decision = 'REJECTED',
       decided_at = COALESCE(decided_at, now())
 WHERE decision IN ('PENDING', 'EXPIRED', 'REVOKED');

ALTER TABLE approvals DROP CONSTRAINT IF EXISTS approvals_decision_state_check;
ALTER TABLE approvals DROP CONSTRAINT IF EXISTS approvals_scope_check;
ALTER TABLE approvals DROP CONSTRAINT IF EXISTS approvals_proposed_object_check;
ALTER TABLE approvals DROP CONSTRAINT IF EXISTS approvals_payload_version_check;
ALTER TABLE approvals DROP CONSTRAINT IF EXISTS approvals_token_hash_check;
ALTER TABLE approvals DROP CONSTRAINT IF EXISTS approvals_operation_hash_check;
ALTER TABLE approvals DROP CONSTRAINT IF EXISTS approvals_revocation_check;

DROP INDEX IF EXISTS idx_approvals_decision_expiry;

ALTER TABLE approvals ADD CONSTRAINT approvals_decision_check
  CHECK (decision IN ('APPROVED', 'REJECTED'));
ALTER TABLE approvals ADD CONSTRAINT approvals_check
  CHECK ((decision = 'APPROVED' AND decided_at IS NOT NULL) OR decision = 'REJECTED');

ALTER TABLE approvals
  DROP COLUMN IF EXISTS revoked_by,
  DROP COLUMN IF EXISTS revoked_at,
  DROP COLUMN IF EXISTS decided_by,
  DROP COLUMN IF EXISTS requested_by,
  DROP COLUMN IF EXISTS token_hash,
  DROP COLUMN IF EXISTS operation_hash,
  DROP COLUMN IF EXISTS payload_version,
  DROP COLUMN IF EXISTS field_allowlist,
  DROP COLUMN IF EXISTS proposed_operation,
  DROP COLUMN IF EXISTS scope;
