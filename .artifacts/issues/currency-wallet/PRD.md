# PRD: Currency Wallet

Status: ready-for-agent

## Summary

A single-wallet currency exchange demo. The wallet holds balances in five
currencies (USD, EUR, GBP, CNY, JPY). The UI shows each balance alongside its
USD equivalent and a wallet total, offers an Exchange form to convert between
any two currencies at hardcoded rates, and lists every past exchange in an
append-only history table.

## Goals

- Display all five balances with per-currency USD value and a wallet total.
- Convert between any currency pair via a single USD-pivot rate table.
- Record every exchange durably, including the rates used at the time.

## Non-goals

- Authentication, sessions, or multiple users.
- Live or fetched exchange rates.
- Reversing, editing, or deleting an exchange.
- Transfers between wallets. Nothing leaves the wallet; every operation is an
  internal conversion.

## Domain vocabulary

**Exchange** — converting an amount of one currency into another _within_ one
wallet. The UI button reads "Exchange"; the domain concept, table, and route are
all named `exchange`. This is deliberately not called a "transfer": in finance a
transfer moves money between accounts, and nothing here does.

**Balance** — the amount of one currency held by one wallet. Five rows per
wallet.

**Minor unit** — the smallest indivisible amount of a currency (cents for USD,
yen for JPY). All amounts are stored and transported as integer counts of minor
units.

## Money representation

Amounts are **integer minor units**, stored in `bigint` columns, never floats.

Each currency carries an **exponent** in the constants file. JPY has exponent 0;
USD, EUR, GBP, and CNY have exponent 2. A blanket "multiply by 100" is wrong for
JPY, and the exponent must be consulted for every parse, format, and conversion.

`bigint` is not JSON-serializable, so **amounts cross the API as decimal
strings** of minor units (`"16423"`), not numbers. The frontend formats for
display using the exponent; it never does arithmetic on them.

## Exchange rates

One hardcoded constants file, one rate per currency: **USD per 1 whole unit of
that currency**. This single table serves both the USD-equivalent display and
the conversion math.

| Currency | Exponent | USD per unit |
| -------- | -------- | ------------ |
| USD      | 2        | 1.00         |
| EUR      | 2        | 1.08         |
| GBP      | 2        | 1.27         |
| CNY      | 2        | 0.14         |
| JPY      | 0        | 0.0067       |

Cross-currency pairs pivot through USD **arithmetically, in one expression** —
`amount × rate[from] ÷ rate[to]` — not as two sequential conversions. One
division, one rounding.

To keep the math exact, rates are stored in the constants file as integers
scaled by 1e10 (`USD_PER_UNIT_SCALED`), and the whole conversion runs in
`BigInt`:

    toMinor = (fromMinor × rateFromScaled × 10^expTo)
              ÷ (rateToScaled × 10^expFrom)

with the division truncating toward zero.

## Rounding

The output amount is **floored**. The remainder is discarded.

Value can therefore never be created by exchanging — only lost to fractions. A
round trip (USD → JPY → USD) will return slightly less than it started with.
This is correct behavior, not a defect. Half-up rounding was rejected because a
loop of round trips can mint value out of nothing.

## Data model

Three new tables. Every model must be re-exported from
`backend/src/database/schema.ts` — `drizzle.config.ts` reads only that barrel,
so an unregistered model generates no migration **and no error**.

**wallets**

- `id` serial primary key
- `name` text not null
- `created_at` timestamptz not null default now()

**balances**

- `id` serial primary key
- `wallet_id` integer not null → `wallets.id`
- `currency` text not null
- `amount` bigint not null — minor units, never negative
- unique (`wallet_id`, `currency`)

**exchanges** — append-only; no update, no delete

- `id` serial primary key
- `wallet_id` integer not null → `wallets.id`
- `from_currency` text not null
- `to_currency` text not null
- `from_amount` bigint not null — minor units debited
- `to_amount` bigint not null — minor units credited, post-floor
- `from_rate_usd` numeric(20,10) not null — rate at exchange time
- `to_rate_usd` numeric(20,10) not null — rate at exchange time
- `created_at` timestamptz not null default now()

Rates are **frozen into each row**, not recomputed at read time. If the
constants file is edited later, history must still report what actually
happened.

## Seed data

A Drizzle migration inserts one wallet row and its five balance rows. Because a
migration is a fixed file, the "randomized" amounts are rolled **once at
authoring time** and baked in as literals — every clone of the repo gets the
same wallet.

Each currency is seeded to a USD-equivalent between $100 and $200, so no row is
dwarfed by the others:

| Currency | USD equivalent | Minor units seeded |
| -------- | -------------- | ------------------ |
| USD      | $164.23        | 16423              |
| EUR      | $187.50        | 17361              |
| GBP      | $112.90        | 8890               |
| CNY      | $143.60        | 102571             |
| JPY      | $178.40        | 26626              |

No seed script and no seeding on server boot — the migration is the only path,
so restarting the server can never silently reset or overwrite balances.

## API

All amounts in requests and responses are strings of minor units. `:walletId` is
typed `string` and validated as a positive integer, per `CLAUDE.md`.

### `GET /api/wallets/:walletId`

Returns balances, each balance's USD value, the wallet total in USD, and the
rate table.

    {
      "id": 1,
      "name": "Demo Wallet",
      "balances": [
        { "currency": "USD", "amount": "16423", "exponent": 2,
          "usdValue": "16423" }
      ],
      "totalUsd": "78660",
      "rates": { "USD": "1.00", "EUR": "1.08" }
    }

`usdValue` and `totalUsd` are USD minor units (cents), floored the same way an
exchange is.

Rates ride along in this response rather than getting an endpoint of their own —
they are constants, not state. 404 when the wallet does not exist.

### `POST /api/wallets/:walletId/exchanges`

    { "fromCurrency": "EUR", "toCurrency": "JPY", "amount": "5000" }

Returns **201 with the created exchange only** — not the updated balances. The
client re-reads the wallet afterward.

    {
      "id": 7, "fromCurrency": "EUR", "toCurrency": "JPY",
      "fromAmount": "5000", "toAmount": "8059",
      "fromRateUsd": "1.0800000000", "toRateUsd": "0.0067000000",
      "createdAt": "2026-09-04T00:00:00.000Z"
    }

### `GET /api/wallets/:walletId/exchanges`

Returns the exchange list, newest first, ordered `desc(created_at), desc(id)` —
matching the existing `dal/foo.ts` ordering convention.

### Validation and errors

Request bodies follow the repo convention: fields typed `any` on the interface,
then checked at runtime. No validation library.

**Every rejection is 400** with the existing flat `{ success: false, message }`
shape used by the `foo` route. The cases are distinguished by message, not by
status code:

| Case                                              | Message                                    |
| ------------------------------------------------- | ------------------------------------------ |
| `amount` missing, non-string, non-integer, or ≤ 0 | `amount must be a positive integer string` |
| unknown currency code                             | `unknown currency`                         |
| `fromCurrency === toCurrency`                     | `cannot exchange a currency for itself`    |
| `amount` exceeds the from-balance                 | `insufficient funds`                       |
| floored output is 0 minor units                   | `amount too small to exchange`             |

The last case is the **dust** guard, and it must be an explicit rejection. ¥1
converted to GBP floors to zero; permitting it would debit the user and credit
nothing.

## Concurrency and atomicity

An exchange is three writes — debit, credit, history insert — and runs inside a
**single Drizzle transaction**.

The transaction alone is not sufficient. Two concurrent exchanges can each read
a balance of 100 and each spend it, a classic lost update. The two balance rows
are therefore locked with `SELECT ... FOR UPDATE` before being read.

The two rows are locked **in a deterministic order (currency code ascending)** so
that opposing exchanges — EUR→JPY racing JPY→EUR — cannot deadlock.

The balance check happens after the lock is acquired, never before.

## Frontend

Follows the existing `FooPanel` / `FooTable` split exactly.

- **`WalletPanel`** — async server component. Fetches the wallet and the
  exchange list, passes both down as initial props alongside any error.
- **`BalanceTable`** — five rows: currency, amount, USD equivalent; wallet total
  in the footer.
- **`ExchangeHistoryTable`** — the exchange log, newest first. Empty state when
  there are none.
- **`ExchangeDialog`** — opened by the **Exchange** button. From-currency select,
  to-currency select, amount input. The to-currency select excludes whatever
  from-currency is chosen.
- **`server-actions/wallet.ts`** — `'use server'`. The only path to the backend.
  Returns the repo's result union,
  `{ ok: true, ... } | { ok: false, message: string }`, and never throws.

After a successful exchange the client **re-reads** both the wallet and the
history, using `useState` + `useTransition` as `FooTable` does. No optimistic
update: the floored output cannot be predicted client-side without duplicating
the rate math, and duplicating it would let the two implementations drift.

Any timestamp rendering pins locale and `timeZone: 'UTC'`, per the existing
hydration-mismatch guard in `FooTable`.

## Testing

Backend, supertest, real Postgres via the existing Testcontainers environment.
Specs go **directly in `backend/test/`** — `testMatch` is flat, so a spec in a
subdirectory silently never runs.

- Conversion math as a direct unit test, including the JPY exponent-0 path and a
  floor-truncation case.
- The full 400 table above, one case per row, as an `it.each`.
- A successful exchange: correct debit, correct credit, history row written with
  the frozen rates.
- Balances unchanged after every rejected request.
- History ordering.

Concurrency is asserted by reasoning and code review, not by a flaky racing test.

## Open items deferred

- No frontend test runner exists in this repo; that decision stays open.
- Money representation is the first of its kind here and is worth an ADR under
  `docs/adr/`, which does not exist yet.
- `CONTEXT.md` should gain glossary entries for Exchange, Balance, and Minor unit
  once this is implemented.
