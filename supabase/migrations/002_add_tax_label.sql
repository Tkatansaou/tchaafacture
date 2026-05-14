-- Add tax_label column to invoices
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tax_label TEXT NOT NULL DEFAULT 'TVA';
