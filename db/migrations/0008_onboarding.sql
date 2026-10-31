-- KOR-PM06-WO-001: resumable, tenant-scoped onboarding wizard.

CREATE TABLE IF NOT EXISTS onboarding_sessions (
  session_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES organizations(tenant_id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'ABANDONED')),
  current_step text NOT NULL DEFAULT 'TENANT' CHECK (current_step IN (
    'TENANT', 'CONNECTOR', 'TEMPLATE', 'INVITE', 'CONSENT', 'POLICY', 'DRY_RUN', 'COMPLETED'
  )),
  profile jsonb NOT NULL DEFAULT '{}'::jsonb,
  connector jsonb,
  template_version_id uuid,
  invite_id uuid,
  consent text CHECK (consent IN ('GRANTED', 'DENIED')),
  policy jsonb,
  dry_run jsonb,
  created_by uuid REFERENCES users(user_id),
  correlation_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  UNIQUE (session_id, tenant_id),
  FOREIGN KEY (template_version_id, tenant_id)
    REFERENCES workflow_template_versions(template_version_id, tenant_id),
  CHECK (jsonb_typeof(profile) = 'object')
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_onboarding_active_tenant
  ON onboarding_sessions (tenant_id)
  WHERE status = 'IN_PROGRESS';

CREATE TABLE IF NOT EXISTS onboarding_invites (
  invite_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES organizations(tenant_id) ON DELETE CASCADE,
  session_id uuid NOT NULL,
  email_normalized text NOT NULL,
  role text NOT NULL CHECK (role IN ('operator', 'approver', 'viewer')),
  token_hash text NOT NULL CHECK (length(token_hash) = 64),
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  created_by uuid REFERENCES users(user_id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (invite_id, tenant_id),
  FOREIGN KEY (session_id, tenant_id)
    REFERENCES onboarding_sessions(session_id, tenant_id) ON DELETE CASCADE,
  CHECK (expires_at > created_at)
);

CREATE INDEX IF NOT EXISTS idx_onboarding_invites_session
  ON onboarding_invites (tenant_id, session_id, created_at);

ALTER TABLE onboarding_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON onboarding_sessions
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
CREATE POLICY tenant_isolation ON onboarding_invites
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

GRANT SELECT, INSERT, UPDATE ON onboarding_sessions, onboarding_invites TO koros_app;

COMMENT ON TABLE onboarding_sessions IS
  'Resumable tenant onboarding state; no secret or real provider credential.';
