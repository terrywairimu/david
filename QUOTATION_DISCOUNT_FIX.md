# Quotation Discount Database Fix

## Problem Description
The quotation discount value was not being saved to the database when creating or editing quotations. This was causing discounts to be lost between sessions.

## Root Cause Analysis
The issue had two components:

1. **Missing Database Column**: The `quotations` table was missing the `discount_amount` column
2. **Missing Code Implementation**: The database INSERT/UPDATE operations were not including the `discount_amount` field

## Files Modified

### 1. Database Schema
- **`scripts/create-tables-v1.sql`**: Added `discount_amount DECIMAL(10,2) DEFAULT 0.00` to quotations table
- **`scripts/add-discount-amount-to-quotations.sql`**: Created migration script to add the missing column

### 2. Application Code
- **`app/sales/components/quotations-view.tsx`**: Updated both INSERT and UPDATE operations to include `discount_amount: quotationData.discount_amount`

## Changes Made

### Database Schema Update
```sql
-- Added to quotations table
discount_amount DECIMAL(10,2) DEFAULT 0.00
```

### Code Updates
```typescript
// INSERT operation - added discount_amount
.insert({
  // ... other fields ...
  discount_amount: quotationData.discount_amount,
  section_names: quotationData.section_names
})

// UPDATE operation - added discount_amount  
.update({
  // ... other fields ...
  discount_amount: quotationData.discount_amount,
  section_names: quotationData.section_names
})
```

## How to Apply the Fix

### Option 1: Run the Migration Script (Recommended)
```bash
# Run the migration script to add the column
psql -d your_database -f scripts/add-discount-amount-to-quotations.sql
```

### Option 2: Manual Database Update
```sql
ALTER TABLE quotations 
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0.00;
```

## Verification
After applying the fix:
1. Create a new quotation with a discount
2. Save the quotation
3. Edit the quotation to verify the discount is loaded
4. Check the database to confirm the `discount_amount` field contains the value

## Impact
- ✅ Quotation discounts are now properly saved to the database
- ✅ Discounts persist between sessions
- ✅ Discounts are correctly loaded when editing quotations
- ✅ No breaking changes to existing functionality

## Notes
- The `discount_amount` field defaults to 0.00 for existing quotations
- The field is optional and can be NULL
- All existing quotation functionality remains intact
