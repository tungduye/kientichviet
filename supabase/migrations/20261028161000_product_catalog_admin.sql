create schema if not exists private;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.product_catalog_settings (
  product_key text primary key,
  product_id text not null,
  variant_id text,
  price text not null,
  image_url text,
  is_visible boolean not null default true,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now(),
  constraint product_catalog_variant_key check (
    (variant_id is null and product_key = product_id)
    or (variant_id is not null and product_key = product_id || '-' || variant_id)
  )
);

insert into public.product_catalog_settings
  (product_key, product_id, variant_id, price, image_url, is_visible, sort_order)
values
  ('p1', 'p1', null, '820.000 ₫', null, true, 1),
  ('p2', 'p2', null, '890.000 ₫', null, true, 2),
  ('p3', 'p3', null, '790.000 ₫', null, true, 3),
  ('p1-basic', 'p1', 'basic', '820.000 ₫', null, true, 1),
  ('p1-signature', 'p1', 'signature', 'Liên hệ', null, true, 2),
  ('p1-premium', 'p1', 'premium', 'Liên hệ', null, true, 3)
on conflict (product_key) do nothing;

create or replace function private.is_catalog_admin()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = (select auth.uid())
  );
$$;

revoke all on function private.is_catalog_admin() from public;
grant usage on schema private to authenticated;
grant execute on function private.is_catalog_admin() to authenticated;

create or replace function private.touch_catalog_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists product_catalog_touch_updated_at
on public.product_catalog_settings;

create trigger product_catalog_touch_updated_at
before update on public.product_catalog_settings
for each row execute function private.touch_catalog_updated_at();

alter table public.admin_users enable row level security;
alter table public.product_catalog_settings enable row level security;

revoke all on table public.admin_users from anon, authenticated;
revoke all on table public.product_catalog_settings from anon, authenticated;
grant select on table public.admin_users to authenticated;
grant select on table public.product_catalog_settings to anon, authenticated;
grant update on table public.product_catalog_settings to authenticated;

drop policy if exists "Admin can verify own membership"
on public.admin_users;
create policy "Admin can verify own membership"
on public.admin_users for select
to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "Visitors can read visible catalog"
on public.product_catalog_settings;
create policy "Visitors can read visible catalog"
on public.product_catalog_settings for select
to anon
using (is_visible = true);

drop policy if exists "Admins can read full catalog"
on public.product_catalog_settings;
create policy "Admins can read full catalog"
on public.product_catalog_settings for select
to authenticated
using (is_visible = true or (select private.is_catalog_admin()));

drop policy if exists "Admins can update catalog"
on public.product_catalog_settings;
create policy "Admins can update catalog"
on public.product_catalog_settings for update
to authenticated
using ((select private.is_catalog_admin()))
with check ((select private.is_catalog_admin()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Admins can upload product images"
on storage.objects;
drop policy if exists "Admins can update product images"
on storage.objects;
drop policy if exists "Admins can delete product images"
on storage.objects;
