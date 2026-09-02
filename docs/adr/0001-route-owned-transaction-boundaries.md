# Routes own transaction boundaries for transfers

`CONTEXT.md` records the convention that the DAL is the only module that imports `db`,
and routes reach the database only through it. Sending money breaks that: a transfer
must hold a row lock across a read, a balance check, and two writes, which requires a
single transaction handle spanning several statements. Since the transfer logic lives
in the route (`backend/src/api/transaction.ts`) rather than in a service, the route
must own the `db.transaction()` boundary. DAL functions therefore accept an optional
`Executor` — either `db` or an open `tx` handle — and default to `db`.

## Considered options

- **Atomic unit inside the DAL.** A single `transferFunds()` DAL function owning the
  transaction would have preserved the convention exactly, but pushes multi-step
  business logic into a layer `CONTEXT.md` scopes to query functions.
- **A service layer.** `CLAUDE.md` anticipates `backend/src/services/` for complicated
  business logic. Rejected for now to stay consistent with the one worked slice
  (`api/foo.ts`), which keeps its logic in the route. If a second feature needs shared
  transfer logic, this is the decision to revisit first.
- **A single guarded CTE statement.** Atomic and race-free without any transaction
  plumbing, but drops to raw SQL and collapses distinct failures into one empty
  result, which the chosen failure taxonomy needs to tell apart.

## Consequences

- Every DAL function that can participate in a transfer takes an `Executor` parameter.
  Adding one that does not silently excludes it from the atomic path.
- Concurrency is defended with `SELECT … FOR UPDATE` in `dal/wallet.lockPair`, which
  **orders rows by id before locking**. That ordering is the only thing preventing a
  deadlock between simultaneous A→B and B→A transfers, and it looks like cosmetic
  sorting to anyone who does not know why it is there.
- The convention in `CONTEXT.md` is now "DAL by default, with this documented
  exception" rather than an absolute rule. Any further exception should extend this
  ADR or supersede it, not accrete silently.
