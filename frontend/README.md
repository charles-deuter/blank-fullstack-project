# frontend

Next.js (App Router) + Tailwind 4 + Headless UI + Jest. Serves the UI on port **3000**.

The browser never calls the backend directly: every request goes through a server
action in `src/server-actions/`, which reads `BACKEND_URL` server-side. The form
kit (`src/components/forms/`) and design tokens (`src/styles/globals.css`) are
documented in the root `CONTEXT.md`.

## Install

Node v26 (pinned in `.nvmrc`; use nvm).

```console
npm install && cp .env.example .env.local
```

`.env.local` holds `BACKEND_URL`, already pointing at `http://localhost:4000`.

## Dev server

```console
npm run dev
```

Open http://localhost:3000. Edit `src/app/page.tsx` to change the page.

## Build and serve

```console
npm run build
```

```console
npm start
```

## Tests

Jest + `@swc/jest` + Testing Library, jsdom. Specs live in `__tests__/` directories
next to the code they test and match `*.test.ts` / `*.test.tsx`. `jest.setup.ts`
polyfills `ResizeObserver` for Headless UI.

```console
npm test
```

```console
npm test -- src/components/forms
```

## Typecheck

Fast, while iterating (`tsc --noEmit` only):

```console
npm run typecheck:fast
```

Full, as the final gate — runs `next typegen` first, which costs ~10s and is only
needed when a route file was added or removed:

```console
npm run typecheck
```

## Lint

```console
npm run lint
```

## Formatting

Prettier settings live in [`.prettierrc`](.prettierrc) and match `backend/`
(single quotes, semicolons, trailing commas, 90-column width).

### check formatting without writing

```console
npm run format:check
```

### fix formatting errors

```console
npm run format
```
