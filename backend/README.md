# backend

Express 5 + Drizzle (PostgreSQL) + Jest. Serves the API on port **4000**.

Architecture, the worked `foo` slice, and the steps for adding an entity are in
[`../CONTEXT.md`](../CONTEXT.md) — read that before adding a feature. This file covers
running the thing.

## Install

Node is pinned to `v26.8.1` by `.nvmrc`, and `npm install` fails on anything older.
When it does, the follow-up `npm test` reports `jest: command not found`, which points
nowhere near the real cause — so start with `nvm use`.

```console
nvm use && npm install && cp .env.example .env
```

`.env.example` already matches the Postgres container that `../dev.sh` starts, so it
works unedited. `PORT` defaults to 4000 when unset.

## Start the server

```console
npm start
```

This needs a reachable database, or `/health-check` returns
`connection_status: INACTIVE`. `../dev.sh` starts one, applies migrations, and runs
the backend and frontend together.

## Tests

**Docker must be running.** `test-environment.ts` is a custom Jest environment that
starts a real `postgres:16-alpine` via Testcontainers and runs the migrations against
it — no mocks, one container per spec file, so budget for container startup.

```console
npm test
```

```console
npm test -- test/test-foo.spec.ts
```

`testMatch` is `<rootDir>/test/*`, which is flat: a spec in a subdirectory of `test/`
will not run, and nothing will warn you about it. Put new specs directly in `test/`.

## Database

Migrations are generated from `src/database/schema.ts`, never hand-written. That file
is a barrel — a model it doesn't re-export produces **no migration and no error**.

```console
npm run db:generate
```

```console
npm run db:migrate
```

`npm run db:push` also exists. It syncs the schema straight to the database without
writing a migration: usable for a throwaway local experiment, wrong for anything you
intend to keep.

## Typecheck and formatting

There is no linter in this app — the frontend has ESLint, the backend does not.
Prettier settings live in [`.prettierrc`](.prettierrc) and match `frontend/`.

```console
npm run typecheck
```

```console
npm run format:check
```

```console
npm run format
```
