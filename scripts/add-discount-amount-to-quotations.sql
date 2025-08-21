-- Migration: Add discount_amount column to quotations table
-- This fixes the issue where quotation discounts were not being saved to the database

-- Add discount_amount column to quotations table
ALTER TABLE quotations 
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0.00;

-- Add comment to document the field
COMMENT ON COLUMN quotations.discount_amount IS 'Discount amount applied to the quotation total';

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'quotations' AND column_name = 'discount_amount';
