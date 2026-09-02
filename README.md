# blank-fullstack-project

Two independent apps in one repo:

| Folder      | Stack                                   | Dev port |
| ----------- | --------------------------------------- | -------- |
| `backend/`  | Express + Drizzle (PostgreSQL) + Jest   | `4000`   |
| `frontend/` | Next.js (App Router) + Tailwind         | `3000`   |

Each folder has its own `package.json` and lockfile — there is no root package.
Node version is pinned per app in `backend/.nvmrc` and `frontend/.nvmrc` (`v26.8.1`);
run `nvm use` in each folder. Both `package.json`s declare `engines.node >= 26.0.0`.

## Setup

```console
cd backend && npm install && cp .env.example .env
cd ../frontend && npm install && cp .env.example .env.local
```

The `backend/.env.example` `DATABASE_*` values match the local Postgres container
that `./dev.sh` starts. The frontend only needs `BACKEND_URL`, which already points
at `http://localhost:4000` in `.env.example`.

## Run

Both apps plus a local Postgres, in one terminal:

```console
./dev.sh
```

This starts a `postgres:16-alpine` container (`local-postgres`, port 5432), waits
for it to be ready, applies `backend/migrations/` with `npm run db:migrate`, then
runs the backend and frontend. Ctrl-C stops all three and removes the container
(`docker run --rm`). Requires a running Docker daemon.

The migrate step is not optional: the container starts empty every run, so without
it the `foo` table does not exist and `/api/foo` returns a 500.

Or run the pieces yourself in separate terminals:

```console
docker run --rm --name local-postgres -e POSTGRES_USER=local -e POSTGRES_PASSWORD=arfarf -p 5432:5432 postgres:16-alpine
```

```console
cd backend && npm start
```

```console
cd backend && npm run db:migrate
```

```console
cd frontend && npm run dev
```

Then open http://localhost:3000 — the page renders `hello-world` followed by a
status dot. The dot is the bitwise AND of the backend's `server_status` and
`connection_status` from `/health-check`: green only when both are `ACTIVE`, red
otherwise. Hover it to see the full request and response. With `./dev.sh` running
the dot is green; without a database it is red (`connection_status: INACTIVE`).

Beneath that is the foo panel: a **Create foo** button that `POST`s to
`/api/foo`, a green/red status line reporting the result, and a table of every
record newest-first. The browser never calls Express directly — it goes through
the Next server actions in `frontend/src/server-actions/`, so there is no CORS
setup and `BACKEND_URL` stays server-side.

## Per-app docs

- [`backend/README.md`](backend/README.md) — server, tests, migrations, formatting
- [`frontend/README.md`](frontend/README.md) — Next.js defaults
