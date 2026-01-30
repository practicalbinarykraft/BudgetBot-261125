-- Migration: Add NOT NULL constraints to status columns
-- Created: 2025-01-27
-- Description: Adds NOT NULL constraints to status columns in planned_transactions and planned_income tables
--              Updates any existing NULL values to default values before adding constraints

-- Step 1: Update existing NULL values in planned_transactions
UPDATE planned_transactions 
SET status = 'planned' 
WHERE status IS NULL;

-- Step 2: Update existing NULL values in planned_income
UPDATE planned_income 
SET status = 'pending' 
WHERE status IS NULL;

-- Step 3: Add NOT NULL constraint to planned_transactions.status
-- Note: This will fail if there are still NULL values, but we've updated them above
ALTER TABLE planned_transactions 
ALTER COLUMN status SET NOT NULL;

-- Step 4: Add NOT NULL constraint to planned_income.status
-- Note: This will fail if there are still NULL values, but we've updated them above
ALTER TABLE planned_income 
ALTER COLUMN status SET NOT NULL;

-- Comments
COMMENT ON COLUMN planned_transactions.status IS 'Status: planned, purchased, or cancelled. NOT NULL constraint ensures data integrity.';
COMMENT ON COLUMN planned_income.status IS 'Status: pending, received, or cancelled. NOT NULL constraint ensures data integrity.';
