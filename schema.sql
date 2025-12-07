-- WARNING: This script will DROP existing tables and data to reset the schema.
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Drop existing tables (Reverse order of dependencies)
drop table if exists public.service_order_items;
drop table if exists public.service_orders;
drop table if exists public.parts;
drop table if exists public.clients;

-- Clients Table
create table public.clients (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  document text not null, -- CPF or CNPJ
  email text,
  phone text,
  address text, -- Full address string for display
  zip_code text,
  street text,
  number text,
  neighborhood text,
  city text,
  state text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Parts (Inventory) Table
create table public.parts (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  code text not null unique,
  category text,
  quantity integer default 0,
  min_stock integer default 0,
  price decimal(10, 2) default 0.00,
  location text,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Service Orders Table
create table public.service_orders (
  id text primary key, -- Custom ID format likely used (e.g., OS-2023-001)
  client_id uuid references public.clients(id) on delete set null,
  model text not null,
  serial_number text,
  condition text,
  fault_description text,
  accessories text[], -- Array of strings
  entry_date timestamp with time zone default timezone('utc'::text, now()) not null,
  status text not null default 'Recebido',
  labor_cost decimal(10, 2) default 0.00,
  service_type text default 'Paid', -- 'Paid' or 'Warranty'
  shipping_method text, -- 'Correios', 'Transportadora', 'Retirada'
  shipping_cost decimal(10, 2) default 0.00,
  discount decimal(10, 2) default 0.00,
  payment_method text,
  payment_proof_url text,
  invoice_number text, -- Invoice number when status is 'Entregue'
  photos text[], -- Array of photo URLs
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Service Order Items (Parts used in an order)
create table public.service_order_items (
  id uuid default uuid_generate_v4() primary key,
  service_order_id text references public.service_orders(id) on delete cascade,
  part_id uuid references public.parts(id) on delete restrict,
  quantity integer not null default 1,
  unit_price decimal(10, 2) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Astera Parts Table
create table public.astera_parts (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  code text not null unique,
  category text default 'Astera',
  quantity integer default 0,
  min_stock integer default 0,
  price decimal(10, 2) default 0.00,
  location text,
  units_per_package integer default 1,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies
alter table public.clients enable row level security;
alter table public.parts enable row level security;
alter table public.service_orders enable row level security;
alter table public.service_order_items enable row level security;

-- Re-create policies (Drop first to avoid errors if they exist, though we dropped tables so implied)
create policy "Enable all for authenticated users" on public.clients for all using (true);
create policy "Enable all for authenticated users" on public.parts for all using (true);
create policy "Enable all for authenticated users" on public.service_orders for all using (true);
create policy "Enable all for authenticated users" on public.service_order_items for all using (true);

-- Indexes
create index idx_clients_document on public.clients(document);
create index idx_clients_name on public.clients(name);
create index idx_parts_code on public.parts(code);
create index idx_service_orders_client_id on public.service_orders(client_id);
create index idx_service_order_items_order_id on public.service_order_items(service_order_id);
create index idx_astera_parts_code on public.astera_parts(code);

-- RLS for Astera Parts
alter table public.astera_parts enable row level security;
create policy "Enable all for authenticated users" on public.astera_parts for all using (true);

-- Cream Source Parts Table
create table public.cream_source_parts (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  code text not null unique,
  category text default 'Cream Source',
  quantity integer default 0,
  min_stock integer default 0,
  price decimal(10, 2) default 0.00,
  location text,
  units_per_package integer default 1,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Cream Source Parts
alter table public.cream_source_parts enable row level security;
create policy "Enable all for authenticated users" on public.cream_source_parts for all using (true);

-- Index for Cream Source
create index idx_cream_source_parts_code on public.cream_source_parts(code);
