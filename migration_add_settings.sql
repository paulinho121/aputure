-- Create a settings table for global configurations
create table if not exists public.settings (
    id text primary key,
    tech_name text,
    tech_email text,
    tech_phone text,
    updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.settings enable row level security;

-- Create policies
create policy "Allow read access to everyone" on public.settings for select using (true);
create policy "Allow update for authenticated users" on public.settings for update using (auth.role() = 'authenticated');
create policy "Allow insert for authenticated users" on public.settings for insert with check (auth.role() = 'authenticated');

-- Insert initial empty settings row if not exists
insert into public.settings (id, tech_name, tech_email, tech_phone)
values ('global', 'Técnico Responsável', 'contato@mcistore.com.br', '5511999999999')
on conflict (id) do nothing;
