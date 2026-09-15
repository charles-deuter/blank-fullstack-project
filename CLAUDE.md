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

## Working across packages

`backend/` and `frontend/` share no code and no build. A feature that touches both is two parallel coding subagents, one per package, each following the `CONTEXT.md` recipe for its half against the agreed API contract (route paths, request/response shapes, error codes); the parent merges and runs the final verification. Do not build them serially in one agent.

## Backend

### API errors

Every non-2xx response from `/api` has exactly this body:

```json
{ "code": "FOO_NAME_INVALID", "message": "name is required and must be a non-empty string" }
```

- `code` — `SCREAMING_SNAKE`, prefixed with the entity, one per code path, never reused. Tests and the frontend branch on it.
- `message` — a fixed string, safe to show a user verbatim: lowercase, no trailing period, no jargon.

#### How controllers send them

- Declare the router's errors once, in an `ERRORS` table at the top of the file (`backend/src/api/foo.ts` is the reference). Send them with the built-in response API: `return res.status(400).json(ERRORS.NAME_INVALID)`. No throwing to reach an error handler, no helper wrapping `res`.
- Errors shared by more than one router go in `backend/src/api/errors.ts`; otherwise keep them next to the controller that uses them.
- Services are API-agnostic. A service raises its own domain error (a class with a domain `code`, so the transaction rolls back); it never knows about HTTP status, API codes, or messages. The controller catches the domain error and maps it to an `ERRORS` entry. Anything the controller does not recognise goes to `next(err)`.

#### Message guidelines

1. **Specific enough to debug from the message alone.** Name the field, the constraint, and the rule that failed. `name is required and must be a non-empty string`, not `invalid input`.
2. **No request values in the message.** Never interpolate ids, amounts, names, or anything else from the request. The path and body are already in the request log; a message that repeats them cannot be grepped for, cannot be asserted exactly, and can leak data.
3. **Same code path, same message.** Two requests that fail at the same branch produce a byte-identical `{ code, message }`. If the message wants to vary, that is two code paths — give the second one its own entry in `ERRORS`.

#### Testing

Assert the whole body with `toEqual({ code, message })`, not `message: expect.any(String)`. The guidelines above make the body deterministic, so the exact match is cheap and catches drift. When several inputs hit the same branch, use `it.each` and assert they all produce the same body (`backend/test/test-foo-create.spec.ts`).

## Agent skills

### Issue tracker

Issues live as local markdown files under `.artifacts/issues/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five-role vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context repo — one `CONTEXT.md` at the repo root. ADRs go in `docs/adr/` (no ADRs written yet; the first one creates the directory). See `docs/agents/domain.md`.
