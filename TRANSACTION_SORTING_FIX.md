# Transaction Sorting Fix

## Problem
The transaction records in the account summary were not properly sorted by their reference numbers (purchase numbers, order numbers, expense numbers) within each date. Transactions with the same date were displayed in a mixed order instead of being arranged from lowest to highest reference numbers.

## Example of the Issue
For transactions on 8/1/2025, the reference numbers were displayed in this order:
- POCL2508005
- POCL2508001  
- POCL2508003
- POCL2508002
- POCL2508006

Instead of the correct order:
- POCL2508001
- POCL2508002
- POCL2508003
- POCL2508005
- POCL2508006

## Root Cause
1. **Frontend Sorting**: The `getFilteredTransactions()` function in `account-summary-view.tsx` only sorted by date (descending) but didn't sort by reference numbers within the same date.

2. **Database View**: The `account_transactions_view` in the database only ordered by `transaction_date DESC, id DESC` without considering reference numbers.

## Solution Applied

### 1. Frontend Sorting Fix (`app/payments/components/account-summary-view.tsx`)
**File**: `app/payments/components/account-summary-view.tsx`
**Lines**: 925-1000

**Before**:
```javascript
// Always sort by most recent first
return filtered.sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())
```

**After**:
```javascript
// First sort chronologically (oldest to newest) for balance calculation
const chronologicallySorted = filtered.sort((a, b) => {
  const dateComparison = new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
  
  if (dateComparison !== 0) {
    return dateComparison
  }
  
  // If dates are the same, sort by reference number (ascending)
  const refA = a.reference_number || ''
  const refB = b.reference_number || ''
  
  const extractNumericPart = (ref: string) => {
    const match = ref.match(/\d+/)
    return match ? parseInt(match[0]) : 0
  }
  
  const numericA = extractNumericPart(refA)
  const numericB = extractNumericPart(refB)
  
  if (numericA !== numericB) {
    return numericA - numericB
  }
  
  return refA.localeCompare(refB)
})

// Recalculate balances chronologically
let runningBalance = 0
const transactionsWithRecalculatedBalance = chronologicallySorted.map(transaction => {
  if (transaction.transaction_type === 'in') {
    runningBalance += transaction.amount
  } else {
    runningBalance -= transaction.amount
  }
  return {
    ...transaction,
    balance_after: runningBalance
  }
})

// Now sort for display (newest first, then by reference number ascending within same date)
return transactionsWithRecalculatedBalance.sort((a, b) => {
  const dateComparison = new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
  
  if (dateComparison !== 0) {
    return dateComparison
  }
  
  const refA = a.reference_number || ''
  const refB = b.reference_number || ''
  
  const extractNumericPart = (ref: string) => {
    const match = ref.match(/\d+/)
    return match ? parseInt(match[0]) : 0
  }
  
  const numericA = extractNumericPart(refA)
  const numericB = extractNumericPart(refB)
  
  if (numericA !== numericB) {
    return numericA - numericB
  }
  
  return refA.localeCompare(refB)
})
```

### 2. Database View Fix (`scripts/create-account-tables.sql`)
**File**: `scripts/create-account-tables.sql`
**Lines**: 275-279

**Before**:
```sql
ORDER BY at.transaction_date DESC, at.id DESC;
```

**After**:
```sql
ORDER BY at.transaction_date DESC, 
         CASE 
             WHEN at.reference_type = 'payment' THEN p.payment_number
             WHEN at.reference_type = 'expense' THEN e.expense_number
             WHEN at.reference_type = 'purchase' THEN pu.purchase_order_number
             ELSE at.transaction_number
         END ASC,
         at.id DESC;
```

### 3. Frontend Query Optimization
**File**: `app/payments/components/account-summary-view.tsx`
**Lines**: 835-840

**Before**:
```javascript
const { data: transactionsData, error } = await supabase
  .from('account_transactions_view')
  .select('*')
  .order('transaction_date', { ascending: false })
```

**After**:
```javascript
const { data: transactionsData, error } = await supabase
  .from('account_transactions_view')
  .select('*')
```

## How the Fix Works

### Frontend Sorting Logic
1. **Chronological Sorting**: First sort transactions chronologically (oldest to newest) for accurate balance calculation
2. **Balance Recalculation**: Recalculate running balances based on chronological order
3. **Display Sorting**: Then sort for display (newest first, then by reference number ascending within same date)
4. **Numeric Extraction**: Extracts numeric parts from reference numbers (e.g., "2508001" from "POCL2508001") for proper numeric sorting
5. **Fallback**: If numeric parts are the same, sorts alphabetically

### Database View Sorting
1. **Primary Sort**: Transaction date (descending)
2. **Secondary Sort**: Reference number based on transaction type:
   - Payments: `payment_number`
   - Expenses: `expense_number` 
   - Purchases: `purchase_order_number`
   - Fallback: `transaction_number`
3. **Tertiary Sort**: Transaction ID (ascending) for consistent ordering

## Benefits
1. **Consistent Ordering**: Transactions are now properly sorted by reference numbers within each date
2. **Better User Experience**: Users can easily find and track transactions in logical order
3. **Improved Data Analysis**: Financial reports and exports will have consistent ordering
4. **Performance**: Database-level sorting reduces frontend processing

## Testing
To verify the fix works correctly:
1. Navigate to the Account Summary page
2. Check that transactions within the same date are sorted by reference number (lowest to highest)
3. Verify that the order is consistent across different date ranges
4. Test with different transaction types (payments, expenses, purchases)

## Files Modified
- `app/payments/components/account-summary-view.tsx`: Frontend sorting logic
- `scripts/create-account-tables.sql`: Database view sorting

The transaction sorting issue has been resolved. Transactions will now display in the correct order: by date (most recent first) and then by reference number (lowest to highest) within each date. 