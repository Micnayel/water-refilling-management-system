# Project: Water Refilling Management System

## Overview

The Water Refilling Management System (WRMS) is a web application for a water refilling station. Staff use it to manage customers and their locations, track gallon inventory, schedule refills and deliveries, monitor sales, and see where demand comes from on Google Maps. Administrators manage users and permissions. Each signed-in user can also choose the system template (appearance) they prefer.

Modules: Login and Registration, Dashboard, Heat Map, Inventory, Customers, Scheduling, User Management, and Settings.

Read these first; they are the source of truth and this file must not contradict them:

- [README.md](./README.md) for the frontend, routes, UI conventions, and operations.
- [BACKEND.md](./BACKEND.md) for the API, authentication, authorization, audit, and migrations.
- [docs/open-questions.md](./docs/open-questions.md) for unsettled policies. Record new unknowns there instead of guessing.

## Stack

- Frontend: React 19, TypeScript 5.9, Vite 6, React Router 7, Tailwind CSS 3, shadcn-style compact primitives
- State and data: TanStack Query (server state), Zustand (session, appearance, UI), TanStack Table
- Forms and validation: React Hook Form and Zod
- Maps: Google Maps JavaScript API (dashboard map and heat map) with a heat layer that is supported by the current Maps version; see the Maps rules below
- Backend: Fastify, Drizzle ORM (in `backend/`)
- Database: MariaDB or MySQL; two Redis services (security/session and cache)
- Testing: Vitest, Testing Library, Playwright
- Package manager: npm (use `npm.cmd` on Windows PowerShell)

## Commands

Run from the repository root unless noted.

- Install: `npm.cmd install`
- Database setup: `npm.cmd run db:setup` (creates the database, applies pending migrations, seeds nothing)
- Dev (API and Vite): `npm.cmd run dev`
- Typecheck: `npm.cmd run typecheck`
- Lint: `npm.cmd run lint`
- Test: `npm.cmd test`
- Build: `npm.cmd run build`
- End-to-end: `npm.cmd run test:e2e`
- Dependency audit: `npm.cmd audit --omit=dev`

Backend, from `backend/`: `npm.cmd ci`, `npm.cmd run typecheck`, `npm.cmd run build`, `npm.cmd test`.

Before saying a task is done, run `typecheck`, `lint`, `test`, then `build`, in that order, and stop at the first failure. Run relevant Playwright flows for interactive changes. Report local checks, browser checks, and live state separately.

## Structure

- `src/app/` — `router.tsx` (routes), `module-registry.ts` (module metadata), `navigation.config.ts` (sidebar)
- `src/modules/<feature>/` — one folder per module: pages, components, hooks, schemas, services, rules, `index.ts`
- `src/components/ui/` — reusable primitives and compact page building blocks
- `src/components/layout/` — authenticated shell and navigation
- `src/components/privacy/` — sensitive-data masking and reveal controls
- `src/components/maps/` — shared Google Maps loader, base map, marker, and heat layer wrappers
- `src/config/` — brand, compliance, regulatory, and system template (theme preset) configuration
- `src/hooks/` — application-wide hooks only
- `src/lib/` — `api-client.ts` and framework-independent utilities
- `src/stores/` — session, preferences, and UI stores
- `src/policies/`, `src/services/`, `src/types/`, `src/pages/` — cross-cutting policies, app-wide services and types, error pages
- `backend/src/modules/<feature>/routes.ts` — API routes for each feature
- `tests/unit/` mirrors `src/`; `tests/e2e/` holds Playwright flows

There is no generic `components/shared` folder. Extend the matching `ui`, `layout`, `privacy`, or `maps` component, or the owning module, instead of creating duplicates.

### Modules

| Module | Frontend | Backend | Permission key |
| --- | --- | --- | --- |
| Login and Registration | `src/modules/auth/` | `backend/src/modules/auth/` | none (public routes; no grant) |
| Dashboard | `src/modules/dashboard/` | `backend/src/modules/dashboard/` | `dashboard` |
| Heat Map | `src/modules/heat-map/` | `backend/src/modules/heat-map/` | `heatmap` |
| Inventory | `src/modules/inventory/` | `backend/src/modules/inventory/` | `inventory` |
| Customers | `src/modules/customers/` | `backend/src/modules/customers/` | `customers` |
| Scheduling | `src/modules/scheduling/` | `backend/src/modules/scheduling/` | `scheduling` |
| User Management | `src/modules/users/` | `backend/src/modules/users/` | `admin` |
| Settings | `src/modules/settings/` | `backend/src/modules/settings/` | `settings` |

### Module rules

- **Login and Registration**: Sign-in uses an HTTP-only session cookie, CSRF protection, Turnstile, and rate limiting. Self-registration creates an account that is inactive and has no grants until an Administrator approves it. Never reveal whether an email or username exists. Passwords are hashed server-side and never logged.
- **Dashboard**: Read-only. Shows a customer location map, sales, client count, client location statistics, and inventory count. All figures come from `/api/v1`, never computed from raw records in the browser. Map pins are masked or generalized by default; exact positions and names need a permissioned, audited reveal.
- **Heat Map**: Read-only. The API returns aggregated, bucketed points (for example by grid cell or barangay with a count), never individual customer coordinates or names. Filters (date range, area, metric) go in request bodies when they could identify a person.
- **Inventory**: Tracks gallons by state (for example full, empty, with customer, damaged). Quantities change only through immutable stock movements (in, out, return, adjust), each with a reason. Stock can never go negative; stale versions return `409`.
- **Customers**: Holds name, contact, address, and coordinates, all sensitive. Mask by default; reveal is permissioned, auto-remasks, and is audited. Coordinates come from a server-side geocode or a validated map pin, never from free text. Records are archived and restored, not deleted.
- **Scheduling**: Refill and delivery schedules (one-time or recurring) with an assigned staff member, using `DatePicker` and `StatusStepperDialog`. Lifecycle: Scheduled, Out for delivery, Completed, Cancelled. Completing a schedule posts the stock movement and the sale in one server transaction; cancelling is allowed only before completion.
- **User Management**: Create, edit, deactivate, and reactivate users; assign roles and `module:view|add|edit|delete` grants; approve or reject pending registrations. Requires `admin:*` grants as described in BACKEND.md. A user cannot raise their own grants or deactivate the last Administrator.
- **Settings**: Each user picks a system template (a named theme preset such as colors, density, and font scale). Templates only swap design-token values; no component may hardcode a template. The choice is saved per user through the API, with the client store as a cache. Non-sensitive preferences are the only thing this module stores. System-wide settings (for example session timeout) need `settings:edit` and are audited.

## Code rules

- TypeScript strict; no `any` unless justified in a comment.
- Small components and functions; one responsibility each.
- Follow existing patterns before inventing new ones.
- Prefer a module's `index.ts` public surface for cross-module imports; never reach into another module's internals.
- Share through `components/ui`, `lib`, or an application-wide hook; never copy code between modules.
- Forms: React Hook Form and Zod. Lists: TanStack Table with the shared `Pagination` component.
- API calls go through `src/lib/api-client.ts` and feature services that parse responses with Zod: Page, feature hook, feature service, `apiRequest()`, `/api/v1`.
- Dates use the shared flatpickr `DatePicker` (ISO `YYYY-MM-DD` in storage and API, MM/DD/YYYY on screen); never native `<input type="date">`. Times and schedules use Asia/Manila.
- Money uses the shared peso helpers (`formatCentavos`, `parsePesoToCentavos`, `formatPesoInput`) with a `₱` prefix.
- Use `SearchableSelect` for catalog selection and the shared `Dialog` and `StatusStepperDialog` for dialogs and lifecycle changes.
- Records use lifecycle actions such as archive and restore, not hard deletion.
- No new dependencies without asking. Pre-approved: the Google Maps loader package and, if the Maps heat layer is unavailable, a WebGL heat layer library for use as a Maps overlay.

## Maps rules

- All map code lives in `src/components/maps/`; modules use those wrappers and never load the Maps script themselves.
- The browser Maps key is `VITE_GOOGLE_MAPS_API_KEY`. It is a public, restricted key by design: restrict it by HTTP referrer and to the Maps JavaScript API only. It is the only non-proxy `VITE_` key allowed.
- Geocoding and any other server-side Google call use a separate unrestricted-by-referrer server key kept in `backend/.env` as `WRMS_GOOGLE_*`, never exposed to the browser.
- Handle missing key, failed script load, quota errors, and no-data cases with visible states.
- Google's heat layer in the Maps JavaScript API has been deprecated. Confirm the layer in use is supported by the current Maps version before building on it, and log the decision in `docs/open-questions.md`.
- Never put coordinates, addresses, or customer names in URLs, logs, analytics, or error messages.
- Maps must work with keyboard focus, offer a non-map list or table alternative for the same data, and stay usable on mobile.

## Routing rules

- Declare routes only in `src/app/router.tsx` and wrap authenticated routes with `ProtectedRoute` and its permission or grant. Login and Registration are the only public routes.
- Update `module-registry.ts` and `navigation.config.ts` when the module catalog or sidebar changes.
- Keep public URLs stable when moving files. Declare static segments such as `new` before dynamic segments such as `:id`.
- Confirm direct navigation and browser refresh work for new routes.

## Compact UI rules

- Controls `h-8 text-sm`; body copy `text-sm`; metadata `text-xs`; compact table rows; card padding `p-3`; spacing `gap-3`; icons `size-4`.
- Use design tokens (`bg-primary`, `text-muted-foreground`, `border-border`, `text-success`, `text-warning`); never raw color values in components. System templates work by redefining these tokens.
- Edit `components/ui/*` instead of repeating utility classes.
- Use `PageHeader`, cards, filters, tables, modals, alerts, skeletons, and responsive mobile cards consistently.
- Every data screen needs loading, empty, and error states.
- Icon-only controls need an accessible name, visible focus, and keyboard operation.
- Keep usable desktop, tablet, and mobile layouts. Every template must keep text contrast accessible.

## Security and privacy

The frontend improves the user experience; the API is the security boundary (see BACKEND.md).

- Never read or edit `.env*`; never commit secrets, credentials, tokens, or production data.
- Never prefix private secrets with `VITE_` (the public Maps browser key is the one documented exception).
- No tokens or sensitive personal data in `localStorage`, `sessionStorage`, persisted Zustand state, or JavaScript-readable cookies. Auth is an HTTP-only session cookie with CSRF protection. The selected template name is non-sensitive and may be persisted.
- No names, birth dates, contact numbers, addresses, coordinates, identifiers, or other sensitive personal data in URLs, logs, analytics, toasts, errors, or snapshots. Search terms containing personal data go in request bodies.
- No `dangerouslySetInnerHTML`; no `console.log` of user or sensitive data.
- Frontend permission checks are UX only; the API must enforce the same rules for every read, write, reveal, print, and export.
- Grants use `module:view|add|edit|delete`. Gate routes with the route permission components and actions with the permission hooks.
- Mask sensitive fields by default; reveal is permissioned, remasks automatically, and is audited.
- Destructive, financial, export, and signature actions need confirmation and an audit event.
- Audit events use opaque IDs only. Every create, update, delete, and export emits the module's event: `AUTH_*` (register, approve, login, logout, failed login), `INVENTORY_CREATE|UPDATE|DELETE|EXPORT`, `CUSTOMER_CREATE|UPDATE|DELETE|EXPORT`, `SCHEDULE_CREATE|UPDATE|DELETE|EXPORT`, `USER_CREATE|UPDATE|DELETE|EXPORT`, and `SETTINGS_UPDATE`. Read-only modules (`DASHBOARD`, `HEATMAP`) emit `_EXPORT` and Access events only. Sensitive reads, reveals, and prints emit Access events.
- Use only synthetic records in mocks, fixtures, docs, and tests. Never seed demo data into production.
- Customer names, contact details, and locations are personal data. If personal data is in scope (for example PH Data Privacy Act, RA 10173), flag anything unclear for compliance review instead of guessing.
- Send authentication, registration, permission, export, signature, location, and sensitive-data changes through `water-refilling-system-sensitive-change` review.

## Backend rules

- One `routes.ts`, service, and schema per feature under `backend/src/modules/<feature>/`; business rules live in the service layer.
- Every route declares its required grant and validates body, query, and params with strict Zod schemas.
- The actor always comes from the session, never from headers or request bodies.
- Mutations accept the current resource version where optimistic concurrency applies and return `409` on a stale version.
- Schema changes go through Drizzle journaled migrations only; never edit an already-applied migration or the database by hand.
- Errors are safe: no stack traces, SQL, secrets, names, or identifiers.
- Dashboard and heat map endpoints aggregate in the database or service layer and return only the minimum needed; they never return raw customer rows.

## Testing

- Vitest and Testing Library under `tests/unit/`, mirroring `src/`; Playwright under `tests/e2e/`; backend tests under `backend/tests/`.
- Cover the happy path, validation, permission denied, empty, loading, and error states.
- Backend routes: unauthenticated, missing grant, out of scope, invalid input, success, and the expected audit event.
- Component tests cover forms, filtering, data masking, and permission states. Map components are tested with the Maps wrapper mocked, including the load-failure state.
- Add a regression test when changing route resolution, redirects, permissions, or data ownership.
- Required regression cases: stock never goes negative, completing a schedule posts exactly one movement and one sale, pending registrations cannot sign in, heat map responses contain no individual coordinates, and each system template renders without raw colors.
- A new module includes its tests.

## Git

- Branches `feat/…`, `fix/…`; Conventional Commits.
- Never force-push or commit directly to `main`.
- CI runs on pushes to `staging` and manual dispatch; do not deploy or push images without approval.

## Definition of done (per module)

- [ ] Route added in `src/app/router.tsx` with its permission; registered in `module-registry.ts` and `navigation.config.ts`
- [ ] Backend `routes.ts` with declared grants, Zod validation, and scope checks
- [ ] Screens follow compact rules with loading, empty, and error states
- [ ] Forms validated with Zod; API responses parsed with Zod
- [ ] Audit events added and documented in BACKEND.md
- [ ] Sensitive fields masked and reveal audited
- [ ] README.md routes table, module table, and process steps updated
- [ ] Unit, component, backend, and relevant Playwright tests written
- [ ] Typecheck, lint, tests, and build pass in the required order
- [ ] No secrets, debug logs, or unused code

## Do not touch

- `.env*`, lockfiles (unless asked), generated files, already-applied migrations
- Production databases and deploy configuration without explicit approval

## Agents, commands, skills available

- Agents: `water-refilling-system-locator`, `water-refilling-system-verifier`, `water-refilling-system-coder`, `water-refilling-system-code-reviewer`, `water-refilling-system-sensitive-reviewer`
- Commands: `/new-module <name>`, `/review`
- Skills: `water-refilling-system-codemap`, `water-refilling-system-verify`, `water-refilling-system-sensitive-change`
- Claude Code imports this file through [CLAUDE.md](./CLAUDE.md); keep model routing and hook summaries there, not here.
