update public.site_content
set published_value = replace(replace(published_value, '—', '-'), '–', '-')
where published_value like '%—%'
   or published_value like '%–%';

update public.site_content_drafts
set draft_value = replace(replace(draft_value, '—', '-'), '–', '-')
where draft_value like '%—%'
   or draft_value like '%–%';
