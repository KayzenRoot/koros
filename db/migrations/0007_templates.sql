-- KOR-PM05-WO-003: immutable, tenant-scoped workflow templates and versions.

CREATE TABLE IF NOT EXISTS workflow_templates (
  template_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES organizations(tenant_id) ON DELETE CASCADE,
  name text NOT NULL CHECK (length(name) BETWEEN 1 AND 100),
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ARCHIVED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES users(user_id),
  UNIQUE (tenant_id, name),
  UNIQUE (template_id, tenant_id)
);

CREATE TABLE IF NOT EXISTS workflow_template_versions (
  template_version_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  version integer NOT NULL CHECK (version > 0),
  config jsonb NOT NULL,
  config_hash text NOT NULL CHECK (length(config_hash) = 64),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES users(user_id),
  UNIQUE (template_id, version),
  UNIQUE (template_version_id, tenant_id),
  FOREIGN KEY (template_id, tenant_id)
    REFERENCES workflow_templates(template_id, tenant_id) ON DELETE CASCADE,
  CHECK (jsonb_typeof(config) = 'object')
);

ALTER TABLE approvals
  ADD COLUMN IF NOT EXISTS template_version_id uuid;

ALTER TABLE approvals DROP CONSTRAINT IF EXISTS approvals_template_version_fk;
ALTER TABLE approvals ADD CONSTRAINT approvals_template_version_fk
  FOREIGN KEY (template_version_id, tenant_id)
  REFERENCES workflow_template_versions(template_version_id, tenant_id);

CREATE INDEX IF NOT EXISTS idx_approvals_template_version
  ON approvals (tenant_id, template_version_id);

ALTER TABLE workflow_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_template_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON workflow_templates
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
CREATE POLICY tenant_isolation ON workflow_template_versions
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

-- Versions are immutable: the app role may read and append, never rewrite.
GRANT SELECT, INSERT ON workflow_templates, workflow_template_versions TO koros_app;

COMMENT ON TABLE workflow_template_versions IS
  'Immutable tenant template versions; policy changes require a new version.';
