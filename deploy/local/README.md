# KOROS local synthetic environment

This directory documents the **local-only** environment used for synthetic
development. It is not a staging or production manifest.

## Requirements

- Node.js 22–26.
- PostgreSQL 17 binaries (`initdb`, `pg_ctl`, `createdb`, `psql`, `pg_isready`).
  Set `KOROS_PG_BIN` if they are not in the default location.

## Start / status / restart / stop

```bash
npm run local:start
npm run local:status
npm run local:restart
npm run local:stop
```

Defaults:

- PostgreSQL: `127.0.0.1:55432`
- App/dashboard: `http://127.0.0.1:3030` (`/login`, `/dashboard`)
- Data, logs, state and credentials: `.koros/local/` (gitignored)

`local:start` initializes a private PostgreSQL data directory, creates the
`koros_local` database and the `koros_app` role, applies migrations, seeds
synthetic data, starts the app on loopback and waits for `/healthz`.
`local:restart` preserves the data directory. `local:stop` stops the app and
PostgreSQL.

## Synthetic credentials

`local:start` generates a random local-only password for
`owner-a@example.invalid` and `owner-b@example.invalid` and writes it to
`.koros/local/credentials.json` with owner-only permissions. The password is
never printed, stored in Git, or used outside this workspace. Delete
`.koros/local/credentials.json` and rerun provisioning if it is lost; do not
commit it.

## Isolation and refusals

- PostgreSQL and the app bind only to `127.0.0.1`; no administrative port is
  exposed.
- No Docker socket is mounted or read.
- The runner refuses `NODE_ENV=production`, non-loopback hosts, equal ports,
  `KOROS_DOCKER_SOCKET`, `KOROS_ALLOW_NON_LOOPBACK=1` and secure cookies over
  plain HTTP.
- The data directory must remain inside the workspace.
- `KOROS_LOCAL_DATA_DIR` may relocate `.koros/local` only within the workspace.

## Failure/recovery

- Missing PostgreSQL binaries: set `KOROS_PG_BIN` and retry.
- Port in use: choose different `KOROS_LOCAL_DB_PORT` / `KOROS_LOCAL_APP_PORT`.
- Migration checksum divergence: `db-migrate` aborts rather than rewriting the
  migration ledger; stop, inspect and recreate a fresh local data directory.
- Stale state: run `npm run local:stop` before `local:start`.

## Limits

Local-only, no TLS, no public/staging deployment, no real CRM/LLM/provider,
no Docker socket and no billing. Delivery to a managed environment remains
**PENDING** and requires separate authorization.
