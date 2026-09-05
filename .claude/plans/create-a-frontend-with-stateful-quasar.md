# Currency Exchange Wallet

## Context

The scaffold has one worked vertical slice (`foo`) demonstrating the full stack path. This feature replaces the home page with a currency exchange wallet — the first feature with real business logic. It introduces the service layer seam, adds two new database entities, and demonstrates transactional writes with row-level locking.

The wallet holds 5 currencies (USD, JPY, EUR, GBP, CNY) with a starting balance of $1,000 USD. Users exchange between currencies at hardcoded rates. All exchanges are logged as append-only records.

## Design decisions (settled)

- **Amounts**: integers in each currency's smallest unit (cents for USD/EUR/GBP/CNY factor=100, yen for JPY factor=1)
- **Rates**: hardcoded USD-base constants in a shared backend file, exposed via API, fetched by frontend via server action
- **Overdraw**: rejected — balance must cover the exchange
- **Concurrency**: `SELECT ... FOR UPDATE` on wallet rows inside a transaction
- **Service layer**: new `backend/src/services/exchange.ts` — first service in the project
- **Frontend**: replace home page (`/`), two-column layout (wallet+form | log), live conversion preview
- **Foo cleanup**: keep backend (routes, DAL, model), remove frontend components (`FooPanel`, `FooTable`) and server action

## Implementation steps

### 1. Currency constants

Create `backend/src/constants/currencies.ts`:

- `CURRENCIES` map: code → `{ decimalPlaces, symbol }` (JPY: 0, rest: 2)
- `RATES_TO_USD`: `{ JPY: 149.50, EUR: 0.92, GBP: 0.79, CNY: 7.24, USD: 1 }`
- `getRate(from, to)`: derives any cross-rate via USD. `fromAmount_whole / rate_from * rate_to` converted back to smallest units
- Helper: `toSmallestUnit(whole, currency)` and `toWholeUnit(smallest, currency)`
- `CurrencyCode` type: `'USD' | 'JPY' | 'EUR' | 'GBP' | 'CNY'`

### 2. Drizzle models

**`backend/src/database/models/wallet-balance.ts`**:
```
wallet_balances: id (serial PK), currency (text NOT NULL UNIQUE), amount (bigint NOT NULL DEFAULT 0)
```
Export `WalletBalanceInsertType`.

**`backend/src/database/models/exchange.ts`**:
```
exchanges: id (serial PK), from_currency (text NOT NULL), to_currency (text NOT NULL),
           from_amount (bigint NOT NULL), to_amount (bigint NOT NULL),
           rate_used (text NOT NULL), created_at (timestamp w/ tz NOT NULL DEFAULT now())
```
Export `ExchangeInsertType`. Use `text` for `rate_used` — it's a denormalized snapshot, not used for math after insertion.

**Update `backend/src/database/schema.ts`**: add re-exports for both new models. Critical — unlisted models produce no migration.

### 3. Migration + seed

- Run `cd backend && npm run db:generate` to create the DDL migration
- Manually append seed INSERTs to the generated SQL file:
  ```sql
  INSERT INTO wallet_balances (currency, amount) VALUES
    ('USD', 100000),
    ('JPY', 0),
    ('EUR', 0),
    ('GBP', 0),
    ('CNY', 0);
  ```

### 4. DAL

**`backend/src/database/dal/wallet-balance.ts`**:
- `findAll()` — returns all 5 rows, ordered by currency
- `findByCurrencyForUpdate(currency, trx)` — `SELECT ... FOR UPDATE` within a transaction, returns single row
- `updateAmount(id, newAmount, trx)` — sets the amount within a transaction

**`backend/src/database/dal/exchange.ts`**:
- `create(record, trx)` — inserts an exchange record within a transaction
- `findAll()` — returns all exchanges ordered by `created_at DESC, id DESC`

Both use a transaction parameter (`trx`) passed from the service layer — same Drizzle `db` interface but scoped to the transaction.

### 5. Service layer

Create `backend/src/services/exchange.ts`:

`performExchange(fromCurrency, toCurrency, sourceAmount)`:
1. Open a Drizzle transaction
2. Lock both currency rows with `FOR UPDATE` (alphabetical order to prevent deadlocks)
3. Validate source balance >= sourceAmount
4. Compute target amount:
   - Convert source smallest-units to whole units: `sourceAmount / 10^fromDecimals`
   - Convert to USD: `wholeSource / RATES_TO_USD[from]`
   - Convert USD to target: `usdAmount * RATES_TO_USD[to]`
   - Convert back to smallest units: `Math.floor(result * 10^toDecimals)`
5. Debit source, credit target
6. Insert exchange record with `rate_used` as the effective rate string
7. Return the exchange record

Throw a typed error (`InsufficientBalanceError`) on overdraw — the route maps it to 400.

### 6. Routes

**`backend/src/api/wallet.ts`** — `GET /` returns all balances.

**`backend/src/api/rates.ts`** — `GET /` returns `RATES_TO_USD` and `CURRENCIES` metadata.

**`backend/src/api/exchanges.ts`**:
- `GET /` — returns all exchange records
- `POST /` — validates `{ from_currency, to_currency, amount }` (all required, valid currency codes, same-currency rejected, amount > 0 integer), calls `performExchange`, returns the record or 400

**Note**: `bigint` values from Postgres serialize as strings in JSON by default. The route must convert to number or string consistently — use string since amounts can exceed `Number.MAX_SAFE_INTEGER` in theory, though not in practice here.

**Update `backend/src/api/router.ts`**: mount `/wallet`, `/rates`, `/exchanges`.

### 7. Server actions

Follow the result-union pattern from `frontend/src/server-actions/foo.ts`.

**`frontend/src/server-actions/wallet.ts`**: `getWalletBalances()` → calls `GET /api/wallet`

**`frontend/src/server-actions/rates.ts`**: `getRates()` → calls `GET /api/rates`

**`frontend/src/server-actions/exchange.ts`**:
- `getExchangeHistory()` → calls `GET /api/exchanges`
- `performExchange(from, to, amount)` → calls `POST /api/exchanges`

### 8. Frontend components

**Remove**: `FooPanel.tsx`, `FooTable.tsx`, `frontend/src/server-actions/foo.ts`

**New components**:

`WalletDisplay.tsx` — renders 5 currency balances using `Intl.NumberFormat`. Receives balances as props.

`ExchangeForm.tsx` (`'use client'`) — two `<select>` dropdowns (source, target — target filters out source), number input for amount, live preview ("You will receive X YYY"), submit button, inline error display. Uses `useTransition` for the submit. Rates passed as props for client-side preview math.

`ExchangeLog.tsx` — table with all columns: ID, From Currency, To Currency, From Amount, To Amount, Rate, Date. Amounts formatted with `Intl.NumberFormat`. Timestamps pinned to UTC (existing pattern).

**Update `frontend/src/app/page.tsx`**:
- Remove `FooPanel` and `HelloWorldDashboard` imports
- Top-level async server component: fetches balances, rates, and exchange history via server actions
- Two-column layout via Tailwind grid/flexbox: left = WalletDisplay + ExchangeForm, right = ExchangeLog
- Client wrapper component (`WalletPage.tsx` or inline) manages re-fetching after an exchange

### 9. Update CONTEXT.md

Add to glossary:
- **Balance** — integer amount in a currency's smallest unit, stored in `wallet_balances`
- **Exchange** — append-only record of a currency conversion, stored in `exchanges`
- **Rate** — hardcoded constant: units of target currency per 1 USD
- **Service** — business logic module in `backend/src/services/`, owns transactions and validation

Update layer map to include the service layer between Route and DAL.
Update "Seams not yet established" to remove the service layer entry.
Add wallet/exchange to the slice inventory.

### 10. Remove foo from home page

Remove `FooPanel.tsx`, `FooTable.tsx`, `frontend/src/server-actions/foo.ts`. Keep `HelloWorldDashboard` — the health dot is useful. Actually, re-reading the decision: "replace the home page entirely." Remove `HelloWorldDashboard` from the page too. The health check endpoint and its server action remain; just not rendered on the home page.

## Verification

1. Run `./dev.sh` — postgres starts, migrations run (including seed), both apps start
2. Open `http://localhost:3000` — wallet shows $1,000.00 USD, 0 for JPY/EUR/GBP/CNY
3. Exchange 100 USD → JPY: balance updates to $900.00 USD and ~14,950 JPY. Log shows the record.
4. Exchange 20,000 JPY → EUR: verify cross-rate math, both balances update, second log entry appears
5. Try to exchange 1,000 USD (only 900 remaining): inline error "Insufficient balance"
6. Verify live preview updates as amount/currency selections change
7. `cd backend && npm run typecheck` — passes
8. `cd frontend && npm run typecheck` — passes
9. Run backend tests: `cd backend && npm test` — existing foo tests still pass
