-- Add sort_order column to wishlist for drag-and-drop reordering
ALTER TABLE wishlist ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Initialize sort_order from id for existing rows (preserves current implicit order)
UPDATE wishlist SET sort_order = id WHERE sort_order = 0;
