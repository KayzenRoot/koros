-- KOR-PM02-WO-003 | 0001_init.sql
-- Synthetic-only schema. No real client data, credentials or production secrets.
-- The app role is created NOLOGIN here; test/dev bootstrap grants LOGIN separately.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'koros_app') THEN
    CREATE ROLE koros_app NOLOGIN NOSUPERUSER NOBYPASSRLS;
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version text PRIMARY KEY,
  checksum text NOT NULL,
  applied_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON schema_migrations FROM PUBLIC;
REVOKE ALL ON schema_migrations FROM koros_app;

CREATE TABLE IF NOT EXISTS organizations (
  tenant_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 200),
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'CLOSED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  user_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  email_normalized text NOT NULL UNIQUE,
  password_hash text NOT NULL CHECK (length(password_hash) >= 20),
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'DISABLED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (email_normalized = lower(btrim(email_normalized))),
  CHECK (position('@' in email_normalized) > 1)
);

CREATE TABLE IF NOT EXISTS memberships (
  membership_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES organizations(tenant_id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'approver', 'operator', 'viewer')),
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'REVOKED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  UNIQUE (tenant_id, user_id),
  CHECK ((status = 'REVOKED') = (revoked_at IS NOT NULL))
);

CREATE TABLE IF NOT EXISTS sessions (
  session_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES organizations(tenant_id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE CHECK (length(token_hash) = 64),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (expires_at > created_at)
);

CREATE TABLE IF NOT EXISTS connections (
  connection_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES organizations(tenant_id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (length(provider) BETWEEN 1 AND 80),
  external_account text NOT NULL DEFAULT '',
  scopes text[] NOT NULL DEFAULT '{}',
  secret_ref text NOT NULL CHECK (length(secret_ref) BETWEEN 1 AND 500),
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PAUSED', 'REVOKED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, provider, external_account)
);

CREATE TABLE IF NOT EXISTS workflows (
  workflow_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES organizations(tenant_id) ON DELETE CASCADE,
  name text NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 200),
  status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name),
  UNIQUE (workflow_id, tenant_id)
);

CREATE TABLE IF NOT EXISTS workflow_versions (
  workflow_version_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid NOT NULL,
  tenant_id uuid NOT NULL REFERENCES organizations(tenant_id) ON DELETE CASCADE,
  version integer NOT NULL CHECK (version > 0),
  input_schema jsonb NOT NULL DEFAULT '{}'::jsonb,
  approval_policy jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workflow_id, version),
  UNIQUE (workflow_version_id, tenant_id),
  FOREIGN KEY (workflow_id, tenant_id) REFERENCES workflows(workflow_id, tenant_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS inbound_events (
  event_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES organizations(tenant_id) ON DELETE CASCADE,
  provider text NOT NULL,
  external_id text NOT NULL,
  body_hash text NOT NULL CHECK (length(body_hash) = 64),
  signature_status text NOT NULL CHECK (signature_status IN ('VALID', 'INVALID', 'MISSING')),
  received_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, provider, external_id),
  UNIQUE (event_id, tenant_id)
);

CREATE TABLE IF NOT EXISTS leads (
  lead_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES organizations(tenant_id) ON DELETE CASCADE,
  event_id uuid NOT NULL,
  external_id text NOT NULL,
  source text NOT NULL,
  status text NOT NULL DEFAULT 'RECEIVED' CHECK (status IN ('RECEIVED', 'VALIDATED', 'DUPLICATE', 'REJECTED', 'ARCHIVED')),
  minimal_fields jsonb NOT NULL DEFAULT '{}'::jsonb,
  consent_status text NOT NULL DEFAULT 'UNKNOWN' CHECK (consent_status IN ('GRANTED', 'DENIED', 'UNKNOWN')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, source, external_id),
  UNIQUE (lead_id, tenant_id),
  FOREIGN KEY (event_id, tenant_id) REFERENCES inbound_events(event_id, tenant_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS runs (
  run_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES organizations(tenant_id) ON DELETE CASCADE,
  lead_id uuid NOT NULL,
  workflow_version_id uuid NOT NULL,
  state text NOT NULL CHECK (state IN ('RECEIVED', 'VALIDATED', 'NORMALIZED', 'DEDUPED', 'CLASSIFIED', 'PENDING_APPROVAL', 'APPROVED', 'DISPATCHING', 'COMPLETED', 'INVALID', 'DUPLICATE', 'REJECTED', 'EXPIRED', 'BLOCKED', 'FAILED', 'UNCERTAIN_EXTERNAL_RESULT')),
  idempotency_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, idempotency_key),
  UNIQUE (run_id, tenant_id),
  FOREIGN KEY (lead_id, tenant_id) REFERENCES leads(lead_id, tenant_id) ON DELETE CASCADE,
  FOREIGN KEY (workflow_version_id, tenant_id) REFERENCES workflow_versions(workflow_version_id, tenant_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS classifications (
  classification_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES organizations(tenant_id) ON DELETE CASCADE,
  run_id uuid NOT NULL,
  schema_version text NOT NULL,
  labels jsonb NOT NULL DEFAULT '{}'::jsonb,
  explanation text NOT NULL DEFAULT '',
  uncertainty numeric(5, 4) NOT NULL DEFAULT 1 CHECK (uncertainty >= 0 AND uncertainty <= 1),
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (run_id, tenant_id) REFERENCES runs(run_id, tenant_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS approvals (
  approval_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES organizations(tenant_id) ON DELETE CASCADE,
  run_id uuid NOT NULL,
  actor_user_id uuid NOT NULL REFERENCES users(user_id),
  payload_hash text NOT NULL CHECK (length(payload_hash) = 64),
  decision text NOT NULL CHECK (decision IN ('APPROVED', 'REJECTED')),
  expires_at timestamptz NOT NULL,
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (run_id, payload_hash),
  FOREIGN KEY (run_id, tenant_id) REFERENCES runs(run_id, tenant_id) ON DELETE CASCADE,
  CHECK ((decision = 'APPROVED' AND decided_at IS NOT NULL) OR decision = 'REJECTED')
);

CREATE TABLE IF NOT EXISTS outbox_actions (
  action_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES organizations(tenant_id) ON DELETE CASCADE,
  run_id uuid NOT NULL,
  operation_key text NOT NULL,
  target text NOT NULL,
  payload_hash text NOT NULL CHECK (length(payload_hash) = 64),
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'DISPATCHING', 'COMPLETED', 'FAILED', 'UNCERTAIN')),
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  next_attempt_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, operation_key),
  FOREIGN KEY (run_id, tenant_id) REFERENCES runs(run_id, tenant_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS audit_events (
  event_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES organizations(tenant_id) ON DELETE CASCADE,
  run_id uuid,
  actor_user_id uuid REFERENCES users(user_id),
  action text NOT NULL,
  entity text NOT NULL,
  entity_id text NOT NULL,
  before_hash text,
  after_hash text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS usage_ledger (
  usage_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES organizations(tenant_id) ON DELETE CASCADE,
  run_id uuid NOT NULL,
  provider text NOT NULL,
  tokens integer NOT NULL DEFAULT 0 CHECK (tokens >= 0),
  cost_estimate numeric(12, 4) NOT NULL DEFAULT 0 CHECK (cost_estimate >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (run_id, tenant_id) REFERENCES runs(run_id, tenant_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS retention_policies (
  policy_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES organizations(tenant_id) ON DELETE CASCADE,
  data_class text NOT NULL,
  retention_days integer NOT NULL CHECK (retention_days > 0),
  purpose text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, data_class)
);

CREATE INDEX IF NOT EXISTS idx_memberships_user ON memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_connections_tenant ON connections(tenant_id);
CREATE INDEX IF NOT EXISTS idx_workflows_tenant ON workflows(tenant_id);
CREATE INDEX IF NOT EXISTS idx_workflow_versions_tenant ON workflow_versions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_inbound_events_tenant ON inbound_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leads_tenant ON leads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_runs_tenant_state ON runs(tenant_id, state);
CREATE INDEX IF NOT EXISTS idx_classifications_run ON classifications(tenant_id, run_id);
CREATE INDEX IF NOT EXISTS idx_approvals_run ON approvals(tenant_id, run_id);
CREATE INDEX IF NOT EXISTS idx_outbox_status ON outbox_actions(status, next_attempt_at);
CREATE INDEX IF NOT EXISTS idx_audit_tenant_created ON audit_events(tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_usage_tenant_created ON usage_ledger(tenant_id, created_at);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inbound_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE classifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE outbox_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE retention_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON organizations
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
CREATE POLICY tenant_isolation ON memberships
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
CREATE POLICY tenant_isolation ON sessions
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
CREATE POLICY tenant_isolation ON connections
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
CREATE POLICY tenant_isolation ON workflows
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
CREATE POLICY tenant_isolation ON workflow_versions
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
CREATE POLICY tenant_isolation ON inbound_events
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
CREATE POLICY tenant_isolation ON leads
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
CREATE POLICY tenant_isolation ON runs
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
CREATE POLICY tenant_isolation ON classifications
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
CREATE POLICY tenant_isolation ON approvals
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
CREATE POLICY tenant_isolation ON outbox_actions
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
CREATE POLICY tenant_isolation ON audit_events
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
CREATE POLICY tenant_isolation ON usage_ledger
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
CREATE POLICY tenant_isolation ON retention_policies
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

GRANT USAGE ON SCHEMA public TO koros_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON
  organizations,
  users,
  memberships,
  sessions,
  connections,
  workflows,
  workflow_versions,
  inbound_events,
  leads,
  runs,
  classifications,
  approvals,
  outbox_actions,
  usage_ledger,
  retention_policies
  TO koros_app;
GRANT SELECT, INSERT ON audit_events TO koros_app;
REVOKE UPDATE, DELETE ON audit_events FROM koros_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO koros_app;

COMMENT ON TABLE audit_events IS 'Append-only audit trail. App role has SELECT/INSERT only.';
COMMENT ON COLUMN connections.secret_ref IS 'Reference to a secret store entry; never the secret value.';
