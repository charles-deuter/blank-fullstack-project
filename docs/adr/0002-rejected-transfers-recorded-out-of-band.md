# Rejected transfers are recorded in their own table, outside the transaction

A rejected transfer — an overdraft, an unknown wallet, a self-send — is worth keeping,
but it cannot be recorded the way a successful one is. The rejection happens inside the
transfer's own transaction, so an audit row written on that handle would be discarded
by the same rollback that undoes the transfer. Rejections therefore go to a separate
`transaction_errors` table, written on the pooled connection **after** the transaction
has rolled back. This keeps `transactions` meaning exactly one thing — money moved —
with no status column and nothing to filter out of balance or history queries.

## Consequences

- **The audit trail is best-effort, not transactional.** A crash between the rollback
  and the error insert loses that record. This is accepted: the ledger's integrity is
  guaranteed, the error log's completeness is not.
- **`transaction_errors` has no foreign keys, deliberately.** It must be able to record
  an attempt against a wallet id that never existed (`RECIPIENT_NOT_FOUND`), which an
  FK would refuse. Adding the "missing" constraint would break the failure taxonomy.
- The DAL's `record()` must be called with `db`, never a `tx` handle.
- The table is never served over HTTP. With no auth in the repo, exposing it would
  publish which wallet ids exist and who attempted to overdraw.
