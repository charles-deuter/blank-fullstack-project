# Project Overview: Blank Fullstack Web App Project

## Start here

Read `CONTEXT.md` before exploring the codebase or spawning an Explore agent. It is the complete, authoritative map: stack, the `foo` reference slice, the step-by-step recipe for a new feature, every convention, and the test setup. Explore only for things it does not cover. If you find it wrong or incomplete, fix it in the same change.

## Tech Stack
- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS
- **Backend:** Node.js, Express, Drizzle Orm, Typescript
- **Database:** PostgreSQL (run locally on docker)
- **Testing:** Jest

## Code Style & Guidelines
- Always use TypeScript types or interfaces for component props; do not use `any` for component props.
- When creating a type for request body always use any then make a runtime validation that it is the expected type.
- When creating a type for request path param or query param always use type string
- When testing backend components default to using supertest for simple tests, however complicated business logic in
  services can be unit tested directly
- Frontend validations give a seamless user experience and prevent unnecessary requests we already know will fail. Don’t wait on the backend to do simple validations that can be done with the data readily available on the frontend. Trigger validation messages on blur or on form submit. Feedback style should be inline form field validations.
- Always disable forms upon submission 
- Always use descriptive type names (TValue, TKey, etc) for generics except for when it is a simple expression that only uses a single clear generic

## Agent skills

### Issue tracker

Issues live as local markdown files under `.artifacts/issues/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five-role vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context repo — one `CONTEXT.md` at the repo root. ADRs go in `docs/adr/` (no ADRs written yet; the first one creates the directory). See `docs/agents/domain.md`.
