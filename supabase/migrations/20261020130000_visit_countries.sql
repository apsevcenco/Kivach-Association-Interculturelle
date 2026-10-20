alter table public.page_visits
  add column if not exists country_code text;

create index if not exists page_visits_country_code_idx
  on public.page_visits (country_code);
