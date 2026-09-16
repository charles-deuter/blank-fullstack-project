# backend

Express 5 + Drizzle (PostgreSQL) + Jest. Serves the API on port **4000**.

## Install

Node v26 (pinned in `.nvmrc`; use nvm).

```console
npm install
```

## Start the server

```console
npm start
```

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

## Database

Generate a migration from the models listed in `src/database/schema.ts`:

```console
npm run db:generate
```

Apply `migrations/` to the database in `.env`:

```console
npm run db:migrate
```

## Typecheck and formatting

```console
npm run typecheck
```

```console
npm run format:check
```

```console
npm run format
```
