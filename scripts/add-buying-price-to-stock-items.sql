-- Add buying_price column to stock_items table
-- Run this in Supabase SQL Editor or via migration

ALTER TABLE stock_items
ADD COLUMN IF NOT EXISTS buying_price DECIMAL(10,2) DEFAULT 0.00;

COMMENT ON COLUMN stock_items.buying_price IS 'Cost price (buying price) in KES';
COMMENT ON COLUMN stock_items.unit_price IS 'Selling price in KES';
