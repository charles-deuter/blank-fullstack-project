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

Two slices exist. The `foo` entity is the **reference slice**, wired from a Postgres
table through Express to a React table; new features are built by copying it. The
**wallets and transfers** slice is backend-only — no server action, no component — and
is where the money rules live. The value of this document is the shape of those slices
and where it is easy to get them wrong.

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
- **Executor** — a `db` handle or an open `tx` handle. DAL functions take one so they
  can run inside a caller's transaction.

Payments language:

- **Wallet** — a stored balance and a display name. A wallet *is* the account holder;
  there is no separate person behind it. _Avoid_: account, user.
- **Transfer** — moving money from one wallet to another. It happens whole or not at
  all. _Avoid_: payment, send.
- **Ledger** — the `transactions` table. A row exists only where money actually moved;
  there is no status column and nothing to filter out.
- **Transaction error** — a recorded rejected transfer attempt, in `transaction_errors`.
  Never served over HTTP. _Avoid_: failed transaction, which implies a ledger row.
- **Cents** — money is integer cents everywhere (`balance_cents`, `amount_cents`).
  Dollars exist only in display. _Avoid_: an unqualified `amount` or `balance`.

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
- **The DAL owns `db`, with one documented exception.** Routes normally import only the
  DAL. `api/transaction.ts` imports `db` directly, because a transfer holds a row lock
  across read, check and write, so the transaction boundary has to sit with the logic.
  DAL functions take an optional **Executor** and default to `db`. See `docs/adr/0001`.
- **Lock wallets in ascending id order.** `dal/wallet.lockPair` sorts by id before
  `FOR UPDATE`. The sort is not cosmetic: without it, simultaneous A→B and B→A transfers
  deadlock each other.
- **`transaction_errors` carries no foreign keys, on purpose.** It has to record wallet
  ids that never existed. "Fixing" the missing constraint breaks the failure taxonomy.
  See `docs/adr/0002`.
- **The seed migration is a test fixture.** `test-environment.ts` migrates a fresh
  container per spec file, so the ten seeded wallets exist in *every* test. Changing a
  seeded balance breaks specs elsewhere that assert on it.
- **Deterministic ordering.** `findALL` sorts `created_at DESC, id DESC`. The `id` tiebreak
  is deliberate — rows sharing a timestamp would otherwise shuffle between queries, and the
  tests assert on the order.
- **Pinned `Intl` formatting.** `FooTable.tsx` pins locale *and* timezone so server and
  client render identical text. Defaulting either causes a hydration mismatch. Any new date
  rendering must do the same.
- **Every export from a `'use server'` module is a public endpoint.** Don't export helpers
  from `frontend/src/server-actions/`. `server-actions/wallet.ts` keeps its three reads
  unexported behind one `loadPaymentsSnapshot` for exactly this reason — which also makes
  a refresh one client roundtrip instead of three, since the client dispatches server
  functions sequentially.
- **`npm run typecheck` in `frontend/` needs a prior `npm run build`.** `layout.tsx` uses
  `LayoutProps<'/'>`, a type Next generates into `.next/types`. On a fresh worktree
  `tsc --noEmit` fails with `Cannot find name 'LayoutProps'` until something has built.
- **Read `frontend/node_modules/next/dist/docs/` before writing frontend code.** Next 16.3
  ships version-matched docs and `frontend/AGENTS.md` requires them; training-data Next is
  wrong often enough to matter. Cache Components is **off**, so `use cache` and its
  prerender rules do not apply here.
- **Money crosses the wire as integer cents.** `frontend/src/lib/money.ts` is the only
  place dollars exist: `parseDollarsToCents` does integer-only arithmetic, because
  `Number('12.34') * 100` is `1233.9999…`.

## Seams not yet established

The first feature that needs one of these decides its shape:

- **Still no service layer.** `CLAUDE.md` refers to unit-testing "complicated business
  logic in services", but `backend/src/services/` does not exist. The transfer rules sit
  in `api/transaction.ts` by decision rather than by accident; `docs/adr/0001` records why,
  and names this the first thing to revisit if a second feature needs the same logic.
- **No auth, sessions, or users.** Middleware is `express.json()` and `morgan` only. A
  wallet is its own account holder, so any caller can send from any wallet. This is also
  why `transaction_errors` is written but never served.
- **No idempotency on transfers.** A retried `POST /api/transactions` moves money twice.
  Retrofitting means a nullable `idempotency_key` column plus a partial unique index.
- **No validation library.** `backend/src/api/foo.ts` hand-rolls its checks.
- **No CI.** No `.github/`. `npm test`, `npm run typecheck`, and `npm run format:check`
  are manual, per app.
- **No `.artifacts/` yet**, though `docs/agents/` describes it. Created on first use.
  `docs/adr/` now exists and holds two decisions.

## Known drift

Recorded so sessions stop rediscovering it. Not currently scheduled for a fix.

- `backend/src/database/pool.ts` exports `getPool()` and **has zero callers**. `db.ts` is
  the live path — don't build on `pool.ts`.
- `CreateFooBody.name` is typed `any` in `backend/src/api/foo.ts`, contradicting the
  no-`any` rule in `CLAUDE.md`.
- Component filenames are PascalCase (`FooTable.tsx`, `PaymentsDashboard.tsx`); every
  other file in both apps is kebab-case. **Resolved** — `CLAUDE.md` no longer mandates
  kebab-case, so match the directory you are writing in.
- The `BACKEND_URL` fallback `?? 'http://localhost:4000'` is duplicated across both files
  in `frontend/src/server-actions/`.
- The error handler in `backend/src/app.ts` returns `err.stack` in the 500 response body.
