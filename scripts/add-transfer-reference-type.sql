-- Add 'transfer' to account_transactions reference_type constraint
-- Run this if Account Summary transfers fail with check constraint violation

-- Drop the existing check constraint (PostgreSQL default name)
ALTER TABLE account_transactions DROP CONSTRAINT IF EXISTS account_transactions_reference_type_check;

-- Add new constraint including 'transfer'
ALTER TABLE account_transactions ADD CONSTRAINT account_transactions_reference_type_check 
  CHECK (reference_type IN ('payment', 'expense', 'purchase', 'sale', 'transfer'));
