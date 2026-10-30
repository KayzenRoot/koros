-- KOR-PM02-WO-003 | test/dev bootstrap only
-- The production app role must be provisioned by operations with its own secret.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'koros_app') THEN
    CREATE ROLE koros_app NOLOGIN NOSUPERUSER NOBYPASSRLS;
  END IF;
END
$$;
ALTER ROLE koros_app WITH LOGIN PASSWORD 'koros_test_only_password';
