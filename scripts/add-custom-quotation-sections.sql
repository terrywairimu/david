-- Add custom sections support for quotations (e.g. Kitchen 2, multiple worktops)
-- Run this migration to enable dynamic sections in quotation modal

-- Add custom_sections JSONB to quotations (stores metadata: id, name, type for each custom section)
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS custom_sections JSONB DEFAULT '[]'::jsonb;

-- Add section_group to quotation_items (null = main/default section, non-null = custom section id)
ALTER TABLE quotation_items ADD COLUMN IF NOT EXISTS section_group VARCHAR(50);

COMMENT ON COLUMN quotations.custom_sections IS 'Array of {id, name, type} for custom sections (normal or worktop)';
COMMENT ON COLUMN quotation_items.section_group IS 'Custom section id when item belongs to a custom section, null for main section';
