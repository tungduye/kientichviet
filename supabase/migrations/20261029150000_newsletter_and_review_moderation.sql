-- Save newsletter opt-ins while allowing the public client to insert only.
create table if not exists public.newsletter_subscriptions (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (
    email = lower(btrim(email)) and
    char_length(email) between 5 and 254 and
    email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  ),
  created_at timestamptz not null default now()
);

alter table public.newsletter_subscriptions enable row level security;
revoke all on table public.newsletter_subscriptions from public, anon, authenticated;
grant insert (email) on table public.newsletter_subscriptions to anon, authenticated;

drop policy if exists "Visitors can subscribe to the newsletter"
  on public.newsletter_subscriptions;
create policy "Visitors can subscribe to the newsletter"
  on public.newsletter_subscriptions for insert
  to anon, authenticated
  with check (
    email = lower(btrim(email)) and
    char_length(email) between 5 and 254 and
    email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  );

-- Existing public reviews remain visible; new submissions wait for review.
alter table public.product_reviews alter column is_visible set default false;
drop policy if exists "Visitors can submit visible product reviews"
  on public.product_reviews;
create policy "Visitors can submit reviews for moderation"
  on public.product_reviews for insert
  to anon, authenticated
  with check (is_visible = false);

grant select (id, product_id, customer_name, rating, body, is_visible, created_at)
  on table public.product_reviews to authenticated;
grant update (is_visible) on table public.product_reviews to authenticated;

drop policy if exists "Admins read all product reviews"
  on public.product_reviews;
create policy "Admins read all product reviews"
  on public.product_reviews for select
  to authenticated
  using ((select private.is_catalog_admin()));

drop policy if exists "Admins moderate product reviews"
  on public.product_reviews;
create policy "Admins moderate product reviews"
  on public.product_reviews for update
  to authenticated
  using ((select private.is_catalog_admin()))
  with check ((select private.is_catalog_admin()));
