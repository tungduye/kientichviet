create table if not exists public.site_content (
  content_key text primary key check (content_key ~ '^[a-zA-Z0-9._-]{1,120}$'),
  published_value text not null default '' check (
    length(published_value) <= 5000 and
    (content_key <> 'home.hero.ctaUrl' or published_value ~ '^/[^/]' or published_value ~ '^https://')
  ),
  is_visible boolean not null default true,
  revision integer not null default 1,
  published_at timestamptz not null default now(),
  published_by uuid references auth.users(id)
);

create table if not exists public.site_content_drafts (
  content_key text primary key check (content_key ~ '^[a-zA-Z0-9._-]{1,120}$'),
  draft_value text not null default '' check (
    length(draft_value) <= 5000 and
    (content_key <> 'home.hero.ctaUrl' or draft_value ~ '^/[^/]' or draft_value ~ '^https://')
  ),
  is_visible boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

create table if not exists public.site_content_revisions (
  id bigint generated always as identity primary key,
  content_key text not null check (content_key ~ '^[a-zA-Z0-9._-]{1,120}$'),
  value text not null check (length(value) <= 5000),
  is_visible boolean not null,
  revision integer not null,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  unique (content_key, revision)
);

create table if not exists public.ar_experiences (
  product_id text primary key check (product_id ~ '^[a-zA-Z0-9_-]{1,80}$'),
  enabled boolean not null default false,
  target_url text check (target_url is null or (length(target_url) <= 2048 and (target_url ~ '^https://' or target_url ~ '^/[^/]') and target_url ~ '\.mind(\?.*)?$')),
  model_url text check (model_url is null or (length(model_url) <= 2048 and (model_url ~ '^https://' or model_url ~ '^/[^/]') and model_url ~ '\.glb(\?.*)?$')),
  scale real not null default 1,
  offset_x real not null default 0,
  offset_y real not null default 0,
  offset_z real not null default 0,
  rotation_x real not null default 0,
  rotation_y real not null default 0,
  rotation_z real not null default 0,
  updated_at timestamptz not null default now(),
  constraint ar_experience_scale check (scale > 0 and scale <= 10),
  constraint ar_experience_offsets check (
    offset_x between -10 and 10 and
    offset_y between -10 and 10 and
    offset_z between -10 and 10
  )
);

insert into public.ar_experiences (product_id, enabled, model_url, scale)
values
  ('p1', true, '/models/Thap-rua-model.glb', 0.4),
  ('p2', false, null, 1),
  ('p3', true, '/models/Hang-Trong-Model.glb', 0.4)
on conflict (product_id) do nothing;

alter table public.site_content enable row level security;
alter table public.site_content_drafts enable row level security;
alter table public.site_content_revisions enable row level security;
alter table public.ar_experiences enable row level security;

revoke all on table public.site_content from anon, authenticated;
revoke all on table public.site_content_drafts from anon, authenticated;
revoke all on table public.site_content_revisions from anon, authenticated;
revoke all on table public.ar_experiences from anon, authenticated;

grant select (content_key, published_value, is_visible, revision, published_at) on table public.site_content to authenticated;
grant select, insert, update on table public.site_content_drafts to authenticated;
grant select on table public.site_content_revisions to authenticated;
grant select on table public.ar_experiences to anon, authenticated;
grant update on table public.ar_experiences to authenticated;

create policy "Published content is public"
on public.site_content for select
to anon, authenticated
using (is_visible = true);

create policy "Admins read hidden published content"
on public.site_content for select
to authenticated
using ((select private.is_catalog_admin()));

create or replace view public.site_content_public
with (security_barrier = true)
as
select
  content_key,
  case when is_visible then published_value else '' end as published_value,
  is_visible,
  revision,
  published_at
from public.site_content;

revoke all on table public.site_content_public from public;
grant select on table public.site_content_public to anon, authenticated;

create policy "Admins read content drafts"
on public.site_content_drafts for select
to authenticated
using ((select private.is_catalog_admin()));

create policy "Admins create content drafts"
on public.site_content_drafts for insert
to authenticated
with check (
  (select private.is_catalog_admin()) and
  updated_by = (select auth.uid())
);

create policy "Admins update content drafts"
on public.site_content_drafts for update
to authenticated
using ((select private.is_catalog_admin()))
with check (
  (select private.is_catalog_admin()) and
  updated_by = (select auth.uid())
);

create policy "Admins read content revisions"
on public.site_content_revisions for select
to authenticated
using ((select private.is_catalog_admin()));

create policy "Visitors read enabled AR configuration"
on public.ar_experiences for select
to anon
using (enabled = true);

create policy "Admins read all AR configuration"
on public.ar_experiences for select
to authenticated
using (enabled = true or (select private.is_catalog_admin()));

create policy "Admins update AR configuration"
on public.ar_experiences for update
to authenticated
using ((select private.is_catalog_admin()))
with check ((select private.is_catalog_admin()));

create or replace function public.publish_all_site_content()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  published_count integer;
begin
  if not (select private.is_catalog_admin()) then
    raise exception 'Not authorized';
  end if;

  insert into public.site_content_revisions
    (content_key, value, is_visible, revision, created_by)
  select
    d.content_key,
    d.draft_value,
    d.is_visible,
    coalesce(p.revision, 0) + 1,
    (select auth.uid())
  from public.site_content_drafts d
  left join public.site_content p using (content_key)
  on conflict (content_key, revision) do nothing;

  insert into public.site_content
    (content_key, published_value, is_visible, revision, published_at, published_by)
  select
    d.content_key,
    d.draft_value,
    d.is_visible,
    coalesce(p.revision, 0) + 1,
    now(),
    (select auth.uid())
  from public.site_content_drafts d
  left join public.site_content p using (content_key)
  on conflict (content_key) do update set
    published_value = excluded.published_value,
    is_visible = excluded.is_visible,
    revision = excluded.revision,
    published_at = excluded.published_at,
    published_by = excluded.published_by;

  get diagnostics published_count = row_count;
  return published_count;
end;
$$;

create or replace function public.restore_site_content_revision(
  target_key text,
  target_revision integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  restored public.site_content_revisions%rowtype;
begin
  if not (select private.is_catalog_admin()) then
    raise exception 'Not authorized';
  end if;

  select * into restored
  from public.site_content_revisions
  where content_key = target_key and revision = target_revision;

  if not found then return false; end if;

  insert into public.site_content_drafts
    (content_key, draft_value, is_visible, updated_at, updated_by)
  values
    (restored.content_key, restored.value, restored.is_visible, now(), (select auth.uid()))
  on conflict (content_key) do update set
    draft_value = excluded.draft_value,
    is_visible = excluded.is_visible,
    updated_at = excluded.updated_at,
    updated_by = excluded.updated_by;

  return true;
end;
$$;

revoke all on function public.publish_all_site_content() from public;
revoke all on function public.restore_site_content_revision(text, integer) from public;
grant execute on function public.publish_all_site_content() to authenticated;
grant execute on function public.restore_site_content_revision(text, integer) to authenticated;
