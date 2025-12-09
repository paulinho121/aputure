-- Add technical_report column to service_orders table
ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS technical_report TEXT;
