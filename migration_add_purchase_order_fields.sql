-- Migration to add discount and shipping fields to purchase orders
ALTER TABLE public.purchase_orders 
ADD COLUMN IF NOT EXISTS discount_percentage decimal(5, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS shipping_cost decimal(10, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS shipping_type text;
