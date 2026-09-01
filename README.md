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

Set a `DATABASE_PASSWORD` (and adjust the other `DATABASE_*` values) in `backend/.env`
if you want the DB-backed endpoints to work. The frontend only needs `BACKEND_URL`,
which already points at `http://localhost:4000` in `.env.example`.

## Run

Both at once:

```console
./dev.sh
```

Or in separate terminals:

```console
cd backend && npm start
```

```console
cd frontend && npm run dev
```

Then open http://localhost:3000 — the page renders `hello-world` and the formatted
response from the backend's `/health-check` endpoint (proving the two apps talk).
`connection_status: INACTIVE` is expected when no PostgreSQL is running.

## Per-app docs

- [`backend/README.md`](backend/README.md) — server, tests, migrations, formatting
- [`frontend/README.md`](frontend/README.md) — Next.js defaults
