-- Create account_transactions table
CREATE TABLE IF NOT EXISTS account_transactions (
    id SERIAL PRIMARY KEY,
    transaction_number VARCHAR(50) UNIQUE NOT NULL,
    account_type VARCHAR(20) NOT NULL CHECK (account_type IN ('cash', 'cooperative_bank', 'credit', 'cheque', 'mpesa', 'petty_cash')),
    transaction_type VARCHAR(10) NOT NULL CHECK (transaction_type IN ('in', 'out')),
    amount DECIMAL(10,2) NOT NULL,
    description TEXT NOT NULL,
    reference_type VARCHAR(20) NOT NULL CHECK (reference_type IN ('payment', 'expense', 'purchase', 'sale')),
    reference_id INTEGER NOT NULL,
    transaction_date TIMESTAMP NOT NULL,
    balance_after DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create account_balances table
CREATE TABLE IF NOT EXISTS account_balances (
    id SERIAL PRIMARY KEY,
    account_type VARCHAR(20) UNIQUE NOT NULL CHECK (account_type IN ('cash', 'cooperative_bank', 'credit', 'cheque', 'mpesa', 'petty_cash')),
    current_balance DECIMAL(10,2) DEFAULT 0,
    last_transaction_date TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial account balances
INSERT INTO account_balances (account_type, current_balance) VALUES
    ('cash', 0),
    ('cooperative_bank', 0),
    ('credit', 0),
    ('cheque', 0),
    ('mpesa', 0),
    ('petty_cash', 0)
ON CONFLICT (account_type) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_account_transactions_account_type ON account_transactions(account_type);
CREATE INDEX IF NOT EXISTS idx_account_transactions_reference ON account_transactions(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_account_transactions_date ON account_transactions(transaction_date);

-- Function to generate unique transaction numbers
CREATE OR REPLACE FUNCTION generate_transaction_number()
RETURNS VARCHAR AS $$
DECLARE
    new_number VARCHAR;
    counter INTEGER := 1;
BEGIN
    LOOP
        new_number := 'TXN' || LPAD(counter::TEXT, 6, '0');
        
        -- Check if number already exists
        IF NOT EXISTS (SELECT 1 FROM account_transactions WHERE transaction_number = new_number) THEN
            RETURN new_number;
        END IF;
        
        counter := counter + 1;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to update account balance
CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER AS $$
DECLARE
    current_balance DECIMAL(10,2);
    new_balance DECIMAL(10,2);
BEGIN
    -- Get current balance for the account type
    SELECT COALESCE(current_balance, 0) INTO current_balance
    FROM account_balances
    WHERE account_type = NEW.account_type;
    
    -- Calculate new balance
    IF NEW.transaction_type = 'in' THEN
        new_balance := current_balance + NEW.amount;
    ELSE
        new_balance := current_balance - NEW.amount;
    END IF;
    
    -- Update the transaction's balance_after
    NEW.balance_after := new_balance;
    
    -- Update account_balances table
    INSERT INTO account_balances (account_type, current_balance, last_transaction_date, updated_at)
    VALUES (NEW.account_type, new_balance, NEW.transaction_date, CURRENT_TIMESTAMP)
    ON CONFLICT (account_type) 
    DO UPDATE SET 
        current_balance = EXCLUDED.current_balance,
        last_transaction_date = EXCLUDED.last_transaction_date,
        updated_at = EXCLUDED.updated_at;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update account balance when transaction is inserted
CREATE TRIGGER trigger_update_account_balance
    BEFORE INSERT ON account_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_account_balance();

-- Function to create transaction from payment
CREATE OR REPLACE FUNCTION create_account_transaction_from_payment()
RETURNS TRIGGER AS $$
DECLARE
    account_type VARCHAR(20);
BEGIN
    -- Determine account type from payment
    IF NEW.account_paid_to IS NOT NULL THEN
        account_type := LOWER(NEW.account_paid_to);
    ELSE
        account_type := LOWER(NEW.payment_method);
    END IF;
    
    -- Validate account type
    IF account_type NOT IN ('cash', 'cooperative_bank', 'credit', 'cheque', 'mpesa', 'petty_cash') THEN
        account_type := 'cash';
    END IF;
    
    -- Create transaction
    INSERT INTO account_transactions (
        transaction_number,
        account_type,
        transaction_type,
        amount,
        description,
        reference_type,
        reference_id,
        transaction_date
    ) VALUES (
        generate_transaction_number(),
        account_type,
        'in',
        NEW.amount,
        COALESCE(NEW.description, NEW.payment_number),
        'payment',
        NEW.id,
        COALESCE(NEW.payment_date, NEW.date_created)
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create transaction from expense
CREATE OR REPLACE FUNCTION create_account_transaction_from_expense()
RETURNS TRIGGER AS $$
DECLARE
    account_type VARCHAR(20);
    expense_description TEXT;
BEGIN
    -- Determine account type from expense
    IF NEW.account_debited IS NOT NULL THEN
        account_type := LOWER(NEW.account_debited);
    ELSE
        account_type := 'cash';
    END IF;
    
    -- Validate account type
    IF account_type NOT IN ('cash', 'cooperative_bank', 'credit', 'cheque', 'mpesa', 'petty_cash') THEN
        account_type := 'cash';
    END IF;
    
    -- Get the real description from expense_items using the same structure as frontend views
    SELECT 
      CASE 
        WHEN COUNT(*) = 0 THEN NEW.expense_number
        WHEN COUNT(*) = 1 THEN 
          CASE 
            WHEN quantity = 1 THEN description || ' @ ' || rate
            ELSE quantity || ' ' || description || ' @ ' || rate
          END
        ELSE 
          COUNT(*) || ' items: ' || 
          STRING_AGG(
            CASE 
              WHEN quantity = 1 THEN description || ' @ ' || rate
              ELSE quantity || ' ' || description || ' @ ' || rate
            END, 
            ', '
          )
      END INTO expense_description
    FROM expense_items 
    WHERE expense_id = NEW.id;
    
    -- Create transaction
    INSERT INTO account_transactions (
        transaction_number,
        account_type,
        transaction_type,
        amount,
        description,
        reference_type,
        reference_id,
        transaction_date
    ) VALUES (
        generate_transaction_number(),
        account_type,
        'out',
        NEW.amount,
        COALESCE(expense_description, NEW.description, NEW.expense_number),
        'expense',
        NEW.id,
        NEW.date_created
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create transaction from purchase
CREATE OR REPLACE FUNCTION create_account_transaction_from_purchase()
RETURNS TRIGGER AS $$
DECLARE
    account_type VARCHAR(20);
    purchase_description TEXT;
BEGIN
    -- Determine account type from purchase
    account_type := LOWER(NEW.payment_method);
    
    -- Validate account type
    IF account_type NOT IN ('cash', 'cooperative_bank', 'credit', 'cheque', 'mpesa', 'petty_cash') THEN
        account_type := 'cash';
    END IF;
    
    -- Get the real description from purchase_items and stock_items using the same structure as frontend views
    SELECT 
      CASE 
        WHEN COUNT(*) = 0 THEN NEW.purchase_order_number
        WHEN COUNT(*) = 1 THEN 
          CASE 
            WHEN si.description IS NOT NULL AND si.description != '' THEN si.description
            WHEN si.name IS NOT NULL AND si.name != '' THEN si.name
            ELSE 'N/A'
          END || ' (' || pi.quantity || ' ' || COALESCE(si.unit, 'N/A') || ')'
        ELSE 
          COUNT(*) || ' items: ' || 
          STRING_AGG(
            CASE 
              WHEN si.description IS NOT NULL AND si.description != '' THEN si.description
              WHEN si.name IS NOT NULL AND si.name != '' THEN si.name
              ELSE 'N/A'
            END || ' (' || pi.quantity || ' ' || COALESCE(si.unit, 'N/A') || ')', 
            ', '
          )
      END INTO purchase_description
    FROM purchase_items pi
    LEFT JOIN stock_items si ON pi.stock_item_id = si.id
    WHERE pi.purchase_id = NEW.id;
    
    -- Create transaction
    INSERT INTO account_transactions (
        transaction_number,
        account_type,
        transaction_type,
        amount,
        description,
        reference_type,
        reference_id,
        transaction_date
    ) VALUES (
        generate_transaction_number(),
        account_type,
        'out',
        NEW.total_amount,
        COALESCE(purchase_description, NEW.notes, NEW.purchase_order_number),
        'purchase',
        NEW.id,
        NEW.purchase_date
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to create transactions automatically
CREATE TRIGGER trigger_create_transaction_from_payment
    AFTER INSERT ON payments
    FOR EACH ROW
    EXECUTE FUNCTION create_account_transaction_from_payment();

CREATE TRIGGER trigger_create_transaction_from_expense
    AFTER INSERT ON expenses
    FOR EACH ROW
    EXECUTE FUNCTION create_account_transaction_from_expense();

CREATE TRIGGER trigger_create_transaction_from_purchase
    AFTER INSERT ON purchases
    FOR EACH ROW
    EXECUTE FUNCTION create_account_transaction_from_purchase();

-- Create account_transactions_view
CREATE OR REPLACE VIEW account_transactions_view AS
SELECT 
    at.id,
    at.transaction_number,
    at.account_type,
    at.transaction_type,
    at.amount,
    at.description,
    at.reference_type,
    at.reference_id,
    at.transaction_date,
    at.balance_after,
    CASE
        WHEN at.transaction_type = 'in' THEN at.amount
        ELSE 0
    END AS money_in,
    CASE
        WHEN at.transaction_type = 'out' THEN at.amount
        ELSE 0
    END AS money_out,
    -- Reference information
    CASE 
        WHEN at.reference_type = 'payment' THEN p.payment_number
        WHEN at.reference_type = 'expense' THEN e.expense_number
        WHEN at.reference_type = 'purchase' THEN pu.purchase_order_number
        ELSE NULL
    END AS reference_number,
    CASE 
        WHEN at.reference_type = 'payment' THEN p.description
        WHEN at.reference_type = 'expense' THEN e.description
        WHEN at.reference_type = 'purchase' THEN pu.notes
        ELSE NULL
    END AS reference_description
FROM account_transactions at
LEFT JOIN payments p ON at.reference_type = 'payment' AND at.reference_id = p.id
LEFT JOIN expenses e ON at.reference_type = 'expense' AND at.reference_id = e.id
LEFT JOIN purchases pu ON at.reference_type = 'purchase' AND at.reference_id = pu.id
ORDER BY at.transaction_date DESC, 
         CASE 
             WHEN at.reference_type = 'payment' THEN p.payment_number
             WHEN at.reference_type = 'expense' THEN e.expense_number
             WHEN at.reference_type = 'purchase' THEN pu.purchase_order_number
             ELSE at.transaction_number
         END DESC,
         at.id DESC; 