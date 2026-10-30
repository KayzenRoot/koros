-- KOR-PM02-WO-002 | 0002_auth.sql
-- SECURITY DEFINER helpers for login and session lookup.
-- The app role never receives BYPASSRLS; these functions expose only the
-- matching user/session and pin search_path.

CREATE OR REPLACE FUNCTION auth_lookup(p_email text)
RETURNS TABLE (
  user_id uuid,
  password_hash text,
  tenant_id uuid,
  membership_id uuid,
  role text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT u.user_id, u.password_hash, m.tenant_id, m.membership_id, m.role
  FROM users u
  JOIN memberships m ON m.user_id = u.user_id
  WHERE u.email_normalized = lower(btrim(p_email))
    AND u.status = 'ACTIVE'
    AND m.status = 'ACTIVE'
  ORDER BY m.created_at
  LIMIT 1;
$$;
REVOKE ALL ON FUNCTION auth_lookup(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION auth_lookup(text) TO koros_app;
COMMENT ON FUNCTION auth_lookup(text) IS 'Returns the first active user/membership for login; no cross-tenant enumeration.';

CREATE OR REPLACE FUNCTION auth_session_lookup(p_token_hash text)
RETURNS TABLE (
  session_id uuid,
  user_id uuid,
  tenant_id uuid,
  role text,
  expires_at timestamptz,
  revoked_at timestamptz,
  user_status text,
  membership_status text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT s.session_id, s.user_id, s.tenant_id, m.role, s.expires_at, s.revoked_at, u.status, m.status
  FROM sessions s
  JOIN users u ON u.user_id = s.user_id
  JOIN memberships m ON m.user_id = s.user_id AND m.tenant_id = s.tenant_id
  WHERE s.token_hash = p_token_hash
    AND m.status = 'ACTIVE'
  LIMIT 1;
$$;
REVOKE ALL ON FUNCTION auth_session_lookup(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION auth_session_lookup(text) TO koros_app;
COMMENT ON FUNCTION auth_session_lookup(text) IS 'Returns one session by token hash; the caller still enforces expiry, revocation and user status.';
