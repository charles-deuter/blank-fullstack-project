# CONTEXT

Read this before exploring. It tells you what exists, how to build on it, and where the traps are.

## Project layout

Two independent apps, no root `package.json`:

| App         | Stack                                      | Port   |
| ----------- | ------------------------------------------ | ------ |
| `backend/`  | Express 5, Drizzle ORM, PostgreSQL, Jest   | `4000` |
| `frontend/` | Next.js (App Router), Tailwind 4, Headless UI | `3000` |

`./dev.sh` starts a throwaway `postgres:16-alpine` container, applies migrations, and runs both apps. The container is `--rm` so the database is empty every run.

One worked vertical slice — the `foo` entity — is wired end to end from Postgres through Express to a React table. Every new feature copies it.

## How to add a feature

Follow this order. Each step lists the file to create and what goes in it.

1. **Model** — `backend/src/database/models/<entity>.ts`
   Copy `models/foo.ts`. Define a `pgTable` and export a `$inferInsert` type.

2. **Schema barrel** — `backend/src/database/schema.ts`
   Add `export * from './models/<entity>'`.
   **This is the trap.** `backend/drizzle.config.ts` points at this one file. An unlisted model produces no migration and no error — you just silently have no table.

3. **Generate migration** — `cd backend && npm run db:generate`

4. **Apply migration** — `npm run db:migrate`
   (`dev.sh` migrates on every start since the container is fresh, so this step is only needed mid-session.)

5. **DAL** — `backend/src/database/dal/<entity>.ts`
   Copy `dal/foo.ts`. This is the only code that imports `db`. Always sort with a tiebreak column (`created_at DESC, id DESC`).

6. **Service (only when needed)** — `backend/src/services/<entity>.ts`
   Skip this for simple CRUD; the route calls the DAL directly, as `foo` does. Create a service when one request writes more than one table, or the calculation is worth unit-testing on its own. The service:
   - runs the whole write inside `db.transaction()` via a `withTransaction(fn)` wrapper exported from the DAL, so the DAL stays the only importer of `db`;
   - passes the transaction handle into DAL functions (give them an `executor` parameter that defaults to `db`);
   - locks rows it will update with `SELECT ... FOR UPDATE`, in a fixed order (by id) so concurrent calls cannot deadlock;
   - throws a typed error (`class <Entity>Error extends Error { code: '...' }`) for business failures. The route maps codes to status (`NOT_FOUND` → 404, everything else → 400) and passes anything else to `next(err)`.
   Pure calculation helpers (no DB) go in their own module under `services/` so they can be tested without fixtures.

7. **Route** — `backend/src/api/<entity>.ts`
   Copy `api/foo.ts`. Body type fields are `any`, validated at runtime (not compile time — this is a CLAUDE.md rule). Route catches errors with `next(err)`.

8. **Mount** — `backend/src/api/router.ts`
   Add `router.use('/<entity>', <entity>)`.

9. **Server action** — `frontend/src/server-actions/<entity>.ts`
   Copy `server-actions/foo.ts`. Fetches `BACKEND_URL` (server-side only). Returns a result union: `{ ok: true, ... } | { ok: false, message: string }`. Never throws. Every export from this file is a public endpoint — don't export helpers.

10. **Server component** — `frontend/src/components/<Entity>Panel.tsx`
    Copy `FooPanel.tsx`. Calls the server action and passes the result as props to the client component.

11. **Client component** — `frontend/src/components/<Entity>Table.tsx` (or whatever UI)
    `'use client'`. Receives data as props from the server component. Uses the form kit (below) for any inputs. After a mutation, re-fetch through the server action rather than patching local state, so the server stays the source of truth for ordering (see `FooTable.tsx`).

Seed data belongs in a custom migration (`cd backend && npx drizzle-kit generate --custom --name=seed-<entity>`, then write the SQL by hand). Migrations run in every test container too, so seeded rows are present in every backend spec — reset them in `beforeEach` when a spec mutates them.

## Form kit

`frontend/src/components/forms/` has ready-to-use form components. Don't rebuild these.

| Component        | What it wraps                                     |
| ---------------- | ------------------------------------------------- |
| `TextField`      | `<input>` — text, email, password, number, date, etc. |
| `TextAreaField`  | `<textarea>`                                      |
| `SelectField`    | native `<select>`                                 |
| `ListboxField`   | Headless UI `<Listbox>` (custom accessible dropdown) |
| `CheckboxField`  | `<input type="checkbox">`                         |
| `Form`           | `<form>` — state, validation, submission lifecycle |

All field components take a `label` prop and an optional `error` prop. When `error` is set, the field shows a danger border and an inline validation message with `aria-live="polite"`.

`Form` wraps the field components with a render-prop API: pass `initialValues`, `validationRules`, and an `onSubmit` callback. It validates on blur and on submit, disables fields during submission, auto-resets on success, and displays a form-level error when `onSubmit` returns a string. Boolean initial values produce `checked`/`onChange` props (for CheckboxField); string values produce `value`/`onChange` that handle both event-based and raw-value onChange (for ListboxField).

`FieldWrapper` provides the shared label-above-control layout. `FieldError` renders the inline message. `fieldStyles.ts` exports class builders (`formInputClasses`, `formTextAreaClasses`, `formSelectClasses`, `formCheckboxClasses`) that handle valid/invalid styling.

## Design tokens

`frontend/src/styles/globals.css` defines semantic color tokens via `@theme`. Use these as Tailwind utilities — never raw palette values.

| Token          | Role                        | Usage                |
| -------------- | --------------------------- | -------------------- |
| `canvas`       | page background             | `bg-canvas`          |
| `surface`      | card / panel background     | `bg-surface`         |
| `elevated`     | input / raised background   | `bg-elevated`        |
| `edge`         | borders                     | `border-edge`        |
| `ink`          | primary text                | `text-ink`           |
| `muted`        | secondary text, placeholders| `text-muted`         |
| `accent`       | interactive elements        | `bg-accent`, `text-accent` |
| `accent-hover` | hover state                 | `hover:bg-accent-hover` |
| `success`      | positive feedback           | `text-success`       |
| `danger`       | errors, destructive actions | `text-danger`, `border-danger` |

The theme is dark-only. `color-scheme: dark` is set on `:root`. `@tailwindcss/forms` is loaded with `strategy: class` — bare form elements are intentionally unstyled; the form kit components apply the plugin classes.

## Architecture rules

- The browser never calls Express. Everything routes through `frontend/src/server-actions/`, which keeps `BACKEND_URL` server-side. There is no CORS configuration.
- Server actions return result unions, never throw. Components render the failure branch.
- The DAL is the only module that imports `db`. Routes import the DAL.
- Request bodies are typed `any`, then validated at runtime with hand-rolled checks. The no-`any` rule applies to component props, not request bodies.
- `import 'dotenv/config'` must be the first import in `backend/src/index.ts`. `db.ts` reads `DATABASE_*` env vars and builds the pool at import time. Any dotenv call in the module body runs too late.
- Backend defaults to port 4000, frontend to 3000. Don't add a 3000 fallback to the backend.
- Pin `Intl` locale AND timezone in any date rendering to avoid hydration mismatches between server and client.
- Form field valid/invalid styles are mutually exclusive branches, not additive. `border-edge` and `border-danger` share specificity.
- Filenames: PascalCase for React components, kebab-case everything else.

## Testing

### Frontend

Jest + `@swc/jest` + Testing Library. Tests live colocated in `__tests__/` directories next to the code they test.

- **Form kit specs.** `frontend/src/components/forms/__tests__/` covers all five field components — rendering, error states, aria attributes, and prop forwarding.
- **`testMatch` covers `.test.ts` and `.test.tsx`.** Non-JSX modules (for example under `src/lib/`) get a plain `.test.ts` spec in a colocated `__tests__/` directory.
- **Headless UI.** `jest.setup.ts` polyfills `ResizeObserver` for jsdom. Headless UI's `ListboxButton` overrides `aria-describedby`, so ListboxField tests find the error element by `role="status"` instead of by ID.

```bash
cd frontend && npm test
```

### Backend

- **Real Postgres, no mocks.** Testcontainers starts a `postgres:16-alpine` per spec file, runs migrations, injects `DATABASE_*` env vars.
- **Flat directory.** Specs go directly in `backend/test/`. A spec in a subdirectory silently does not run, and a helper file in `backend/test/` is run as a spec and fails. Shared fixtures go inline in the spec, or in a new `backend/test-helpers/` directory outside `testMatch`.
- **Every spec gets migrations, including seeds.** A pure-logic spec still boots a container; that is fine, just expect ~2s of startup per file.
- **Supertest against the app.** Reference: `backend/test/test-foo-create.spec.ts`.
- **Pool teardown is global.** `after-env-setup.ts` handles it in `afterAll`.

```bash
cd backend && npm test
```

## What doesn't exist yet

The first feature that needs one of these creates it:

- No service layer — logic sits in the route handlers. Step 6 above says where one goes and how it is shaped when a feature needs it
- No auth, sessions, or users
- No validation library — checks are hand-rolled
- No CI
- Single page (`frontend/src/app/page.tsx` renders everything)

## Known drift

- `BACKEND_URL` fallback `?? 'http://localhost:4000'` is duplicated across server action files.
- The error handler in `backend/src/app.ts` returns `err.stack` in the 500 body. Deliberate for this scaffold — must not survive into anything public-facing.
