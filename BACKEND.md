# Backend

The API is the security boundary for the Water Refilling Management System. It is a Fastify service backed by Drizzle ORM, MariaDB/MySQL, and Redis. The browser only receives aggregated or masked data unless a permissioned, audited reveal is requested.

## Runtime

- Fastify 5 with strict Zod validation on every body, query, and params.
- Drizzle ORM with pooled `mysql2` connections (`backend/src/db/client.ts`).
- Two Redis services: sessions/security and cache. If `WRMS_REDIS_SESSION_URL` is empty or Redis is unreachable, the session store falls back to an in-memory store for local development.
- Routes are registered under `/api/v1`; health checks live outside that prefix.
- Business rules live in each module's service layer. Routes authenticate, authorize, validate, and audit.

## Environment

Configuration is read from `backend/.env` (ignored) and process env. Never commit values. The names are:

| Name | Purpose |
| --- | --- |
| `WRMS_API_HOST`, `WRMS_API_PORT` | API bind address and port (default `127.0.0.1:8080`). |
| `WRMS_DB_HOST`, `WRMS_DB_PORT`, `WRMS_DB_USER`, `WRMS_DB_PASSWORD`, `WRMS_DB_NAME` | MariaDB/MySQL connection. |
| `WRMS_REDIS_SESSION_URL` | Session and security store; falls back to memory locally. |
| `WRMS_REDIS_CACHE_URL` | Cache service. |
| `WRMS_SESSION_TIMEOUT_MINUTES` | Server-side session lifetime (default 60). |
| `WRMS_TURNSTILE_SITE_KEY`, `WRMS_TURNSTILE_SECRET_KEY`, `TURNSTILE_LOCAL_TEST_MODE` | Cloudflare Turnstile. Local test mode must be off in production. |
| `WRMS_GOOGLE_GEOCODE_KEY` | Server-side geocoding key. Never exposed to the browser. |
| `WRMS_BOOTSTRAP_EMAIL`, `WRMS_BOOTSTRAP_USERNAME`, `WRMS_BOOTSTRAP_PASSWORD`, `WRMS_BOOTSTRAP_FULL_NAME` | One-time administrator bootstrap only. |

## Authentication

1. `POST /auth/register` validates the body, checks Turnstile, and creates a `pending` account with no grants. It always returns the same success message, so callers cannot discover whether an email or username already exists.
2. An Administrator approves the account, which makes it `active` and assigns grants or a role.
3. `POST /auth/login` verifies the password with `scrypt`, rejects `pending` and `inactive` accounts, creates a random session token, and sets an HTTP-only session cookie. The CSRF token is returned in the response body and kept in browser memory only.
4. Every non-GET authenticated request must send `x-csrf-token`; a mismatch returns `403 csrf_failed`.
5. `POST /auth/logout` destroys the server session, clears the cookie, and records `AUTH_LOGOUT`.
6. `GET /auth/session` returns the current user and CSRF token, or `401 unauthenticated`.

Passwords are hashed with `scrypt` and never logged. Login and registration are rate limited per client key. Failed logins record `AUTH_LOGIN_FAILED` without revealing which part failed.

## Authorization

Each route declares `ctx.authenticate` and then asserts the required grant. The actor always comes from the session, never from request bodies or headers.

Grant format: `module:view|add|edit|delete|export|reveal`.

| Module | Grants |
| --- | --- |
| Dashboard | `dashboard:view`, `dashboard:export` |
| Heat Map | `heatmap:view`, `heatmap:export` |
| Inventory | `inventory:view`, `inventory:add`, `inventory:edit`, `inventory:delete`, `inventory:export` |
| Customers | `customers:view`, `customers:add`, `customers:edit`, `customers:delete`, `customers:export`, `customers:reveal` |
| Scheduling | `scheduling:view`, `scheduling:add`, `scheduling:edit`, `scheduling:delete`, `scheduling:export` |
| Reports | `reports:view`, `reports:export` |
| Audit | `audit:view` |
| Notifications | `notifications:view` |
| Administration | `admin:view`, `admin:add`, `admin:edit`, `admin:delete`, `admin:export` |
| Settings | `settings:view`, `settings:edit` |

Administration routes require `admin:view` at the pre-handler level and the finer grant inside the handler. A user cannot raise their own grants, deactivate themselves, or deactivate the last active Administrator.

## Routes

All paths are relative to `/api/v1` unless noted.

| Method | Path | Grant | Notes |
| --- | --- | --- | --- |
| GET | `/auth/turnstile` | public | Returns the public site key. |
| GET | `/auth/session` | session | Current user and CSRF token. |
| GET | `/auth/csrf` | session | Refreshed CSRF token. |
| POST | `/auth/register` | public | Turnstile-protected, pending account. |
| POST | `/auth/login` | public | Turnstile-protected, rate limited. |
| POST | `/auth/logout` | session | Destroys the session. |
| GET | `/dashboard/summary` | `dashboard:view` | Aggregated sales, clients, inventory. |
| GET | `/dashboard/map` | `dashboard:view` | Generalized pins/cells. |
| POST | `/dashboard/reveal` | `customers:reveal` | Audited field reveal. |
| POST | `/heat-map/points` | `heatmap:view` | Aggregated buckets, no individual rows. |
| POST | `/heat-map/export` | `heatmap:export` | Audited CSV export. |
| POST | `/inventory/query` | `inventory:view` | Paged items. |
| GET | `/inventory/:id` | `inventory:view` | Item detail. |
| GET | `/inventory/:id/movements` | `inventory:view` | Movement history. |
| POST | `/inventory` | `inventory:add` | Creates an item with opening quantity. |
| PATCH | `/inventory/:id` | `inventory:edit` | Versioned update. |
| POST | `/inventory/:id/movements` | `inventory:edit` | In/out/return/adjust/damaged movement. |
| GET | `/inventory/export` | `inventory:export` | Audited CSV export. |
| POST | `/customers/query` | `customers:view` | Paged, masked records. |
| GET | `/customers/:id` | `customers:view` | Masked detail. |
| POST | `/customers/:id/reveal` | `customers:reveal` | Audited reveal. |
| POST | `/customers` | `customers:add` | Creates a customer. |
| PATCH | `/customers/:id` | `customers:edit` | Versioned update. |
| POST | `/customers/:id/archive` | `customers:delete` | Lifecycle archive. |
| POST | `/customers/:id/restore` | `customers:delete` | Lifecycle restore. |
| POST | `/customers/geocode` | `customers:add` | Server-side geocoding. |
| GET | `/customers/export` | `customers:export` | Audited CSV export. |
| POST | `/schedules/query` | `scheduling:view` | Paged schedules; optional `status`, `date`, or `from`/`to` date range. |
| GET | `/schedules/assignees` | `scheduling:view` | Assignable active staff. |
| GET | `/schedules/:id` | `scheduling:view` | Schedule detail. |
| POST | `/schedules` | `scheduling:add` | One-time or recurring schedule. |
| PATCH | `/schedules/:id` | `scheduling:edit` | Versioned update. |
| POST | `/schedules/:id/status` | `scheduling:edit` | Lifecycle transition; completion posts one movement and one sale in one transaction. |
| GET | `/schedules/export` | `scheduling:export` | Audited CSV export. |
| GET | `/reports/summary` | `reports:view` | Aggregated period figures. |
| GET | `/reports/export` | `reports:export` | Audited CSV export. |
| POST | `/audit/query` | `audit:view` | Paged audit events. |
| GET | `/notifications` | `notifications:view` | Scoped feed. |
| POST | `/notifications/:id/read` | `notifications:view` | Marks one notice read. |
| POST | `/users/query` | `admin:view` | Paged users. |
| GET | `/users/pending` | `admin:view` | Pending registrations. |
| GET | `/users/:id` | `admin:view` | User detail. |
| POST | `/users` | `admin:add` | Creates a user. |
| PATCH | `/users/:id` | `admin:edit` | Versioned update; self-escalation blocked. |
| POST | `/users/:id/approve` | `admin:edit` | Activates and assigns grants. |
| POST | `/users/:id/reject` | `admin:edit` | Rejects a registration. |
| POST | `/users/:id/deactivate` | `admin:delete` | Deactivates; last Administrator protected. |
| POST | `/users/:id/reactivate` | `admin:delete` | Reactivates. |
| GET | `/roles` | `admin:view` | Role defaults. |
| POST | `/roles` | `admin:add` | Creates a role. |
| PATCH | `/roles/:id` | `admin:edit` | Updates a role. |
| DELETE | `/roles/:id` | `admin:delete` | Removes a non-system role. |
| GET | `/users/export` | `admin:export` | Audited CSV export. |
| GET | `/settings/preferences` | `settings:view` | Current user's template. |
| PUT | `/settings/preferences` | `settings:view` | Saves own template. |
| GET | `/settings/system` | `settings:view` | System settings. |
| PUT | `/settings/system` | `settings:edit` | Versioned system setting update. |

Health: `GET /health/live` and `GET /health/ready`.

## Contracts

- Lists return `{ items, nextCursor }`. Cursors are opaque strings; the current implementation encodes an offset, so clients must not parse or construct them.
- Page size defaults to 20 and is capped at 100.
- Mutations that can race send and return a `version`. A stale version returns `409 conflict`.
- Errors use a safe envelope: `{ "error": { "code": "...", "message": "..." } }`. Stack traces, SQL, secrets, names, and identifiers are never returned.
- Search terms that may contain personal data go in request bodies, never URLs.
- Responses never include customer coordinates or names from Dashboard or Heat Map endpoints; those modules return aggregated buckets only.
- CSV exports are audited with the module's `_EXPORT` event.

## Audit events

Every audit row stores an opaque actor ID, event name, entity type, opaque entity ID, a short non-personal detail, and server time.

| Event | Emitted by |
| --- | --- |
| `AUTH_REGISTER`, `AUTH_APPROVE`, `AUTH_LOGIN`, `AUTH_LOGIN_FAILED`, `AUTH_LOGOUT` | Authentication and user approval. |
| `ACCESS` | Sensitive reads, reveals, and prints. |
| `DASHBOARD_EXPORT`, `HEATMAP_EXPORT`, `REPORTS_EXPORT` | Read-only module exports. |
| `INVENTORY_CREATE`, `INVENTORY_UPDATE`, `INVENTORY_DELETE`, `INVENTORY_EXPORT` | Inventory mutations and export. |
| `CUSTOMER_CREATE`, `CUSTOMER_UPDATE`, `CUSTOMER_DELETE`, `CUSTOMER_EXPORT` | Customer mutations, lifecycle, and export. |
| `SCHEDULE_CREATE`, `SCHEDULE_UPDATE`, `SCHEDULE_DELETE`, `SCHEDULE_EXPORT` | Scheduling mutations and export. |
| `USER_CREATE`, `USER_UPDATE`, `USER_DELETE`, `USER_EXPORT` | Administration mutations and export. |
| `SETTINGS_UPDATE` | System setting changes. |

Audit entries must not contain names, addresses, contact numbers, coordinates, or other personal data.

## Database and migrations

- Schema: `backend/src/db/schema.ts`.
- Journaled migrations: `backend/drizzle/*.sql`, applied in order by `backend/scripts/db-setup.mjs` using a `schema_migrations` table. Never edit an applied migration or change the database by hand.
- `npm.cmd run db:setup` creates the configured database if needed and applies pending migrations. It does not seed data.
- `npm.cmd run bootstrap --prefix backend` (after setting the `WRMS_BOOTSTRAP_*` values) creates the first active Administrator with `admin:*` grants and every module's view grant.
- Use synthetic records in development and tests. Never seed production data.

## Backend testing

Tests live under `backend/tests/` and run with `npm.cmd test` from `backend/`. Cover unauthenticated access, missing grants, invalid input, success, concurrency conflicts, and the expected audit event. The session store and database can be replaced through `buildServer({ db, sessions })` for route tests.
