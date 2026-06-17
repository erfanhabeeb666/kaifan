-- Alter menu_items columns to match Java's Integer mapping and satisfy schema validation
ALTER TABLE menu_items MODIFY COLUMN tax_type INT DEFAULT 0;
ALTER TABLE menu_items MODIFY COLUMN item_allow_addon INT DEFAULT 0;
