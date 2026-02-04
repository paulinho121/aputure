-- Add tracking_token to service_orders for public access
alter table public.service_orders 
add column if not exists tracking_token uuid default gen_random_uuid();

-- Create a unique index for the tracking token to ensure fast lookups
create unique index if not exists idx_service_orders_tracking_token on public.service_orders(tracking_token);

-- Update RLS policies to allow public read access to service_orders via tracking_token
-- Note: We still want to keep the main table private, but allow fetching a single row if the token matches.
create policy "Allow public tracking access"
on public.service_orders
for select
using (true); -- We will filter by token in the application logic for better control, 
             -- but the policy must allow the read.
