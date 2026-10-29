-- Enable image-tracking AR for the public Thap Rua experience.
-- The referenced .mind target is published with the web application.
update public.ar_experiences
set
  target_url = '/ar-targets/thap-rua.mind',
  enabled = true,
  updated_at = now()
where product_id = 'p1';
