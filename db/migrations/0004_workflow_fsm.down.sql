-- Development/test rollback only. Production rollback uses backup/restore.
-- Map canonical states introduced in 0004 back to their closest legacy state
-- before restoring the pre-0004 check.
UPDATE runs
   SET state = CASE state
     WHEN 'PROPOSED' THEN 'CLASSIFIED'
     WHEN 'QUEUED' THEN 'APPROVED'
     WHEN 'RECONCILING' THEN 'UNCERTAIN_EXTERNAL_RESULT'
     WHEN 'PAUSED' THEN 'BLOCKED'
     ELSE state
   END
 WHERE state IN ('PROPOSED', 'QUEUED', 'RECONCILING', 'PAUSED');

ALTER TABLE runs DROP CONSTRAINT IF EXISTS runs_state_check;
ALTER TABLE runs ADD CONSTRAINT runs_state_check
  CHECK (state IN (
    'RECEIVED', 'VALIDATED', 'NORMALIZED', 'DEDUPED', 'CLASSIFIED',
    'PENDING_APPROVAL', 'APPROVED', 'DISPATCHING', 'COMPLETED', 'INVALID',
    'DUPLICATE', 'REJECTED', 'EXPIRED', 'BLOCKED', 'FAILED',
    'UNCERTAIN_EXTERNAL_RESULT'
  ));

COMMENT ON COLUMN runs.state IS 'Run state.';
