import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { startLocalServer } from '../src/app.mjs';
import { closePool, withTenant } from '../src/db.mjs';
import { signPayload } from '../src/ingestion/signature.mjs';
import { resetIngestionRateLimit } from '../src/ingestion/service.mjs';

const enabled = process.env.KOROS_DB_TESTS === '1' && Boolean(process.env.KOROS_DATABASE_URL);
const options = { skip: !enabled };
const TENANT_A = '11111111-1111-4111-8111-111111111111';
const TENANT_B = '22222222-2222-4222-8222-222222222222';
const PROVIDER = 'synthetic-webhook';
const ACCOUNT_A = 'source-a';
const ACCOUNT_B = 'source-b';
const SECRET_A = 'test-webhook-secret-a';
const SECRET_B = 'test-webhook-secret-b';
const RUN_ID = `${Date.now().toString(36)}-${process.pid}`;

function unique(name) {
  return `${RUN_ID}-${name}`;
}

let server;
let origin;

before(async () => {
  if (!enabled) return;
  process.env.KOROS_WEBHOOK_SECRET_A = SECRET_A;
  process.env.KOROS_WEBHOOK_SECRET_B = SECRET_B;
  server = await startLocalServer(0);
  origin = `http://127.0.0.1:${server.address().port}`;
  resetIngestionRateLimit();
});

after(async () => {
  if (server) {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
  if (enabled) await closePool();
});

beforeEach(() => {
  if (enabled) resetIngestionRateLimit();
});

function leadBody(externalId) {
  return {
    external_id: externalId,
    lead: {
      email: `${externalId}@example.invalid`,
      name: 'Synthetic Lead',
      intent: 'demo',
      consent_status: 'GRANTED',
    },
  };
}

async function postWebhook({
  tenant = TENANT_A,
  provider = PROVIDER,
  account = ACCOUNT_A,
  body = leadBody('ingest-default'),
  secret = SECRET_A,
  timestamp,
  signature,
  rawBody,
} = {}) {
  const raw = rawBody ?? Buffer.from(JSON.stringify(body));
  const ts = timestamp ?? String(Math.floor(Date.now() / 1000));
  const sig = signature ?? signPayload(secret, ts, raw);
  const res = await fetch(`${origin}/v1/webhooks/leads`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-koros-tenant': tenant,
      'x-koros-provider': provider,
      'x-koros-account': account,
      'x-koros-timestamp': ts,
      'x-koros-signature': sig,
    },
    body: raw,
  });
  return { res, body: await res.json() };
}

test('accepts a signed synthetic lead for tenant A', options, async () => {
  const externalId = unique('a-1');
  const { res, body } = await postWebhook({ body: leadBody(externalId) });
  assert.equal(res.status, 202);
  assert.equal(body.status, 'accepted');
  assert.equal(body.tenantId, TENANT_A);
  assert.ok(body.eventId);
  assert.ok(body.leadId);

  const counts = await withTenant(TENANT_A, async (client) => {
    const events = await client.query('SELECT count(*)::int AS total FROM inbound_events WHERE external_id = $1', [externalId]);
    const leads = await client.query('SELECT count(*)::int AS total FROM leads WHERE external_id = $1', [externalId]);
    const audit = await client.query("SELECT count(*)::int AS total FROM audit_events WHERE action = 'WEBHOOK_ACCEPTED'");
    return { events: events.rows[0].total, leads: leads.rows[0].total, audit: audit.rows[0].total };
  });
  assert.equal(counts.events, 1);
  assert.equal(counts.leads, 1);
  assert.ok(counts.audit >= 1);
});

test('replay of the same external_id is a duplicate, not a second lead', options, async () => {
  const externalId = unique('a-dup');
  const first = await postWebhook({ body: leadBody(externalId) });
  assert.equal(first.res.status, 202);
  const second = await postWebhook({ body: leadBody(externalId) });
  assert.equal(second.res.status, 200);
  assert.equal(second.body.status, 'duplicate');
  assert.equal(second.body.leadId, null);

  const count = await withTenant(TENANT_A, async (client) => {
    const result = await client.query('SELECT count(*)::int AS total FROM leads WHERE external_id = $1', [externalId]);
    return result.rows[0].total;
  });
  assert.equal(count, 1);
});

test('rejects invalid signature, stale timestamp and wrong secret', options, async () => {
  const invalid = await postWebhook({
    body: leadBody(unique('bad-signature')),
    signature: '0'.repeat(64),
  });
  assert.equal(invalid.res.status, 401);
  assert.equal(invalid.body.error, 'invalid_signature');

  const staleTimestamp = String(Math.floor(Date.now() / 1000) - 600);
  const stale = await postWebhook({ body: leadBody(unique('stale')), timestamp: staleTimestamp });
  assert.equal(stale.res.status, 401);
  assert.equal(stale.body.error, 'stale_timestamp');

  const wrongSecret = await postWebhook({
    body: leadBody(unique('wrong-secret')),
    secret: SECRET_B,
  });
  assert.equal(wrongSecret.res.status, 401);
  assert.equal(wrongSecret.body.error, 'invalid_signature');
});

test('rejects unknown source and cross-tenant source spoof', options, async () => {
  const unknown = await postWebhook({
    body: leadBody(unique('unknown-source')),
    account: 'source-unknown',
  });
  assert.equal(unknown.res.status, 401);
  assert.equal(unknown.body.error, 'unauthorized_source');

  const spoof = await postWebhook({
    body: leadBody(unique('spoof')),
    tenant: TENANT_A,
    account: ACCOUNT_B,
    secret: SECRET_B,
  });
  assert.equal(spoof.res.status, 401);
});

test('rejects malformed payload and unsupported content types', options, async () => {
  const malformed = await postWebhook({
    body: { lead: { email: 'missing@example.invalid' } },
  });
  assert.equal(malformed.res.status, 400);
  assert.equal(malformed.body.error, 'invalid_external_id');

  const raw = Buffer.from(JSON.stringify(leadBody(unique('wrong-type'))));
  const ts = String(Math.floor(Date.now() / 1000));
  const res = await fetch(`${origin}/v1/webhooks/leads`, {
    method: 'POST',
    headers: {
      'content-type': 'text/plain',
      'x-koros-tenant': TENANT_A,
      'x-koros-provider': PROVIDER,
      'x-koros-account': ACCOUNT_A,
      'x-koros-timestamp': ts,
      'x-koros-signature': signPayload(SECRET_A, ts, raw),
    },
    body: raw,
  });
  assert.equal(res.status, 415);
});

test('isolates a valid tenant B event from tenant A', options, async () => {
  const externalId = unique('b-1');
  const b = await postWebhook({
    tenant: TENANT_B,
    account: ACCOUNT_B,
    secret: SECRET_B,
    body: leadBody(externalId),
  });
  assert.equal(b.res.status, 202);
  assert.equal(b.body.tenantId, TENANT_B);

  const bCount = await withTenant(TENANT_B, async (client) => {
    const result = await client.query('SELECT count(*)::int AS total FROM inbound_events WHERE external_id = $1', [externalId]);
    return result.rows[0].total;
  });
  assert.equal(bCount, 1);

  const aView = await withTenant(TENANT_A, async (client) => {
    const result = await client.query('SELECT count(*)::int AS total FROM inbound_events WHERE external_id = $1', [externalId]);
    return result.rows[0].total;
  });
  assert.equal(aView, 0);
});

test('rejects an oversized webhook body before processing', options, async () => {
  const raw = Buffer.alloc(17 * 1024, 0x61);
  const ts = String(Math.floor(Date.now() / 1000));
  const res = await fetch(`${origin}/v1/webhooks/leads`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-koros-tenant': TENANT_A,
      'x-koros-provider': PROVIDER,
      'x-koros-account': ACCOUNT_A,
      'x-koros-timestamp': ts,
      'x-koros-signature': signPayload(SECRET_A, ts, raw),
    },
    body: raw,
  });
  assert.equal(res.status, 413);
});
