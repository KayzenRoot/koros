-- KOR-PM02-WO-003 | synthetic seed only
-- Fixed UUIDs and .invalid e-mails. No real client data or credentials.
-- This file is applied by the migration runner as the database owner.

INSERT INTO organizations (tenant_id, name, status) VALUES
  ('11111111-1111-4111-8111-111111111111', 'Synthetic Tenant A', 'ACTIVE'),
  ('22222222-2222-4222-8222-222222222222', 'Synthetic Tenant B', 'ACTIVE')
ON CONFLICT DO NOTHING;

INSERT INTO users (user_id, email, email_normalized, password_hash, status) VALUES
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'owner-a@example.invalid', 'owner-a@example.invalid', 'scrypt$synthetic$00000000000000000000000000000000', 'ACTIVE'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'owner-b@example.invalid', 'owner-b@example.invalid', 'scrypt$synthetic$00000000000000000000000000000000', 'ACTIVE')
ON CONFLICT DO NOTHING;

INSERT INTO memberships (membership_id, tenant_id, user_id, role, status) VALUES
  ('a1000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'owner', 'ACTIVE'),
  ('b1000000-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'owner', 'ACTIVE')
ON CONFLICT DO NOTHING;

INSERT INTO workflows (workflow_id, tenant_id, name, status) VALUES
  ('a0000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'Synthetic Lead Flow A', 'ACTIVE'),
  ('b0000000-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222', 'Synthetic Lead Flow B', 'ACTIVE')
ON CONFLICT DO NOTHING;

INSERT INTO workflow_versions (workflow_version_id, workflow_id, tenant_id, version, input_schema, approval_policy) VALUES
  ('a0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 1, '{"type":"object"}'::jsonb, '{"required":true}'::jsonb),
  ('b0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222', 1, '{"type":"object"}'::jsonb, '{"required":true}'::jsonb)
ON CONFLICT DO NOTHING;

INSERT INTO inbound_events (event_id, tenant_id, provider, external_id, body_hash, signature_status) VALUES
  ('a0000000-0000-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111', 'synthetic-webhook', 'event-a', 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 'VALID'),
  ('b0000000-0000-4000-8000-000000000003', '22222222-2222-4222-8222-222222222222', 'synthetic-webhook', 'event-b', 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', 'VALID')
ON CONFLICT DO NOTHING;

INSERT INTO leads (lead_id, tenant_id, event_id, external_id, source, status, minimal_fields, consent_status) VALUES
  ('a0000000-0000-4000-8000-000000000004', '11111111-1111-4111-8111-111111111111', 'a0000000-0000-4000-8000-000000000003', 'lead-a', 'synthetic', 'VALIDATED', '{"intent":"demo-a"}'::jsonb, 'GRANTED'),
  ('b0000000-0000-4000-8000-000000000004', '22222222-2222-4222-8222-222222222222', 'b0000000-0000-4000-8000-000000000003', 'lead-b', 'synthetic', 'VALIDATED', '{"intent":"demo-b"}'::jsonb, 'GRANTED')
ON CONFLICT DO NOTHING;

INSERT INTO runs (run_id, tenant_id, lead_id, workflow_version_id, state, idempotency_key) VALUES
  ('a0000000-0000-4000-8000-000000000005', '11111111-1111-4111-8111-111111111111', 'a0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000002', 'PENDING_APPROVAL', 'run-a'),
  ('b0000000-0000-4000-8000-000000000005', '22222222-2222-4222-8222-222222222222', 'b0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000002', 'PENDING_APPROVAL', 'run-b')
ON CONFLICT DO NOTHING;

INSERT INTO approvals (approval_id, tenant_id, run_id, actor_user_id, payload_hash, decision, expires_at, decided_at) VALUES
  ('a0000000-0000-4000-8000-000000000006', '11111111-1111-4111-8111-111111111111', 'a0000000-0000-4000-8000-000000000005', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc', 'APPROVED', now() + interval '1 day', now()),
  ('b0000000-0000-4000-8000-000000000006', '22222222-2222-4222-8222-222222222222', 'b0000000-0000-4000-8000-000000000005', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd', 'APPROVED', now() + interval '1 day', now())
ON CONFLICT DO NOTHING;

INSERT INTO audit_events (event_id, tenant_id, run_id, actor_user_id, action, entity, entity_id, metadata) VALUES
  ('a0000000-0000-4000-8000-000000000007', '11111111-1111-4111-8111-111111111111', 'a0000000-0000-4000-8000-000000000005', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'SEED', 'run', 'a0000000-0000-4000-8000-000000000005', '{"source":"synthetic"}'::jsonb),
  ('b0000000-0000-4000-8000-000000000007', '22222222-2222-4222-8222-222222222222', 'b0000000-0000-4000-8000-000000000005', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'SEED', 'run', 'b0000000-0000-4000-8000-000000000005', '{"source":"synthetic"}'::jsonb)
ON CONFLICT DO NOTHING;

INSERT INTO usage_ledger (usage_id, tenant_id, run_id, provider, tokens, cost_estimate) VALUES
  ('a0000000-0000-4000-8000-000000000008', '11111111-1111-4111-8111-111111111111', 'a0000000-0000-4000-8000-000000000005', 'synthetic', 0, 0),
  ('b0000000-0000-4000-8000-000000000008', '22222222-2222-4222-8222-222222222222', 'b0000000-0000-4000-8000-000000000005', 'synthetic', 0, 0)
ON CONFLICT DO NOTHING;

INSERT INTO retention_policies (policy_id, tenant_id, data_class, retention_days, purpose) VALUES
  ('a0000000-0000-4000-8000-000000000009', '11111111-1111-4111-8111-111111111111', 'synthetic-run', 30, 'synthetic test only'),
  ('b0000000-0000-4000-8000-000000000009', '22222222-2222-4222-8222-222222222222', 'synthetic-run', 30, 'synthetic test only')
ON CONFLICT DO NOTHING;
