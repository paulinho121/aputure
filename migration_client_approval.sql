-- Function to approve or reject an order from the public tracking link
create or replace function public.update_order_status_public(p_order_id text, p_token uuid, p_new_status text)
returns boolean
language plpgsql
security definer
as $$
declare
  v_order_id text;
begin
  -- Verify the token matches the order
  select id into v_order_id
  from public.service_orders
  where id = p_order_id and tracking_token = p_token;

  if v_order_id is null then
    return false;
  end if;

  -- Update the status
  update public.service_orders
  set status = p_new_status
  where id = p_order_id;

  return true;
end;
$$;

-- Allow public to select service_order_items
create policy "Allow public read on service_order_items"
on public.service_order_items
for select
using (true);

-- Allow public to select parts (we only need name and price)
-- Note: 'Enable all for authenticated users' might be the only policy right now.
-- We add one for public access.
create policy "Allow public read on parts"
on public.parts
for select
using (true);
