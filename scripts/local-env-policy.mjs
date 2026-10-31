export const LOOPBACK_HOSTS = Object.freeze(['127.0.0.1', '::1', 'localhost']);
export const DEFAULT_LOCAL_PORTS = Object.freeze({ database: 55432, app: 3030 });

export function parseLocalPort(value, fallback) {
  const text = value === undefined || value === null || value === '' ? String(fallback) : String(value);
  if (!/^[1-9][0-9]{0,4}$/.test(text)) return null;
  const port = Number(text);
  return port >= 1024 && port <= 65535 ? port : null;
}

/**
 * Local-only policy: loopback, non-production, no Docker socket, no secure
 * cookies over plain HTTP. It never returns or logs a credential.
 */
export function validateLocalEnvironment(env = {}) {
  const errors = [];
  if (env.NODE_ENV === 'production') errors.push('production_forbidden');
  if (env.KOROS_DOCKER_SOCKET) errors.push('docker_socket_forbidden');
  if (env.KOROS_ALLOW_NON_LOOPBACK === '1') errors.push('non_loopback_forbidden');
  if (env.KOROS_SECURE_COOKIES === '1') errors.push('secure_cookies_require_tls');

  const databaseHost = env.KOROS_LOCAL_DB_HOST || '127.0.0.1';
  const appHost = env.KOROS_LOCAL_APP_HOST || '127.0.0.1';
  if (!LOOPBACK_HOSTS.includes(databaseHost)) errors.push('database_host_not_loopback');
  if (!LOOPBACK_HOSTS.includes(appHost)) errors.push('app_host_not_loopback');

  const databasePort = parseLocalPort(env.KOROS_LOCAL_DB_PORT, DEFAULT_LOCAL_PORTS.database);
  const appPort = parseLocalPort(env.KOROS_LOCAL_APP_PORT, DEFAULT_LOCAL_PORTS.app);
  if (databasePort === null) errors.push('invalid_database_port');
  if (appPort === null) errors.push('invalid_app_port');
  if (databasePort !== null && databasePort === appPort) errors.push('ports_must_differ');

  if (env.KOROS_DATABASE_URL) {
    try {
      const url = new URL(env.KOROS_DATABASE_URL);
      if (url.protocol !== 'postgres:') errors.push('database_url_must_be_postgres');
      if (!LOOPBACK_HOSTS.includes(url.hostname)) errors.push('database_url_not_loopback');
    } catch {
      errors.push('invalid_database_url');
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    databaseHost,
    appHost,
    databasePort,
    appPort,
  };
}
