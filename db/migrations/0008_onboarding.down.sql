-- Development/test rollback only. Production rollback uses backup/restore.
DROP POLICY IF EXISTS tenant_isolation ON onboarding_invites;
DROP POLICY IF EXISTS tenant_isolation ON onboarding_sessions;
DROP TABLE IF EXISTS onboarding_invites;
DROP TABLE IF EXISTS onboarding_sessions;
