-- Add mpesa and petty_cash to account types (for existing databases)
-- Run this in Supabase SQL Editor if you already have account_transactions/account_balances

-- Drop and recreate account_transactions account_type constraint
ALTER TABLE account_transactions DROP CONSTRAINT IF EXISTS account_transactions_account_type_check;
ALTER TABLE account_transactions ADD CONSTRAINT account_transactions_account_type_check 
  CHECK (account_type IN ('cash', 'cooperative_bank', 'credit', 'cheque', 'mpesa', 'petty_cash'));

-- Drop and recreate account_balances account_type constraint  
ALTER TABLE account_balances DROP CONSTRAINT IF EXISTS account_balances_account_type_check;
ALTER TABLE account_balances ADD CONSTRAINT account_balances_account_type_check 
  CHECK (account_type IN ('cash', 'cooperative_bank', 'credit', 'cheque', 'mpesa', 'petty_cash'));

-- Insert new account balance rows
INSERT INTO account_balances (account_type, current_balance) VALUES
    ('mpesa', 0),
    ('petty_cash', 0)
ON CONFLICT (account_type) DO NOTHING;
