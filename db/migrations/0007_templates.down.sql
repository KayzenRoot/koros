-- Development/test rollback only. Production rollback uses backup/restore.
DROP INDEX IF EXISTS idx_approvals_template_version;
ALTER TABLE approvals DROP CONSTRAINT IF EXISTS approvals_template_version_fk;
ALTER TABLE approvals DROP COLUMN IF EXISTS template_version_id;

DROP POLICY IF EXISTS tenant_isolation ON workflow_template_versions;
DROP POLICY IF EXISTS tenant_isolation ON workflow_templates;
DROP TABLE IF EXISTS workflow_template_versions;
DROP TABLE IF EXISTS workflow_templates;
