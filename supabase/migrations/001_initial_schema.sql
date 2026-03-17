-- Tattoo Shop Kiosk & Queue - Initial Schema
-- Run this in Supabase SQL Editor or via Supabase CLI

-- Customers (from kiosk sign-in)
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  phone_number text not null,
  created_at timestamptz not null default now()
);

-- Waivers (one per sign-in; customer can have multiple over time)
create table if not exists public.waivers (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  agreed_to_terms boolean not null default true,
  signed_at timestamptz not null default now()
);

-- Queue (one active row per customer per visit)
create table if not exists public.queue (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  status text not null check (status in ('waiting', 'notified', 'completed')) default 'waiting',
  added_at timestamptz not null default now()
);

-- Indexes for common queries
create index if not exists idx_queue_status on public.queue(status);
create index if not exists idx_queue_added_at on public.queue(added_at);
create index if not exists idx_waivers_customer_id on public.waivers(customer_id);

-- Optional: enable RLS and add policies (uncomment when ready)
-- alter table public.customers enable row level security;
-- alter table public.waivers enable row level security;
-- alter table public.queue enable row level security;
