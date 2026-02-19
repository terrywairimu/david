# Account Summary – Load Performance Analysis

## Database inspection (via Supabase MCP)

### Table row counts
| Table | Rows |
|-------|------|
| account_transactions | 1,156 |
| payments | 96 |
| expenses | 601 |
| purchases | 139 |
| account_balances | 6 |

### Indexes
- `account_transactions`: `idx_account_transactions_account_type`, `idx_account_transactions_reference`, `idx_account_transactions_transaction_date`, `idx_account_transactions_balance`
- `account_balances`: unique on `account_type`
- Source tables have appropriate indexes

### View performance
- `account_transactions_view` runs in ~5–6 ms (full scan of 1,156 rows)
- Uses indexed scans; no obvious DB-side bottlenecks

---

## Root cause: frontend logic, not the database

Most delay comes from application flow and data access patterns, not from view or table performance.

### 1. `syncAllTransactions` – main bottleneck

When sync is “needed”:

1. `checkIfSyncNeeded` compares counts (payments vs payment transactions, etc.).
2. If any count mismatch is found, `syncAllTransactions` runs.
3. It iterates **all** records and checks each one:
   - 96 payments → `checkTransactionExists('payment', id)` per payment
   - 601 expenses → same per expense
   - 139 purchases → same per purchase  

**Total: 836 round trips**, plus more for any update/delete/create per record.

With network and Supabase client overhead (e.g. ~50–100 ms per call), this alone can be ~40–80 seconds.

### 2. `checkIfSyncNeeded` – 6 queries on every load

On **every** Account Summary load:

- 3 count queries (payments, expenses, purchases)
- 3 count queries (account_transactions by reference_type)

So **6 queries** before deciding whether to sync. This is relatively cheap but unnecessary when sync is not needed.

### 3. Double fetch of `account_transactions_view`

- `loadAccountBalances()` – `SELECT * FROM account_transactions_view`
- `loadTransactions()` – `SELECT * FROM account_transactions_view`

The view is executed twice, even though it returns the same dataset.

### 4. Redundant balance computation

- `loadAccountBalances`:
  - Fetches all transactions
  - Aggregates `money_in` / `money_out` in JS
  - Performs **6 UPDATE** calls to `account_balances`

The DB trigger on `account_transactions` already updates `account_balances`. Recalculating and updating on each load adds work and network time.

### 5. Real-time subscriptions trigger full reload

On any change to:

- payments
- expenses  
- purchases
- account_transactions

`loadAccountData()` runs again: full reload including `checkIfSyncNeeded` and possibly `syncAllTransactions`.

---

## Recommended optimizations

1. **Optimize sync**  
   Replace per-record checks with bulk logic:
   - Find payment/expense/purchase IDs that have no corresponding `account_transactions` row.
   - Only create transactions for those IDs.
   - Aim for a small number of queries (e.g. 3–6) instead of 800+.

2. **Avoid duplicate view fetch**  
   Call the view once, then:
   - Use the result for both `loadAccountBalances` and `loadTransactions`.

3. **Use `account_balances` for cards**  
   For the summary cards, read from `account_balances` instead of re-aggregating all transactions each time. Trust the trigger for correctness.

4. **Smarter real-time updates**  
   Instead of full `loadAccountData()` on every change, consider:
   - Refetching only what changed (e.g. balances or one account’s transactions).
   - Debouncing rapid changes (e.g. from batch edits).

5. **Relax sync frequency**  
   Sync only when necessary (e.g. after user actions or when counts differ). Avoid syncing on every load when counts already match.

---

## Summary

- **Database**: View and indexes are fine; queries run in ~5 ms.
- **Main issue**: `syncAllTransactions` causing 800+ sequential DB calls when triggered.
- **Other issues**: Multiple view fetches and unnecessary balance recomputation + updates.
