# backend

Express 5 + Drizzle (PostgreSQL) + Jest. Serves the API on port **4000**.

## Install

Node Version v26, it is suggested you use nvm when working with this library

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

```console
npm run db:generate
```

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
