-- KOR-PM02-WO-003 | 0001_init.down.sql
-- Dev/test only. Production rollback uses backup/restore, not this file.
DROP TABLE IF EXISTS
  retention_policies,
  usage_ledger,
  audit_events,
  outbox_actions,
  approvals,
  classifications,
  runs,
  leads,
  inbound_events,
  workflow_versions,
  workflows,
  connections,
  sessions,
  memberships,
  users,
  organizations
CASCADE;
