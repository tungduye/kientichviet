-- Data migration kept separate from the review schema change.
update public.product_catalog_settings
set price = 'COMING SOON'
where product_key = 'p2';

insert into public.product_catalog_settings
  (product_key, product_id, variant_id, price, is_visible, sort_order)
values
  ('p2-basic', 'p2', 'basic', 'COMING SOON', true, 1),
  ('p2-signature', 'p2', 'signature', 'COMING SOON', true, 2),
  ('p2-premium', 'p2', 'premium', 'COMING SOON', true, 3)
on conflict (product_key) do update
set price = excluded.price;
