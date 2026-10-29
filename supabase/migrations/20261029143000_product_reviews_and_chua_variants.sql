-- Forward-only schema migration. If this feature must be retired, deploy a
-- later migration that first revokes access, then drops product_reviews.
create table if not exists public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id text not null check (product_id in ('p1', 'p2', 'p3')),
  customer_name text not null check (char_length(btrim(customer_name)) between 2 and 60),
  rating smallint not null check (rating between 1 and 5),
  body text not null check (char_length(btrim(body)) between 10 and 1000),
  is_visible boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists product_reviews_public_feed
  on public.product_reviews (product_id, created_at desc)
  where is_visible = true;

alter table public.product_reviews enable row level security;
revoke all on table public.product_reviews from public, anon, authenticated;
grant select (id, product_id, customer_name, rating, body, created_at)
  on public.product_reviews to anon, authenticated;
grant insert (product_id, customer_name, rating, body)
  on public.product_reviews to anon, authenticated;

drop policy if exists "Visitors can read visible product reviews"
  on public.product_reviews;
create policy "Visitors can read visible product reviews"
  on public.product_reviews for select
  to anon, authenticated
  using (is_visible = true);

drop policy if exists "Visitors can submit visible product reviews"
  on public.product_reviews;
create policy "Visitors can submit visible product reviews"
  on public.product_reviews for insert
  to anon, authenticated
  with check (is_visible = true);
