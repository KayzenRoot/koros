-- KOR-PM04-WO-001: canonical workflow FSM states.
-- Legacy M02/M03 states remain accepted so an existing synthetic row is never
-- silently rewritten by this migration; the FSM service only permits canonical
-- transitions.

ALTER TABLE runs DROP CONSTRAINT IF EXISTS runs_state_check;
ALTER TABLE runs ADD CONSTRAINT runs_state_check
  CHECK (state IN (
    'RECEIVED', 'VALIDATED', 'PROPOSED', 'PENDING_APPROVAL', 'REJECTED',
    'EXPIRED', 'APPROVED', 'QUEUED', 'RECONCILING', 'COMPLETED', 'FAILED',
    'PAUSED',
    -- Compatibility with the M02/M03 implementation until rows are migrated.
    'NORMALIZED', 'DEDUPED', 'CLASSIFIED', 'DISPATCHING', 'INVALID',
    'DUPLICATE', 'BLOCKED', 'UNCERTAIN_EXTERNAL_RESULT'
  ));

COMMENT ON COLUMN runs.state IS
  'Canonical M04 FSM states plus legacy M02/M03 states for compatibility.';
