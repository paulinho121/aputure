-- Add stock_deducted column to service_orders
alter table public.service_orders 
add column if not exists stock_deducted boolean default false;

-- Update existing orders to have stock_deducted = false (already default)
-- But if some orders are already completed, we might want to mark them as true 
-- to avoid deducting stock now for old orders.
update public.service_orders 
set stock_deducted = true 
where status in ('Em Reparo', 'Pronto', 'Entregue');
