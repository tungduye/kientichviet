-- Durable order storage. Google Sheets is a reporting destination, never the only copy.
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_id text not null unique check (order_id ~ '^DH-[0-9]{8}-[0-9]{6}$'),
  order_date_display text not null check (char_length(order_date_display) between 8 and 80),
  customer_name text not null check (char_length(customer_name) between 2 and 120),
  customer_phone text not null check (customer_phone ~ '^[0-9]{9,12}$'),
  customer_email text not null default 'Chưa cung cấp' check (char_length(customer_email) <= 254),
  customer_address text not null check (char_length(customer_address) between 5 and 500),
  customer_note text not null default 'Không có' check (char_length(customer_note) <= 1000),
  products text not null check (char_length(products) between 1 and 2000),
  total_amount text not null check (char_length(total_amount) between 1 and 100),
  total_numeric bigint not null default 0 check (total_numeric >= 0),
  items jsonb not null default '[]'::jsonb check (jsonb_typeof(items) = 'array'),
  sheet_sync_status text not null default 'pending'
    check (sheet_sync_status in ('pending', 'synced', 'failed')),
  sheet_synced_at timestamptz,
  sheet_sync_error text,
  created_at timestamptz not null default now()
);

create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_sheet_sync_status_idx
  on public.orders (sheet_sync_status, created_at desc);

alter table public.orders enable row level security;
revoke all on table public.orders from public, anon, authenticated;
