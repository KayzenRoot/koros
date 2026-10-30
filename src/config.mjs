/** KOR-PM02-WO-001: this baseline runs only on local loopback with synthetic data. */
export const VERSION = '0.1.0';

export const PUBLIC_CONFIG = Object.freeze({
  environment: 'local-synthetic',
  bindAddress: '127.0.0.1',
  authentication: 'session-rbac',
  tenantAccess: 'authenticated-session-only',
  dataMode: 'synthetic-only',
  externalWrites: false,
  crmIntegration: false,
  modelIntegration: false,
});

export function parsePort(value) {
  if (typeof value !== 'string' && typeof value !== 'number') {
    throw new TypeError('Port must be an integer');
  }
  const text = String(value);
  if (!/^(0|[1-9][0-9]{0,4})$/.test(text)) {
    throw new RangeError('Port must be an integer from 0 through 65535');
  }
  const port = Number(text);
  if (port > 65535) {
    throw new RangeError('Port must be an integer from 0 through 65535');
  }
  return port;
}
