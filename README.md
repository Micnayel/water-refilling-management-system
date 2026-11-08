# Water Refilling Management System

A compact, responsive management frontend built with React, TypeScript, Vite, Tailwind CSS, and shadcn-style UI primitives. The application covers Login and Registration, a Dashboard, a Heat Map, Inventory (gallons), Customers, Scheduling, User Management, and Settings (system template selection), plus reporting and administration.

This repository holds the frontend and the `/api/v1` backend (see [BACKEND.md](BACKEND.md)). Development runs the real API against a local database with synthetic records; the API enforces authentication, authorization, validation, scope, audit logging, and sensitive-data protection.

## Documentation

- [System architecture](docs/system-architecture.md) explains the current frontend layers, state, API path, and production boundary.
- [System design](docs/system-design.md) maps the implemented workflows, record handoffs, and shared controls.
- [System flowcharts](docs/system-flowcharts.md) provides detailed workflow diagrams.
- [Open questions](docs/open-questions.md) records policies and production decisions that are not settled by this reference implementation.

## Feature overview

- Login and Registration cover secure sign-in, self-registration with administrator approval, and session handling.
- Dashboard covers a Google Map of customer locations, sales, client count, client location statistics, and inventory count.
- Heat Map covers a Google Maps heat map of aggregated customer and demand density by area.
- Inventory covers gallon stock by state, stock movements, and low-stock visibility.
- Customers cover customer profiles, contact details, delivery locations, and gallons on hand.
- Scheduling covers refill and delivery schedules, staff assignment, and status tracking through completion.
- User Management covers users, roles, grants, and registration approval.
- Settings let each user select the system template (theme preset) they want; administrators also manage system-wide settings.
- Operations and administration cover audit, notifications, users, roles, permissions, and system settings.

## Application processes

The router exposes workspaces rather than a forced screen sequence, but records hand off between modules as follows. Policy-dependent steps still require the decisions tracked in [open questions](docs/open-questions.md).

### Login and Registration

1. A visitor registers with the required details and passes the Turnstile check.
2. The new account is created inactive with no grants and appears in the pending registrations list.
3. An Administrator approves or rejects it and assigns a role; approval activates the account.
4. The user signs in at `/login`, receives an HTTP-only session cookie, and lands on the Dashboard.
5. The session ends on logout, idle timeout, or server-side expiry.

### Dashboard

1. The Dashboard loads aggregated figures from the API: sales, client count, client location statistics, and inventory count.
2. The customer location map shows masked or generalized pins by default.
3. Revealing an exact location or customer name requires a grant, remasks automatically, and is audited.
4. Figures link into the owning module (Customers, Inventory, Scheduling) for detail.

### Heat Map

1. The user opens the Heat Map and selects a date range, area, and metric (for example customer density or completed deliveries).
2. The API returns aggregated, bucketed points only; no individual customer coordinates or names.
3. The heat layer renders on Google Maps, with a table of the same area counts as a non-map alternative.

### Inventory

1. A user adds a gallon stock item or type with its opening quantity.
2. Stock changes only through stock movements (in, out, return, adjust), each with a reason.
3. Completing a schedule posts the matching movement automatically.
4. Quantities by state (full, empty, with customer, damaged) feed the Dashboard inventory count; stock cannot go negative.

### Customers

1. A user creates a customer with contact details and a delivery location chosen on the map or geocoded from the address.
2. Sensitive fields stay masked until a permitted, audited reveal.
3. Gallons on hand and delivery history update as schedules complete.
4. Customers who stop ordering are archived, and can be restored.

### Scheduling

1. A user creates a one-time or recurring refill or delivery schedule for a customer and assigns a staff member.
2. The schedule moves through Scheduled, Out for delivery, Completed, or Cancelled using the status stepper.
3. Completing a schedule, in one server transaction, posts the stock movement and records the sale in centavos.
4. Cancelling is allowed only before completion.

### User Management

1. An Administrator reviews pending registrations and approves or rejects them.
2. The Administrator assigns a role; selecting a role replaces the user's grants with the role defaults, which can then be adjusted.
3. Users can be deactivated and reactivated; the last active Administrator cannot be deactivated.

### Settings

1. A user opens Settings and previews the available system templates.
2. Selecting a template saves the choice to the user's profile through the API and applies it immediately.
3. The choice follows the user across devices; the client store only caches it.
4. System-wide settings (such as session timeout) are visible only to users with `settings:edit` and are audited.

### Access, audit, and notifications

1. Frontend route and action gates are presentation only; the API authorizes every read, write, reveal, print, and export for the authenticated actor and scope.
2. Successful mutations and selected sensitive reads emit audit records with the actor, server time, and opaque resource ID.
3. The notification feed is filtered by scope and module grants and contains no personal names or sensitive notes.
4. Reading or dismissing a notification does not complete the underlying work.

## Quick start

### Requirements

- Node.js 22.23.4 (Node 22 LTS line)
- npm
- Git
- Local MariaDB or MySQL running on the configured `WRMS_DB_HOST` and port
- Two local Redis services (security/session and cache) on the configured ports
- A Google Maps Platform project with the Maps JavaScript API enabled (see Google Maps configuration)

### Install and run

```powershell
npm.cmd install
npm.cmd run db:setup
npm.cmd run dev
```

`npm run db:setup` creates the configured local database if needed and applies pending journaled migrations. It does not reset existing schema and does not seed accounts. Run it on a new machine and after schema changes. `npm run dev` only starts the API and Vite. Run the documented bootstrap before the first sign-in.

Vite prints the local URL when the development server starts. Ordinary development proxies the real API at `VITE_API_PROXY_TARGET` (default `http://127.0.0.1:8080`).

### Local environment

The backend requires MySQL/MariaDB, both Redis services, migrations, and the one-time Administrator bootstrap. Local data comes from the database.

Local development uses one ignored `backend/.env` for the API and Vite. Vite reads the `VITE_` API proxy target; the backend reads its server settings from the same file and serves the public Turnstile site key at `GET /auth/turnstile`. Local setup uses Cloudflare's test site key and secret with `TURNSTILE_LOCAL_TEST_MODE=true`. Production must use real Turnstile keys and keep local test mode off. The local setup script creates missing values without replacing existing ones. Restart Vite and the backend after changing the file. Never prefix private secrets with `VITE_`.

- Local seed accounts and records are synthetic and must never contain real personal data.
- The client calls relative `/api/v1` paths and sends secure session cookies with `credentials: "include"`.

### Google Maps configuration

- `VITE_GOOGLE_MAPS_API_KEY` is the browser key for the Dashboard map and Heat Map. It is public by design, so restrict it by HTTP referrer and to the Maps JavaScript API only. It is the only `VITE_` key that is not the API proxy target.
- Server-side geocoding uses a separate `WRMS_GOOGLE_*` key in `backend/.env`; it is never exposed to the browser.
- Without a key, map screens show a clear unavailable state and the table alternative still works.
- Google's heat layer in the Maps JavaScript API has been deprecated; the layer in use and the reason are tracked in [open questions](docs/open-questions.md).

### Page contracts

The app ships a single page per feature. The `/api/v1` list contracts are paged (`{ items | rows, nextCursor }`) and validated with strict Zod in each module's `service.ts`.

### Session idle timeout

The browser ends an idle session after the configured timeout and warns 60 seconds before signing out. The default is 60 minutes (`sessionTimeoutMinutes` in `src/stores/settings-store.ts`, falling back to `IDLE_TIMEOUT_MS` in `src/components/session/SessionTimeout.tsx`); System maintenance offers 15, 30, 60, and 120 minutes. The API enforces its own session lifetime; the client timer only clears the browser session and cache.
Do not commit `.env` files, credentials, access tokens, production data, or real personal information.

## Commands

```powershell
npm.cmd run dev        # Start the local API and Vite development servers
npm.cmd run typecheck  # TypeScript project check
npm.cmd run lint       # ESLint
npm.cmd test           # Vitest test suite
npm.cmd run build      # TypeScript build and production bundle
npm.cmd run test:e2e   # Playwright end-to-end tests
npm.cmd audit --omit=dev # Production dependency audit
```

Install Playwright's Chromium browser before the first end-to-end run:

```powershell
npx.cmd playwright install chromium
```

Before handing off a material change, run the project checks in this order and stop on the first failure:

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npm.cmd run build
```

## Technology

| Area | Implementation |
| --- | --- |
| Application | React 19, TypeScript 5.9, Vite 6 |
| Routing | React Router 7 |
| Styling | Tailwind CSS 3 and compact UI primitives; system templates swap design-token values |
| Server state | TanStack Query |
| Client state | Zustand for session, appearance, and UI state |
| Forms and validation | React Hook Form and Zod schemas where adopted |
| Tables | TanStack Table |
| Maps | Google Maps JavaScript API through `src/components/maps/` |
| Dates | flatpickr through the shared `DatePicker` primitive (ISO `YYYY-MM-DD` values) |
| Money | `formatCentavos` / `parsePesoToCentavos` / `formatPesoInput` from the shared money helpers |
| API | Fastify, Drizzle ORM, MariaDB/MySQL, and Redis in `backend/` |
| Testing | Vitest, Testing Library, and Playwright |

## Project structure

```text
src/
|-- app/                    # Central router, module metadata, navigation config
|-- components/
|   |-- ui/                 # Reusable UI primitives and compact page building blocks
|   |-- layout/             # Authenticated application shell and navigation
|   |-- privacy/            # Sensitive-data masking and reveal controls
|   `-- maps/               # Shared Google Maps loader, base map, markers, heat layer
|-- config/                 # Brand, compliance, regulatory, and system template configuration
|-- hooks/                  # Application-wide hooks only
|-- lib/                    # API client and framework-independent utilities
|-- modules/<feature>/      # Pages, components, hooks, schemas, services, rules
|-- pages/                  # Application-level error pages
|-- policies/               # Cross-cutting policy definitions
|-- services/               # Truly application-wide services
|-- stores/                 # Session, preferences, and UI stores
|-- types/                  # Application-wide types
`-- main.tsx                # Browser entry point

tests/
|-- unit/                   # Vitest files mirroring the src/ layout
`-- e2e/                    # Playwright browser workflows
```

### Modules

| Module | Folder | Backend routes |
| --- | --- | --- |
| Login and Registration | `src/modules/auth/` | `backend/src/modules/auth/routes.ts` |
| Dashboard | `src/modules/dashboard/` | `backend/src/modules/dashboard/routes.ts` |
| Heat Map | `src/modules/heat-map/` | `backend/src/modules/heat-map/routes.ts` |
| Inventory | `src/modules/inventory/` | `backend/src/modules/inventory/routes.ts` |
| Customers | `src/modules/customers/` | `backend/src/modules/customers/routes.ts` |
| Scheduling | `src/modules/scheduling/` | `backend/src/modules/scheduling/routes.ts` |
| User Management | `src/modules/users/` | `backend/src/modules/users/routes.ts` |
| Settings | `src/modules/settings/` | `backend/src/modules/settings/routes.ts` |

### Component ownership

The project does not use a generic `components/shared` folder.

- Put reusable visual primitives and compact page building blocks in `src/components/ui`.
- Put shell-level components in `src/components/layout`.
- Put sensitive-data masking and reveal controls in `src/components/privacy`.
- Put the shared Google Maps loader and map wrappers in `src/components/maps`; modules never load the Maps script themselves.
- Keep pages, domain components, hooks, schemas, services, handlers, and rules in `src/modules/<feature>`; place their tests under the matching path in `tests/unit/`.
- Prefer a module's `index.ts` public surface for cross-module imports. Some existing pages and handlers still use direct imports.
- Keep API routes for a feature in `backend/src/modules/<feature>/routes.ts`.
- Avoid duplicate components with different names. Extend the existing primitive or domain component when ownership is clear.

## Routing and navigation

`src/app/router.tsx` declares the application routes directly and wraps authenticated routes with `ProtectedRoute`. `src/app/module-registry.ts` contains module metadata; `src/app/navigation.config.ts` provides sidebar grouping and ordering. The registry does not generate routes. Some feature `index.ts` files expose public exports, but route ownership is currently central.

Keep public URLs stable when relocating files. File moves require import updates, not route changes. Static route segments such as `new` must be declared before dynamic segments such as `:id`.

Permissions use the `module:view|add|edit|delete` grant format, matching AGENTS.md.

| Area | Route | Permission |
| --- | --- | --- |
| Dashboard | `/` | `dashboard:view` |
| Heat Map | `/heat-map` | `heatmap:view` |
| Inventory | `/inventory` | `inventory:view` |
| Inventory new | `/inventory/new` | `inventory:add` grant |
| Inventory detail | `/inventory/:id` | `inventory:view` |
| Inventory edit | `/inventory/:id/edit` | `inventory:edit` grant |
| Customers | `/customers` | `customers:view` |
| Customers new | `/customers/new` | `customers:add` grant |
| Customers detail | `/customers/:id` | `customers:view` |
| Customers edit | `/customers/:id/edit` | `customers:edit` grant |
| Scheduling | `/scheduling` | `scheduling:view` |
| Scheduling new | `/scheduling/new` | `scheduling:add` grant |
| Scheduling detail | `/scheduling/:id` | `scheduling:view` |
| Scheduling edit | `/scheduling/:id/edit` | `scheduling:edit` grant |
| Reports | `/reports` | `reports:view` |
| Audit trail | `/audit` | `audit:view` |
| User Management | `/administration/users` | `admin:view` |
| Pending registrations | `/administration/users/pending` | `admin:view` |
| User new | `/administration/users/new` | `admin:add` grant |
| User edit | `/administration/users/:id/edit` | `admin:edit` grant |
| Administration roles | `/administration/roles` | `admin:view` |
| Administration permissions | `/administration/permissions` | `admin:view` |
| System maintenance | `/administration/system-maintenance` | `admin:view` |
| Notifications | `/notifications` | `notifications:view` |
| Settings | `/settings` | `settings:view` |

The public routes are `/login` and `/register`. The authenticated route tree includes a catch-all not-found page; denied access is rendered by `ProtectedRoute` within a protected route, not by a separate `/403` route. Every signed-in user may open `/settings` to choose their own template.

### Adding or moving a route

1. Keep the route page inside its owning module.
2. Add or update the route in `src/app/router.tsx`, including its `ProtectedRoute` permission or grant.
3. Add or adjust module metadata in `src/app/module-registry.ts` when the module catalog changes.
4. Add or adjust its navigation descriptor in `src/app/navigation.config.ts` when it belongs in the sidebar.
5. Gate actions with the correct permission and update links, redirects, breadcrumbs, and tests without changing stable URLs unnecessarily.
6. Confirm direct navigation and browser refresh work for the route in the deployment's SPA fallback configuration.

## UI and layout conventions

All screens use the compact application language defined by the existing UI and layout components.

- Use primitives from `@/components/ui`; do not hand-roll buttons, inputs, dialogs, or common page controls.
- Dates always use the shared flatpickr `DatePicker` (never native `<input type="date">`); it keeps ISO values, supports min/max dates, and portals above dialogs.
- Money inputs use the peso helpers (`parsePesoToCentavos` on blur/submit, `formatPesoInput` for display, `formatCentavos` for totals) with a `₱` prefix.
- Catalog selection uses `SearchableSelect` with code/name labels and sublabels.
- Dialogs use the fixed `Dialog` primitive `Header`/`Body`/`Footer` regions (`bleed` headers, `max-w-2xl`/`max-w-3xl` for wide forms); lifecycle changes reuse the shared `StatusStepperDialog`.
- Use `PageHeader`, cards, filters, tables, modals, alerts, skeletons, and responsive mobile cards consistently.
- Use `h-8` controls, `text-sm` body copy, `text-xs` metadata, and compact table rows.
- Use design tokens such as `bg-primary`, `text-muted-foreground`, `border-border`, `text-success`, and `text-warning`.
- Do not add raw color values in components. System templates work only by redefining these tokens, and every template must keep accessible text contrast.
- Every data screen must provide loading, empty, and error states; map screens also handle a missing key and a failed script load.
- Icon-only controls need an accessible name, visible focus, and keyboard operation.
- Format Philippine currency through the shared money formatter or `Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" })`.
- Dates display app-wide as MM/DD/YYYY via `formatDateNumeric`; storage and pickers stay ISO `YYYY-MM-DD`.
- Lists paginate with the shared `Pagination` component (10/20/50 per page, numbered pages, live Showing X–Y of Z counter, page reset on filter change).
- Preserve usable desktop, tablet, and mobile layouts when updating a screen.

## Data and API flow

Application API requests use `src/lib/api-client.ts` and the relative `/api/v1` base path. Feature services parse responses with Zod; `apiRequest()` parses a response when given a schema.

```text
Page
  -> feature hook
  -> feature service
  -> apiRequest()
  -> /api/v1
  -> Zod response parsing where supplied by the feature
```

- TanStack Query owns API-backed state and cache invalidation.
- Feature services validate API responses with Zod where a contract exists.
- Administration user responses and create/update requests include an explicit `grants` array of `module:view|add|edit|delete` values. Roles carry default grants: selecting a role in the user editor replaces that user's grants with the role defaults, and saving a role can apply its defaults to assigned users.
- `/administration/permissions` is a read-only matrix of the same API-backed role defaults used by the Roles editor, including custom roles. Reads require both `admin:view` and `admin:edit` and the authenticated scope at the API boundary. Production must independently authorize and audit permission changes.
- The API records successful Add, Edit, Delete, and Transaction operations with the authenticated actor, server time, and opaque resource ID. Existing sensitive reads, print actions, and exports remain Access events. Actionable notifications are served by `/api/v1/notifications` and filtered for the current scope and module grants. Notification text contains no personal names or sensitive notes. Production must emit immutable audit events and scoped notifications on the server.
- Mutations send the current resource version where the contract requires optimistic concurrency.
- A `401` emits a session-expired event and the client rejects the request. This frontend does not implement an automatic refresh request.
- Connectivity failures produce a connection error; they do not by themselves clear the session.
- Search terms containing personal data belong in request bodies, never URLs.
- Records use lifecycle actions such as archive and restore instead of hard deletion.

### Module notes

#### Login and Registration

- Route and API: `/login`, `/register`, and `backend/src/modules/auth/routes.ts`.
- Rules: Public routes with no grant. Turnstile and rate limiting on sign-in and registration. Self-registered accounts are inactive with no grants until an Administrator approves them. Responses never reveal whether an email or username exists. Passwords are hashed server-side and never logged.
- Audit events: `AUTH_REGISTER`, `AUTH_APPROVE`, `AUTH_LOGIN`, `AUTH_LOGIN_FAILED`, `AUTH_LOGOUT`.

#### Dashboard

- Route and API: `/` and `backend/src/modules/dashboard/routes.ts`.
- Rules: Read-only. Sales, client count, client location statistics, and inventory count are computed by the API, not in the browser. Map pins are masked or generalized by default; exact location and name reveals are permissioned and audited.
- Audit events: `DASHBOARD_EXPORT`, plus Access events for reveals.

#### Heat Map

- Route and API: `/heat-map` and `backend/src/modules/heat-map/routes.ts`.
- Rules: Read-only. The API returns aggregated, bucketed points with counts, never individual coordinates or names. Filters that could identify a person go in request bodies. A table alternative mirrors the map data.
- Audit events: `HEATMAP_EXPORT`, plus Access events for detailed views.

#### Inventory

- Route and API: `/inventory` and `backend/src/modules/inventory/routes.ts`.
- Rules: Gallon counts by state (full, empty, with customer, damaged). Quantities change only through immutable stock movements (in, out, return, adjust) with a reason. Stock cannot go negative; stale versions return `409`.
- Audit events: `INVENTORY_CREATE`, `INVENTORY_UPDATE`, `INVENTORY_DELETE`, `INVENTORY_EXPORT`.

#### Customers

- Route and API: `/customers` and `backend/src/modules/customers/routes.ts`.
- Rules: Name, contact, address, and coordinates are sensitive and masked by default; reveal is permissioned, auto-remasks, and is audited. Coordinates come from server-side geocoding or a validated map pin. Records are archived and restored, not deleted.
- Audit events: `CUSTOMER_CREATE`, `CUSTOMER_UPDATE`, `CUSTOMER_DELETE`, `CUSTOMER_EXPORT`.

#### Scheduling

- Route and API: `/scheduling` and `backend/src/modules/scheduling/routes.ts`.
- Rules: One-time or recurring refill and delivery schedules with an assigned staff member, in Asia/Manila time. Lifecycle is Scheduled, Out for delivery, Completed, Cancelled. Completing a schedule posts the stock movement and the sale in one server transaction; cancelling is allowed only before completion.
- Audit events: `SCHEDULE_CREATE`, `SCHEDULE_UPDATE`, `SCHEDULE_DELETE`, `SCHEDULE_EXPORT`.

#### User Management

- Route and API: `/administration/users` and `backend/src/modules/users/routes.ts`.
- Rules: Requires the `admin:*` grants described in Security and sensitive-data rules. Approves or rejects pending registrations. A user cannot raise their own grants or deactivate the last active Administrator.
- Audit events: `USER_CREATE`, `USER_UPDATE`, `USER_DELETE`, `USER_EXPORT`.

#### Settings

- Route and API: `/settings` and `backend/src/modules/settings/routes.ts`.
- Rules: Any signed-in user may read and change their own template. Templates are named presets in `src/config/` that only swap design-token values. The choice is stored per user through the API and cached in the client preferences store; it contains no sensitive data. System-wide settings require `settings:edit`.
- Audit events: `SETTINGS_UPDATE`.

## Security and sensitive-data rules

Frontend permission checks improve the user experience. The API remains the security boundary.

- Never store access tokens or sensitive personal data in `localStorage`, `sessionStorage`, persisted Zustand state, or JavaScript-readable cookies.
- Never put names, birth dates, contact numbers, addresses, coordinates, identifiers, or other sensitive personal data in URLs, logs, analytics, toasts, errors, or snapshots.
- Mask sensitive values by default and audit sensitive reads and writes using opaque identifiers only.
- Gate routes with the route permission components and gate actions with the permission hooks/components.
- Destructive, financial, export, and signature actions require confirmation and an audit event.
- Validate form input and API responses with Zod.
- Do not use `dangerouslySetInnerHTML`.
- Use only synthetic records in mocks, fixtures, documentation, and tests.

The production server must independently enforce permissions, scope, CSRF protection, session expiry and revocation, validation, safe error responses, immutable audit events, and secure file access.

For Administration user, role, department, and permission management, the API must resolve the authenticated user from the session and require both `admin:view` and `admin:edit` for reads, `admin:add` for user and role creation, `admin:edit` for user updates, and `admin:delete` for deactivation/reactivation. The API resolves the actor from the session, never from request headers.

Customer names, contact details, and locations are personal data. If the PH Data Privacy Act (RA 10173) is in scope, flag anything unclear for compliance review instead of guessing.

## Testing

Keep tests under `tests/unit/` in paths mirroring `src/`, and browser tests under `tests/e2e/`. Use only synthetic data.

- Unit tests cover schemas, permissions, lifecycle rules, formatting, and pure utilities.
- Component tests cover important forms, filtering, data masking, permission states, and responsive interactions. Map components are tested with the Maps wrapper mocked, including the load-failure state.
- Playwright covers critical workflows such as login and registration approval, Customers, Inventory, and Scheduling flows, and selecting a system template in Settings.
- Add a regression test when changing route resolution, redirects, permissions, or data ownership.
- Required regression cases: stock never goes negative; completing a schedule posts exactly one stock movement and one sale; pending registrations cannot sign in; heat map responses contain no individual coordinates; every system template renders without raw color values.

## Development and operations processes

### Local setup

1. Install Node.js 22.23.4, npm, Git, MariaDB/MySQL, and both Redis services.
2. Run `npm.cmd install`, then `npm.cmd run db:setup`.
3. Follow [BACKEND.md](BACKEND.md) to supply the one-time `WRMS_BOOTSTRAP_*` values and run the backend bootstrap against an empty database.
4. Add the Google Maps keys described above to `backend/.env`.
5. Run `npm.cmd run dev` from the repository root to start the API and Vite.
6. Never seed synthetic or demo records into a production database.

### Change verification

1. Run `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd test`, then `npm.cmd run build`; stop at the first failure.
2. Run relevant Playwright flows for interactive changes.
3. In `backend/`, run `npm.cmd ci`, `npm.cmd run typecheck`, `npm.cmd run build`, then `npm.cmd test`.
4. Send authentication, registration, permission, export, signature, location, and sensitive-data changes through `water-refilling-system-sensitive-change` review.
5. Report local checks, browser checks, and live state separately.

### CI and deployment

1. CI runs on code-affecting pushes to `staging` and manual dispatch: frontend checks, sharded unit tests, backend build and tests, Compose validation, and a production image build.
2. The image must report MySQL up and the baked revision equal to the commit at `/health/ready`.
3. Only passing images are pushed to GHCR with a `sha-<commit>` tag; `:staging` is promoted after the deploy gate passes.
4. Deployment pins Coolify to the SHA tag and waits for the public readiness endpoint to report the exact commit.
5. Apply migrations in an approved window and keep them backward-compatible. An image rollback never reverses a migration; restore from backup if a migration must be undone.

### Backup and restore

1. The recommended schedule is the one-shot `deploy/coolify/backup` task at 02:00 Asia/Manila; the maintenance-window `scheduled-backup.sh` remains an alternative.
2. Backups take a live single-transaction database snapshot, archive the encrypted private-file volume, encrypt with age, upload, and compare a downloaded copy.
3. Configure an off-VPS rclone destination, age recipient, external dead-man monitoring, and retention; remote deletion is not automated.
4. Restore only into isolated MySQL and private-file volumes with the matching keys, then verify schema and representative record/file reads.
5. A recorded backup is not proof of a usable restore; production approval requires a successful offsite restore drill.

## Production hosting

The client expects same-origin `/api/v1` access unless the hosting layer proxies that path to the API. A production server must issue secure HTTP-only session cookies and enforce CSRF protection.

Configure the web server so application routes fall back to `index.html`, while `/api/*` is handled by the API proxy and never by the SPA fallback. Verify direct loading and browser refresh for nested routes such as `/customers/:id`.

### Vercel

A full-stack Vercel deployment uses one project:

- The Vite build is served as static output from `dist`.
- `api/index.ts` is a Node function that hands `/api/*` requests to the same Fastify app the local server uses. It imports the compiled backend from `backend/dist`, so the build runs both TypeScript builds. `vercel.json` rewrites `/api/*` to this function and routes every other path to `index.html`.
- A single function is used instead of a catch-all route file because plain Vercel Functions treat `[...name]` as one path segment, not as a catch-all. The rewrite keeps the Fastify routes unchanged.
- MySQL/MariaDB and Redis are external. Vercel does not provide them. Set `WRMS_DB_*`, `WRMS_REDIS_SESSION_URL`, `WRMS_TURNSTILE_*`, and optionally `WRMS_GOOGLE_GEOCODE_KEY` in the Vercel project.
- `WRMS_DB_SSL=true` enables TLS for hosted MySQL providers such as TiDB Cloud or Aiven. Use `WRMS_DB_CONNECTION_LIMIT=5` or similar on serverless hosts to stay inside provider limits.
- `WRMS_REDIS_SESSION_URL` must point at a networked Redis (for example Upstash) so sessions survive across function instances. Without it the API falls back to per-instance memory, which loses sessions.
- Run `npm run db:setup` once against the hosted database, then run the Administrator bootstrap locally with the same `WRMS_DB_*` values.
- `NODE_ENV=production` is required so session cookies are marked `secure`.
- Vercel Functions run in a region you choose. Keep the function region close to the database and Redis to reduce latency.

## Repository guidance

- [AGENTS.md](./AGENTS.md) contains shared WRMS coding, privacy, and verification instructions.
- [water-refilling-system-sensitive-change](./.agents/skills/water-refilling-system-sensitive-change/SKILL.md) provides focused guidance for sensitive changes.
- [CLAUDE.md](./CLAUDE.md) imports AGENTS.md for Claude Code. Claude Code skills ([water-refilling-system-codemap](./.claude/skills/water-refilling-system-codemap/SKILL.md), [water-refilling-system-verify](./.claude/skills/water-refilling-system-verify/SKILL.md), [water-refilling-system-sensitive-change](./.claude/skills/water-refilling-system-sensitive-change/SKILL.md)) and agents ([water-refilling-system-locator](./.claude/agents/water-refilling-system-locator.md), [water-refilling-system-verifier](./.claude/agents/water-refilling-system-verifier.md), [water-refilling-system-coder](./.claude/agents/water-refilling-system-coder.md), [water-refilling-system-code-reviewer](./.claude/agents/water-refilling-system-code-reviewer.md), [water-refilling-system-sensitive-reviewer](./.claude/agents/water-refilling-system-sensitive-reviewer.md)) keep searches and check output small and route coding and review to cheaper models; see the model routing table in CLAUDE.md.
- [Path-scoped rules](./.claude/rules) load only for matching files, and [hooks](./.claude/hooks) wired in [.claude/settings.json](./.claude/settings.json) block secret access, destructive git/database commands, and generated-file edits, ask before commits and deploys, and scan and lint each edit (summary in CLAUDE.md).
- Project reviewer profiles are also available for [Codex](./.codex/agents/water-refilling-system-sensitive-reviewer.toml) and [Antigravity](./.agents/agents/water-refilling-system-sensitive-reviewer.md).

## License

Internal and proprietary. Update this section if the distribution model changes.
