-- Add payment status and related fields to purchases table
-- This migration adds the fields needed for the new payment status functionality

-- Add new columns to purchases table
ALTER TABLE purchases 
ADD COLUMN IF NOT EXISTS client_id INTEGER REFERENCES registered_entities(id),
ADD COLUMN IF NOT EXISTS paid_to VARCHAR(255),
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'not_yet_paid' CHECK (payment_status IN ('not_yet_paid', 'partially_paid', 'fully_paid')),
ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS balance DECIMAL(10,2) DEFAULT 0.00;

-- Update existing records to have default values
UPDATE purchases 
SET payment_status = 'not_yet_paid',
    amount_paid = 0.00,
    balance = total_amount
WHERE payment_status IS NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_purchases_client_id ON purchases(client_id);
CREATE INDEX IF NOT EXISTS idx_purchases_payment_status ON purchases(payment_status);

-- Add comments for documentation
COMMENT ON COLUMN purchases.client_id IS 'Client ID for client purchases (NULL for general purchases)';
COMMENT ON COLUMN purchases.paid_to IS 'Reference to quotation/order/invoice being paid for';
COMMENT ON COLUMN purchases.payment_status IS 'Payment status: not_yet_paid, partially_paid, fully_paid';
COMMENT ON COLUMN purchases.amount_paid IS 'Amount already paid for this purchase';
COMMENT ON COLUMN purchases.balance IS 'Remaining balance to be paid';
