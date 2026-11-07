alter table public.product_catalog_settings
add column if not exists specifications jsonb;

alter table public.product_catalog_settings
drop constraint if exists product_catalog_specifications_object;

alter table public.product_catalog_settings
add constraint product_catalog_specifications_object check (
  specifications is null or jsonb_typeof(specifications) = 'object'
);

-- Keep the approved storefront cover while leaving prices and variant galleries intact.
update public.product_catalog_settings
set
  image_url = '/images/thap-rua-angle-front.jpg',
  image_urls = array['/images/thap-rua-angle-front.jpg']::text[]
where product_key = 'p1';

insert into public.product_catalog_settings
  (product_key, product_id, variant_id, price, is_visible, sort_order, specifications)
values
  (
    'p3-basic', 'p3', 'basic', '790.000 ₫', true, 1,
    '{"pieces":"211","time":"5 tiếng","difficulty":"Trung bình","material":"Gỗ basswood","size":"15 × 15 × 15 cm","audience":"15 tuổi trở lên"}'::jsonb
  ),
  (
    'p3-signature', 'p3', 'signature', 'Liên hệ', true, 2,
    '{"pieces":"211","time":"5 tiếng","difficulty":"Trung bình","material":"Gỗ basswood","size":"15 × 15 × 15 cm","audience":"15 tuổi trở lên"}'::jsonb
  )
on conflict (product_key) do update
set specifications = excluded.specifications;

update public.product_catalog_settings
set specifications = case product_key
  when 'p1' then '{"pieces":"150","time":"10 tiếng","difficulty":"Trung bình","material":"Gỗ basswood","size":"20 × 20 × 30 cm","audience":"15 tuổi trở lên"}'::jsonb
  when 'p1-basic' then '{"pieces":"150","time":"10 tiếng","difficulty":"Trung bình","material":"Gỗ basswood","size":"20 × 20 × 30 cm","audience":"15 tuổi trở lên"}'::jsonb
  when 'p1-signature' then '{"pieces":"150","time":"10 tiếng","difficulty":"Trung bình","material":"Gỗ basswood","size":"20 × 20 × 30 cm","audience":"15 tuổi trở lên"}'::jsonb
  when 'p1-premium' then '{"pieces":"150","time":"15 tiếng","difficulty":"Trung bình","material":"Gỗ basswood kết hợp khảm đá mosaic","size":"20 × 20 × 30 cm","audience":"15 tuổi trở lên"}'::jsonb
  when 'p2' then '{"pieces":"xxx","time":"Đang cập nhật","difficulty":"Đang cập nhật","material":"Đang cập nhật","size":"Đang cập nhật","audience":"Đang cập nhật"}'::jsonb
  when 'p2-basic' then '{"pieces":"xxx","time":"Đang cập nhật","difficulty":"Đang cập nhật","material":"Đang cập nhật","size":"Đang cập nhật","audience":"Đang cập nhật"}'::jsonb
  when 'p2-signature' then '{"pieces":"xxx","time":"Đang cập nhật","difficulty":"Đang cập nhật","material":"Đang cập nhật","size":"Đang cập nhật","audience":"Đang cập nhật"}'::jsonb
  when 'p2-premium' then '{"pieces":"xxx","time":"Đang cập nhật","difficulty":"Đang cập nhật","material":"Đang cập nhật","size":"Đang cập nhật","audience":"Đang cập nhật"}'::jsonb
  when 'p3' then '{"pieces":"211","time":"5 tiếng","difficulty":"Trung bình","material":"Gỗ basswood","size":"15 × 15 × 15 cm","audience":"15 tuổi trở lên"}'::jsonb
  else specifications
end
where product_key in (
  'p1', 'p1-basic', 'p1-signature', 'p1-premium',
  'p2', 'p2-basic', 'p2-signature', 'p2-premium',
  'p3'
);
