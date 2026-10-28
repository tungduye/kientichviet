alter table public.product_catalog_settings
add column image_urls text[] not null default '{}',
add column revision integer not null default 1;

update public.product_catalog_settings
set image_urls = array[image_url]
where image_url is not null and cardinality(image_urls) = 0;

alter table public.product_catalog_settings
add constraint product_catalog_gallery_limit check (cardinality(image_urls) <= 8),
add constraint product_catalog_revision_positive check (revision > 0);

update public.product_catalog_settings
set sort_order = case product_id
  when 'p3' then 1
  when 'p1' then 2
  when 'p2' then 3
  else sort_order
end
where variant_id is null and product_id in ('p1', 'p2', 'p3');

-- Catalog writes must pass through the validated Edge Function, which uses
-- the service role after checking membership in public.admin_users.
revoke update on table public.product_catalog_settings from authenticated;
