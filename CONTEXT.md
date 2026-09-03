# CONTEXT

Orientation for anyone — human or agent — about to add a feature here. Read this before
exploring; it is the map that stops each session re-deriving the same facts.

## What this repo is

A **scaffold**, not a product. Two independent apps in one repo, no root `package.json`:

| Folder      | Stack                                 | Dev port |
| ----------- | ------------------------------------- | -------- |
| `backend/`  | Express 5 + Drizzle (PostgreSQL) + Jest | `4000` |
| `frontend/` | Next.js (App Router) + Tailwind 4      | `3000` |

`./dev.sh` starts a throwaway `postgres:16-alpine` container, applies migrations, then
runs both apps. Node is pinned per app via `.nvmrc` (`v26.8.1`); run `nvm use` in each.

There is exactly **one worked vertical slice** — the `foo` entity — wired from a
Postgres table through Express to a React table. Every new feature is built by copying
it. The value of this document is the shape of that slice and where it is easy to get
it wrong.

## Glossary

Use these terms verbatim; don't drift to synonyms.

- **Slice** — one entity's full path across all seven layers below. The unit of feature work.
- **Model** — a Drizzle `pgTable` definition in `backend/src/database/models/`.
- **Schema barrel** — `backend/src/database/schema.ts`, which re-exports every model.
- **DAL** — data access layer, `backend/src/database/dal/`. The only code that touches `db`.
- **Route** — an Express router in `backend/src/api/`, mounted under `/api`.
- **Server action** — a `'use server'` module in `frontend/src/server-actions/`; the
  frontend's only path to the backend.
- **Result union** — the `{ ok: true, ... } | { ok: false, message: string }` shape every
  server action returns instead of throwing.
- **Heartbeat** — the `SELECT 1` liveness probe behind `/health-check`.

## Layer map

Request path, traced once:

```
browser → server action (Next server) → Express route → DAL → Drizzle → Postgres
```

The seven files a slice touches, in the order you create them:

| # | Layer         | `foo` reference                        | Role |
| - | ------------- | -------------------------------------- | ---- |
| 1 | Model         | `backend/src/database/models/foo.ts`   | `pgTable` + `$inferInsert` type export |
| 2 | Schema barrel | `backend/src/database/schema.ts`       | `export * from './models/foo'` |
| 3 | DAL           | `backend/src/database/dal/foo.ts`      | Query functions; sole importer of `db` |
| 4 | Route         | `backend/src/api/foo.ts`               | Router, validation, status codes |
| 5 | Router mount  | `backend/src/api/router.ts`            | `router.use('/foo', foo)` |
| 6 | Server action | `frontend/src/server-actions/foo.ts`   | `fetch` to `BACKEND_URL`, returns a result union |
| 7 | Component     | `frontend/src/components/FooTable.tsx` | `'use client'`, consumes the server action |

`backend/src/database/db.ts` builds the pool and the Drizzle `db` from `DATABASE_*` env
vars at import time. `backend/src/app.ts` holds `/health-check`, the 404 fallback, and
the error handler.

## Adding a new entity

1. Write the model in `backend/src/database/models/<entity>.ts` — copy `models/foo.ts`.
2. **Re-export it from `backend/src/database/schema.ts`.** Not optional: `drizzle.config.ts`
   points `schema` at that one file, so an unlisted model is invisible to `db:generate`
   and produces **no migration, with no error**. This is the most common way to lose an hour.
3. `cd backend && npm run db:generate` — migrations are generated, never hand-written.
4. `npm run db:migrate` to apply. `dev.sh` migrates on every start because the container
   is created fresh (`docker run --rm`) and is empty each run.
5. Add `backend/src/database/dal/<entity>.ts`. Reuse the shapes in `dal/foo.ts`
   (`create`, `findALL`); `dal/heartbeat.ts` is the minimal raw-SQL example.
6. Add `backend/src/api/<entity>.ts` and mount it in `backend/src/api/router.ts`.
7. Add specs in `backend/test/` (see below), then the server action and component.

## Testing

Backend only — **the frontend has no test runner configured at all.** Whether to add one
is an open decision.

- **Real Postgres, no mocks.** `backend/test-environment.ts` is a custom Jest environment
  that starts a Testcontainers `postgres:16-alpine`, runs the real migrations against it,
  and injects `DATABASE_*` into the environment before the test module imports anything.
- **One container per spec file.** Isolated, but slow — budget for container startup per file.
- **`testMatch` is `<rootDir>/test/*` — flat.** A spec in `test/some-dir/` **will not run**
  and will not warn. New specs go directly in `backend/test/`.
- **Supertest against the app**, per `CLAUDE.md`. `backend/test/test-foo-create.spec.ts` is
  the reference: happy path, persistence check, `it.each` validation table, ordering assertion.
- **Pool teardown is global.** `after-env-setup.ts` closes the pool in `afterAll`; specs
  don't manage it.

- **Run it under the pinned Node.** The suite needs Node >= 26 and Docker running. If the
  shell's default `node` is older, `npm install` fails and `npm test` reports
  `jest: command not found` — a misleading error with an unrelated cause. Run `nvm use`
  first (`.nvmrc` pins `v26.8.1`). Worktrees start without `node_modules`.

```bash
cd backend && nvm use && npm install && npm test
```

## Conventions that bite

- **The browser never calls Express.** Everything goes through `frontend/src/server-actions/`,
  which keeps `BACKEND_URL` server-side. That is why this repo has **no CORS configuration
  anywhere** — a client-side `fetch` to port 4000 would silently require it.
- **Server actions return result unions, they don't throw.** Components render the failure
  branch; nothing uses error boundaries. See `ListFoosResult` / `CreateFooResult`.
- **The DAL is the only module that imports `db`.** Routes import the DAL.
- **Deterministic ordering.** `findALL` sorts `created_at DESC, id DESC`. The `id` tiebreak
  is deliberate — rows sharing a timestamp would otherwise shuffle between queries, and the
  tests assert on the order.
- **Pinned `Intl` formatting.** `FooTable.tsx` pins locale *and* timezone so server and
  client render identical text. Defaulting either causes a hydration mismatch. Any new date
  rendering must do the same.
- **Every export from a `'use server'` module is a public endpoint.** Don't export helpers
  from `frontend/src/server-actions/`.
- **Request bodies are typed `any`, then validated at runtime.** `CLAUDE.md` prescribes this:
  the compile-time type is a lie about untrusted input, so `CreateFooBody.name` is `any` and
  `backend/src/api/foo.ts` hand-checks it. Copy that shape; don't "fix" it to a strict type.
  The no-`any` rule applies to component props, not request bodies.
- **Env is loaded by the first import in `backend/src/index.ts`.** `import 'dotenv/config'`
  sits above `./app` on purpose: `app.ts` transitively imports `database/db.ts`, which reads
  `DATABASE_*` and builds the pool **at import time**. Any `dotenv.config()` call in the
  module body runs too late to matter. New env vars must be read after that import, not
  before.
- **Backend defaults to port 4000, frontend to 3000.** `PORT` falls back to 4000 in
  `index.ts`, matching `.env.example`, `dev.sh` and the READMEs. Don't reintroduce a 3000
  fallback — with no `.env` present it makes the backend race Next for the same port.
- **Filenames: PascalCase for React components, kebab-case everywhere else.**
  `FooTable.tsx` and `HelloWorldDashboard.tsx` against `test-environment.ts`,
  `health-check.ts`. Follow the local convention of the directory you're adding to.

## Seams not yet established

The first feature that needs one of these decides its shape:

- **No service layer.** `CLAUDE.md` refers to unit-testing "complicated business logic in
  services", but `backend/src/services/` does not exist. Logic currently sits in the route.
- **No auth, sessions, or users.** Middleware is `express.json()` and `morgan` only.
- **No validation library.** `backend/src/api/foo.ts` hand-rolls its checks.
- **No CI.** No `.github/`. `npm test`, `npm run typecheck`, and `npm run format:check`
  are manual, per app. All three are currently green in both apps, so they are usable as a
  gate as-is — wiring them up needs no cleanup first.
- **No `.artifacts/` and no `docs/adr/`**, though `docs/agents/` describes both. Created on
  first use.

## Known drift

Recorded so sessions stop rediscovering it. Not currently scheduled for a fix.

- The `BACKEND_URL` fallback `?? 'http://localhost:4000'` is duplicated across both files
  in `frontend/src/server-actions/`.
- The error handler in `backend/src/app.ts` returns `err.stack` in the 500 response body.
  **Deliberate** — this is a scaffold, and the traces are useful while wiring up a slice.
  It is the one thing here that must not survive into anything public-facing.
