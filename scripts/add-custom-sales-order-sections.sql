-- Add custom_sections JSONB to sales_orders (stores metadata: id, name, type, anchorKey for each custom section)
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS custom_sections JSONB DEFAULT '[]'::jsonb;

-- Add section_group to sales_order_items (null = main/default section, non-null = custom section id)
ALTER TABLE sales_order_items ADD COLUMN IF NOT EXISTS section_group VARCHAR(50);

-- Update sales_order_items category to allow appliances, wardrobes, tvunit
-- Drop existing category check and add expanded one
ALTER TABLE sales_order_items DROP CONSTRAINT IF EXISTS sales_order_items_category_check;
ALTER TABLE sales_order_items ADD CONSTRAINT sales_order_items_category_check 
  CHECK (category IN ('cabinet', 'worktop', 'accessories', 'appliances', 'wardrobes', 'tvunit'));

COMMENT ON COLUMN sales_orders.custom_sections IS 'Array of {id, name, type, anchorKey} for custom sections (normal or worktop)';
COMMENT ON COLUMN sales_order_items.section_group IS 'Custom section id when item belongs to a custom section, null for main section';
