update public.product_catalog_settings
set price = case product_key
  when 'p1' then '369.000 ₫'
  when 'p1-basic' then '369.000 ₫'
  when 'p1-signature' then '499.000 ₫'
  when 'p1-premium' then '669.000 ₫'
  when 'p3' then '219.000 ₫'
  when 'p3-basic' then '219.000 ₫'
  when 'p3-signature' then '289.000 ₫'
  else price
end
where product_key in (
  'p1', 'p1-basic', 'p1-signature', 'p1-premium',
  'p3', 'p3-basic', 'p3-signature'
);

update public.product_catalog_settings
set specifications = jsonb_set(
  coalesce(specifications, '{}'::jsonb),
  '{difficulty}',
  '"Nâng cao"'::jsonb,
  true
)
where product_key = 'p1-premium';
