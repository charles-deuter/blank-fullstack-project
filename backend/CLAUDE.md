# Backend

## API errors

Every non-2xx response from `/api` has exactly this body:

```json
{ "code": "FOO_NAME_INVALID", "message": "name is required and must be a non-empty string" }
```

- `code` — `SCREAMING_SNAKE`, prefixed with the entity, one per code path, never reused. Tests and the frontend branch on it.
- `message` — a fixed string, safe to show a user verbatim: lowercase, no trailing period, no jargon.

### How controllers send them

- Declare the router's errors once, in an `ERRORS` table at the top of the file (`api/foo.ts` is the reference). Send them with the built-in response API: `return res.status(400).json(ERRORS.NAME_INVALID)`. No throwing to reach an error handler, no helper wrapping `res`.
- Errors shared by more than one router go in `api/errors.ts`; otherwise keep them next to the controller that uses them.
- Services are API-agnostic. A service raises its own domain error (a class with a domain `code`, so the transaction rolls back); it never knows about HTTP status, API codes, or messages. The controller catches the domain error and maps it to an `ERRORS` entry. Anything the controller does not recognise goes to `next(err)`.

### Message guidelines

1. **Specific enough to debug from the message alone.** Name the field, the constraint, and the rule that failed. `name is required and must be a non-empty string`, not `invalid input`.
2. **No request values in the message.** Never interpolate ids, amounts, names, or anything else from the request. The path and body are already in the request log; a message that repeats them cannot be grepped for, cannot be asserted exactly, and can leak data. Constants are fine: `currency must be one of USD, EUR, GBP, JPY, CNY`.
3. **Same code path, same message.** Two requests that fail at the same branch produce a byte-identical `{ code, message }`. If the message wants to vary, that is two code paths — give the second one its own entry in `ERRORS`.

### Testing

Assert the whole body with `toEqual({ code, message })`, not `message: expect.any(String)`. The guidelines above make the body deterministic, so the exact match is cheap and catches drift. When several inputs hit the same branch, use `it.each` and assert they all produce the same body (`test/test-foo-create.spec.ts`).
