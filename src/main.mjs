import { parsePort } from './config.mjs';
import { startLocalServer } from './app.mjs';

try {
  const port = parsePort(process.env.KOROS_PORT ?? '3030');
  const server = await startLocalServer(port);
  console.info(`KOROS synthetic-only baseline listening on http://127.0.0.1:${server.address().port}`);
} catch (error) {
  console.error(`Cannot start local baseline: ${error.message}`);
  process.exitCode = 1;
}
