-- Add labor_description column to service_orders table
ALTER TABLE service_orders 
ADD COLUMN IF NOT EXISTS labor_description TEXT;
