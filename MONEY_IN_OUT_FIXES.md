# Money In/Out Columns Fix

## Issue Identified

The **Money In** and **Money Out** columns in the account summary table were showing as empty/zero values.

## Root Cause

The component was loading data from the `account_transactions` table instead of the `account_transactions_view`. 

- **`account_transactions` table**: Does NOT have `money_in` and `money_out` columns
- **`account_transactions_view` view**: HAS `money_in` and `money_out` columns with proper calculations

## Database View Analysis

### View Definition
The `account_transactions_view` correctly calculates:
```sql
CASE
    WHEN transaction_type = 'in' THEN amount
    ELSE 0
END AS money_in,
CASE
    WHEN transaction_type = 'out' THEN amount
    ELSE 0
END AS money_out
```

### Data Verification
- **Total transactions**: 72
- **Transactions with money_in > 0**: 11 (incoming money)
- **Transactions with money_out > 0**: 61 (outgoing money)

## Fixes Applied

### 1. Updated Transaction Loading
**Before:**
```typescript
const { data: transactionsData, error } = await supabase
  .from('account_transactions')  // ❌ Wrong table
  .select('*')
```

**After:**
```typescript
const { data: transactionsData, error } = await supabase
  .from('account_transactions_view')  // ✅ Correct view
  .select('*')
```

### 2. Updated Account Balance Calculation
**Before:**
```typescript
const { data: balances, error } = await supabase
  .from('account_transactions')
  .select('account_type, transaction_type, amount')
```

**After:**
```typescript
const { data: balances, error } = await supabase
  .from('account_transactions_view')
  .select('account_type, money_in, money_out')
```

### 3. Improved Balance Calculation Logic
**Before:**
```typescript
if (transaction.transaction_type === 'in') {
  current.total_in += transaction.amount
  current.current_balance += transaction.amount
} else {
  current.total_out += transaction.amount
  current.current_balance -= transaction.amount
}
```

**After:**
```typescript
current.total_in += transaction.money_in || 0
current.total_out += transaction.money_out || 0
current.current_balance += (transaction.money_in || 0) - (transaction.money_out || 0)
```

### 4. Updated Sync Button Styling
**Before:** Large button with text
**After:** Compact icon-only button (40x40px)

## Sample Data Verification

| Transaction | Type | Amount | Money In | Money Out |
|-------------|------|--------|----------|-----------|
| TXN000001 | Payment | 50,000 | 50,000 | 0 |
| TXN000005 | Payment | 75,000 | 75,000 | 0 |
| TXN000098 | Purchase | 112,750 | 0 | 112,750 |

## Files Modified
- `app/payments/components/account-summary-view.tsx`

## Result
✅ **Money In** and **Money Out** columns now display correct values
✅ Account balances calculated from proper money_in/money_out data
✅ Sync button is now a compact icon-only button
✅ All transaction data properly sourced from the view

## Testing
The account summary table should now show:
- **Money In** column: Displays amount for incoming transactions (payments)
- **Money Out** column: Displays amount for outgoing transactions (expenses, purchases)
- **Account balances**: Correctly calculated from money_in/money_out totals 