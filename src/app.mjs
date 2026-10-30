import { createServer } from 'node:http';
import { PUBLIC_CONFIG, VERSION, parsePort } from './config.mjs';

const HEADERS = Object.freeze({
  'Cache-Control': 'no-store',
  'Content-Type': 'application/json; charset=utf-8',
  'Content-Security-Policy': "default-src 'none'",
  'X-Content-Type-Options': 'nosniff',
});

function reply(res, status, object) {
  const body = JSON.stringify(object);
  res.writeHead(status, {
    ...HEADERS,
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

/** Deliberately exposes no auth, tenant, CRM, AI or write endpoints. */
export function handleRequest(req, res) {
  const target = typeof req.url === 'string' ? req.url : '';
  const pathname = target.split('?', 1)[0];
  if (req.method !== 'GET') {
    reply(res, 405, { error: 'method_not_allowed' });
    return;
  }
  if (pathname === '/healthz') {
    reply(res, 200, { status: 'ok' });
    return;
  }
  if (pathname === '/version') {
    reply(res, 200, { version: VERSION });
    return;
  }
  if (pathname === '/config') {
    reply(res, 200, PUBLIC_CONFIG);
    return;
  }
  reply(res, 404, { error: 'not_found' });
}

/** Always binds loopback. Caller cannot provide another host. */
export function startLocalServer(port = 0) {
  const validPort = parsePort(port);
  return new Promise((resolve, reject) => {
    const server = createServer(handleRequest);
    const onStartupError = (error) => reject(error);
    server.once('error', onStartupError);
    server.listen(validPort, '127.0.0.1', () => {
      server.off('error', onStartupError);
      resolve(server);
    });
  });
}
