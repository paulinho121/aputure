-- 1. Create Brands Table
create table if not exists public.brands (
  id uuid default uuid_generate_v4() primary key,
  name text not null unique,
  logo_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable RLS for Brands
alter table public.brands enable row level security;
create policy "Enable all for authenticated users" on public.brands for all using (true);

-- 3. Insert existing brands
insert into public.brands (name)
values ('Aputure'), ('Astera'), ('Cream Source')
on conflict (name) do nothing;

-- 4. Prepare Parts table for Brand Relationship
alter table public.parts add column if not exists brand_id uuid references public.brands(id);

-- 5. Migration: Link existing parts to brands based on 'manufacturer' text column
update public.parts p
set brand_id = b.id
from public.brands b
where p.manufacturer = b.name;

-- 6. Important: Create an index for faster lookups
create index if not exists idx_parts_brand_id on public.parts(brand_id);

-- 7. (Optional but recommended) Cleanup old manufacturer column later, 
-- but for now we keep it for backward compatibility with the existing code until updated.
