# blank-fullstack-project

Two independent apps in one repo:

| Folder      | Stack                                   | Dev port |
| ----------- | --------------------------------------- | -------- |
| `backend/`  | Express + Drizzle (PostgreSQL) + Jest   | `4000`   |
| `frontend/` | Next.js (App Router) + Tailwind         | `3000`   |

Each folder has its own `package.json` and lockfile — there is no root package.
Node version is pinned in `backend/.nvmrc` (`v24.16.0`); use the same for the frontend.

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
for it to be ready, then runs the backend and frontend. Ctrl-C stops all three and
removes the container (`docker run --rm`). Requires a running Docker daemon.

Or run the pieces yourself in separate terminals:

```console
docker run --rm --name local-postgres -e POSTGRES_USER=local -e POSTGRES_PASSWORD=arfarf -p 5432:5432 postgres:16-alpine
```

```console
cd backend && npm start
```

```console
cd frontend && npm run dev
```

Then open http://localhost:3000 — the page renders `hello-world` and the formatted
response from the backend's `/health-check` endpoint (proving the two apps talk).
With `./dev.sh` running you should see `connection_status: ACTIVE`; without a
database it reads `INACTIVE`.

## Per-app docs

- [`backend/README.md`](backend/README.md) — server, tests, migrations, formatting
- [`frontend/README.md`](frontend/README.md) — Next.js defaults
