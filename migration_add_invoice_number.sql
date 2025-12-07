-- Migration: Add invoice_number field to service_orders table
-- Run this in Supabase SQL Editor

ALTER TABLE public.service_orders 
ADD COLUMN IF NOT EXISTS invoice_number text;

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'service_orders' 
  AND column_name = 'invoice_number';
