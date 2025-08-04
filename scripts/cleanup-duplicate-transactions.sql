-- Cleanup Duplicate Transactions Script
-- This script removes duplicate transactions based on reference_type and reference_id
-- Keeps the oldest transaction and deletes newer duplicates

-- First, let's see what duplicates exist
SELECT 
    reference_type,
    reference_id,
    COUNT(*) as duplicate_count,
    MIN(created_at) as oldest_transaction,
    MAX(created_at) as newest_transaction
FROM account_transactions
GROUP BY reference_type, reference_id
HAVING COUNT(*) > 1
ORDER BY reference_type, reference_id;

-- Delete duplicate transactions, keeping only the oldest one
DELETE FROM account_transactions 
WHERE id IN (
    SELECT id FROM (
        SELECT id,
               ROW_NUMBER() OVER (
                   PARTITION BY reference_type, reference_id 
                   ORDER BY created_at ASC
               ) as rn
        FROM account_transactions
    ) ranked
    WHERE rn > 1
);

-- Verify cleanup by checking for remaining duplicates
SELECT 
    reference_type,
    reference_id,
    COUNT(*) as remaining_count
FROM account_transactions
GROUP BY reference_type, reference_id
HAVING COUNT(*) > 1
ORDER BY reference_type, reference_id;

-- Show final transaction count by reference type
SELECT 
    reference_type,
    COUNT(*) as transaction_count
FROM account_transactions
GROUP BY reference_type
ORDER BY reference_type; 