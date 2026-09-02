# Project Overview: Blank Fullstack Web App Project

## Tech Stack
- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS
- **Backend:** Node.js, Express, Drizzle Orm, Typescript
- **Database:** PostgreSQL (run locally on docker)
- **Testing:** Jest

## Code Style & Guidelines
- Always use TypeScript types or interfaces for component props; do not use `any`.
- Name components using PascalCase and files using kebab-case (e.g., `user-profile.tsx`).
- When testing backend components default to using supertest for simple tests, however complicated business logic in 
services can be unit tested directly

## Agent skills

### Issue tracker

Issues live as local markdown files under `.artifacts/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five-role vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context repo — one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
