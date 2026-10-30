import assert from 'node:assert/strict';
import { startLocalServer } from '../src/app.mjs';

const server = await startLocalServer(0);
try {
  const addr = server.address();
  assert.equal(addr.address, '127.0.0.1');
  const base = `http://127.0.0.1:${addr.port}`;
  const health = await fetch(`${base}/healthz`);
  assert.equal(health.status, 200);
  assert.deepEqual(await health.json(), { status: 'ok' });
  const denied = await fetch(`${base}/v1/tenants`, { method: 'POST' });
  assert.equal(denied.status, 405);
  console.info('PASS: loopback health and fail-closed protected route');
} finally {
  await new Promise((resolve, reject) => server.close((e) => e ? reject(e) : resolve()));
}
