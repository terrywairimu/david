# Payments Account Summary & Transfer – Troubleshooting

## Why is there no data?

The Account Summary and Transfer features depend on these database objects:

1. **`account_transactions`** – Stores all cash/bank movements
2. **`account_balances`** – Stores current balance per account type
3. **`account_transactions_view`** – View joining transactions with payments, expenses, purchases

### Root causes of empty data

1. **Tables or view not created**  
   Run the setup script in Supabase SQL Editor:
   - `scripts/create-account-tables.sql`

2. **Field name mismatches**  
   The app reads both naming styles:
   - **Payments**: `account_credited` or `account_paid_to`
   - **Expenses**: `account_debited` or `account_paid_from`

3. **No source data synced yet**  
   Account Summary shows data from:
   - **Receive Payments** (`payments`)
   - **Expenses**
   - **Purchases**

   If none of these exist, balances will be zero.

4. **Transfer fails with constraint error**  
   If transfers fail with messages about `reference_type`, add `transfer` to the allowed values:
   - Run `scripts/add-transfer-reference-type.sql` in Supabase

### Setup order

1. Run `scripts/create-account-tables.sql` (creates tables, view, triggers)
2. Run `scripts/add-transfer-reference-type.sql` (enables transfers)
3. Record some payments, expenses, or purchases
4. Use **Sync** in Account Summary if data does not show

### Manual sync

Account Summary syncs automatically on load, but you can force a sync via the **Sync** button to:
- Create `account_transactions` from payments, expenses, purchases
- Recalculate balances
